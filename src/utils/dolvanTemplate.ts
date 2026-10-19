import * as XLSX from 'xlsx';
import {
  PerformaRecord,
  BillSheetDefinition,
  BillItem,
  LocationWorkbook,
  ensureCompleteMasterItems,
  isNonZeroQtyValue,
  computeSummaryQtyFromSizes
} from '../types/performa';

/**
 * Exact Column Specification for DOLVAN INVENTERY.xlsx -> Sheet1 (43 columns)
 * 100% aligned with the DISCOM master reference file.
 */
export interface DolvanColumnDef {
  key: string;
  header1: string;
  header2: string;
  header3: string;
  width: number;
}

export const DOLVAN_SHEET1_COLUMNS: DolvanColumnDef[] = [
  // 0 to 5: Main TC Identifiers
  { key: 'srNo', header1: 'SR NO', header2: '', header3: '', width: 8 },
  { key: 'date', header1: 'DATE', header2: '', header3: '', width: 12 },
  { key: 'location', header1: 'Location of TC', header2: '', header3: '', width: 28 },
  { key: 'serialNo', header1: 'TC Serial Number.', header2: '', header3: '', width: 18 },
  { key: 'make', header1: 'TC Make', header2: '', header3: '', width: 16 },
  { key: 'capacity', header1: 'TC Capacity', header2: '', header3: '', width: 14 },

  // 6 & 7: Bushing Goti (HT & LT) - Sr No. 1
  { key: 'bushingHT', header1: 'Replacement of  bushing goti', header2: '1', header3: 'HT', width: 10 },
  { key: 'bushingLT', header1: 'Replacement of  bushing goti', header2: '', header3: 'LT', width: 10 },

  // 8 to 10: AL Patta KVA (100, 200, 500) - Sr No. 2
  { key: 'alPatta100', header1: 'Providing LT side AL. Patta KVA', header2: '2', header3: '100', width: 10 },
  { key: 'alPatta200', header1: 'Providing LT side AL. Patta KVA', header2: '', header3: '200', width: 10 },
  { key: 'alPatta500', header1: 'Providing LT side AL. Patta KVA', header2: '', header3: '500', width: 10 },

  // 11: Earth Connection - Sr No. 3
  { key: 'earthConnection', header1: 'Check and Tight Earth Connection', header2: '3', header3: '', width: 14 },

  // 12 to 14: LT Damaged Cable - Sr No. 4
  { key: 'ltCableNos', header1: 'Replacement of LT damaged cable', header2: '4', header3: 'Nos.', width: 10 },
  { key: 'ltCableC1', header1: 'Replacement of LT damaged cable', header2: '', header3: 'C- 1(70)', width: 12 },
  { key: 'ltCableC2', header1: 'Replacement of LT damaged cable', header2: '', header3: 'C- 2(150)', width: 12 },

  // 15: Providing of new termination in form of RYBN core
  { key: 'terminationRYBN', header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '', header3: '', width: 18 },

  // 16 to 19: Termination up to sq mm cable - Sr No. 5
  { key: 'termination70', header1: 'Providing of termination up to sq mm cable', header2: '5', header3: '70', width: 10 },
  { key: 'termination150', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '150', width: 10 },
  { key: 'termination185', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '185', width: 10 },
  { key: 'termination240', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '240', width: 10 },

  // 20 & 21: Check oil leakage and fill up - Sr No. 6
  { key: 'oilLeakage', header1: 'Check oil leakage and fill up ', header2: '6', header3: '', width: 12 },
  { key: 'oilLeakageLtr', header1: 'Check oil leakage and fill up ', header2: '', header3: 'Ltr', width: 10 },

  // 22: Replacement of deteriorated / providing LT dist Box - Sr No. 7
  { key: 'distBox', header1: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity ', header2: '7', header3: '', width: 16 },

  // 23 & 24: KIT-KAT FUSE (100 AMP, 200 AMP)
  { key: 'kitKet100', header1: 'KIT-KAT FUSE ', header2: '100 AMP', header3: '', width: 12 },
  { key: 'kitKet200', header1: 'KIT-KAT FUSE ', header2: '200 AMP', header3: '', width: 12 },

  // 25 to 27: Replacement of HRC Fuse Base - Sr No. 8
  { key: 'hrcBase630', header1: 'Replacement of HRC Fuse Base', header2: '8', header3: '630', width: 10 },
  { key: 'hrcBase400', header1: 'Replacement of HRC Fuse Base', header2: '', header3: '400', width: 10 },
  { key: 'hrcBase250', header1: 'Replacement of HRC Fuse Base', header2: '', header3: '250', width: 10 },

  // 28 to 30: Replacement of HRC Fuse Link - Sr No. 9
  { key: 'hrcLink630', header1: 'Replacement of HRC Fuse Link', header2: '9', header3: '630', width: 10 },
  { key: 'hrcLink400', header1: 'Replacement of HRC Fuse Link', header2: '', header3: '400', width: 10 },
  { key: 'hrcLink250', header1: 'Replacement of HRC Fuse Link', header2: '', header3: '250', width: 10 },

  // 31: Providing of Fuse element (D.O.) - Sr No. 10
  { key: 'fuseElementDO', header1: 'Providing of Fuse elemant (D.O.) ', header2: '10', header3: '', width: 12 },

  // 32: Providing of Sundry items (Nut, Bolt, Washer) - Sr No. 11
  { key: 'sundryItems', header1: 'Providing of Sundry items (Nut,Bolt,Washer)', header2: '11', header3: '', width: 14 },

  // 33: General Condition - Sr No. 12
  { key: 'generalCondition', header1: 'General Condition', header2: '12', header3: '', width: 12 },

  // 34 to 36: LT Side Brass Nuts (12mm, 20mm, 30mm) - Sr No. 13
  { key: 'brassNut12', header1: 'LT Side Brass Nuts ', header2: '13', header3: '12 mm', width: 10 },
  { key: 'brassNut20', header1: 'LT Side Brass Nuts ', header2: '', header3: '20 mm', width: 10 },
  { key: 'brassNut30', header1: 'LT Side Brass Nuts ', header2: '', header3: '30 mm', width: 10 },

  // 37 to 39: LT Side Brass Washer (12mm, 20mm, 30mm)
  { key: 'brassWasher12', header1: 'LT Side Brass Washer ', header2: '', header3: '12 mm', width: 10 },
  { key: 'brassWasher20', header1: 'LT Side Brass Washer ', header2: '', header3: '20 mm', width: 10 },
  { key: 'brassWasher30', header1: 'LT Side Brass Washer ', header2: '', header3: '30 mm', width: 10 },

  // 40: Breather 500 gm
  { key: 'breather', header1: 'Breather ', header2: '', header3: '500 gm', width: 12 },

  // 41 & 42: HALF STUD (12 MM, 20 MM)
  { key: 'halfStud12', header1: 'HALF STUD ', header2: '', header3: '12 MM', width: 10 },
  { key: 'halfStud20', header1: 'HALF STUD ', header2: '', header3: '20 MM', width: 10 }
];

/**
 * Builds the exact merges matching DOLVAN INVENTERY.xlsx Sheet1
 */
export function buildDolvanSheet1Merges(): XLSX.Range[] {
  return [
    { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },     // Bushing goti (Col 6 - 7)
    { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } },    // AL. Patta KVA (Col 8 - 10)
    { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } },   // LT damaged cable (Col 12 - 14)
    { s: { r: 0, c: 16 }, e: { r: 0, c: 19 } },   // Termination up to sq mm (Col 16 - 19)
    { s: { r: 0, c: 20 }, e: { r: 0, c: 21 } },   // Check oil leakage (Col 20 - 21)
    { s: { r: 0, c: 23 }, e: { r: 0, c: 24 } },   // KIT-KAT FUSE (Col 23 - 24)
    { s: { r: 0, c: 25 }, e: { r: 0, c: 27 } },   // HRC Fuse Base (Col 25 - 27)
    { s: { r: 0, c: 28 }, e: { r: 0, c: 30 } },   // HRC Fuse Link (Col 28 - 30)
    { s: { r: 0, c: 34 }, e: { r: 0, c: 36 } },   // LT Side Brass Nuts (Col 34 - 36)
    { s: { r: 0, c: 37 }, e: { r: 0, c: 39 } },   // LT Side Brass Washer (Col 37 - 39)
    { s: { r: 0, c: 41 }, e: { r: 0, c: 42 } }    // HALF STUD (Col 41 - 42)
  ];
}

/**
 * Creates the sample performa record matching Row 3 of DOLVAN INVENTERY.xlsx
 * Location: "JAY GANESH PLOT NO:-5733", TC Serial: 52, Make: Aman, Capacity: 200 KVA
 */
export function createDolvanSamplePerforma(customLocation: string = 'JAY GANESH PLOT NO:-5733'): PerformaRecord {
  const baseItems = ensureCompleteMasterItems([]);

  const applySample = (
    srLabel: string,
    qty: number | string,
    sizeQtys?: Record<string, number | string>,
    mat: boolean = true,
    lab: boolean = true
  ) => {
    const row = baseItems.find(r => r.srLabel === srLabel);
    if (row) {
      row.materialYes = mat;
      row.labourYes = lab;
      if (sizeQtys && row.sizeFields) {
        row.sizeQtys = { ...(row.sizeQtys || {}), ...sizeQtys };
        row.qty = computeSummaryQtyFromSizes(row.sizeFields, row.sizeQtys, qty);
      } else {
        row.qty = qty;
      }
    }
  };

  applySample('2', 1);
  applySample('2.1', 3);
  applySample('3', 1);
  applySample('4', '6m', { 'Nos.': 1, 'C-1(70)': '', 'C-2(150)': 6 });
  applySample('5', 1);
  applySample('6', 2, { '25': '', '50': '', '70': 2 });
  applySample('6.1', 6, { '95': '', '120': '', '150': 6 });
  applySample('6.2', 2, { '185': 2 });
  applySample('7', '', undefined, true, true);
  applySample('8', 1);
  applySample('10', 1, { '100Amp': 1, '200Amp': '' });
  applySample('11', 3, { '630 amp': '', '400 amp': '', '250 amp': 3 });
  applySample('12', 3, { '630 amp': '', '400 amp': '', '250 amp': 3 });
  applySample('13', 3);
  applySample('14', 1);
  applySample('15', 1);
  applySample('16', 4, { '12MM': 1, '20MM': '', '30MM': 3 });

  return {
    id: 'DOL-001',
    date: '2026-09-18',
    location: customLocation,
    transformerRefNo: 'TR-DOLVAN-52',
    transformerMake: 'Aman',
    transformerSerialNo: '52',
    capacity: '200',
    division: 'ANKLESHWAR IND DIVISION',
    subDivision: 'ANKLESHWAR GIDC SDN',
    performaNo: 'DOL-001',
    workOrderNo: 'WO/DGVCL/DLV/2026/772',
    serviceOrderNo: 'SO/DGVCL/GIDC/2026/104',
    measurements: {
      voltageRN: '234',
      voltageYN: '235',
      voltageBN: '232',
      ampereR: '99',
      ampereY: '72',
      ampereB: '85',
      ampereN: '42'
    },
    items: baseItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'saved'
  };
}

/**
 * Creates the default Bill Sheet for a Location Excel workbook
 */
export function createDefaultBillSheet(_locationName: string): BillSheetDefinition {
  const items: BillItem[] = [
    { id: 'b-1', srNo: 1, description: 'Providing LT side AL. Patta (200 KVA)', unit: 'Nos.', qty: 3, rate: 350, labourRate: 80, materialAmount: 1050, labourAmount: 240, totalAmount: 1290, remarks: '200 KVA' },
    { id: 'b-2', srNo: 2, description: 'Check & Tight Earth Connection', unit: 'Nos.', qty: 1, rate: 0, labourRate: 150, materialAmount: 0, labourRateAmount: 150, labourAmount: 150, totalAmount: 150, remarks: 'Completed' } as any,
    { id: 'b-3', srNo: 3, description: 'Replacement of damaged LT cable (C-2 150 sq mm)', unit: 'Mtr', qty: 6, rate: 450, labourRate: 100, materialAmount: 2700, labourAmount: 600, totalAmount: 3300, remarks: '6 Meters' },
    { id: 'b-4', srNo: 4, description: 'Providing of new termination in form of RYBN core', unit: 'Nos.', qty: 1, rate: 250, labourRate: 90, materialAmount: 250, labourAmount: 90, totalAmount: 340, remarks: 'PVC Tape' },
    { id: 'b-5', srNo: 5, description: 'Providing of cable termination (70 sq mm)', unit: 'Nos.', qty: 2, rate: 120, labourRate: 60, materialAmount: 240, labourAmount: 120, totalAmount: 360, remarks: '2 Ends' },
    { id: 'b-6', srNo: 6, description: 'Providing of cable termination (150 sq mm)', unit: 'Nos.', qty: 6, rate: 160, labourRate: 80, materialAmount: 960, labourAmount: 480, totalAmount: 1440, remarks: '6 Ends' },
    { id: 'b-7', srNo: 7, description: 'Check oil leakage & top-up transformer oil', unit: 'Ltr', qty: 1, rate: 180, labourRate: 50, materialAmount: 180, labourAmount: 50, totalAmount: 230, remarks: '1 Liter' },
    { id: 'b-8', srNo: 8, description: 'Checking and replacement of Kit-Kat fuse 100A', unit: 'Nos.', qty: 1, rate: 280, labourRate: 60, materialAmount: 280, labourAmount: 60, totalAmount: 340, remarks: '' },
    { id: 'b-9', srNo: 9, description: 'Replacement of 250A HRC Fuse Base & Link', unit: 'Nos.', qty: 3, rate: 420, labourRate: 70, materialAmount: 1260, labourAmount: 210, totalAmount: 1470, remarks: 'Set of 3' },
    { id: 'b-10', srNo: 10, description: 'Providing Sundry items (Nut, Bolt, Washer)', unit: 'Sets', qty: 3, rate: 90, labourRate: 30, materialAmount: 270, labourAmount: 90, totalAmount: 360, remarks: '' },
    { id: 'b-11', srNo: 11, description: 'Providing Half Stud 20MM on LT side', unit: 'Nos.', qty: 1, rate: 220, labourRate: 50, materialAmount: 220, labourAmount: 50, totalAmount: 270, remarks: 'Brass 20MM' }
  ];

  const subTotal = items.reduce((sum, it) => sum + it.totalAmount, 0);
  const taxGst = Math.round(subTotal * 0.18);
  const grandTotal = subTotal + taxGst;

  return {
    name: 'bill',
    billNumber: `BILL-${new Date().getFullYear()}-001`,
    billDate: new Date().toISOString().slice(0, 10),
    contractorName: 'SHIV ELECTRICALS - DGVCL Authorized Maintenance Contractor',
    workOrderRef: `WO/DGVCL/DLV/${new Date().getFullYear()}/772`,
    items,
    subTotal,
    taxGst,
    grandTotal
  };
}

/**
 * Maps a single Performa record (including sizeQtys) to the canonical 43-column DOLVAN array
 */
export function mapPerformaToDolvanRow(performa: PerformaRecord, index: number): (string | number)[] {
  const items = ensureCompleteMasterItems(performa.items || []);

  const parseVal = (raw: number | string | undefined | null): number | string => {
    if (!isNonZeroQtyValue(raw)) return '';
    const str = String(raw).trim();
    const n = Number(str);
    return !isNaN(n) ? n : str;
  };

  const getRowBySr = (srLabel: string) => items.find(i => i.srLabel === srLabel);

  const getSingleQty = (srLabel: string): number | string => {
    const it = getRowBySr(srLabel);
    if (!it) return '';
    const parsed = parseVal(it.qty);
    if (parsed !== '') return parsed;
    if (it.materialYes || it.labourYes) return 1;
    return '';
  };

  const getSizeQty = (srLabel: string, sizeKey: string): number | string => {
    const it = getRowBySr(srLabel);
    if (!it) return '';
    if (it.sizeQtys && isNonZeroQtyValue(it.sizeQtys[sizeKey])) {
      return parseVal(it.sizeQtys[sizeKey]);
    }
    return '';
  };

  const getCombinedSizesQty = (srLabel: string, sizeKeys: string[]): number | string => {
    const it = getRowBySr(srLabel);
    if (!it) return '';
    if (it.sizeQtys) {
      let sum = 0;
      let hasAny = false;
      for (const k of sizeKeys) {
        if (isNonZeroQtyValue(it.sizeQtys[k])) {
          hasAny = true;
          const n = Number(it.sizeQtys[k]);
          if (!isNaN(n)) sum += n;
        }
      }
      if (hasAny) return sum > 0 ? sum : parseVal(it.qty);
    }
    return parseVal(it.qty);
  };

  return [
    index + 1,                                                       // 0: SR NO
    performa.date || '2026-09-18',                                   // 1: DATE
    performa.location || '',                                         // 2: Location of TC
    performa.transformerSerialNo || '',                              // 3: TC Serial Number.
    performa.transformerMake || '',                                  // 4: TC Make
    performa.capacity || '',                                         // 5: TC Capacity
    getSingleQty('1.1'),                                             // 6: Bushing goti HT
    getSingleQty('1'),                                               // 7: Bushing goti LT
    '',                                                              // 8: AL. Patta 100
    getSingleQty('2.1'),                                             // 9: AL. Patta 200
    '',                                                              // 10: AL. Patta 500
    getSingleQty('3'),                                               // 11: Earth Connection
    getSizeQty('4', 'Nos.'),                                         // 12: LT cable Nos.
    getSizeQty('4', 'C-1(70)'),                                      // 13: C- 1(70)
    getSizeQty('4', 'C-2(150)'),                                     // 14: C- 2(150)
    getSingleQty('5'),                                               // 15: Termination RYBN
    getCombinedSizesQty('6', ['25', '50', '70']),                    // 16: Termination 70 (25/50/70)
    getCombinedSizesQty('6.1', ['95', '120', '150']),                // 17: Termination 150 (95/120/150)
    getSizeQty('6.2', '185') || getSingleQty('6.2'),                 // 18: Termination 185
    '',                                                              // 19: Termination 240
    getSingleQty('7'),                                               // 20: Oil leakage
    0,                                                               // 21: Oil Ltr
    getCombinedSizesQty('9.1', ['Up to 100 Amp', 'Above 100 Amp']) || getSingleQty('9'), // 22: Dist Box
    getSizeQty('10', '100Amp'),                                      // 23: Kit-Kat 100
    getSizeQty('10', '200Amp'),                                      // 24: Kit-Kat 200
    getSizeQty('11', '630 amp'),                                     // 25: HRC Base 630
    getSizeQty('11', '400 amp'),                                     // 26: HRC Base 400
    getSizeQty('11', '250 amp'),                                     // 27: HRC Base 250
    getSizeQty('12', '630 amp'),                                     // 28: HRC Link 630
    getSizeQty('12', '400 amp'),                                     // 29: HRC Link 400
    getSizeQty('12', '250 amp'),                                     // 30: HRC Link 250
    getSingleQty('13'),                                              // 31: Fuse element D.O.
    getSingleQty('14'),                                              // 32: Sundry items
    getSingleQty('15') || 1,                                         // 33: General Condition
    getSizeQty('16', '12MM'),                                        // 34: Brass Nut 12mm
    getSizeQty('16', '20MM'),                                        // 35: Brass Nut 20mm
    getSizeQty('16', '30MM'),                                        // 36: Brass Nut 30mm
    getSizeQty('17', '12MM'),                                        // 37: Brass Washer 12mm
    getSizeQty('17', '20MM'),                                        // 38: Brass Washer 20mm
    getSizeQty('17', '30MM'),                                        // 39: Brass Washer 30mm
    getSingleQty('18'),                                              // 40: Breather
    '',                                                              // 41: HALF STUD 12 MM
    getSingleQty('2')                                                // 42: HALF STUD 20 MM
  ];
}

/**
 * Builds the canonical Sheet1 (inventory) worksheet matching DOLVAN INVENTERY.xlsx
 */
export function buildDolvanSheet1Worksheet(performas: PerformaRecord[]): XLSX.WorkSheet {
  const headerRow1 = DOLVAN_SHEET1_COLUMNS.map(c => c.header1);
  const headerRow2 = DOLVAN_SHEET1_COLUMNS.map(c => c.header2);
  const headerRow3 = DOLVAN_SHEET1_COLUMNS.map(c => c.header3);

  const dataRows = performas.map((p, idx) => mapPerformaToDolvanRow(p, idx));

  const aoa = [headerRow1, headerRow2, headerRow3, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = buildDolvanSheet1Merges();
  ws['!cols'] = DOLVAN_SHEET1_COLUMNS.map(c => ({ wch: c.width }));
  ws['!rows'] = [
    { hpt: 30, hpx: 40 },
    { hpt: 24, hpx: 32 },
    { hpt: 18, hpx: 24 },
    ...performas.map(() => ({ hpt: 21, hpx: 28 }))
  ];

  return ws;
}

/**
 * Builds the Bill worksheet
 */
export function buildBillWorksheet(billData?: BillSheetDefinition): XLSX.WorkSheet {
  const b = billData || createDefaultBillSheet('Location');

  const rows: any[][] = [
    ['DGVCL TRANSFORMER MAINTENANCE BILL & ESTIMATE'],
    ['Bill No:', b.billNumber, '', 'Date:', b.billDate],
    ['Contractor:', b.contractorName, '', 'Work Order:', b.workOrderRef],
    [],
    ['SR NO', 'DESCRIPTION OF ITEM / WORK', 'UNIT', 'QUANTITY', 'MATERIAL RATE (₹)', 'LABOUR RATE (₹)', 'MATERIAL AMT (₹)', 'LABOUR AMT (₹)', 'TOTAL AMOUNT (₹)']
  ];

  b.items.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.description,
      item.unit,
      item.qty,
      item.rate,
      item.labourRate,
      item.materialAmount,
      item.labourAmount,
      item.totalAmount
    ]);
  });

  rows.push([]);
  rows.push(['', '', '', '', '', '', '', 'Sub-Total (₹):', b.subTotal]);
  rows.push(['', '', '', '', '', '', '', 'GST (18%):', b.taxGst]);
  rows.push(['', '', '', '', '', '', '', 'GRAND TOTAL (₹):', b.grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 }
  ];

  return ws;
}

/**
 * Exports a dual-sheet Excel file containing both 'inventory' and 'bill' sheets!
 */
export function exportDualSheetLocationExcel(workbook: LocationWorkbook): string {
  const wb = XLSX.utils.book_new();

  const inventorySheetDef = workbook.sheets['inventory'] || workbook.sheets['Performas'];
  const performas = inventorySheetDef?.performas || [];
  const wsInventory = buildDolvanSheet1Worksheet(performas);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'inventory');

  const billSheetDef = workbook.sheets['bill'];
  const wsBill = buildBillWorksheet(billSheetDef?.billData);
  XLSX.utils.book_append_sheet(wb, wsBill, 'bill');

  const cleanLoc = (workbook.locationName || 'LOCATION').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `${cleanLoc}_INVENTORY_BILL.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Compatible export for ExportReferenceModal
 */
export function exportDolvanReferenceExcel(
  performas: PerformaRecord[],
  locationName: string = 'DOLVAN',
  _mode: 'sheet1_only' | 'full_workbook' = 'sheet1_only'
): string {
  const wb = XLSX.utils.book_new();
  const wsSheet1 = buildDolvanSheet1Worksheet(performas);
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Sheet1');

  const cleanLoc = (locationName || 'DOLVAN').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `${cleanLoc}_INVENTERY_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
