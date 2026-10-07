import * as XLSX from 'xlsx';
import { SheetData } from '../types/sync';

/**
 * Parses an uploaded File (Excel .xlsx, .xls, .csv) into an array of SheetData
 */
export async function parseExcelFile(file: File): Promise<{ workbookName: string; sheets: SheetData[] }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert worksheet to array of arrays (header: 1)
    const jsonRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, { header: 1, defval: '' });

    if (jsonRows.length === 0) {
      sheets.push({
        name: sheetName,
        columns: ['Column A', 'Column B', 'Column C'],
        rows: [['', '', '']]
      });
      continue;
    }

    // First row as columns or autogenerate
    const firstRow = jsonRows[0] || [];
    let columns = firstRow.map((col, idx) => {
      if (col !== undefined && col !== null && String(col).trim() !== '') {
        return String(col).trim();
      }
      return `Column ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? Math.floor(idx / 26) : ''}`;
    });

    if (columns.length === 0) {
      columns = ['Column A'];
    }

    // Rows data
    const rawRows = jsonRows.slice(1);
    const rows = rawRows.map(row => {
      // normalize row length to match columns length
      const normalizedRow: (string | number | boolean | null)[] = [];
      for (let i = 0; i < columns.length; i++) {
        const val = row[i];
        normalizedRow.push(val !== undefined ? val : '');
      }
      return normalizedRow;
    });

    sheets.push({
      name: sheetName,
      columns,
      rows: rows.length > 0 ? rows : [new Array(columns.length).fill('')]
    });
  }

  return {
    workbookName: file.name,
    sheets: sheets.length > 0 ? sheets : [
      { name: 'Sheet1', columns: ['Column A', 'Column B'], rows: [['', '']] }
    ]
  };
}

/**
 * Exports SheetData array to a downloadable Excel .xlsx Blob
 */
export function exportToExcelBlob(sheets: SheetData[]): Blob {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const aoa = [sheet.columns, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Exports a single sheet to CSV string
 */
export function exportToCSV(sheet: SheetData): string {
  const aoa = [sheet.columns, ...sheet.rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  return XLSX.utils.sheet_to_csv(ws);
}

/**
 * Downloads a blob as a file in browser
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Evaluates basic spreadsheet formulas like =SUM(A1:A5), =AVERAGE(B1:B10), =COUNT(), etc.
 */
export function evaluateFormula(formula: string, sheet: SheetData): string | number {
  if (!formula.startsWith('=')) return formula;

  const expression = formula.substring(1).trim().toUpperCase();

  try {
    // Check for SUM(range) or SUM(val1, val2)
    const sumMatch = expression.match(/^SUM\(([A-Z0-9:, ]+)\)$/i);
    if (sumMatch) {
      const vals = resolveRangeValues(sumMatch[1], sheet);
      return vals.reduce<number>((acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0), 0);
    }

    // Check for AVERAGE(range)
    const avgMatch = expression.match(/^AVERAGE\(([A-Z0-9:, ]+)\)$/i);
    if (avgMatch) {
      const vals = resolveRangeValues(avgMatch[1], sheet).map(v => Number(v)).filter(v => !isNaN(v));
      if (vals.length === 0) return 0;
      const sum = vals.reduce((a, b) => a + b, 0);
      return Math.round((sum / vals.length) * 100) / 100;
    }

    // Check for MAX(range)
    const maxMatch = expression.match(/^MAX\(([A-Z0-9:, ]+)\)$/i);
    if (maxMatch) {
      const vals = resolveRangeValues(maxMatch[1], sheet).map(v => Number(v)).filter(v => !isNaN(v));
      return vals.length ? Math.max(...vals) : 0;
    }

    // Check for MIN(range)
    const minMatch = expression.match(/^MIN\(([A-Z0-9:, ]+)\)$/i);
    if (minMatch) {
      const vals = resolveRangeValues(minMatch[1], sheet).map(v => Number(v)).filter(v => !isNaN(v));
      return vals.length ? Math.min(...vals) : 0;
    }

    // Check for COUNT(range)
    const countMatch = expression.match(/^COUNT\(([A-Z0-9:, ]+)\)$/i);
    if (countMatch) {
      const vals = resolveRangeValues(countMatch[1], sheet).filter(v => v !== '' && v !== null && v !== undefined);
      return vals.length;
    }

    // Simple math expression e.g. 5 + 10 or cell references like A1 + B1
    const resolvedMath = expression.replace(/([A-Z]+)([0-9]+)/g, (_match, colLetters, rowNum) => {
      const colIdx = columnLetterToIndex(colLetters);
      const rowIdx = parseInt(rowNum, 10) - 2; // header is row 1, data starts row 2
      if (sheet.rows[rowIdx] && sheet.rows[rowIdx][colIdx] !== undefined) {
        const val = sheet.rows[rowIdx][colIdx];
        return String(Number(val) || 0);
      }
      return '0';
    });

    // Safe eval for numbers and basic math operators
    if (/^[0-9+\-*/(). ]+$/.test(resolvedMath)) {
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${resolvedMath})`)();
      return typeof result === 'number' ? Math.round(result * 1000) / 1000 : String(result);
    }
  } catch {
    return '#VALUE!';
  }

  return formula;
}

function resolveRangeValues(rangeStr: string, sheet: SheetData): (string | number | boolean | null)[] {
  const parts = rangeStr.split(/[,:]/).map(s => s.trim());
  if (parts.length === 2 && rangeStr.includes(':')) {
    // Range format e.g. A2:A10 or D2:D8
    const start = parseCellAddress(parts[0]);
    const end = parseCellAddress(parts[1]);

    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const values: (string | number | boolean | null)[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const dataRowIdx = r - 2; // Row 1 is header
      if (sheet.rows[dataRowIdx]) {
        for (let c = minCol; c <= maxCol; c++) {
          values.push(sheet.rows[dataRowIdx][c]);
        }
      }
    }
    return values;
  }

  // Individual cell list e.g. A2, B2
  return parts.map(part => {
    const { row, col } = parseCellAddress(part);
    const dataRowIdx = row - 2;
    if (sheet.rows[dataRowIdx] && sheet.rows[dataRowIdx][col] !== undefined) {
      return sheet.rows[dataRowIdx][col];
    }
    return '';
  });
}

export function columnLetterToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColumnLetter(idx: number): string {
  let temp = idx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function parseCellAddress(addr: string): { col: number; row: number } {
  const match = addr.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return { col: 0, row: 2 };
  return {
    col: columnLetterToIndex(match[1]),
    row: parseInt(match[2], 10)
  };
}

export function getCellAddress(colIdx: number, rowIdx: number): string {
  return `${indexToColumnLetter(colIdx)}${rowIdx + 2}`;
}
