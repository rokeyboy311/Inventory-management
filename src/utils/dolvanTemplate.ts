import * as XLSX from 'xlsx';
import { PerformaRecord, MaintenanceItemRow } from '../types/performa';

/**
 * Canonical Column Specification for DOLVAN INVENTERY.xlsx -> Sheet1
 * 29 columns matching the exact reference structure, spelling, capitalization, and subcategories.
 */
export interface DolvanColumnDef {
  key: string;
  header1: string;
  header2: string;
  header3: string;
  width: number;
}

export const DOLVAN_SHEET1_COLUMNS: DolvanColumnDef[] = [
  // 1 to 5: Main TC Identifiers
  { key: 'srNo', header1: 'SR NO', header2: 'SR NO', header3: '1', width: 8 },
  { key: 'location', header1: 'Location of TC', header2: 'Site Location', header3: '2', width: 28 },
  { key: 'serialNo', header1: 'TC Serial Number.', header2: 'TC Serial', header3: '3', width: 18 },
  { key: 'make', header1: 'TC Make', header2: 'Make', header3: '4', width: 16 },
  { key: 'capacity', header1: 'TC Capacity', header2: 'Capacity', header3: '5', width: 14 },

  // 6 & 7: Bushing Goti (HT & LT)
  { key: 'bushingHT', header1: 'Replacement of  bushing goti', header2: 'HT', header3: '6', width: 10 },
  { key: 'bushingLT', header1: 'Replacement of  bushing goti', header2: 'LT', header3: '7', width: 10 },

  // 8: AL Patta
  { key: 'alPatta100', header1: 'Providing LT side AL. Patta KVA', header2: '100', header3: '8', width: 14 },

  // 9: Earth Connection
  { key: 'earthConnection', header1: 'Check and Tight Earth Connection', header2: 'Nos.', header3: '9', width: 14 },

  // 10 to 12: LT Damaged Cable
  { key: 'ltCableNos', header1: 'Replacement of LT damaged cable', header2: 'Nos.', header3: '10', width: 10 },
  { key: 'ltCableC1', header1: 'Replacement of LT damaged cable', header2: 'C- 1(70)', header3: '11', width: 12 },
  { key: 'ltCableC2', header1: 'Replacement of LT damaged cable', header2: 'C- 2(150)', header3: '12', width: 12 },

  // 13 & 14: Termination RYBN
  { key: 'termination70', header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '70', header3: '13', width: 12 },
  { key: 'termination150', header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '150', header3: '14', width: 12 },

  // 15: Termination up to sq mm
  { key: 'terminationUpto', header1: 'Providing of termination up to sq mm cable', header2: 'Sets', header3: '15', width: 14 },

  // 16: Measurement of Voltage & Ampere
  { key: 'measurementVA', header1: 'Measurement and voltage ampeare', header2: 'Reading', header3: '16', width: 18 },

  // 17: Oil Leakage
  { key: 'oilLeakage', header1: 'Check oil leakage and fill up', header2: 'Ltr', header3: '17', width: 12 },

  // 18: Distribution Box
  { key: 'distBox', header1: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity', header2: 'Nos.', header3: '18', width: 16 },

  // 19 & 20: Kit-Ket Fuse
  { key: 'kitKet100', header1: 'Checking and replacement of Kit-Ket fuse if required', header2: '100Amp', header3: '19', width: 12 },
  { key: 'kitKet200', header1: 'Checking and replacement of Kit-Ket fuse if required', header2: '200Amp', header3: '20', width: 12 },

  // 21: HRC Fuse Base
  { key: 'hrcFuseBase', header1: 'Replacement of HRC Fuse Base', header2: '400', header3: '21', width: 12 },

  // 22: HRC Fuse Link
  { key: 'hrcFuseLink', header1: 'Replacement of HRC Fuse Link', header2: '400', header3: '22', width: 12 },

  // 23: Fuse Element D.O.
  { key: 'fuseElementDO', header1: 'Providing of Fuse elemant (D.O.)', header2: 'Nos.', header3: '23', width: 12 },

  // 24: Sundry items
  { key: 'sundryItems', header1: 'Providing of Sundry items (Nut,Bolt,Washer)', header2: 'Sets', header3: '24', width: 14 },

  // 25: General Condition
  { key: 'generalCondition', header1: 'General Condition', header2: 'Status', header3: '25', width: 12 },

  // 26: Brass Nuts
  { key: 'brassNuts', header1: 'LT Side Brass Nuts', header2: '12 mm', header3: '26', width: 12 },

  // 27: Brass Washer
  { key: 'brassWasher', header1: 'LT Side Brass Washer', header2: '12 mm', header3: '27', width: 12 },

  // 28: Breather
  { key: 'breather', header1: 'Breather', header2: '500 gm', header3: '28', width: 12 },

  // 29: Half Stud
  { key: 'halfStud', header1: 'HALF STUD', header2: '12 MM', header3: '29', width: 12 }
];

/**
 * Builds the exact merged cell ranges for DOLVAN INVENTERY.xlsx -> Sheet1
 * Multi-row header:
 * Row 0: Category group
 * Row 1: Subcategory / unit
 * Row 2: Index number (1 to 29)
 */
export function buildDolvanSheet1Merges(): XLSX.Range[] {
  const merges: XLSX.Range[] = [];

  let c = 0;
  while (c < DOLVAN_SHEET1_COLUMNS.length) {
    const currentH1 = DOLVAN_SHEET1_COLUMNS[c].header1;
    let endC = c;
    while (endC + 1 < DOLVAN_SHEET1_COLUMNS.length && DOLVAN_SHEET1_COLUMNS[endC + 1].header1 === currentH1) {
      endC++;
    }

    if (endC > c) {
      // Horizontal merge across Row 0 (e.g. Bushing goti across Col F and G)
      merges.push({ s: { r: 0, c }, e: { r: 0, c: endC } });
    } else {
      // Single category: merge vertically between Row 0 and Row 1
      merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    }

    c = endC + 1;
  }

  return merges;
}

/**
 * Helper to match an item description in performa
 */
function findItem(items: MaintenanceItemRow[], searchTerms: string[]): MaintenanceItemRow | undefined {
  return items.find(it => {
    const desc = it.description.toLowerCase();
    return searchTerms.some(term => desc.includes(term.toLowerCase()));
  });
}

/**
 * Formats maintenance item quantity or status for DOLVAN Sheet1 cell.
 * Preserves reference Sheet1 style:
 * If qty > 0 -> output number
 * If material/labour Yes but qty=0 -> output 1 (or corresponding value)
 * If unserviced / 0 / No -> blank '' (no fabrication of missing data)
 */
function getCellItemValue(item?: MaintenanceItemRow, defaultValueIfYes: number | string = 1): string | number {
  if (!item) return '';
  const numQty = Number(item.qty);
  if (!isNaN(numQty) && numQty > 0) {
    return numQty;
  }
  if (item.materialYes || item.labourYes) {
    return defaultValueIfYes;
  }
  return '';
}

/**
 * Converts an internal application PerformaRecord into an exact 29-element row for DOLVAN Sheet1
 */
export function mapPerformaToDolvanRow(performa: PerformaRecord, index: number): (string | number)[] {
  const items = performa.items || [];

  // Item lookups
  const itemBushingHT = findItem(items, ['ht bushing', 'replacement of ht']);
  const itemBushingLT = findItem(items, ['lt bushing', 'replacement of lt bushing']);
  const itemAlPatta = findItem(items, ['al patta', 'al. patta']);
  const itemEarth = findItem(items, ['earth connection', 'tight earth']);
  const itemLtCable = findItem(items, ['damage lt cable', 'damaged cable']);
  const itemTermination70 = findItem(items, ['termination of 25/50/70', '70 sq mm cable']);
  const itemTermination150 = findItem(items, ['termination of 95/120/150', '150 sq mm cable']);
  const itemTerminationRYBN = findItem(items, ['termination in form of ryb', 'r,y,b and n core']);
  const itemTerminationUpto = findItem(items, ['termination up to', '185 sq mm']);
  const itemOil = findItem(items, ['oil leakage', 'top up of oil']);
  const itemDistBox = findItem(items, ['replacement of new box above 100', 'dist. box', 'fixing new box']);
  const itemKitKet100 = findItem(items, ['kit-ket fuse (100amp)', 'kit-ket fuse 100']);
  const itemKitKet200 = findItem(items, ['kit-ket fuse (200amp)', 'kit-ket fuse 200']);
  const itemHrcBase = findItem(items, ['400 amp hrc fuse base', 'hrc fuse base']);
  const itemHrcLink = findItem(items, ['400 amp hrc fuse link', 'hrc fuse link']);
  const itemFuseDO = findItem(items, ['fuse element on ht', 'd.o fuse', 'd.o.']);
  const itemSundry = findItem(items, ['sundry items', 'nut, bolt, washer']);
  const itemGeneral = findItem(items, ['general condition', 'cleaning, clamping']);
  const itemBrassNut = findItem(items, ['brass nut 12mm', 'brass nut']);
  const itemBrassWasher = findItem(items, ['brass washer 12mm', 'brass washer']);
  const itemBreather = findItem(items, ['breather']);
  const itemHalfStud = findItem(items, ['half stud', 'stud on lt side']);

  // Format Voltage & Ampere reading
  let vaReading: string | number = '';
  const m = performa.measurements;
  if (m) {
    const hasVoltage = (m.voltageRN && m.voltageRN !== '0') || (m.voltageYN && m.voltageYN !== '0') || (m.voltageBN && m.voltageBN !== '0');
    const hasAmpere = (m.ampereR && m.ampereR !== '0') || (m.ampereY && m.ampereY !== '0') || (m.ampereB && m.ampereB !== '0') || (m.ampereN && m.ampereN !== '0');
    if (hasVoltage || hasAmpere) {
      vaReading = `${m.voltageRN || '0'}/${m.voltageYN || '0'}/${m.voltageBN || '0'}V ${m.ampereR || '0'}/${m.ampereY || '0'}/${m.ampereB || '0'}A`;
    } else {
      const itemVA = findItem(items, ['measurement of voltage', 'measurement and voltage']);
      if (itemVA && (itemVA.materialYes || itemVA.labourYes || Number(itemVA.qty) > 0)) {
        vaReading = '1';
      }
    }
  }

  // Row matching exact 29 columns
  return [
    index + 1,                                            // Col 1: SR NO
    performa.location || '',                              // Col 2: Location of TC
    performa.transformerSerialNo || '',                   // Col 3: TC Serial Number.
    performa.transformerMake || '',                       // Col 4: TC Make
    performa.capacity || '',                              // Col 5: TC Capacity
    getCellItemValue(itemBushingHT),                      // Col 6: Bushing goti HT
    getCellItemValue(itemBushingLT),                      // Col 7: Bushing goti LT
    getCellItemValue(itemAlPatta),                        // Col 8: AL. Patta 100 KVA
    getCellItemValue(itemEarth, 1),                       // Col 9: Check Earth Connection
    getCellItemValue(itemLtCable),                        // Col 10: LT damaged cable Nos.
    getCellItemValue(itemTermination70),                  // Col 11: C- 1(70)
    getCellItemValue(itemTermination150),                 // Col 12: C- 2(150)
    getCellItemValue(itemTerminationRYBN, 1),             // Col 13: Termination RYBN 70
    getCellItemValue(itemTerminationRYBN, 1),             // Col 14: Termination RYBN 150
    getCellItemValue(itemTerminationUpto, 1),             // Col 15: Termination up to sq mm
    vaReading,                                            // Col 16: Measurement and voltage ampeare
    getCellItemValue(itemOil),                            // Col 17: Check oil leakage (Ltr)
    getCellItemValue(itemDistBox),                        // Col 18: LT dist. Box above 100 KVA
    getCellItemValue(itemKitKet100),                      // Col 19: Kit-Ket fuse 100Amp
    getCellItemValue(itemKitKet200),                      // Col 20: Kit-Ket fuse 200Amp
    getCellItemValue(itemHrcBase),                        // Col 21: HRC Fuse Base 400
    getCellItemValue(itemHrcLink),                        // Col 22: HRC Fuse Link 400
    getCellItemValue(itemFuseDO),                         // Col 23: Fuse element (D.O.)
    getCellItemValue(itemSundry, 1),                      // Col 24: Sundry items
    itemGeneral && (itemGeneral.materialYes || itemGeneral.labourYes || Number(itemGeneral.qty) > 0) ? (itemGeneral.remarks || '3') : '', // Col 25: General Condition
    getCellItemValue(itemBrassNut),                       // Col 26: LT Side Brass Nuts
    getCellItemValue(itemBrassWasher),                    // Col 27: LT Side Brass Washer
    getCellItemValue(itemBreather),                       // Col 28: Breather
    getCellItemValue(itemHalfStud)                        // Col 29: HALF STUD
  ];
}

/**
 * Builds the canonical Sheet1 worksheet matching DOLVAN INVENTERY.xlsx
 */
export function buildDolvanSheet1Worksheet(performas: PerformaRecord[]): XLSX.WorkSheet {
  const headerRow1 = DOLVAN_SHEET1_COLUMNS.map(c => c.header1);
  const headerRow2 = DOLVAN_SHEET1_COLUMNS.map(c => c.header2);
  const headerRow3 = DOLVAN_SHEET1_COLUMNS.map(c => c.header3);

  const dataRows = performas.map((p, idx) => mapPerformaToDolvanRow(p, idx));

  // Assemble full table: 3 header rows + all data rows
  const aoa = [headerRow1, headerRow2, headerRow3, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Apply Merges
  ws['!merges'] = buildDolvanSheet1Merges();

  // Apply exact Column Widths
  ws['!cols'] = DOLVAN_SHEET1_COLUMNS.map(c => ({ wch: c.width }));

  // Apply Row Heights (Headers: 28pt, 22pt, 18pt; Data rows: 20pt)
  ws['!rows'] = [
    { hpt: 30, hpx: 40 },
    { hpt: 24, hpx: 32 },
    { hpt: 18, hpx: 24 },
    ...performas.map(() => ({ hpt: 21, hpx: 28 }))
  ];

  return ws;
}

/**
 * Primary Export Function: Generates and triggers download of the DOLVAN INVENTERY reference Excel file
 * @param performas List of performa records to export
 * @param locationName Location or workbook title
 * @param mode 'sheet1_only' (Default) | 'full_workbook'
 */
export function exportDolvanReferenceExcel(
  performas: PerformaRecord[],
  locationName: string = 'DOLVAN',
  mode: 'sheet1_only' | 'full_workbook' = 'sheet1_only'
): string {
  const wb = XLSX.utils.book_new();

  // 1. Primary Sheet: Sheet1 (The Master Reference)
  const wsSheet1 = buildDolvanSheet1Worksheet(performas);
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Sheet1');

  // 2. Supporting Sheets (Only if 'full_workbook' mode is chosen)
  if (mode === 'full_workbook') {
    // Performas summary sheet
    const performaRows = performas.map((p, idx) => ({
      'Sr No': idx + 1,
      'Performa ID': p.id,
      'Date': p.date,
      'Location of TC': p.location,
      'TC Make': p.transformerMake,
      'TC Serial': p.transformerSerialNo,
      'Capacity': p.capacity,
      'Voltage (R-Y-B)': `${p.measurements?.voltageRN || '0'}/${p.measurements?.voltageYN || '0'}/${p.measurements?.voltageBN || '0'} V`,
      'Ampere (R-Y-B-N)': `${p.measurements?.ampereR || '0'}/${p.measurements?.ampereY || '0'}/${p.measurements?.ampereB || '0'}/${p.measurements?.ampereN || '0'} A`,
      'Status': 'Completed'
    }));
    const wsPerformas = XLSX.utils.json_to_sheet(performaRows);
    XLSX.utils.book_append_sheet(wb, wsPerformas, 'Performas');

    // Maintenance item breakdown sheet
    const maintenanceRows: Record<string, any>[] = [];
    performas.forEach((p, pIdx) => {
      p.items.forEach(it => {
        if (it.materialYes || it.labourYes || Number(it.qty) > 0) {
          maintenanceRows.push({
            'Performa Index': pIdx + 1,
            'Performa ID': p.id,
            'Location': p.location,
            'Item Description': it.description,
            'Unit': it.unit,
            'Material': it.materialYes ? 'Yes' : 'No',
            'Labour': it.labourYes ? 'Yes' : 'No',
            'Quantity': it.qty,
            'Remarks': it.remarks || ''
          });
        }
      });
    });
    const wsMaint = XLSX.utils.json_to_sheet(maintenanceRows.length > 0 ? maintenanceRows : [{ 'Notice': 'No serviced items' }]);
    XLSX.utils.book_append_sheet(wb, wsMaint, 'Maintenance');

    // Measurements sheet
    const measurementRows = performas.map((p, idx) => ({
      'Sr No': idx + 1,
      'Performa ID': p.id,
      'Location': p.location,
      'Voltage R-N': p.measurements?.voltageRN || '0',
      'Voltage Y-N': p.measurements?.voltageYN || '0',
      'Voltage B-N': p.measurements?.voltageBN || '0',
      'Ampere R': p.measurements?.ampereR || '0',
      'Ampere Y': p.measurements?.ampereY || '0',
      'Ampere B': p.measurements?.ampereB || '0',
      'Ampere N': p.measurements?.ampereN || '0'
    }));
    const wsMeas = XLSX.utils.json_to_sheet(measurementRows);
    XLSX.utils.book_append_sheet(wb, wsMeas, 'Measurements');
  }

  // Generate File Name
  const cleanLoc = (locationName || 'DOLVAN').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `${cleanLoc}_INVENTERY_${today}.xlsx`;

  // Download
  XLSX.writeFile(wb, fileName);
  return fileName;
}
