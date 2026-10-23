import * as XLSX from 'xlsx';
import { 
  PerformaRecord, 
  LocationWorkbook, 
  createBlankPerforma, 
  isNonZeroQtyValue 
} from '../types/performa';
import {
  calculateDgvclBillFromInventory,
  DGVCL_SOR_SCHEDULE,
  getDgvclBillItemId
} from './dgvclBillEngine';

export interface InventoryImportResult {
  performas: PerformaRecord[];
  detectedLocationName: string;
  totalRows: number;
  warnings: string[];
}

export interface BillImportResult {
  customRates: Record<string, number>;
  billQuantities: Record<string, number>;
  tenderPercentage: number;
  tenderTargetAmount: number;
  contractorName?: string;
  billNumber?: string;
  billDate?: string;
  warnings: string[];
}

/**
 * Normalizes an Excel date serial or string into YYYY-MM-DD
 */
function normalizeDate(raw: any): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (typeof raw === 'number') {
    // Excel date epoch
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  const str = String(raw).trim();
  // e.g. 18-8-26 or 18/08/2026 or 2026-08-18
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD-MM-YY or DD-MM-YYYY
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }
  return str;
}

/**
 * Parses an Inventory Excel file (supports 3-tier canonical DISCOM layout or flat tabular)
 */
export async function parseInventoryExcelFile(
  file: File,
  fallbackLocationName: string = ''
): Promise<InventoryImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Pick primary inventory sheet
  const sheetNames = wb.SheetNames;
  let targetSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('inventory') || 
    n.toLowerCase().includes('performa') || 
    n.toLowerCase().includes('sheet1')
  ) || sheetNames[0];

  const ws = wb.Sheets[targetSheetName];
  if (!ws) {
    throw new Error(`No readable sheet found in inventory workbook.`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rawRows.length === 0) {
    throw new Error(`Inventory sheet "${targetSheetName}" is empty.`);
  }

  // 1. Detect header layout and data start row
  let dataStartRow = 3; // default for 3-tier DISCOM header
  let isCanonical43Col = false;

  // Check row 0, 1, 2
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r];
    if (!row) continue;
    const c0 = String(row[0] || '').trim();
    const c2 = String(row[2] || '').trim();
    // If column 0 is '1' and column 2 has location text, this is the first data row
    if (c0 === '1' && c2.length > 2) {
      dataStartRow = r;
      isCanonical43Col = true;
      break;
    }
  }

  // Detect location name from file name or first row
  let detectedLoc = fallbackLocationName.trim();
  if (!detectedLoc) {
    // Extract from file name: e.g. "GIDC INVENTORY..." -> "GIDC ANKLESHWAR" or "GIDC"
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' ').trim();
    const words = cleanFileName.split(/\s+/).filter(w => !['inventory', 'shiv', 'ele', 'ra', '2', 'sheet', 'file', 'xlsx', 'xls'].includes(w.toLowerCase()));
    if (words.length > 0) {
      detectedLoc = words.join(' ').toUpperCase();
    } else {
      detectedLoc = 'NEW LOCATION';
    }
  }

  // Location prefix for Performa ID: e.g. "DOL" or "GIDC"
  const prefixWords = detectedLoc.replace(/[^A-Za-z0-9\s]/g, '').trim().split(/\s+/);
  const idPrefix = (prefixWords[0] || 'LOC').slice(0, 4).toUpperCase();

  const performas: PerformaRecord[] = [];
  const warnings: string[] = [];
  let previousDate = '';

  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const col0 = String(row[0] || '').trim();
    const col2 = String(row[2] || '').trim();

    // Check for TOTAL summary row
    if (col0.toUpperCase().includes('TOTAL') || col2.toUpperCase().includes('TOTAL')) {
      break; // End of data rows
    }

    // Skip blank rows
    if (!col0 && !col2 && !row[3]) {
      continue;
    }

    const srNum = parseInt(col0, 10) || (performas.length + 1);
    const pId = `${idPrefix}-${String(srNum).padStart(3, '0')}`;
    const rowLocation = col2 || detectedLoc;
    
    const p = createBlankPerforma(pId, rowLocation);
    if (row[1]) {
      previousDate = normalizeDate(row[1]);
    }
    p.date = previousDate || normalizeDate(row[1]);
    p.transformerSerialNo = String(row[3] || '').trim();
    p.transformerMake = String(row[4] || '').trim();
    p.capacity = String(row[5] || '').trim();

    // Helper to assign item quantities
    const setItemQty = (srLabel: string, val: any, sizeKey?: string) => {
      if (!isNonZeroQtyValue(val)) return;
      const it = p.items.find(i => i.srLabel === srLabel);
      if (!it) return;
      it.materialYes = true;
      it.labourYes = true;
      if (sizeKey) {
        it.sizeQtys = it.sizeQtys || {};
        it.sizeQtys[sizeKey] = val;
        it.qty = srLabel === '7' && sizeKey === 'Ltr' ? '1' : String(val);
      } else {
        it.qty = String(val);
      }
    };

    if (isCanonical43Col || row.length >= 20) {
      // 43-column canonical layout
      setItemQty('1.1', row[6]);               // HT bushing
      setItemQty('1', row[7]);                 // LT bushing
      setItemQty('2.1', row[8], '100');        // AL Patta 100
      setItemQty('2.1', row[9], '200');        // AL Patta 200
      setItemQty('2.1', row[10], '500');       // AL Patta 500
      setItemQty('3', row[11]);                // Earth Connection
      setItemQty('4', row[12], 'Nos.');        // LT Cable Nos
      setItemQty('4', row[13], 'C-1(70)');     // C-1(70)
      setItemQty('4', row[14], 'C-2(150)');    // C-2(150)
      setItemQty('5', row[15]);                // Termination RYBN
      setItemQty('6', row[16]);                // Termination 25/50/70
      setItemQty('6.1', row[17], '150');       // Termination 95/120/150
      setItemQty('6.2', row[18], '185');       // Termination 185
      setItemQty('6.3', row[19], '240');       // Termination 240
      setItemQty('7', row[20]);                // Oil leakage
      setItemQty('7', row[21], 'Ltr');         // Oil Ltr
      setItemQty('9.2', row[22]);              // Dist Box Above 100
      setItemQty('10', row[23], '100Amp');     // Kit-Kat 100
      setItemQty('10', row[24], '200Amp');     // Kit-Kat 200
      setItemQty('11', row[25], '630 amp');    // HRC Base 630
      setItemQty('11', row[26], '400 amp');    // HRC Base 400
      setItemQty('11', row[27], '250 amp');    // HRC Base 250
      setItemQty('12', row[28], '630 amp');    // HRC Link 630
      setItemQty('12', row[29], '400 amp');    // HRC Link 400
      setItemQty('12', row[30], '250 amp');    // HRC Link 250
      setItemQty('13', row[31]);               // DO Fuse element
      setItemQty('14', row[32]);               // Sundry
      setItemQty('15', row[33]);               // General Condition
      setItemQty('16', row[34], '12MM');       // Brass Nut 12
      setItemQty('16', row[35], '20MM');       // Brass Nut 20
      setItemQty('16', row[36], '30MM');       // Brass Nut 30
      setItemQty('17', row[37], '12MM');       // Brass Washer 12
      setItemQty('17', row[38], '20MM');       // Brass Washer 20
      setItemQty('17', row[39], '30MM');       // Brass Washer 30
      setItemQty('18', row[40], '500 gm');     // Breather 500g
      setItemQty('2', row[41], '12MM');        // Half Stud 12
      setItemQty('2', row[42], '20MM');        // Half Stud 20
    }

    performas.push(p);
  }

  if (performas.length === 0) {
    warnings.push('No valid performa records could be parsed from the uploaded inventory file.');
  }

  return {
    performas,
    detectedLocationName: detectedLoc,
    totalRows: performas.length,
    warnings
  };
}

/**
 * Parses a Bill Excel file (extracts custom SOR rates, tender target amount, and tender percentage)
 */
export async function parseBillExcelFile(file: File): Promise<BillImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  
  const customRates: Record<string, number> = {};
  const billQuantities: Record<string, number> = {};
  let tenderPercentage = 20;
  let tenderTargetAmount = 2000000;
  let contractorName: string | undefined = undefined;
  let billNumber: string | undefined = undefined;
  const warnings: string[] = [];

  let page1Row = 9;
  let page2Row = 10;
  DGVCL_SOR_SCHEDULE.forEach((item, itemIndex) => {
    const rowNumber = item.page === 1 ? page1Row++ : page2Row++;
    const sheet = wb.Sheets[item.page === 1 ? 'GST BILL' : 'GST BILL 2'];
    if (!sheet || item.isHeader) return;

    const itemId = getDgvclBillItemId(item, itemIndex);
    const rate = sheet[`H${rowNumber}`]?.v;
    if (typeof rate === 'number' && Number.isFinite(rate)) {
      customRates[itemId] = rate;
    }

    const quantity = sheet[`E${rowNumber}`]?.v;
    if (typeof quantity === 'number' && Number.isFinite(quantity)) {
      billQuantities[itemId] = quantity;
    } else if (typeof quantity === 'string' && quantity.trim()) {
      const parsedQuantity = Number(quantity);
      if (Number.isFinite(parsedQuantity)) billQuantities[itemId] = parsedQuantity;
    }
  });

  // Check 'GST BILL 2' (Page 2)
  const ws2 = wb.Sheets['GST BILL 2'] || wb.Sheets['BILL FORM-2'];
  if (ws2) {
    // Check Tender % in summary lines (e.g. Above 20 %)
    for (let r = 25; r <= 35; r++) {
      const txt = String(ws2['B' + r]?.v || '') + ' ' + String(ws2['H' + r]?.v || '');
      const match = txt.match(/above\s*(\d+(\.\d+)?)\s*%/i);
      if (match) {
        tenderPercentage = parseFloat(match[1]);
        break;
      }
    }

    // Extract contractor name if available
    for (let r = 40; r <= 70; r++) {
      const val = String(ws2['B' + r]?.v || '');
      if (val.toLowerCase().includes('contractor') || val.toLowerCase().includes('shiv')) {
        contractorName = val.trim();
        break;
      }
    }
  }

  return {
    customRates,
    billQuantities,
    tenderPercentage,
    tenderTargetAmount,
    contractorName,
    billNumber,
    warnings
  };
}

/**
 * Main importer orchestrator: creates a complete LocationWorkbook with dual sheets (inventory + bill)
 */
export async function createLocationWorkbookFromExcelImport(options: {
  locationName: string;
  inventoryFile: File;
  billFile?: File | null;
}): Promise<{ workbook: LocationWorkbook; recordCount: number; warnings: string[] }> {
  const { locationName, inventoryFile, billFile } = options;

  // 1. Parse Inventory
  const invResult = await parseInventoryExcelFile(inventoryFile, locationName);
  const finalLocationName = (locationName || invResult.detectedLocationName || 'IMPORTED LOCATION').trim();

  // 2. Parse Bill (if provided)
  let billResult: BillImportResult = {
    customRates: {},
    billQuantities: {},
    tenderPercentage: 20,
    tenderTargetAmount: 2000000,
    warnings: []
  };

  if (billFile) {
    try {
      billResult = await parseBillExcelFile(billFile);
    } catch (err: any) {
      invResult.warnings.push(`Notice: Could not parse all details from bill file (${err.message || 'Error'}). Standard DGVCL rates applied.`);
    }
  }

  // Generate unique locationId
  const cleanId = finalLocationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 16);
  const locationId = `loc_${cleanId}_${Date.now().toString(36)}`;
  const workbookName = `${finalLocationName}.xlsx`;

  // 3. Compute DGVCL Bill Sheet directly from imported performas & custom rates
  const billOptions = {
    tenderTargetAmount: billResult.tenderTargetAmount,
    tenderPercentage: billResult.tenderPercentage,
    billNumber: billResult.billNumber,
    contractorName: billResult.contractorName,
    customRates: billResult.customRates
  };
  const calculatedBill = calculateDgvclBillFromInventory(
    invResult.performas,
    finalLocationName,
    billOptions
  );
  const quantityOverrides = Object.fromEntries(
    Object.entries(billResult.billQuantities).filter(([itemId, quantity]) => {
      const calculatedQuantity = calculatedBill.billData.items.find(item => item.id === itemId)?.qty;
      return calculatedQuantity !== undefined && calculatedQuantity !== quantity;
    })
  );
  const billCalc = Object.keys(quantityOverrides).length > 0
    ? calculateDgvclBillFromInventory(invResult.performas, finalLocationName, {
      ...billOptions,
      quantityOverrides
    })
    : calculatedBill;

  const nowIso = new Date().toISOString();

  // 4. Construct Dual-Sheet LocationWorkbook
  const workbook: LocationWorkbook = {
    locationId,
    locationName: finalLocationName,
    workbookName,
    activeSheetName: 'inventory',
    lastModified: nowIso,
    tenderTargetAmount: billResult.tenderTargetAmount,
    tenderPercentage: billResult.tenderPercentage,
    sheets: {
      'inventory': {
        name: 'inventory',
        type: 'inventory',
        performas: invResult.performas,
        rawRowsCount: invResult.performas.length,
        isCompatible: true
      },
      'bill': {
        name: 'bill',
        type: 'bill',
        performas: [],
        billData: billCalc.billData,
        rawRowsCount: billCalc.billData.items.length,
        isCompatible: true
      }
    }
  };

  return {
    workbook,
    recordCount: invResult.performas.length,
    warnings: [...invResult.warnings, ...billResult.warnings]
  };
}
