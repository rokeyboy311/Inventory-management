import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { InventorySubmission, InventoryItemDefinition } from '../types/inventory';

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
 * Builds dynamic 2-Tier hierarchical column structure based on configured items & sub-options
 */
export function buildHierarchicalColumnLayout(itemDefinitions: InventoryItemDefinition[]): ExcelColumnLayout[] {
  const layout: ExcelColumnLayout[] = [
    { headerLevel1: 'Entry_ID', headerLevel2: 'ID' },
    { headerLevel1: 'Timestamp', headerLevel2: 'Date / Time' }
  ];

  for (const item of itemDefinitions) {
    if (item.options && item.options.length > 0) {
      // Multi-column item with sub-options (e.g. Lug -> 100, 200, 500)
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
      // Single column item (e.g. Power, Earth Compaction, Box)
      layout.push({
        itemId: item.id,
        itemName: item.name,
        headerLevel1: item.name,
        headerLevel2: item.unit ? `Value (${item.unit})` : 'Value'
      });
    }
  }

  layout.push(
    { headerLevel1: 'Submitted_By', headerLevel2: 'User' },
    { headerLevel1: 'Notes', headerLevel2: 'Remarks' },
    { headerLevel1: 'Sync_Status', headerLevel2: 'Status' }
  );

  return layout;
}

/**
 * Builds 2-Tier Header Data Rows and Excel Merges for Location File
 */
export function buildHierarchicalExcelData(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance',
  itemDefinitions: InventoryItemDefinition[]
) {
  const matched = submissions.filter(
    s => s.location.toLowerCase() === location.toLowerCase() && s.locationType === locationType
  );

  const columnLayout = buildHierarchicalColumnLayout(itemDefinitions);
  
  // Row 1 & Row 2 headers
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
      // Horizontal merge across Row 1 for multi-option items (e.g. Lug across 100, 200, 500)
      merges.push({
        s: { r: 0, c: colIdx },
        e: { r: 0, c: endCol }
      });
    } else {
      // Single column (can be vertically merged if preferred)
      merges.push({
        s: { r: 0, c: colIdx },
        e: { r: 1, c: colIdx }
      });
    }

    colIdx = endCol + 1;
  }

  // Data rows (Row 3 onwards)
  const dataRows: (string | number)[][] = [];

  for (const sub of matched) {
    const row: (string | number)[] = [];
    const itemValueMap = new Map(sub.items.map(it => [it.itemId, it]));

    for (const col of columnLayout) {
      if (col.headerLevel1 === 'Entry_ID') {
        row.push(sub.id);
      } else if (col.headerLevel1 === 'Timestamp') {
        row.push(new Date(sub.timestamp).toLocaleString());
      } else if (col.headerLevel1 === 'Submitted_By') {
        row.push(sub.submittedBy || 'Site Personnel');
      } else if (col.headerLevel1 === 'Notes') {
        row.push(sub.notes || '');
      } else if (col.headerLevel1 === 'Sync_Status') {
        row.push(sub.syncStatus);
      } else if (col.itemId) {
        const itemVal = itemValueMap.get(col.itemId);
        if (!itemVal) {
          row.push('');
          continue;
        }

        if (col.subOption) {
          // Multi-option column (e.g. Lug -> 100)
          if (itemVal.optionValues && itemVal.optionValues[col.subOption] !== undefined) {
            row.push(itemVal.optionValues[col.subOption]);
          } else if (itemVal.selectedType && itemVal.selectedType.toLowerCase() === col.subOption.toLowerCase()) {
            row.push(itemVal.value !== undefined ? itemVal.value : '');
          } else {
            row.push('');
          }
        } else {
          // Single-value column (e.g. Power, Earth Compaction, Box)
          row.push(itemVal.value !== undefined ? itemVal.value : '');
        }
      } else {
        row.push('');
      }
    }

    dataRows.push(row);
  }

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
 * Creates and downloads the exact 2-tier Hierarchical Merged Excel Workbook (.xlsx)
 */
export function exportLocationExcelFile(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance',
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions || defaultFallbackItemDefs;
  const cleanFolder = sanitizeFolderName(location);
  const fileName = locationType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;
  const wb = XLSX.utils.book_new();

  const { headerRow1, headerRow2, dataRows, merges } = buildHierarchicalExcelData(
    submissions, 
    location, 
    locationType, 
    activeItemDefs
  );

  const aoa = [headerRow1, headerRow2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;

  // Auto column widths
  ws['!cols'] = headerRow1.map((_, i) => ({ wch: Math.max(12, String(headerRow2[i] || '').length + 4) }));

  const sheetTitle = locationType === 'In house' ? 'In_House_Log' : 'Maintenance_Log';
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  XLSX.writeFile(wb, fileName);
}

/**
 * Exports CSV version with combined header names
 */
export function exportLocationCSVFile(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance',
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions || defaultFallbackItemDefs;
  const cleanFolder = sanitizeFolderName(location);
  const fileName = locationType === 'In house' ? `${cleanFolder}_In_House.csv` : `${cleanFolder}_Maintenance.csv`;

  const { headerRow1, headerRow2, dataRows } = buildHierarchicalExcelData(
    submissions, 
    location, 
    locationType, 
    activeItemDefs
  );

  const combinedHeaders = headerRow1.map((h1, i) => {
    const h2 = headerRow2[i];
    return h2 && h2 !== 'Value' && h2 !== 'ID' && h2 !== 'User' && h2 !== 'Remarks' && h2 !== 'Status'
      ? `${h1} (${h2})`
      : h1;
  });

  const ws = XLSX.utils.aoa_to_sheet([combinedHeaders, ...dataRows]);
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
 * Exports a single Location Folder as a ZIP containing the 2 dedicated Excel files
 */
export async function exportSingleLocationFolderZIP(
  submissions: InventorySubmission[], 
  location: string,
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions || defaultFallbackItemDefs;
  const zip = new JSZip();
  const cleanFolder = sanitizeFolderName(location);
  const folder = zip.folder(cleanFolder) || zip;

  // 1. In House File
  const inHouseData = buildHierarchicalExcelData(submissions, location, 'In house', activeItemDefs);
  const wbInHouse = XLSX.utils.book_new();
  const wsInHouse = XLSX.utils.aoa_to_sheet([inHouseData.headerRow1, inHouseData.headerRow2, ...inHouseData.dataRows]);
  wsInHouse['!merges'] = inHouseData.merges;
  XLSX.utils.book_append_sheet(wbInHouse, wsInHouse, 'In_House_Log');
  const bufInHouse = XLSX.write(wbInHouse, { type: 'array', bookType: 'xlsx' });
  folder.file(`${cleanFolder}_In_House.xlsx`, bufInHouse);

  // 2. Maintenance File
  const maintData = buildHierarchicalExcelData(submissions, location, 'Maintenance', activeItemDefs);
  const wbMaint = XLSX.utils.book_new();
  const wsMaint = XLSX.utils.aoa_to_sheet([maintData.headerRow1, maintData.headerRow2, ...maintData.dataRows]);
  wsMaint['!merges'] = maintData.merges;
  XLSX.utils.book_append_sheet(wbMaint, wsMaint, 'Maintenance_Log');
  const bufMaint = XLSX.write(wbMaint, { type: 'array', bookType: 'xlsx' });
  folder.file(`${cleanFolder}_Maintenance.xlsx`, bufMaint);

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
 * Exports ALL Locations in a complete ZIP package with folder structure
 */
export async function exportAllLocationFoldersZIP(
  submissions: InventorySubmission[], 
  availableLocations: string[],
  itemDefinitions?: InventoryItemDefinition[]
) {
  const activeItemDefs = itemDefinitions || defaultFallbackItemDefs;
  const zip = new JSZip();
  const allLocs = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));

  for (const loc of allLocs) {
    const cleanFolder = sanitizeFolderName(loc);
    const folder = zip.folder(cleanFolder);
    if (!folder) continue;

    // 1. In House File
    const inHouseData = buildHierarchicalExcelData(submissions, loc, 'In house', activeItemDefs);
    const wbInHouse = XLSX.utils.book_new();
    const wsInHouse = XLSX.utils.aoa_to_sheet([inHouseData.headerRow1, inHouseData.headerRow2, ...inHouseData.dataRows]);
    wsInHouse['!merges'] = inHouseData.merges;
    XLSX.utils.book_append_sheet(wbInHouse, wsInHouse, 'In_House_Log');
    const bufInHouse = XLSX.write(wbInHouse, { type: 'array', bookType: 'xlsx' });
    folder.file(`${cleanFolder}_In_House.xlsx`, bufInHouse);

    // 2. Maintenance File
    const maintData = buildHierarchicalExcelData(submissions, loc, 'Maintenance', activeItemDefs);
    const wbMaint = XLSX.utils.book_new();
    const wsMaint = XLSX.utils.aoa_to_sheet([maintData.headerRow1, maintData.headerRow2, ...maintData.dataRows]);
    wsMaint['!merges'] = maintData.merges;
    XLSX.utils.book_append_sheet(wbMaint, wsMaint, 'Maintenance_Log');
    const bufMaint = XLSX.write(wbMaint, { type: 'array', bookType: 'xlsx' });
    folder.file(`${cleanFolder}_Maintenance.xlsx`, bufMaint);
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

// Fallback items if none provided
const defaultFallbackItemDefs: InventoryItemDefinition[] = [
  { id: 'power', name: 'Power', fieldType: 'input_only' },
  { id: 'earth_compaction', name: 'Earth Compaction', fieldType: 'input_only', defaultValue: '1' },
  { id: 'lug', name: 'Lug', fieldType: 'dual', options: ['100', '200', '500'] },
  { id: 'box', name: 'Box', fieldType: 'input_only' },
  { id: 'cable', name: 'Cable', fieldType: 'dual', options: ['1.5 sq mm', '2.5 sq mm', '4 sq mm', 'Armoured'] }
];

export function buildLocationSpecificExcelData(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance'
) {
  const layoutData = buildHierarchicalExcelData(submissions, location, locationType, defaultFallbackItemDefs);
  return {
    headers: layoutData.headerRow1,
    headerRow1: layoutData.headerRow1,
    headerRow2: layoutData.headerRow2,
    rows: layoutData.dataRows,
    matchedSubmissions: layoutData.matchedSubmissions
  };
}

export function buildItemMasterRegisterData(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance'
) {
  const headers = ['Item_Name', 'Total_Logged_Count', 'Latest_Value', 'Last_Updated'];
  const matched = submissions.filter(s => s.location.toLowerCase() === location.toLowerCase() && s.locationType === locationType);
  const rows = defaultFallbackItemDefs.map(d => [d.name, matched.length, '-', '-']);
  return { headers, rows };
}

export function buildMatrixSubmissionData(
  submissions: InventorySubmission[], 
  location: string, 
  locationType: 'In house' | 'Maintenance'
) {
  const layoutData = buildHierarchicalExcelData(submissions, location, locationType, defaultFallbackItemDefs);
  return {
    headers: layoutData.headerRow1.map((h, i) => `${h} (${layoutData.headerRow2[i]})`),
    rows: layoutData.dataRows
  };
}

export function buildFlattenedExcelData(submissions: InventorySubmission[]) {
  const headers = ['Entry_ID', 'Timestamp', 'Location', 'Location_Type', 'Item_Name', 'Value_Entered', 'Submitted_By', 'Sync_Status'];
  const rows: (string | number)[][] = [];
  for (const sub of submissions) {
    for (const it of sub.items) {
      rows.push([sub.id, new Date(sub.timestamp).toLocaleString(), sub.location, sub.locationType, it.itemName, it.value, sub.submittedBy, sub.syncStatus]);
    }
  }
  return { headers, rows };
}

export function exportSubmissionsToExcel(submissions: InventorySubmission[], filename = 'Site_Inventory_Log.xlsx') {
  const { headers, rows } = buildFlattenedExcelData(submissions);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Log');
  XLSX.writeFile(wb, filename);
}

export function exportSubmissionsToCSV(submissions: InventorySubmission[], filename = 'Site_Inventory_Log.csv') {
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
