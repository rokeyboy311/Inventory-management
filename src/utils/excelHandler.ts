import * as XLSX from 'xlsx';
import { PerformaRecord, ImportSummary, DEFAULT_PERFORMA_ITEMS_TEMPLATE, createBlankPerforma } from '../types/performa';

/**
 * Parses an uploaded Excel / CSV file buffer.
 * Returns the workbook metadata, sheet names, and raw data for each sheet.
 */
export async function parseUploadedExcel(file: File): Promise<{
  fileName: string;
  sheetNames: string[];
  workbook: XLSX.WorkBook;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        resolve({
          fileName: file.name,
          sheetNames: workbook.SheetNames,
          workbook
        });
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses rows from a selected sheet and extracts Performa records.
 * Compares against existing records in active sheet to categorize:
 * Existing, New, Duplicates, Warnings.
 */
export function analyzeSheetForPerformas(
  workbook: XLSX.WorkBook,
  sheetName: string,
  existingPerformas: PerformaRecord[],
  defaultLocation: string = 'Ahmedabad'
): ImportSummary {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      existingCount: 0,
      newCount: 0,
      duplicatesCount: 0,
      warningsCount: 1,
      existingIds: [],
      newIds: [],
      duplicateIds: [],
      warnings: [`Sheet "${sheetName}" was not found in workbook.`],
      parsedPerformas: [],
      sheetName,
      workbookName: ''
    };
  }

  // Convert sheet to JSON array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const existingMap = new Set(existingPerformas.map(p => p.id.trim().toUpperCase()));
  const seenInFile = new Set<string>();
  const duplicateIds: string[] = [];
  const existingIds: string[] = [];
  const newIds: string[] = [];
  const warnings: string[] = [];
  const parsedPerformas: PerformaRecord[] = [];

  if (rawRows.length === 0) {
    warnings.push(`Sheet "${sheetName}" is empty.`);
  }

  rawRows.forEach((row, index) => {
    // Look for ID in various column naming variations
    const rawId = (
      row['Performa ID'] ||
      row['PerformaID'] ||
      row['ID'] ||
      row['SR NO'] ||
      row['Performa No'] ||
      row['TC Serial Number.'] ||
      row['Serial No'] ||
      ''
    ).toString().trim();

    if (!rawId) {
      warnings.push(`Row ${index + 2}: Missing Performa ID column or value.`);
      return;
    }

    const normId = rawId.toUpperCase();

    // Check duplicate in the file itself
    if (seenInFile.has(normId)) {
      if (!duplicateIds.includes(rawId)) {
        duplicateIds.push(rawId);
      }
      warnings.push(`Row ${index + 2}: Duplicate Performa ID "${rawId}" detected in this import file.`);
    } else {
      seenInFile.add(normId);
    }

    // Check against existing in database
    if (existingMap.has(normId)) {
      existingIds.push(rawId);
    } else {
      newIds.push(rawId);
    }

    // Build PerformaRecord from row
    const location = (
      row['Location of Transformer'] ||
      row['Location'] ||
      row['Location of TC'] ||
      defaultLocation
    ).toString().trim();

    const dateVal = row['DATE'] || row['Date'] || new Date().toISOString().slice(0, 10);
    const dateStr = typeof dateVal === 'object' && dateVal instanceof Date 
      ? dateVal.toISOString().slice(0, 10) 
      : String(dateVal);

    const refNo = (row['Transformer Ref. No'] || row['Transformer Reference No'] || row['Ref No'] || '').toString();
    const make = (row['Transformer Make'] || row['Make'] || row['TC Make'] || 'W&P').toString();
    const serial = (row['Transformer serial no.'] || row['Serial No'] || row['TC Serial Number.'] || '').toString();
    const capacity = (row['CAPACITY'] || row['Capacity'] || row['TC Capacity'] || '200 KVA').toString();

    const performa: PerformaRecord = {
      ...createBlankPerforma(rawId, location),
      date: dateStr,
      transformerRefNo: refNo,
      transformerMake: make,
      transformerSerialNo: serial,
      capacity: capacity || '0',
      measurements: {
        voltageRN: String(row['Voltage R-N'] || row['Voltage RN'] || '0'),
        voltageYN: String(row['Voltage Y-N'] || row['Voltage YN'] || '0'),
        voltageBN: String(row['Voltage B-N'] || row['Voltage BN'] || '0'),
        ampereR: String(row['Ampere R'] || '0'),
        ampereY: String(row['Ampere Y'] || '0'),
        ampereB: String(row['Ampere B'] || '0'),
        ampereN: String(row['Ampere N'] || '0')
      },
      status: 'saved'
    };

    // If specific item QTY or Remarks are present in columns, map them
    performa.items.forEach(item => {
      const colQty = row[`${item.description} - QTY`] ?? row[item.description];
      if (colQty !== undefined && colQty !== '') {
        const num = parseFloat(colQty);
        item.qty = isNaN(num) ? colQty : num;
      }
      const colRemarks = row[`${item.description} - Remarks`];
      if (colRemarks) {
        item.remarks = String(colRemarks);
      }
      const colMat = row[`${item.description} - Material`];
      if (colMat !== undefined) {
        item.materialYes = String(colMat).toLowerCase().includes('y') || colMat === true || colMat === 1;
      }
      const colLab = row[`${item.description} - Labour`];
      if (colLab !== undefined) {
        item.labourYes = String(colLab).toLowerCase().includes('y') || colLab === true || colLab === 1;
      }
    });

    parsedPerformas.push(performa);
  });

  return {
    existingCount: existingIds.length,
    newCount: newIds.length,
    duplicatesCount: duplicateIds.length,
    warningsCount: warnings.length,
    existingIds,
    newIds,
    duplicateIds,
    warnings,
    parsedPerformas,
    sheetName,
    workbookName: ''
  };
}

/**
 * Exports the complete active dataset as an Excel workbook.
 * Preserves the exact sequential order of performas:
 * Existing records remain in their existing order, and newly added records are appended at the end.
 */
export function exportPerformasToExcel(
  performas: PerformaRecord[],
  workbookName: string = 'Ahmedabad.xlsx',
  sheetName: string = 'Performas'
): void {
  const wb = XLSX.utils.book_new();

  // 1. Primary Sheet: Performas with full header and item breakdown
  const performaRows = performas.map((p, idx) => {
    const row: Record<string, any> = {
      'Sr No': idx + 1,
      'Performa ID': p.id,
      'DATE': p.date,
      'Location of Transformer': p.location,
      'Transformer Ref. No': p.transformerRefNo,
      'Transformer Make': p.transformerMake,
      'Transformer serial no.': p.transformerSerialNo,
      'CAPACITY': p.capacity,
      'Voltage R-N': p.measurements.voltageRN,
      'Voltage Y-N': p.measurements.voltageYN,
      'Voltage B-N': p.measurements.voltageBN,
      'Ampere R': p.measurements.ampereR,
      'Ampere Y': p.measurements.ampereY,
      'Ampere B': p.measurements.ampereB,
      'Ampere N': p.measurements.ampereN
    };

    // Append each item's material, labour, qty, and remarks
    p.items.forEach(item => {
      row[`${item.description} (Unit)`] = item.unit;
      row[`${item.description} (Material)`] = item.materialYes ? 'Yes' : 'No';
      row[`${item.description} (Labour)`] = item.labourYes ? 'Yes' : 'No';
      row[`${item.description} (QTY)`] = item.qty;
      if (item.remarks) {
        row[`${item.description} (Remarks)`] = item.remarks;
      }
    });

    return row;
  });

  const wsPerformas = XLSX.utils.json_to_sheet(performaRows);
  XLSX.utils.book_append_sheet(wb, wsPerformas, sheetName || 'Performas');

  // 2. Summary / Maintenance Sheet
  const maintenanceRows = performas.map((p, idx) => ({
    'Sr No': idx + 1,
    'Performa ID': p.id,
    'Date': p.date,
    'Location': p.location,
    'Make': p.transformerMake,
    'Serial No': p.transformerSerialNo,
    'Capacity': p.capacity,
    'Total Items Serviced': p.items.filter(i => Number(i.qty) > 0).length,
    'Status': 'Completed'
  }));
  const wsMaintenance = XLSX.utils.json_to_sheet(maintenanceRows);
  XLSX.utils.book_append_sheet(wb, wsMaintenance, 'Maintenance');

  // 3. Measurements Sheet
  const measurementRows = performas.map((p, idx) => ({
    'Sr No': idx + 1,
    'Performa ID': p.id,
    'Date': p.date,
    'Location': p.location,
    'Voltage R-N (V)': p.measurements.voltageRN,
    'Voltage Y-N (V)': p.measurements.voltageYN,
    'Voltage B-N (V)': p.measurements.voltageBN,
    'Ampere R (A)': p.measurements.ampereR,
    'Ampere Y (A)': p.measurements.ampereY,
    'Ampere B (A)': p.measurements.ampereB,
    'Ampere N (A)': p.measurements.ampereN
  }));
  const wsMeasurements = XLSX.utils.json_to_sheet(measurementRows);
  XLSX.utils.book_append_sheet(wb, wsMeasurements, 'Measurements');

  // Trigger download
  const cleanFileName = workbookName.endsWith('.xlsx') ? workbookName : `${workbookName}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * Downloads a rich ready-to-test sample Excel file matching the template.
 */
export function downloadSampleExcel(locationName: string = 'Ahmedabad'): void {
  const samplePerformas: PerformaRecord[] = [
    {
      ...createBlankPerforma('AHM-001', locationName),
      date: '2026-09-08',
      transformerRefNo: 'TR-AHM-01',
      transformerMake: 'W&P',
      transformerSerialNo: 'IT 1434',
      capacity: '200 KVA',
      status: 'saved'
    },
    {
      ...createBlankPerforma('AHM-002', locationName),
      date: '2026-09-09',
      transformerRefNo: 'TR-AHM-02',
      transformerMake: 'NIK-SAN',
      transformerSerialNo: 'NS-8891',
      capacity: '100 KVA',
      status: 'saved'
    },
    {
      ...createBlankPerforma('AHM-003', locationName),
      date: '2026-09-10',
      transformerRefNo: 'TR-AHM-03',
      transformerMake: 'ABB',
      transformerSerialNo: 'ABB-4920',
      capacity: '250 KVA',
      status: 'saved'
    }
  ];

  exportPerformasToExcel(samplePerformas, `Sample_${locationName}_Transformer_Data.xlsx`, 'Performas');
}
