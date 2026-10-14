import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { InventorySubmission, InventoryItemDefinition, TC_MAINTENANCE_MASTER_ITEMS } from '../types/inventory';

export function sanitizeFolderName(location: string): string {
  return location.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
}

export interface ExcelColumnLayout {
  itemId?: string;
  itemName?: string;
  subOption?: string;
  headerLevel1: string;
  headerLevel2: string;
}

/**
 * Builds the canonical 2-tier Hierarchical Column Layout matching the user's reference specification
 */
export function buildHierarchicalColumnLayout(itemDefinitions: InventoryItemDefinition[]): ExcelColumnLayout[] {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  
  // 5 Canonical Prefix Columns
  const layout: ExcelColumnLayout[] = [
    { headerLevel1: 'SR NO', headerLevel2: 'Sr. No.' },
    { headerLevel1: 'Location of TC', headerLevel2: 'Site Location' },
    { headerLevel1: 'TC Serial Number.', headerLevel2: 'TC Serial' },
    { headerLevel1: 'TC Make', headerLevel2: 'Make' },
    { headerLevel1: 'TC Capacity', headerLevel2: 'Capacity' }
  ];

  for (const item of activeItemDefs) {
    if (item.options && item.options.length > 0) {
      for (const opt of item.options) {
        layout.push({
          itemId: item.id,
          itemName: item.name,
          subOption: opt,
          headerLevel1: item.name,
          headerLevel2: opt
        });
      }
    } else {
      layout.push({
        itemId: item.id,
        itemName: item.name,
        headerLevel1: item.name,
        headerLevel2: item.unit ? item.unit : ''
      });
    }
  }

  return layout;
}

/**
 * Builds canonical 2-Tier Header Data Rows and Excel Merges for a Sub-Division or Location
 */
export function buildSubdivisionExcelData(
  subdivisionName: string,
  submissions: InventorySubmission[],
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const cleanSubName = sanitizeFolderName(subdivisionName || 'DOLVAN');

  // Filter submissions belonging to this sub-division (or all if matches subdivisionName or default)
  const matched = submissions.filter(s => {
    if (s.subdivisionId && s.subdivisionId.toLowerCase().includes(subdivisionName.toLowerCase())) {
      return true;
    }
    if (subdivisionName.toLowerCase() === 'dolvan' || subdivisionName.toLowerCase() === 'sub-dolvan') {
      return true;
    }
    return !s.subdivisionId || s.subdivisionId === 'sub-dolvan';
  });

  const columnLayout = buildHierarchicalColumnLayout(activeItemDefs);
  const headerRow1 = columnLayout.map(c => c.headerLevel1);
  const headerRow2 = columnLayout.map(c => c.headerLevel2);

  // Calculate Merges
  const merges: XLSX.Range[] = [];
  let colIdx = 0;
  while (colIdx < columnLayout.length) {
    const currentH1 = columnLayout[colIdx].headerLevel1;
    let endCol = colIdx;
    while (endCol + 1 < columnLayout.length && columnLayout[endCol + 1].headerLevel1 === currentH1) {
      endCol++;
    }
    if (endCol > colIdx) {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: endCol } });
    } else {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 1, c: colIdx } });
    }
    colIdx = endCol + 1;
  }

  // Build Data Rows
  const dataRows: (string | number)[][] = [];
  matched.forEach((sub, idx) => {
    const row: (string | number)[] = [];
    const itemValueMap = new Map(sub.items.map(it => [it.itemId, it]));

    for (const col of columnLayout) {
      if (col.headerLevel1 === 'SR NO') {
        row.push(idx + 1);
      } else if (col.headerLevel1 === 'Location of TC') {
        row.push(sub.location);
      } else if (col.headerLevel1 === 'TC Serial Number.') {
        row.push(sub.transformerSerial || '2508');
      } else if (col.headerLevel1 === 'TC Make') {
        row.push(sub.transformerMake || 'NIK-SAN');
      } else if (col.headerLevel1 === 'TC Capacity') {
        row.push(sub.transformerCapacity || '63');
      } else if (col.itemId) {
        const itemVal = itemValueMap.get(col.itemId);
        if (!itemVal) {
          row.push('');
          continue;
        }
        if (col.subOption) {
          if (itemVal.optionValues && itemVal.optionValues[col.subOption] !== undefined) {
            row.push(itemVal.optionValues[col.subOption]);
          } else if (itemVal.selectedType && itemVal.selectedType.trim().toLowerCase() === col.subOption.trim().toLowerCase()) {
            row.push(itemVal.value !== undefined ? itemVal.value : '');
          } else {
            row.push('');
          }
        } else {
          row.push(itemVal.value !== undefined ? itemVal.value : '');
        }
      } else {
        row.push('');
      }
    }
    dataRows.push(row);
  });

  return {
    headerRow1,
    headerRow2,
    dataRows,
    columnLayout,
    merges,
    matchedSubmissions: matched,
    cleanSubName,
    fileName: `${cleanSubName}.xlsx`
  };
}

/**
 * Creates and downloads the Canonical Single Primary Excel Workbook for a Sub-Division (.xlsx)
 * Named after the Sub-Division (e.g. DOLVAN.xlsx)
 */
export function exportSubdivisionPrimaryExcelFile(
  subdivisionName: string,
  submissions: InventorySubmission[],
  itemDefinitions?: InventoryItemDefinition[]
) {
  const { headerRow1, headerRow2, dataRows, merges, cleanSubName, fileName } = buildSubdivisionExcelData(
    subdivisionName,
    submissions,
    itemDefinitions
  );

  const wb = XLSX.utils.book_new();
  const aoa = [headerRow1, headerRow2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols'] = headerRow1.map((_, i) => ({ wch: Math.max(14, String(headerRow2[i] || '').length + 4) }));

  XLSX.utils.book_append_sheet(wb, ws, `${cleanSubName}_Work_Log`);

  const validation = validateExcelWorkbook(wb);
  if (!validation.valid) {
    console.warn('[Excel Validation Warnings]:', validation.errors);
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * Validates generated Excel Workbook before user download
 */
export function validateExcelWorkbook(wb: XLSX.WorkBook): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    errors.push('Workbook contains no sheets.');
    return { valid: false, errors };
  }
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      errors.push(`Sheet "${sheetName}" is missing or unreadable.`);
      continue;
    }
    if (!ws['!ref']) {
      errors.push(`Sheet "${sheetName}" contains empty range ref.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Builds data for a specific site location
 */
export function buildHierarchicalExcelData(
  submissions: InventorySubmission[], 
  location: string, 
  _locationType?: string,
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const matched = submissions.filter(s => s.location.toLowerCase() === location.toLowerCase());
  const columnLayout = buildHierarchicalColumnLayout(activeItemDefs);

  const headerRow1 = columnLayout.map(c => c.headerLevel1);
  const headerRow2 = columnLayout.map(c => c.headerLevel2);

  const merges: XLSX.Range[] = [];
  let colIdx = 0;
  while (colIdx < columnLayout.length) {
    const currentH1 = columnLayout[colIdx].headerLevel1;
    let endCol = colIdx;
    while (endCol + 1 < columnLayout.length && columnLayout[endCol + 1].headerLevel1 === currentH1) {
      endCol++;
    }
    if (endCol > colIdx) {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: endCol } });
    } else {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 1, c: colIdx } });
    }
    colIdx = endCol + 1;
  }

  const dataRows: (string | number)[][] = [];
  matched.forEach((sub, idx) => {
    const row: (string | number)[] = [];
    const itemValueMap = new Map(sub.items.map(it => [it.itemId, it]));

    for (const col of columnLayout) {
      if (col.headerLevel1 === 'SR NO') {
        row.push(idx + 1);
      } else if (col.headerLevel1 === 'Location of TC') {
        row.push(sub.location);
      } else if (col.headerLevel1 === 'TC Serial Number.') {
        row.push(sub.transformerSerial || '2508');
      } else if (col.headerLevel1 === 'TC Make') {
        row.push(sub.transformerMake || 'NIK-SAN');
      } else if (col.headerLevel1 === 'TC Capacity') {
        row.push(sub.transformerCapacity || '63');
      } else if (col.itemId) {
        const itemVal = itemValueMap.get(col.itemId);
        if (!itemVal) {
          row.push('');
          continue;
        }
        if (col.subOption) {
          if (itemVal.optionValues && itemVal.optionValues[col.subOption] !== undefined) {
            row.push(itemVal.optionValues[col.subOption]);
          } else if (itemVal.selectedType && itemVal.selectedType.trim().toLowerCase() === col.subOption.trim().toLowerCase()) {
            row.push(itemVal.value !== undefined ? itemVal.value : '');
          } else {
            row.push('');
          }
        } else {
          row.push(itemVal.value !== undefined ? itemVal.value : '');
        }
      } else {
        row.push('');
      }
    }
    dataRows.push(row);
  });

  return { 
    headerRow1, 
    headerRow2, 
    dataRows, 
    columnLayout, 
    merges, 
    matchedSubmissions: matched 
  };
}

/**
 * Creates and downloads the exact 2-tier Merged Excel Workbook for a single location (.xlsx)
 */
export function exportLocationExcelFile(
  submissions: InventorySubmission[], 
  location: string, 
  _locationType?: string,
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const cleanFolder = sanitizeFolderName(location);
  const fileName = `${cleanFolder}_Work_Log.xlsx`;
  const wb = XLSX.utils.book_new();

  const { headerRow1, headerRow2, dataRows, merges } = buildHierarchicalExcelData(
    submissions, 
    location, 
    'Maintenance', 
    activeItemDefs
  );

  const aoa = [headerRow1, headerRow2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols'] = headerRow1.map((_, i) => ({ wch: Math.max(14, String(headerRow2[i] || '').length + 4) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Work_Log');
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports CSV format of the location sheet
 */
export function exportLocationCSVFile(
  submissions: InventorySubmission[], 
  location: string, 
  _locationType?: string,
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const cleanFolder = sanitizeFolderName(location);
  const fileName = `${cleanFolder}_Work_Log.csv`;

  const { headerRow1, headerRow2, dataRows } = buildHierarchicalExcelData(
    submissions, 
    location, 
    'Maintenance', 
    activeItemDefs
  );

  const aoa = [headerRow1, headerRow2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const csvContent = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a single Location Folder as a ZIP
 */
export async function exportSingleLocationFolderZIP(
  submissions: InventorySubmission[], 
  location: string,
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const zip = new JSZip();
  const cleanFolder = sanitizeFolderName(location);
  const folder = zip.folder(cleanFolder) || zip;

  const locData = buildHierarchicalExcelData(submissions, location, 'Maintenance', activeItemDefs);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([locData.headerRow1, locData.headerRow2, ...locData.dataRows]);
  ws['!merges'] = locData.merges;
  ws['!cols'] = locData.headerRow1.map((_, i) => ({ wch: Math.max(14, String(locData.headerRow2[i] || '').length + 4) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Work_Log');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  folder.file(`${cleanFolder}_Work_Log.xlsx`, buf);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanFolder}_Excel_Folder.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports ALL Locations in a complete ZIP package
 */
export async function exportAllLocationFoldersZIP(
  submissions: InventorySubmission[], 
  availableLocations: string[],
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions && itemDefinitions.length > 0 ? itemDefinitions : TC_MAINTENANCE_MASTER_ITEMS;
  const zip = new JSZip();
  const allLocs = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));

  for (const loc of allLocs) {
    const cleanFolder = sanitizeFolderName(loc);
    const folder = zip.folder(cleanFolder);
    if (!folder) continue;

    const locData = buildHierarchicalExcelData(submissions, loc, 'Maintenance', activeItemDefs);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([locData.headerRow1, locData.headerRow2, ...locData.dataRows]);
    ws['!merges'] = locData.merges;
    ws['!cols'] = locData.headerRow1.map((_, i) => ({ wch: Math.max(14, String(locData.headerRow2[i] || '').length + 4) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Work_Log');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    folder.file(`${cleanFolder}_Work_Log.xlsx`, buf);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'All_Site_Locations_Excel_Folders.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildFlattenedExcelData(submissions: InventorySubmission[]) {
  const headers = ['SR NO', 'Location of TC', 'TC Serial Number.', 'TC Make', 'TC Capacity', 'Item Name', 'Value/Qty', 'Specification', 'Entered By', 'Date'];
  const rows: (string | number)[][] = [];
  submissions.forEach((sub, idx) => {
    for (const it of sub.items) {
      rows.push([
        idx + 1,
        sub.location,
        sub.transformerSerial || '2508',
        sub.transformerMake || 'NIK-SAN',
        sub.transformerCapacity || '63',
        it.itemName,
        it.value,
        it.selectedType || '',
        sub.submittedBy,
        new Date(sub.timestamp).toLocaleDateString()
      ]);
    }
  });
  return { headers, rows };
}

export function exportSubmissionsToExcel(submissions: InventorySubmission[], filename = 'Site_Work_Log.xlsx') {
  const { headers, rows } = buildFlattenedExcelData(submissions);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Work_Log');
  XLSX.writeFile(wb, filename);
}

export function exportSubmissionsToCSV(submissions: InventorySubmission[], filename = 'Site_Work_Log.csv') {
  const { headers, rows } = buildFlattenedExcelData(submissions);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
