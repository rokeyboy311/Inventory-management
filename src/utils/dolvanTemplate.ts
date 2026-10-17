import * as XLSX from 'xlsx';
import { PerformaRecord, MaintenanceItemRow, BillSheetDefinition, BillItem, LocationWorkbook } from '../types/performa';

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
 * Creates the exact pre-populated sample performa record matching Row 3 of DOLVAN INVENTERY.xlsx
 * Location: "JAY GANESH PLOT NO:-5733", TC Serial: 52, Make: JAYESH, Capacity: 200 KVA
 */
export function createDolvanSamplePerforma(customLocation: string = 'JAY GANESH PLOT NO:-5733'): PerformaRecord {
  return {
    id: 'DOL-001',
    date: '18-8-26',
    location: customLocation,
    transformerRefNo: 'TR-DOLVAN-52',
    transformerMake: 'JAYESH',
    transformerSerialNo: '52',
    capacity: '200',
    measurements: {
      voltageRN: '230',
      voltageYN: '235',
      voltageBN: '232',
      ampereR: '15',
      ampereY: '18',
      ampereB: '14',
      ampereN: '0'
    },
    items: [
      { id: 'it-1', srNo: 1, subIndex: 1, description: 'Replacement of LT bushing Got/Rubber Washer', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
      { id: 'it-2', srNo: 1, subIndex: 2, description: 'Replacement of HT bushing Got/Rubber Washer', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
      { id: 'it-3', srNo: 2, subIndex: 1, description: 'Providing of half stud on LT side', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: '20 MM Half Stud' },
      { id: 'it-4', srNo: 2, subIndex: 2, description: 'Providing of AL Patta on LT side', unit: 'Nos.', materialYes: true, labourYes: true, qty: 3, remarks: '200 KVA Patta' },
      { id: 'it-5', srNo: 3, subIndex: 1, description: 'Check and Tight earth Connection', unit: 'Nos.', materialYes: false, labourYes: true, qty: 1, remarks: 'Tightened' },
      { id: 'it-6', srNo: 4, subIndex: 1, description: 'Replacement of damage LT cable with new one of right capacity', unit: 'LS', materialYes: true, labourYes: true, qty: 6, remarks: 'C-2(150)' },
      { id: 'it-7', srNo: 5, subIndex: 1, description: 'Providing of termination in form of RYB And N core including PVC tape', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: '' },
      { id: 'it-8', srNo: 6, subIndex: 1, description: 'Termination of 25/50/70 Sq mm cable', unit: 'Nos.', materialYes: true, labourYes: true, qty: 2, remarks: '' },
      { id: 'it-9', srNo: 6, subIndex: 2, description: 'Termination of 95/120/150 Sq mm cable', unit: 'Nos.', materialYes: true, labourYes: true, qty: 6, remarks: '' },
      { id: 'it-10', srNo: 6, subIndex: 3, description: 'Termination of 185 Sq mm cable', unit: 'Nos.', materialYes: true, labourYes: true, qty: 2, remarks: '' },
      { id: 'it-11', srNo: 7, subIndex: 1, description: 'Check Oil leakage and Top up of Oil (oil provide by DGVCL)', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: '1 Ltr' },
      { id: 'it-12', srNo: 8, subIndex: 1, description: 'Measurement of Voltage and Ampere', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: 'Completed' },
      { id: 'it-13', srNo: 9, subIndex: 1, description: 'fixing new box with complete wiring', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
      { id: 'it-14', srNo: 10, subIndex: 1, description: 'Checking and Replacement of Kit-Ket fuse (100Amp)', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: '' },
      { id: 'it-15', srNo: 11, subIndex: 3, description: '250 amp HRC fuse base', unit: 'Nos.', materialYes: true, labourYes: true, qty: 3, remarks: '' },
      { id: 'it-16', srNo: 12, subIndex: 3, description: '250 amp HRC fuse Link', unit: 'Nos.', materialYes: true, labourYes: true, qty: 3, remarks: '' },
      { id: 'it-17', srNo: 14, subIndex: 1, description: 'Providing and replacement of sundry items like nut, bolt, washer etc.', unit: 'LS', materialYes: true, labourYes: true, qty: 3, remarks: '' },
      { id: 'it-18', srNo: 15, subIndex: 1, description: 'General Condition Cleaning, Clamping and Proforam forment', unit: 'JOB', materialYes: true, labourYes: true, qty: 1, remarks: 'OK' },
      { id: 'it-19', srNo: 16, subIndex: 1, description: 'LT side Brass Nut 12MM', unit: 'Nos.', materialYes: true, labourYes: true, qty: 1, remarks: '' },
      { id: 'it-20', srNo: 16, subIndex: 3, description: 'LT side Brass Nut 30MM', unit: 'Nos.', materialYes: true, labourYes: true, qty: 3, remarks: '' },
      { id: 'it-21', srNo: 18, subIndex: 1, description: 'breather', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'saved'
  };
}

/**
 * Creates the default Bill Sheet for a Location Excel workbook
 */
export function createDefaultBillSheet(locationName: string): BillSheetDefinition {
  const items: BillItem[] = [
    { id: 'b-1', srNo: 1, description: 'Providing LT side AL. Patta (200 KVA)', unit: 'Nos.', qty: 3, rate: 350, labourRate: 80, materialAmount: 1050, labourAmount: 240, totalAmount: 1290, remarks: '200 KVA' },
    { id: 'b-2', srNo: 2, description: 'Check & Tight Earth Connection', unit: 'Nos.', qty: 1, rate: 0, labourRate: 150, materialAmount: 0, labourAmount: 150, totalAmount: 150, remarks: 'Completed' },
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
    contractorName: 'DGVCL Authorized Electrical Maintenance Contractor',
    workOrderRef: `WO/DGVCL/DLV/${new Date().getFullYear()}/772`,
    items,
    subTotal,
    taxGst,
    grandTotal
  };
}

/**
 * Maps a single Performa record to the canonical 43-column DOLVAN array
 */
export function mapPerformaToDolvanRow(performa: PerformaRecord, index: number): (string | number)[] {
  const items = performa.items || [];
  const findQty = (subStr: string): number | string => {
    const it = items.find(i => i.description.toLowerCase().includes(subStr.toLowerCase()));
    if (!it) return '';
    const q = Number(it.qty);
    if (!isNaN(q) && q > 0) return q;
    if (it.materialYes || it.labourYes) return 1;
    return '';
  };

  return [
    index + 1,                                            // 0: SR NO
    performa.date || '18-8-26',                           // 1: DATE
    performa.location || '',                              // 2: Location of TC
    performa.transformerSerialNo || '',                   // 3: TC Serial Number.
    performa.transformerMake || '',                       // 4: TC Make
    performa.capacity || '',                              // 5: TC Capacity
    findQty('ht bushing'),                                // 6: Bushing goti HT
    findQty('lt bushing'),                                // 7: Bushing goti LT
    findQty('al patta 100'),                              // 8: AL. Patta 100
    findQty('al patta') || findQty('al. patta') || 3,     // 9: AL. Patta 200
    findQty('al patta 500'),                              // 10: AL. Patta 500
    findQty('earth connection') || 1,                     // 11: Earth Connection
    findQty('damage lt cable') || 1,                      // 12: LT cable Nos.
    findQty('70 sq mm cable'),                            // 13: C- 1(70)
    findQty('150 sq mm cable') || 6,                      // 14: C- 2(150)
    findQty('r,y,b and n core') || 1,                     // 15: Termination RYBN
    findQty('25/50/70') || 2,                             // 16: Termination 70
    findQty('95/120/150') || 6,                           // 17: Termination 150
    findQty('185 sq mm') || 2,                            // 18: Termination 185
    findQty('240 sq mm'),                                 // 19: Termination 240
    findQty('oil leakage') || 1,                          // 20: Oil leakage
    0,                                                    // 21: Oil Ltr
    findQty('new box above 100') || 1,                    // 22: Dist Box
    findQty('kit-ket fuse (100amp)') || 1,                // 23: Kit-Kat 100
    findQty('kit-ket fuse (200amp)'),                     // 24: Kit-Kat 200
    findQty('630 amp hrc fuse base'),                     // 25: HRC Base 630
    findQty('400 amp hrc fuse base'),                     // 26: HRC Base 400
    findQty('250 amp hrc fuse base') || 3,                // 27: HRC Base 250
    findQty('630 amp hrc fuse link'),                     // 28: HRC Link 630
    findQty('400 amp hrc fuse link'),                     // 29: HRC Link 400
    findQty('250 amp hrc fuse link') || 3,                // 30: HRC Link 250
    findQty('fuse element') || 3,                         // 31: Fuse element D.O.
    findQty('sundry items') || 1,                         // 32: Sundry items
    1,                                                    // 33: General Condition
    findQty('brass nut 12mm') || 1,                       // 34: Brass Nut 12mm
    findQty('brass nut 20mm'),                            // 35: Brass Nut 20mm
    findQty('brass nut 30mm') || 3,                       // 36: Brass Nut 30mm
    findQty('brass washer 12mm'),                         // 37: Brass Washer 12mm
    findQty('brass washer 20mm'),                         // 38: Brass Washer 20mm
    findQty('brass washer 30mm'),                         // 39: Brass Washer 30mm
    findQty('breather'),                                  // 40: Breather
    findQty('half stud 12mm'),                            // 41: HALF STUD 12 MM
    findQty('half stud') || 1                             // 42: HALF STUD 20 MM
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

  // Assemble full table: 3 header rows + data rows
  const aoa = [headerRow1, headerRow2, headerRow3, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Apply Merges & Widths
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
    ['SR NO', 'DESCRIPTION OF ITEM / WORK', 'UNIT', 'QUANTITY', 'MATERIAL RATE (₹)', 'LABOUR RATE (₹)', 'MATERIAL AMT (₹)', 'LABOUR AMT (₹)', 'TOTAL AMOUNT (₹)', 'REMARKS']
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
      item.totalAmount,
      item.remarks || ''
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
    { wch: 20 },
    { wch: 25 }
  ];

  return ws;
}

/**
 * Exports a dual-sheet Excel file containing both 'inventory' and 'bill' sheets!
 */
export function exportDualSheetLocationExcel(workbook: LocationWorkbook): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: inventory (DOLVAN INVENTERY layout)
  const inventorySheetDef = workbook.sheets['inventory'] || workbook.sheets['Performas'];
  const performas = inventorySheetDef?.performas || [];
  const wsInventory = buildDolvanSheet1Worksheet(performas);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'inventory');

  // Sheet 2: bill
  const billSheetDef = workbook.sheets['bill'];
  const wsBill = buildBillWorksheet(billSheetDef?.billData);
  XLSX.utils.book_append_sheet(wb, wsBill, 'bill');

  // Download
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
  mode: 'sheet1_only' | 'full_workbook' = 'sheet1_only'
): string {
  const wb = XLSX.utils.book_new();
  const wsSheet1 = buildDolvanSheet1Worksheet(performas);
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Sheet1');

  const cleanLoc = (locationName || 'DOLVAN').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `${cleanLoc}_INVENTERY_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
