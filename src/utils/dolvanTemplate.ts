import XLSX from 'xlsx-js-style';
import {
  PerformaRecord,
  BillSheetDefinition,
  BillItem,
  LocationWorkbook,
  ensureCompleteMasterItems,
  isNonZeroQtyValue,
  computeSummaryQtyFromSizes
} from '../types/performa';
import { syncBillFromInventory } from './billSync';
import { getMasterItemsList } from './itemsMaster';
import { 
  calculateDgvclBillFromInventory, 
  DgvclBillCalculationResult, 
  getTenderTargetForLocation, 
  getTenderPercentForLocation 
} from './dgvclBillEngine';

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
  { key: 'srNo', header1: 'SR NO', header2: '', header3: '', width: 5.5 },
  { key: 'date', header1: 'DATE', header2: '', header3: '', width: 11 },
  { key: 'location', header1: 'Location of TC', header2: '', header3: '', width: 34 },
  { key: 'serialNo', header1: 'TC Serial Number.', header2: '', header3: '', width: 14 },
  { key: 'make', header1: 'TC Make', header2: '', header3: '', width: 10 },
  { key: 'capacity', header1: 'TC Capacity', header2: '', header3: '', width: 9 },

  // 6 & 7: Bushing Goti (HT & LT) - Sr No. 1
  { key: 'bushingHT', header1: 'Replacement of  bushing goti', header2: '1', header3: 'HT', width: 5.5 },
  { key: 'bushingLT', header1: 'Replacement of  bushing goti', header2: '', header3: 'LT', width: 5.5 },

  // 8 to 10: AL Patta KVA (100, 200, 500) - Sr No. 2
  { key: 'alPatta100', header1: 'Providing LT side AL. Patta KVA', header2: '2', header3: '100', width: 5.5 },
  { key: 'alPatta200', header1: 'Providing LT side AL. Patta KVA', header2: '', header3: '200', width: 5.5 },
  { key: 'alPatta500', header1: 'Providing LT side AL. Patta KVA', header2: '', header3: '500', width: 5.5 },

  // 11: Earth Connection - Sr No. 3
  { key: 'earthConnection', header1: 'Check and Tight Earth Connection', header2: '3', header3: '', width: 7.5 },

  // 12 to 14: LT Damaged Cable - Sr No. 4
  { key: 'ltCableNos', header1: 'Replacement of LT damaged cable', header2: '4', header3: 'Nos.', width: 5.5 },
  { key: 'ltCableC1', header1: 'Replacement of LT damaged cable', header2: '', header3: 'C- 1(70)', width: 6.5 },
  { key: 'ltCableC2', header1: 'Replacement of LT damaged cable', header2: '', header3: 'C- 2(150)', width: 6.5 },

  // 15: Providing of new termination in form of RYBN core
  { key: 'terminationRYBN', header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '', header3: '', width: 8.0 },

  // 16 to 19: Termination up to sq mm cable - Sr No. 5
  { key: 'termination70', header1: 'Providing of termination up to sq mm cable', header2: '5', header3: '70', width: 5.5 },
  { key: 'termination150', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '150', width: 5.5 },
  { key: 'termination185', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '185', width: 5.5 },
  { key: 'termination240', header1: 'Providing of termination up to sq mm cable', header2: '', header3: '240', width: 5.5 },

  // 20 & 21: Check oil leakage and fill up - Sr No. 6
  { key: 'oilLeakage', header1: 'Check oil leakage and fill up ', header2: '6', header3: '', width: 5.5 },
  { key: 'oilLeakageLtr', header1: 'Check oil leakage and fill up ', header2: '', header3: 'Ltr', width: 5.5 },

  // 22: Replacement of deteriorated / providing LT dist Box - Sr No. 7
  { key: 'distBox', header1: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity ', header2: '7', header3: '', width: 8.0 },

  // 23 & 24: KIT-KAT FUSE (100 AMP, 200 AMP)
  { key: 'kitKet100', header1: 'KIT-KAT FUSE ', header2: '100 AMP', header3: '', width: 7.0 },
  { key: 'kitKet200', header1: 'KIT-KAT FUSE ', header2: '200 AMP', header3: '', width: 7.0 },

  // 25 to 27: Replacement of HRC Fuse Base - Sr No. 8
  { key: 'hrcBase630', header1: 'Replacement of HRC Fuse Base', header2: '8', header3: '630', width: 5.5 },
  { key: 'hrcBase400', header1: 'Replacement of HRC Fuse Base', header2: '', header3: '400', width: 5.5 },
  { key: 'hrcBase250', header1: 'Replacement of HRC Fuse Base', header2: '', header3: '250', width: 5.5 },

  // 28 to 30: Replacement of HRC Fuse Link - Sr No. 9
  { key: 'hrcLink630', header1: 'Replacement of HRC Fuse Link', header2: '9', header3: '630', width: 5.5 },
  { key: 'hrcLink400', header1: 'Replacement of HRC Fuse Link', header2: '', header3: '400', width: 5.5 },
  { key: 'hrcLink250', header1: 'Replacement of HRC Fuse Link', header2: '', header3: '250', width: 5.5 },

  // 31: Providing of Fuse element (D.O.) - Sr No. 10
  { key: 'fuseElementDO', header1: 'Providing of Fuse elemant (D.O.) ', header2: '10', header3: '', width: 7.5 },

  // 32: Providing of Sundry items (Nut, Bolt, Washer) - Sr No. 11
  { key: 'sundryItems', header1: 'Providing of Sundry items (Nut,Bolt,Washer)', header2: '11', header3: '', width: 7.5 },

  // 33: General Condition - Sr No. 12
  { key: 'generalCondition', header1: 'General Condition', header2: '12', header3: '', width: 7.5 },

  // 34 to 36: LT Side Brass Nuts (12mm, 20mm, 30mm) - Sr No. 13
  { key: 'brassNut12', header1: 'LT Side Brass Nuts ', header2: '13', header3: '12 mm', width: 5.5 },
  { key: 'brassNut20', header1: 'LT Side Brass Nuts ', header2: '', header3: '20 mm', width: 5.5 },
  { key: 'brassNut30', header1: 'LT Side Brass Nuts ', header2: '', header3: '30 mm', width: 5.5 },

  // 37 to 39: LT Side Brass Washer (12mm, 20mm, 30mm)
  { key: 'brassWasher12', header1: 'LT Side Brass Washer ', header2: '', header3: '12 mm', width: 5.5 },
  { key: 'brassWasher20', header1: 'LT Side Brass Washer ', header2: '', header3: '20 mm', width: 5.5 },
  { key: 'brassWasher30', header1: 'LT Side Brass Washer ', header2: '', header3: '30 mm', width: 5.5 },

  // 40: Breather 500 gm
  { key: 'breather', header1: 'Breather ', header2: '', header3: '500 gm', width: 7.5 },

  // 41 & 42: HALF STUD (12 MM, 20 MM)
  { key: 'halfStud12', header1: 'HALF STUD ', header2: '', header3: '12 MM', width: 5.5 },
  { key: 'halfStud20', header1: 'HALF STUD ', header2: '', header3: '20 MM', width: 5.5 }
];

/**
 * Builds the exact merges matching DOLVAN INVENTERY.xlsx Sheet1
 */
export function buildDolvanSheet1Merges(): XLSX.Range[] {
  return [
    // 0 to 5: Main TC Identifiers vertically merged across rows 0, 1, 2
    { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } },     // SR NO
    { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } },     // DATE
    { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } },     // Location of TC
    { s: { r: 0, c: 3 }, e: { r: 2, c: 3 } },     // TC Serial Number.
    { s: { r: 0, c: 4 }, e: { r: 2, c: 4 } },     // TC Make
    { s: { r: 0, c: 5 }, e: { r: 2, c: 5 } },     // TC Capacity

    // Row 0 Horizontal merges for items
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
    { s: { r: 0, c: 41 }, e: { r: 0, c: 42 } },   // HALF STUD (Col 41 - 42)

    // Row 1 Horizontal merges for SR numbers across sub-columns
    { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } },     // '1' Bushing goti (Col 6 - 7)
    { s: { r: 1, c: 8 }, e: { r: 1, c: 10 } },    // '2' AL. Patta KVA (Col 8 - 10)
    { s: { r: 1, c: 12 }, e: { r: 1, c: 14 } },   // '4' LT damaged cable (Col 12 - 14)
    { s: { r: 1, c: 16 }, e: { r: 1, c: 19 } },   // '5' Termination up to sq mm (Col 16 - 19)
    { s: { r: 1, c: 20 }, e: { r: 1, c: 21 } },   // '6' Check oil leakage (Col 20 - 21)
    { s: { r: 1, c: 25 }, e: { r: 1, c: 27 } },   // '8' HRC Fuse Base (Col 25 - 27)
    { s: { r: 1, c: 28 }, e: { r: 1, c: 30 } },   // '9' HRC Fuse Link (Col 28 - 30)
    { s: { r: 1, c: 34 }, e: { r: 1, c: 36 } }    // '13' LT Side Brass Nuts (Col 34 - 36)
  ];
}

export interface EffectiveDolvanColumn extends DolvanColumnDef {
  customSrLabel?: string;
  customSizeField?: string;
}

/**
 * Builds the effective set of columns dynamically based on location master items
 * and items present in performa records.
 */
export function getEffectiveDolvanColumns(
  locationId?: string,
  performas: PerformaRecord[] = []
): { columns: EffectiveDolvanColumn[]; merges: XLSX.Range[] } {
  const columns: EffectiveDolvanColumn[] = [...DOLVAN_SHEET1_COLUMNS];
  const merges: XLSX.Range[] = buildDolvanSheet1Merges();

  const STANDARD_SR_LABELS = new Set([
    '1', '1.1', '2', '2.1', '3', '4', '5', '6', '6.1', '6.2', '7', '8', '9', '9.1', '9.2', '10', '11', '12', '13', '14', '15', '16', '17', '18'
  ]);

  const extraItems: { srLabel: string; description: string; unit: string; sizeFields?: string[] }[] = [];

  // Check master items list for the location
  const masterItems = getMasterItemsList(locationId);
  for (const it of masterItems) {
    if (!STANDARD_SR_LABELS.has(it.srLabel) && !extraItems.some(x => x.srLabel === it.srLabel)) {
      extraItems.push({
        srLabel: it.srLabel,
        description: it.description,
        unit: it.unit || 'Nos.',
        sizeFields: it.sizeFields
      });
    }
  }

  // Also check if any performa has custom items
  for (const p of performas) {
    if (Array.isArray(p.items)) {
      for (const it of p.items) {
        if (it.srLabel && !STANDARD_SR_LABELS.has(it.srLabel) && !extraItems.some(x => x.srLabel === it.srLabel)) {
          extraItems.push({
            srLabel: it.srLabel,
            description: it.description,
            unit: it.unit || 'Nos.',
            sizeFields: it.sizeFields
          });
        }
      }
    }
  }

  // Append extra custom columns
  for (const item of extraItems) {
    if (item.sizeFields && item.sizeFields.length > 0) {
      const startCol = columns.length;
      item.sizeFields.forEach((sf) => {
        columns.push({
          key: `custom_${item.srLabel}_${sf}`,
          header1: item.description,
          header2: item.srLabel,
          header3: sf,
          width: 6.0,
          customSrLabel: item.srLabel,
          customSizeField: sf
        });
      });
      const endCol = columns.length - 1;
      if (endCol > startCol) {
        merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: endCol } });
        merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: endCol } });
      }
    } else {
      columns.push({
        key: `custom_${item.srLabel}`,
        header1: item.description,
        header2: item.srLabel,
        header3: item.unit || '',
        width: 7.5,
        customSrLabel: item.srLabel
      });
    }
  }

  return { columns, merges };
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
 * Maps a single Performa record (including sizeQtys and dynamic custom items) to row values
 */
export function mapPerformaToDolvanRow(
  performa: PerformaRecord,
  index: number,
  allColumns: EffectiveDolvanColumn[] = DOLVAN_SHEET1_COLUMNS
): (string | number)[] {
  const items = ensureCompleteMasterItems(performa.items || []);

  const parseVal = (raw: number | string | undefined | null): number | string => {
    if (!isNonZeroQtyValue(raw)) return '';
    const str = String(raw).trim();
    const n = Number(str);
    return !isNaN(n) ? n : str;
  };

  const getRowBySr = (srLabel: string) => performa.items?.find(i => i.srLabel === srLabel) || items.find(i => i.srLabel === srLabel);

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

  const getSizeQtyOrLegacy = (srLabel: string, sizeKey: string): number | string => {
    const it = getRowBySr(srLabel);
    if (!it) return '';
    const sizeQty = getSizeQty(srLabel, sizeKey);
    if (sizeQty !== '') return sizeQty;
    if (it.sizeQtys && Object.values(it.sizeQtys).some(isNonZeroQtyValue)) return '';
    return getSingleQty(srLabel);
  };

  const getOilLeakageQty = (): number | string => {
    const it = getRowBySr('7');
    if (!it || (!isNonZeroQtyValue(it.qty) && !it.materialYes && !it.labourYes)) return '';
    return isNonZeroQtyValue(it.qty) ? parseVal(it.qty) : 1;
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

  const formatDateDisplay = (raw?: string): string => {
    if (!raw) return '2026-09-18';
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return `${m[3]}-${m[2]}-${m[1]}`;
    }
    return raw;
  };

  const baseRow: (string | number)[] = [
    index + 1,                                                                     // 0: SR NO
    formatDateDisplay(performa.date),                                             // 1: DATE
    (performa.location || '').toUpperCase(),                                      // 2: Location of TC
    performa.transformerSerialNo || '',                                           // 3: TC Serial Number.
    performa.transformerMake || '',                                               // 4: TC Make
    performa.capacity || '',                                                      // 5: TC Capacity
    getSingleQty('1.1'),                                                          // 6: Bushing goti HT
    getSingleQty('1'),                                                            // 7: Bushing goti LT
    getSizeQty('2.1', '100'),                                                     // 8: AL. Patta 100
    getSizeQtyOrLegacy('2.1', '200'),                                             // 9: AL. Patta 200
    getSizeQty('2.1', '500'),                                                     // 10: AL. Patta 500
    getSingleQty('3'),                                                            // 11: Earth Connection
    getSizeQty('4', 'Nos.'),                                                      // 12: LT cable Nos.
    getSizeQty('4', 'C-1(70)'),                                                   // 13: C- 1(70)
    getSizeQty('4', 'C-2(150)'),                                                  // 14: C- 2(150)
    getSingleQty('5'),                                                            // 15: Termination RYBN
    getSingleQty('6') || getCombinedSizesQty('6', ['25', '50', '70']),            // 16: Termination 70 (25/50/70)
    getCombinedSizesQty('6.1', ['95', '120', '150']),                             // 17: Termination 150 (95/120/150)
    getSizeQty('6.2', '185') || getSingleQty('6.2'),                              // 18: Termination 185
    getSizeQty('6.2', '240') || getSizeQty('6', '240'),                           // 19: Termination 240
    getOilLeakageQty(),                                                           // 20: Oil leakage
    getSizeQty('7', 'Ltr') || (getOilLeakageQty() !== '' ? 0 : ''),                // 21: Oil Ltr (0 when checked without extra liters)
    ((Number(getSingleQty('9.1')) || 0) + (Number(getSingleQty('9.2')) || 0)) || getCombinedSizesQty('9.1', ['Up to 100 Amp', 'Above 100 Amp']) || getSingleQty('9'), // 22: Dist Box
    getSizeQty('10', '100Amp'),                                                   // 23: Kit-Kat 100
    getSizeQty('10', '200Amp'),                                                   // 24: Kit-Kat 200
    getSizeQty('11', '630 amp'),                                                  // 25: HRC Base 630
    getSizeQty('11', '400 amp'),                                                  // 26: HRC Base 400
    getSizeQty('11', '250 amp'),                                                  // 27: HRC Base 250
    getSizeQty('12', '630 amp'),                                                  // 28: HRC Link 630
    getSizeQty('12', '400 amp'),                                                  // 29: HRC Link 400
    getSizeQty('12', '250 amp'),                                                  // 30: HRC Link 250
    getSingleQty('13'),                                                           // 31: Fuse element D.O.
    getSingleQty('14'),                                                           // 32: Sundry items
    getSingleQty('15') || 1,                                                      // 33: General Condition
    getSizeQty('16', '12MM'),                                                     // 34: Brass Nut 12mm
    getSizeQty('16', '20MM'),                                                     // 35: Brass Nut 20mm
    getSizeQty('16', '30MM'),                                                     // 36: Brass Nut 30mm
    getSizeQty('17', '12MM'),                                                     // 37: Brass Washer 12mm
    getSizeQty('17', '20MM'),                                                     // 38: Brass Washer 20mm
    getSizeQty('17', '30MM'),                                                     // 39: Brass Washer 30mm
    getSingleQty('18'),                                                           // 40: Breather
    getSizeQty('2', '12MM'),                                                      // 41: HALF STUD 12 MM
    getSizeQtyOrLegacy('2', '20MM')                                               // 42: HALF STUD 20 MM
  ];

  // Dynamically map custom columns
  for (let c = 43; c < allColumns.length; c++) {
    const colDef = allColumns[c];
    const targetSr = colDef.customSrLabel;
    if (!targetSr) {
      baseRow.push('');
      continue;
    }
    const it = performa.items?.find(i => i.srLabel === targetSr) || items.find(i => i.srLabel === targetSr);
    if (!it) {
      baseRow.push('');
      continue;
    }
    if (colDef.customSizeField) {
      const v = it.sizeQtys?.[colDef.customSizeField];
      baseRow.push(parseVal(v));
    } else {
      const v = parseVal(it.qty);
      if (v !== '') {
        baseRow.push(v);
      } else if (it.materialYes || it.labourYes) {
        baseRow.push(1);
      } else {
        baseRow.push('');
      }
    }
  }

  return baseRow;
}

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

const BORDER_TOTAL = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'double', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

/**
 * Builds the canonical Sheet1 (inventory) worksheet matching DOLVAN INVENTERY.xlsx
 * Exactly reproduces reference layout: tall header, vertical 90deg text, bold styles,
 * borders on every cell, column sums on TOTAL row, and compact field sizes.
 */
export function buildDolvanSheet1Worksheet(
  performas: PerformaRecord[],
  locationId?: string
): XLSX.WorkSheet {
  const { columns: allColumns, merges } = getEffectiveDolvanColumns(locationId, performas);

  const headerRow1 = allColumns.map(c => c.header1);
  const headerRow2 = allColumns.map((c, i) => i < 6 ? '' : c.header2);
  const headerRow3 = allColumns.map((c, i) => i < 6 ? '' : c.header3);

  const dataRows = performas.map((p, idx) => mapPerformaToDolvanRow(p, idx, allColumns));

  // Compute Total Row
  const totalRow: (string | number)[] = ['TOTAL', '', '', '', '', ''];
  for (let c = 6; c < allColumns.length; c++) {
    let sum = 0;
    let hasNumeric = false;
    for (const row of dataRows) {
      const val = row[c];
      if (typeof val === 'number') {
        sum += val;
        hasNumeric = true;
      } else if (typeof val === 'string' && val.trim() !== '') {
        const n = Number(val);
        if (!isNaN(n)) {
          sum += n;
          hasNumeric = true;
        }
      }
    }
    totalRow.push(hasNumeric && sum > 0 ? sum : '');
  }

  const aoa = [headerRow1, headerRow2, headerRow3, ...dataRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const totalRowIdx = 3 + dataRows.length;
  // Merge TOTAL across columns 0 to 5
  merges.push({ s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 5 } });

  const totalCols = allColumns.length;

  // Apply complete cell-by-cell styling, fonts, rotation, borders
  for (let r = 0; r <= totalRowIdx; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }

      if (r === 0) {
        ws[cellRef].s = {
          font: { name: 'Arial', sz: 8.5, bold: true, color: { rgb: '000000' } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
          border: BORDER_THIN
        };
      } else if (r === 1) {
        ws[cellRef].s = {
          font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: '000000' } },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: BORDER_THIN
        };
      } else if (r === 2) {
        ws[cellRef].s = {
          font: { name: 'Arial', sz: 8.5, bold: true, color: { rgb: '000000' } },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: BORDER_THIN
        };
      } else if (r === totalRowIdx) {
        if (c < 6) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_TOTAL
          };
        } else {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_TOTAL
          };
        }
      } else {
        // Data rows (r >= 3 && r < totalRowIdx)
        if (c === 0) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_THIN
          };
        } else if (c === 1) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_THIN
          };
        } else if (c === 2) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'left' },
            border: BORDER_THIN
          };
        } else if (c === 3 || c === 4) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_THIN
          };
        } else if (c === 5) {
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_THIN
          };
        } else {
          // Item quantities
          ws[cellRef].s = {
            font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: '000000' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: BORDER_THIN
          };
        }
      }
    }
  }

  ws['!merges'] = merges;
  ws['!cols'] = allColumns.map(c => ({ wch: c.width }));
  ws['!rows'] = [
    { hpt: 135, hpx: 180 }, // tall rotated item titles matching Image 1
    { hpt: 20, hpx: 26 },   // SR numbers row
    { hpt: 20, hpx: 26 },   // sizes / sub-headers row
    ...performas.map(() => ({ hpt: 19, hpx: 25 })), // data rows
    { hpt: 22, hpx: 29 }    // TOTAL row
  ];
  ws['!views'] = [{ showGridLines: true }];

  return ws;
}

/**
 * Builds the Bill worksheet with professional DISCOM styling
 */
const BORDER_BILL_CELL = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

const BORDER_BILL_TOTAL = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'double', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

/**
 * Builds Page 1 of the official DGVCL SOR Bill: 'GST BILL'
 * Reproduces the exact multi-row header, column layout, thin borders,
 * formula linkages to inventory totals, and Page 1 bottom sum (=SUM(J9:J49)).
 */
export function buildGstBillWorksheet(
  calc: DgvclBillCalculationResult,
  invSheetName: string = 'inventory',
  invTotalRow: number = 182
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  const safeInv = invSheetName.includes(' ') ? `'${invSheetName}'` : invSheetName;

  // Row 2-7: Multi-row Headers
  const setCell = (r: number, c: number, v: any, bold: boolean = false, align: 'center' | 'left' | 'right' = 'center', f?: string) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell: any = {
      t: typeof v === 'number' ? 'n' : 's',
      v: v ?? '',
      s: {
        font: { name: 'Arial', sz: 9, bold, color: { rgb: '000000' } },
        alignment: { vertical: 'center', horizontal: align, wrapText: true },
        border: BORDER_BILL_CELL
      }
    };
    if (f) cell.f = f;
    ws[addr] = cell;
  };

  // Setup grid empty borders for header rows 1 to 7
  for (let r = 1; r <= 7; r++) {
    for (let c = 1; c <= 11; c++) {
      setCell(r, c, '');
    }
  }

  // Header Titles
  setCell(1, 1, 'Sr No.', true, 'center');
  setCell(1, 2, 'Unit', true, 'center');
  setCell(1, 3, 'Quantity executed (or supplied', true, 'center');
  setCell(4, 3, 'Since\nprevious\nbill ARC', true, 'center');
  setCell(4, 4, 'Qty\nexecuted\nin this bill', true, 'center');
  setCell(1, 5, 'Items of work or supplies\n(grouped under Sub-heads of\nSub-works or estimates)', true, 'center');
  setCell(1, 7, 'Rate', true, 'center');
  setCell(1, 8, 'Amount', true, 'center');
  setCell(3, 8, 'Since\nprevious\nbill total\nfor each', true, 'center');
  setCell(3, 9, 'Qty\nexecuted\nin this\nbill total', true, 'center');
  setCell(4, 10, 'Up to\ndate', true, 'center');
  setCell(1, 11, 'Remark', true, 'center');

  // Header Merges
  merges.push(
    { s: { r: 1, c: 1 }, e: { r: 6, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 6, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 3, c: 4 } },
    { s: { r: 4, c: 3 }, e: { r: 6, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 6, c: 4 } },
    { s: { r: 1, c: 5 }, e: { r: 6, c: 6 } },
    { s: { r: 1, c: 7 }, e: { r: 6, c: 7 } },
    { s: { r: 1, c: 8 }, e: { r: 2, c: 10 } },
    { s: { r: 3, c: 8 }, e: { r: 6, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 6, c: 9 } },
    { s: { r: 4, c: 10 }, e: { r: 6, c: 10 } },
    { s: { r: 1, c: 11 }, e: { r: 6, c: 11 } }
  );

  // Row 8 (r: 7): Column numbering
  const colNums = ['', 1, 2, 3, 4, 5, '', 6, 7, 8, 9, 10];
  for (let c = 1; c <= 11; c++) {
    setCell(7, c, colNums[c] ?? '', true, 'center');
  }

  // Page 1 Item Rows (Rows 9 to 49, r: 8 to 48)
  const items = calc.page1Items;
  for (let r = 8; r <= 48; r++) {
    const item = items[r - 8];
    for (let c = 1; c <= 11; c++) {
      setCell(r, c, '');
    }
    merges.push({ s: { r, c: 5 }, e: { r, c: 6 } });

    if (!item) continue;

    const rowNum = r + 1;
    // Sr No
    setCell(r, 1, item.description.startsWith('Checking') || item.description === 'Half Stud' ? '' : (item.srNo === 1 ? '1' : String(item.remarks?.includes('Header') ? '' : (item.id.replace('dgvcl-item-', '').replace(/_/g, '.').split('-')[0]))), false, 'center');
    // Unit
    setCell(r, 2, item.unit || '', false, 'center');
    // Qty Executed Since Previous Bill
    setCell(r, 3, '', false, 'center');

    // Qty in This Bill (with formula if applicable)
    let qtyFormula: string | undefined = undefined;
    if (calc.billData.quantityOverrides?.[item.id] === undefined) {
      if (rowNum === 9) qtyFormula = 'E10+E11';
      else if (rowNum === 10) qtyFormula = `${safeInv}!$H$${invTotalRow}`;
      else if (rowNum === 11) qtyFormula = `${safeInv}!$G$${invTotalRow}`;
      else if (rowNum === 12) qtyFormula = `${safeInv}!$I$${invTotalRow}+${safeInv}!$J$${invTotalRow}`;
      else if (rowNum === 13) qtyFormula = 'E12';
      else if (rowNum === 14) qtyFormula = `${safeInv}!$K$${invTotalRow}`;
      else if (rowNum === 15) qtyFormula = 'E14';
      else if (rowNum === 16) qtyFormula = `${safeInv}!$L$${invTotalRow}`;
      else if (rowNum === 17) qtyFormula = `${safeInv}!$M$${invTotalRow}`;
      else if (rowNum === 18) qtyFormula = `${safeInv}!$P$${invTotalRow}`;
      else if (rowNum === 19) qtyFormula = `${safeInv}!$Q$${invTotalRow}`;
      else if (rowNum === 21) qtyFormula = `${safeInv}!$R$${invTotalRow}`;
      else if (rowNum === 22) qtyFormula = `${safeInv}!$S$${invTotalRow}`;
      else if (rowNum === 23) qtyFormula = `${safeInv}!$T$${invTotalRow}`;
      else if (rowNum === 24) qtyFormula = 'E23+E22+E21+E19';
      else if (rowNum === 26) qtyFormula = `${safeInv}!$U$${invTotalRow}`;
      else if (rowNum === 30) qtyFormula = `${safeInv}!$W$${invTotalRow}`;
      else if (rowNum === 32) qtyFormula = `${safeInv}!$X$${invTotalRow}`;
      else if (rowNum === 33) qtyFormula = `${safeInv}!$Y$${invTotalRow}`;
      else if (rowNum === 35) qtyFormula = `${safeInv}!$Z$${invTotalRow}`;
      else if (rowNum === 36) qtyFormula = `${safeInv}!$AA$${invTotalRow}`;
      else if (rowNum === 37) qtyFormula = `${safeInv}!$AB$${invTotalRow}`;
      else if (rowNum === 38) qtyFormula = 'E35+E36+E37';
      else if (rowNum === 40) qtyFormula = `${safeInv}!$AC$${invTotalRow}`;
      else if (rowNum === 41) qtyFormula = `${safeInv}!$AD$${invTotalRow}`;
      else if (rowNum === 42) qtyFormula = `${safeInv}!$AE$${invTotalRow}`;
      else if (rowNum === 43) qtyFormula = `${safeInv}!$AF$${invTotalRow}`;
      else if (rowNum === 44) qtyFormula = 'E43';
      else if (rowNum === 45) qtyFormula = `${safeInv}!$AG$${invTotalRow}`;
      else if (rowNum === 46) qtyFormula = `${safeInv}!$AH$${invTotalRow}`;
      else if (rowNum === 49) qtyFormula = `${safeInv}!$AP$${invTotalRow}`;
    }

    setCell(r, 4, item.qty > 0 || qtyFormula ? item.qty : '', false, 'center', qtyFormula);

    // Description of Item
    setCell(r, 5, item.description, item.remarks === 'Category Header', 'left');

    // Rate
    setCell(r, 7, item.rate > 0 ? item.rate : '', false, 'right');

    // Amount = H{rowNum} * E{rowNum}
    const amtFormula = item.rate > 0 ? `H${rowNum}*E${rowNum}` : undefined;
    setCell(r, 9, item.totalAmount > 0 || amtFormula ? item.totalAmount : '', true, 'right', amtFormula);

    // Remark
    setCell(r, 11, rowNum === 9 ? 'Full Rate recommended' : '', false, 'center');
  }

  // Row 50 (r: 49): TOTAL OF PAGE
  for (let c = 1; c <= 11; c++) {
    setCell(49, c, '');
  }
  setCell(49, 1, 'TOTAL OF PAGE', true, 'center');
  merges.push({ s: { r: 49, c: 1 }, e: { r: 49, c: 6 } });
  setCell(49, 9, calc.page1Total, true, 'right', 'SUM(J9:J49)');

  // Row 58 footnote
  setCell(57, 1, '*The second signature is only necessary when the officer who prepared the bill not the officer who makes the payment.', false, 'left');
  merges.push({ s: { r: 57, c: 1 }, e: { r: 57, c: 11 } });

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 3 },   // A
    { wch: 8 },   // B: Sr No
    { wch: 8 },   // C: Unit
    { wch: 10 },  // D: Since prev
    { wch: 12 },  // E: Qty
    { wch: 45 },  // F: Description
    { wch: 10 },  // G
    { wch: 10 },  // H: Rate
    { wch: 12 },  // I: Prev amount
    { wch: 14 },  // J: Amount
    { wch: 14 },  // K: Up to date
    { wch: 22 }   // L: Remark
  ];
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 60, c: 11 } });
  ws['!views'] = [{ showGridLines: true }];

  return ws;
}

/**
 * Builds Page 2 of the official DGVCL SOR Bill: 'GST BILL 2'
 * Reproduces the FIRST PAGE TOTAL carry forward ('GST BILL'!J50), remaining items & labor,
 * Total (A), Above 20% tender premium, Net Total, GST 18%, Grand Total,
 * and the official Certificates and Signature blocks.
 */
export function buildGstBill2Worksheet(
  calc: DgvclBillCalculationResult,
  invSheetName: string = 'inventory',
  invTotalRow: number = 182
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  const safeInv = invSheetName.includes(' ') ? `'${invSheetName}'` : invSheetName;

  const setCell = (r: number, c: number, v: any, bold: boolean = false, align: 'center' | 'left' | 'right' = 'center', f?: string) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell: any = {
      t: typeof v === 'number' ? 'n' : 's',
      v: v ?? '',
      s: {
        font: { name: 'Arial', sz: 9, bold, color: { rgb: '000000' } },
        alignment: { vertical: 'center', horizontal: align, wrapText: true },
        border: BORDER_BILL_CELL
      }
    };
    if (f) cell.f = f;
    ws[addr] = cell;
  };

  // Row 1: Page number indicator '2'
  setCell(0, 1, 2, true, 'center');
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 11 } });

  // Setup grid empty borders for header rows 1 to 7
  for (let r = 1; r <= 7; r++) {
    for (let c = 1; c <= 11; c++) {
      setCell(r, c, '');
    }
  }

  // Header Titles
  setCell(1, 1, 'Sr No.', true, 'center');
  setCell(1, 2, 'Unit', true, 'center');
  setCell(1, 3, 'Quantity executed (or supplied', true, 'center');
  setCell(4, 3, 'Since\nprevious\nbill ARC', true, 'center');
  setCell(4, 4, 'Qty\nexecuted\nin this bill', true, 'center');
  setCell(1, 5, 'Items of work or supplies\n(grouped under Sub-heads of\nSub-works or estimates)', true, 'center');
  setCell(1, 7, 'Rate', true, 'center');
  setCell(1, 8, 'Amount', true, 'center');
  setCell(3, 8, 'Since\nprevious\nbill total\nfor each', true, 'center');
  setCell(3, 9, 'Qty\nexecuted\nin this\nbill total', true, 'center');
  setCell(4, 10, 'Up to\ndate', true, 'center');
  setCell(1, 11, 'Remark', true, 'center');

  // Header Merges
  merges.push(
    { s: { r: 1, c: 1 }, e: { r: 6, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 6, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 3, c: 4 } },
    { s: { r: 4, c: 3 }, e: { r: 6, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 6, c: 4 } },
    { s: { r: 1, c: 5 }, e: { r: 6, c: 6 } },
    { s: { r: 1, c: 7 }, e: { r: 6, c: 7 } },
    { s: { r: 1, c: 8 }, e: { r: 2, c: 10 } },
    { s: { r: 3, c: 8 }, e: { r: 6, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 6, c: 9 } },
    { s: { r: 4, c: 10 }, e: { r: 6, c: 10 } },
    { s: { r: 1, c: 11 }, e: { r: 6, c: 11 } }
  );

  // Row 8 (r: 7): Column numbering
  const colNums = ['', 1, 2, 3, 4, 5, '', 6, 7, 8, 9, 10];
  for (let c = 1; c <= 11; c++) {
    setCell(7, c, colNums[c] ?? '', true, 'center');
  }

  // Row 9 (r: 8): FIRST PAGE TOTAL
  for (let c = 1; c <= 11; c++) setCell(8, c, '');
  setCell(8, 5, 'FIRST PAGE TOTAL', true, 'left');
  merges.push({ s: { r: 8, c: 5 }, e: { r: 8, c: 6 } });
  setCell(8, 9, calc.page1Total, true, 'right', "'GST BILL'!J50");
  setCell(8, 11, 'Full Rate recommended', false, 'center');

  // Page 2 Items (Rows 10 to 24, r: 9 to 23)
  const items = calc.page2Items;
  for (let r = 9; r <= 23; r++) {
    const item = items[r - 9];
    for (let c = 1; c <= 11; c++) setCell(r, c, '');
    merges.push({ s: { r, c: 5 }, e: { r, c: 6 } });

    if (!item) continue;
    const rowNum = r + 1;

    setCell(r, 1, item.remarks === 'Category Header' ? '' : (item.id.replace('dgvcl-item-', '').replace(/_/g, '.').split('-')[0]), false, 'center');
    setCell(r, 2, item.unit || '', false, 'center');
    setCell(r, 3, '', false, 'center');

    let qtyFormula: string | undefined = undefined;
    if (calc.billData.quantityOverrides?.[item.id] === undefined) {
      if (rowNum === 10) qtyFormula = `${safeInv}!$AQ$${invTotalRow}`;
      else if (rowNum === 13) qtyFormula = `${safeInv}!$AI$${invTotalRow}`;
      else if (rowNum === 14) qtyFormula = `${safeInv}!$AJ$${invTotalRow}`;
      else if (rowNum === 15) qtyFormula = `${safeInv}!$AK$${invTotalRow}`;
      else if (rowNum === 16) qtyFormula = 'E15+E14+E13';
      else if (rowNum === 17) qtyFormula = `${safeInv}!$AL$${invTotalRow}`;
      else if (rowNum === 18) qtyFormula = `${safeInv}!$AM$${invTotalRow}`;
      else if (rowNum === 20) qtyFormula = 'E17+E19+E18';
      else if (rowNum === 23) qtyFormula = `${safeInv}!$AO$${invTotalRow}`;
      else if (rowNum === 24) qtyFormula = 'E23';
    }

    setCell(r, 4, item.qty > 0 || qtyFormula ? item.qty : '', false, 'center', qtyFormula);
    setCell(r, 5, item.description, item.remarks === 'Category Header', 'left');
    setCell(r, 7, item.rate > 0 ? item.rate : '', false, 'right');

    const amtFormula = item.rate > 0 ? `H${rowNum}*E${rowNum}` : undefined;
    setCell(r, 9, item.totalAmount > 0 || amtFormula ? item.totalAmount : '', true, 'right', amtFormula);
  }

  // Summary Rows 25 to 30 (r: 24 to 29)
  // Row 25: Total value of work done (A)
  for (let c = 1; c <= 11; c++) setCell(24, c, '');
  setCell(24, 1, 'Total value of work done or supplies made to date (A)….→', true, 'left');
  merges.push({ s: { r: 24, c: 1 }, e: { r: 24, c: 6 } });
  setCell(24, 7, 'Total ', true, 'right');
  merges.push({ s: { r: 24, c: 7 }, e: { r: 24, c: 9 } });
  setCell(24, 10, calc.workDoneTotalA, true, 'right', 'SUM(J9:J24)');
  merges.push({ s: { r: 24, c: 10 }, e: { r: 24, c: 11 } });

  // Row 26: Above 20 %
  for (let c = 1; c <= 11; c++) setCell(25, c, '');
  setCell(25, 1, `Above${calc.tenderPercentage}  %`, true, 'left');
  merges.push({ s: { r: 25, c: 1 }, e: { r: 25, c: 6 } });
  setCell(25, 7, `Above ${calc.tenderPercentage} %`, true, 'right');
  merges.push({ s: { r: 25, c: 7 }, e: { r: 25, c: 9 } });
  setCell(25, 10, calc.aboveTenderAmount, true, 'right', `(K25*${calc.tenderPercentage})/100`);
  merges.push({ s: { r: 25, c: 10 }, e: { r: 25, c: 11 } });

  // Row 27: Net Total
  for (let c = 1; c <= 11; c++) setCell(26, c, '');
  setCell(26, 1, 'TOTAL ', true, 'left');
  merges.push({ s: { r: 26, c: 1 }, e: { r: 26, c: 6 } });
  setCell(26, 7, 'Net Total', true, 'right');
  merges.push({ s: { r: 26, c: 7 }, e: { r: 26, c: 9 } });
  setCell(26, 10, calc.netTotal, true, 'right', 'K25+K26');
  merges.push({ s: { r: 26, c: 10 }, e: { r: 26, c: 11 } });

  // Row 28: GST Extra (18%)
  for (let c = 1; c <= 11; c++) setCell(27, c, '');
  setCell(27, 7, 'GST Extra (18%) (1)', true, 'right');
  merges.push({ s: { r: 27, c: 7 }, e: { r: 27, c: 9 } });
  setCell(27, 10, calc.taxGst, true, 'right', 'K27*0.18');
  merges.push({ s: { r: 27, c: 10 }, e: { r: 27, c: 11 } });

  // Row 29: Round Off
  for (let c = 1; c <= 11; c++) setCell(28, c, '');
  setCell(28, 7, 'Round Off 2', true, 'right');
  merges.push({ s: { r: 28, c: 7 }, e: { r: 28, c: 9 } });
  setCell(28, 10, 0, false, 'right');
  merges.push({ s: { r: 28, c: 10 }, e: { r: 28, c: 11 } });

  // Row 30: Grand Total
  for (let c = 1; c <= 11; c++) setCell(29, c, '');
  setCell(29, 7, 'Grand Total (1+2)', true, 'right');
  merges.push({ s: { r: 29, c: 7 }, e: { r: 29, c: 9 } });
  setCell(29, 10, calc.grandTotal, true, 'right', 'SUM(K27:K29)');
  merges.push({ s: { r: 29, c: 10 }, e: { r: 29, c: 11 } });

  // Row 33: Remarks
  setCell(32, 1, 'REMARKS:-', true, 'left');

  // Certificate and Signatures (matching reference sheet)
  setCell(49, 1, 'II   CERTIFICATES AND SIGNATURES', true, 'left');
  merges.push({ s: { r: 49, c: 1 }, e: { r: 49, c: 10 } });

  setCell(51, 1, ' The measurements were made by __________________________________________on _______________________________________________________and are Recorded at page ', false, 'left');
  merges.push({ s: { r: 51, c: 1 }, e: { r: 51, c: 11 } });

  setCell(52, 1, '________________ of  measurement  Book  No :_________________________No  advance  payment  hes been made previously  without  detailed  measurments.   ', false, 'left');
  merges.push({ s: { r: 52, c: 1 }, e: { r: 52, c: 11 } });

  setCell(53, 1, '____________________%checked  By  me', false, 'left');
  merges.push({ s: { r: 53, c: 1 }, e: { r: 53, c: 11 } });

  setCell(56, 3, 'Dated  signature of ', false, 'center');
  setCell(57, 3, 'Officer preparing the bill"', false, 'center');
  setCell(59, 6, 'Dy.Engr./Jr. Engr.', true, 'center');

  setCell(63, 3, 'Dated  signature of ', false, 'center');
  setCell(64, 3, 'Officer  Authorising the bill"', false, 'center');

  setCell(68, 3, 'Signature of', false, 'center');
  setCell(69, 3, 'the Contractor', true, 'center');

  setCell(71, 1, ' *The second signature is only necessary when the officer who prepared the bill not the officer who makes the payment.', false, 'left');
  merges.push({ s: { r: 71, c: 1 }, e: { r: 71, c: 11 } });

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 3 },   // A
    { wch: 8 },   // B: Sr No
    { wch: 8 },   // C: Unit
    { wch: 10 },  // D: Since prev
    { wch: 12 },  // E: Qty
    { wch: 45 },  // F: Description
    { wch: 10 },  // G
    { wch: 10 },  // H: Rate
    { wch: 12 },  // I: Prev amount
    { wch: 14 },  // J: Amount
    { wch: 14 },  // K: Up to date
    { wch: 22 }   // L: Remark
  ];
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 73, c: 11 } });
  ws['!views'] = [{ showGridLines: true }];

  return ws;
}

/**
 * Backward compatible wrapper for buildBillWorksheet that returns GST BILL
 */
export function buildBillWorksheet(billData?: BillSheetDefinition): XLSX.WorkSheet {
  const calc = calculateDgvclBillFromInventory([], 'DOLVAN', {
    tenderTargetAmount: billData?.tenderTargetAmount ?? 2000000,
    tenderPercentage: billData?.tenderPercentage ?? 20,
    billNumber: billData?.billNumber,
    billDate: billData?.billDate,
    contractorName: billData?.contractorName,
    workOrderRef: billData?.workOrderRef
  });
  return buildGstBillWorksheet(calc);
}

/**
 * Exports the authentic 3-sheet DISCOM workbook:
 * 1. Sheet 1: Canonical 43-column maintenance inventory with wrap headers, bold quantities, and =SUM() total row.
 * 2. Sheet 2: 'GST BILL' (Page 1) with direct formula links to inventory totals and page sum.
 * 3. Sheet 3: 'GST BILL 2' (Page 2) with Page 1 carry forward, Page 2 items, Net Total, GST 18%, Grand Total, and Certificates.
 */
export function exportDualSheetLocationExcel(workbook: LocationWorkbook): string {
  const wb = XLSX.utils.book_new();

  const inventorySheetDef = workbook.sheets['inventory'] || workbook.sheets['Performas'];
  const performas = inventorySheetDef?.performas || [];
  
  // Sheet 1: inventory (name matches locationName e.g. 'GIDC' or 'inventory')
  const wsInventory = buildDolvanSheet1Worksheet(performas, workbook.locationId);
  const invSheetName = (workbook.locationName || 'inventory').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, wsInventory, invSheetName);

  // Compute authentic DGVCL billing model
  const tenderTarget = workbook.tenderTargetAmount || getTenderTargetForLocation(workbook.locationId);
  const tenderPercent = workbook.tenderPercentage || getTenderPercentForLocation(workbook.locationId);
  const calcResult = calculateDgvclBillFromInventory(performas, workbook.locationName, {
    tenderTargetAmount: tenderTarget,
    tenderPercentage: tenderPercent,
    billNumber: workbook.sheets['bill']?.billData?.billNumber,
    billDate: workbook.sheets['bill']?.billData?.billDate,
    contractorName: workbook.sheets['bill']?.billData?.contractorName,
    workOrderRef: workbook.sheets['bill']?.billData?.workOrderRef,
    customRates: workbook.sheets['bill']?.billData?.customRates,
    quantityOverrides: workbook.sheets['bill']?.billData?.quantityOverrides
  });

  const lastInventoryRow = 4 + performas.length; // Row index of TOTAL row in Sheet 1

  // Sheet 2: GST BILL (Page 1)
  const wsGstBill = buildGstBillWorksheet(calcResult, invSheetName, lastInventoryRow);
  XLSX.utils.book_append_sheet(wb, wsGstBill, 'GST BILL');

  // Sheet 3: GST BILL 2 (Page 2)
  const wsGstBill2 = buildGstBill2Worksheet(calcResult, invSheetName, lastInventoryRow);
  XLSX.utils.book_append_sheet(wb, wsGstBill2, 'GST BILL 2');

  const cleanLoc = (workbook.locationName || 'LOCATION').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `${cleanLoc}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Compatible export for ExportReferenceModal
 */
export function exportDolvanReferenceExcel(
  performas: PerformaRecord[],
  locationName: string = 'DOLVAN',
  mode: 'sheet1_only' | 'full_workbook' = 'sheet1_only',
  locationId?: string
): string {
  const wb = XLSX.utils.book_new();
  const wsSheet1 = buildDolvanSheet1Worksheet(performas, locationId);
  const cleanLoc = (locationName || 'DOLVAN').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  XLSX.utils.book_append_sheet(wb, wsSheet1, cleanLoc.slice(0, 31));

  if (mode === 'full_workbook') {
    const tenderTarget = locationId ? getTenderTargetForLocation(locationId) : 2000000;
    const tenderPercent = locationId ? getTenderPercentForLocation(locationId) : 20;
    const calcResult = calculateDgvclBillFromInventory(performas, locationName, {
      tenderTargetAmount: tenderTarget,
      tenderPercentage: tenderPercent
    });
    const lastInventoryRow = 4 + performas.length;

    const wsGstBill = buildGstBillWorksheet(calcResult, cleanLoc.slice(0, 31), lastInventoryRow);
    XLSX.utils.book_append_sheet(wb, wsGstBill, 'GST BILL');

    const wsGstBill2 = buildGstBill2Worksheet(calcResult, cleanLoc.slice(0, 31), lastInventoryRow);
    XLSX.utils.book_append_sheet(wb, wsGstBill2, 'GST BILL 2');
  }

  const fileName = `${cleanLoc}_INVENTERY_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
