export interface MaintenanceItemRow {
  id: string;
  srNo: number;
  subIndex?: number;
  srLabel?: string; // e.g. "1", "1.1", "2", "2.1", "6", "6.1", "6.2", etc.
  description: string;
  unit: string;
  materialYes: boolean;
  labourYes: boolean;
  qty: number | string;
  sizeFields?: string[]; // e.g. ['Nos.', 'C-1(70)', 'C-2(150)'] or ['25', '50', '70'] or ['12MM', '20MM', '30MM']
  sizeQtys?: Record<string, number | string>;
  remarks?: string;
}

export interface VoltageAmpereReading {
  voltageRN: string;
  voltageYN: string;
  voltageBN: string;
  voltageRY?: string;
  voltageYB?: string;
  voltageBR?: string;
  ampereR: string;
  ampereY: string;
  ampereB: string;
  ampereN: string;
}

export interface PerformaRecord {
  id: string; // e.g. AHM-001 or DOL-001 (auto-managed in background or header)
  date: string; // YYYY-MM-DD or DD-MM-YYYY
  location: string; // Location of Transformer entered separately per performa by user
  transformerRefNo: string; // e.g. TR-2026-09
  transformerMake: string; // e.g. Aman, Voltamp, ABB, Crompton, Bharat Bijlee, Kotsons
  transformerSerialNo: string; // e.g. 743, TR-99201
  capacity: string; // e.g. 10, 16, 25, 63, 63/22, 100, 200, 315, 500
  // Background optional fields preserved for 100% DB & Excel Exporter compatibility (hidden from entry UI)
  division?: string; // Defaults to "ANKLESHWAR IND DIVISION"
  subDivision?: string; // Defaults to "ANKLESHWAR GIDC SDN"
  performaNo?: string;
  workOrderNo?: string;
  serviceOrderNo?: string;
  items: MaintenanceItemRow[];
  measurements: VoltageAmpereReading;
  createdAt: string;
  updatedAt: string;
  status?: 'saved' | 'draft';
}

export interface BillItem {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  labourRate: number;
  materialAmount: number;
  labourAmount: number;
  totalAmount: number;
  remarks: string;
}

export interface BillSheetDefinition {
  name: string;
  billNumber: string;
  billDate: string;
  contractorName: string;
  workOrderRef: string;
  items: BillItem[];
  subTotal: number;
  taxGst: number;
  grandTotal: number;
}

export interface SheetDefinition {
  name: string;
  type: 'performas' | 'maintenance' | 'measurements' | 'master_data' | 'inventory' | 'bill' | 'other';
  performas: PerformaRecord[];
  isCompatible: boolean;
  rawRowsCount?: number;
  billData?: BillSheetDefinition;
}

export interface LocationWorkbook {
  locationId: string;
  teamId?: string;
  locationName: string;
  workbookName: string;
  activeSheetName: string;
  sheets: Record<string, SheetDefinition>;
  lastModified: string;
}

export interface ColumnMappingConfig {
  location: string;
  performaId: string;
  date: string;
  transformerRefNo: string;
  transformerMake: string;
  transformerSerialNo: string;
  capacity: string;
  material: string;
  labour: string;
  qty: string;
}

export interface ImportSummary {
  existingCount: number;
  newCount: number;
  duplicatesCount: number;
  warningsCount: number;
  existingIds: string[];
  newIds: string[];
  duplicateIds: string[];
  warnings: string[];
  parsedPerformas: PerformaRecord[];
  sheetName: string;
  workbookName: string;
}

export interface CustomMacroPreset {
  id: string;
  name: string;
  description?: string;
  itemsMap: Record<
    number,
    {
      materialYes: boolean;
      labourYes: boolean;
      qty: number | string;
      sizeQtys?: Record<string, number | string>;
    }
  >;
}

/**
 * CONSOLIDATED 23-ITEM MASTER LIST WITH SIZE-BASED QUANTITY SUB-FIELDS (SR 1 to 18)
 */
export const DEFAULT_PERFORMA_ITEMS_TEMPLATE: Omit<MaintenanceItemRow, 'id'>[] = [
  // 1 & 2: SR 1 & SR 1.1
  {
    srNo: 1,
    subIndex: 1,
    srLabel: '1',
    description: 'Replacement of LT bushing Goti/Rubber Washer',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  {
    srNo: 1,
    subIndex: 2,
    srLabel: '1.1',
    description: 'Replacement of HT bushing Goti/Rubber Washer',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 3 & 4: SR 2 & SR 2.1
  {
    srNo: 2,
    subIndex: 1,
    srLabel: '2',
    description: 'Providing of half stud on LT side',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  {
    srNo: 2,
    subIndex: 2,
    srLabel: '2.1',
    description: 'Providing of AL. Patta on LT side',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 5: SR 3
  {
    srNo: 3,
    subIndex: 1,
    srLabel: '3',
    description: 'Check and Tight earth Connection',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 6: SR 4 — 3 Quantity Sub-Fields: Nos., C-1(70), C-2(150)
  {
    srNo: 4,
    subIndex: 1,
    srLabel: '4',
    description: 'Replacement of damage LT cable with new one of right capacity',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['Nos.', 'C-1(70)', 'C-2(150)'],
    sizeQtys: { 'Nos.': '', 'C-1(70)': '', 'C-2(150)': '' }
  },
  // 7: SR 5
  {
    srNo: 5,
    subIndex: 1,
    srLabel: '5',
    description: 'Providing of termination in form of RYB And N core including PVC tape',
    unit: 'LS',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 8: SR 6 — 3 Quantity Sub-Fields: 25, 50, 70
  {
    srNo: 6,
    subIndex: 1,
    srLabel: '6',
    description: 'Termination of 25/50/70 Sq mm cable',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['25', '50', '70'],
    sizeQtys: { '25': '', '50': '', '70': '' }
  },
  // 9: SR 6.1 — 3 Quantity Sub-Fields: 95, 120, 150
  {
    srNo: 6,
    subIndex: 2,
    srLabel: '6.1',
    description: 'Termination of 95/120/150 Sq mm cable',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['95', '120', '150'],
    sizeQtys: { '95': '', '120': '', '150': '' }
  },
  // 10: SR 6.2 — 1 Quantity Sub-Field: 185
  {
    srNo: 6,
    subIndex: 3,
    srLabel: '6.2',
    description: 'Termination of 185 Sq mm cable',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['185'],
    sizeQtys: { '185': '' }
  },
  // 11: SR 7
  {
    srNo: 7,
    subIndex: 1,
    srLabel: '7',
    description: 'Check Oil leakage and Top up of Oil (oil provide by DGVCL)',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 12: SR 8
  {
    srNo: 8,
    subIndex: 1,
    srLabel: '8',
    description: 'Measurement of Voltage and Ampere',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 13: SR 9
  {
    srNo: 9,
    subIndex: 1,
    srLabel: '9',
    description: 'Fixing new box with complete wiring',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 14: SR 9.1 (Consolidated from 9.1 & 9.2) — 2 Quantity Sub-Fields: Up to 100 Amp, Above 100 Amp
  {
    srNo: 9,
    subIndex: 2,
    srLabel: '9.1',
    description: 'Replacement of new box up to / above 100 Amp',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['Up to 100 Amp', 'Above 100 Amp'],
    sizeQtys: { 'Up to 100 Amp': '', 'Above 100 Amp': '' }
  },
  // 15: SR 10 (Consolidated from 10 & 10.1) — 2 Quantity Sub-Fields: 100Amp, 200Amp
  {
    srNo: 10,
    subIndex: 1,
    srLabel: '10',
    description: 'Checking and Replacement of Kit-Kat fuse (100Amp / 200Amp)',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['100Amp', '200Amp'],
    sizeQtys: { '100Amp': '', '200Amp': '' }
  },
  // 16: SR 11 (Consolidated from 11, 11.1, 11.2) — 3 Quantity Sub-Fields: 630 amp, 400 amp, 250 amp
  {
    srNo: 11,
    subIndex: 1,
    srLabel: '11',
    description: '630 / 400 / 250 amp HRC fuse base',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['630 amp', '400 amp', '250 amp'],
    sizeQtys: { '630 amp': '', '400 amp': '', '250 amp': '' }
  },
  // 17: SR 12 (Consolidated from 12, 12.1, 12.2) — 3 Quantity Sub-Fields: 630 amp, 400 amp, 250 amp
  {
    srNo: 12,
    subIndex: 1,
    srLabel: '12',
    description: '630 / 400 / 250 amp HRC fuse Link',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['630 amp', '400 amp', '250 amp'],
    sizeQtys: { '630 amp': '', '400 amp': '', '250 amp': '' }
  },
  // 18: SR 13
  {
    srNo: 13,
    subIndex: 1,
    srLabel: '13',
    description: 'Providing of Fuse element on HT side (on D.O fuse)',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 19: SR 14
  {
    srNo: 14,
    subIndex: 1,
    srLabel: '14',
    description: 'Providing and replacement of sundry items like nut, bolt, washer etc.',
    unit: 'LS',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 20: SR 15
  {
    srNo: 15,
    subIndex: 1,
    srLabel: '15',
    description: 'General Condition Cleaning, Clamping and Proforma Forment',
    unit: 'JOB',
    materialYes: false,
    labourYes: false,
    qty: ''
  },
  // 21: SR 16 (Consolidated from 16, 16.1, 16.2) — 3 Quantity Sub-Fields: 12MM, 20MM, 30MM
  {
    srNo: 16,
    subIndex: 1,
    srLabel: '16',
    description: 'LT side Brass Nut 12MM / 20MM / 30MM',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['12MM', '20MM', '30MM'],
    sizeQtys: { '12MM': '', '20MM': '', '30MM': '' }
  },
  // 22: SR 17 (Consolidated from 17, 17.1, 17.2) — 3 Quantity Sub-Fields: 12MM, 20MM, 30MM
  {
    srNo: 17,
    subIndex: 1,
    srLabel: '17',
    description: 'LT side Brass washer 12MM / 20MM / 30MM',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: ['12MM', '20MM', '30MM'],
    sizeQtys: { '12MM': '', '20MM': '', '30MM': '' }
  },
  // 23: SR 18
  {
    srNo: 18,
    subIndex: 1,
    srLabel: '18',
    description: 'Breather',
    unit: 'Nos.',
    materialYes: false,
    labourYes: false,
    qty: ''
  }
];

export function isNonZeroQtyValue(val: number | string | undefined | null): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s || s === '0') return false;
  return true;
}

export function computeSummaryQtyFromSizes(
  sizeFields?: string[],
  sizeQtys?: Record<string, number | string>,
  fallbackQty?: number | string
): number | string {
  if (!sizeFields || sizeFields.length === 0 || !sizeQtys) {
    return fallbackQty ?? '';
  }
  const activeVals: (number | string)[] = [];
  let numericSum = 0;
  let allNumeric = true;

  for (const key of sizeFields) {
    const raw = sizeQtys[key];
    if (isNonZeroQtyValue(raw)) {
      const s = String(raw).trim();
      activeVals.push(s);
      const n = Number(s);
      if (!isNaN(n)) {
        numericSum += n;
      } else {
        allNumeric = false;
      }
    }
  }

  if (activeVals.length === 0) return '';
  if (allNumeric) return numericSum;
  return activeVals.join(', ');
}

/**
 * Ensures any Performa's items array (whether newly created or loaded from an older 33-row database record)
 * is normalized to the 23-item master structure with all `sizeFields` and `sizeQtys` intact.
 */
export function ensureCompleteMasterItems(existingItems: MaintenanceItemRow[] = []): MaintenanceItemRow[] {
  let masterTemplates: Omit<MaintenanceItemRow, 'id'>[] = DEFAULT_PERFORMA_ITEMS_TEMPLATE;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dgvcl_custom_master_items_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          masterTemplates = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  const result: MaintenanceItemRow[] = masterTemplates.map((tpl, idx) => ({
    ...tpl,
    id: `item-${tpl.srNo || idx + 1}-${tpl.subIndex || 1}-${idx}`,
    materialYes: false,
    labourYes: false,
    qty: '',
    ...(tpl.sizeFields
      ? {
          sizeFields: [...tpl.sizeFields],
          sizeQtys: Object.fromEntries(tpl.sizeFields.map(f => [f, '']))
        }
      : {})
  }));

  if (!Array.isArray(existingItems) || existingItems.length === 0) {
    return result;
  }

  // Helper to merge an incoming row into target index & optional target sizeField
  const applyToTarget = (
    targetIdx: number,
    src: MaintenanceItemRow,
    specificSizeKey?: string
  ) => {
    const target = result[targetIdx];
    if (!target) return;

    if (src.materialYes) target.materialYes = true;
    if (src.labourYes) target.labourYes = true;

    if (target.sizeFields && target.sizeQtys) {
      if (src.sizeQtys && typeof src.sizeQtys === 'object') {
        for (const sf of target.sizeFields) {
          if (isNonZeroQtyValue(src.sizeQtys[sf])) {
            target.sizeQtys[sf] = src.sizeQtys[sf];
          }
        }
      } else if (specificSizeKey && target.sizeFields.includes(specificSizeKey)) {
        if (isNonZeroQtyValue(src.qty)) {
          target.sizeQtys[specificSizeKey] = src.qty;
        }
      } else if (isNonZeroQtyValue(src.qty)) {
        const firstKey = target.sizeFields[0];
        if (firstKey && !isNonZeroQtyValue(target.sizeQtys[firstKey])) {
          target.sizeQtys[firstKey] = src.qty;
        }
      }
      target.qty = computeSummaryQtyFromSizes(target.sizeFields, target.sizeQtys, target.qty);
      if (isNonZeroQtyValue(target.qty)) {
        target.materialYes = true;
        target.labourYes = true;
      }
    } else {
      if (isNonZeroQtyValue(src.qty)) {
        target.qty = src.qty;
        target.materialYes = true;
        target.labourYes = true;
      }
    }
  };

  // Direct label/description matching for user-customized items
  for (const src of existingItems) {
    if (!src) continue;
    const sLabel = (src.srLabel || '').trim();
    const sDesc = (src.description || '').trim().toLowerCase();

    const directIdx = result.findIndex(r => 
      (sLabel && r.srLabel && r.srLabel.trim() === sLabel) ||
      (sDesc && r.description && r.description.trim().toLowerCase() === sDesc)
    );
    if (directIdx >= 0) {
      applyToTarget(directIdx, src);
    }
  }

  for (const src of existingItems) {
    if (!src) continue;
    const sr = (src.srLabel || '').trim();
    const desc = (src.description || '').toLowerCase();

    if (sr === '1' || desc.includes('lt bushing')) {
      applyToTarget(0, src);
    } else if (sr === '1.1' || desc.includes('ht bushing')) {
      applyToTarget(1, src);
    } else if (sr === '2' || desc.includes('half stud')) {
      applyToTarget(2, src);
    } else if (sr === '2.1' || desc.includes('al. patta') || desc.includes('al patta')) {
      applyToTarget(3, src);
    } else if (sr === '3' || desc.includes('earth connection')) {
      applyToTarget(4, src);
    } else if (sr === '4' || desc.includes('damage lt cable')) {
      applyToTarget(5, src, 'Nos.');
    } else if (sr === '5' || desc.includes('ryb and n core')) {
      applyToTarget(6, src);
    } else if (sr === '6' || desc.includes('25/50/70')) {
      applyToTarget(7, src, '70');
    } else if (sr === '6.1' || desc.includes('95/120/150')) {
      applyToTarget(8, src, '150');
    } else if (sr === '6.2' || desc.includes('185 sq mm')) {
      applyToTarget(9, src, '185');
    } else if (sr === '7' || desc.includes('oil leakage')) {
      applyToTarget(10, src);
    } else if (sr === '8' || desc.includes('measurement of voltage')) {
      applyToTarget(11, src);
    } else if (sr === '9' || desc.includes('fixing new box')) {
      applyToTarget(12, src);
    } else if (sr === '9.1' || desc.includes('new box')) {
      if (desc.includes('above 100') || sr === '9.2') {
        applyToTarget(13, src, 'Above 100 Amp');
      } else {
        applyToTarget(13, src, 'Up to 100 Amp');
      }
    } else if (sr === '9.2') {
      applyToTarget(13, src, 'Above 100 Amp');
    } else if (sr === '10' || sr === '10.1' || desc.includes('kit-kat') || desc.includes('kit-ket')) {
      if (sr === '10.1' || (desc.includes('200amp') && !desc.includes('100amp'))) {
        applyToTarget(14, src, '200Amp');
      } else {
        applyToTarget(14, src, '100Amp');
      }
    } else if (sr === '11' || sr === '11.1' || sr === '11.2' || desc.includes('hrc fuse base')) {
      if (sr === '11.1' || (desc.includes('400') && !desc.includes('630'))) {
        applyToTarget(15, src, '400 amp');
      } else if (sr === '11.2' || (desc.includes('250') && !desc.includes('630'))) {
        applyToTarget(15, src, '250 amp');
      } else {
        applyToTarget(15, src, '630 amp');
      }
    } else if (sr === '12' || sr === '12.1' || sr === '12.2' || desc.includes('hrc fuse link')) {
      if (sr === '12.1' || (desc.includes('400') && !desc.includes('630'))) {
        applyToTarget(16, src, '400 amp');
      } else if (sr === '12.2' || (desc.includes('250') && !desc.includes('630'))) {
        applyToTarget(16, src, '250 amp');
      } else {
        applyToTarget(16, src, '630 amp');
      }
    } else if (sr === '13' || desc.includes('fuse element')) {
      applyToTarget(17, src);
    } else if (sr === '14' || desc.includes('sundry items')) {
      applyToTarget(18, src);
    } else if (sr === '15' || desc.includes('general condition')) {
      applyToTarget(19, src);
    } else if (sr === '16' || sr === '16.1' || sr === '16.2' || desc.includes('brass nut')) {
      if (sr === '16.1' || (desc.includes('20mm') && !desc.includes('12mm'))) {
        applyToTarget(20, src, '20MM');
      } else if (sr === '16.2' || (desc.includes('30mm') && !desc.includes('12mm'))) {
        applyToTarget(20, src, '30MM');
      } else {
        applyToTarget(20, src, '12MM');
      }
    } else if (sr === '17' || sr === '17.1' || sr === '17.2' || desc.includes('brass washer')) {
      if (sr === '17.1' || (desc.includes('20mm') && !desc.includes('12mm'))) {
        applyToTarget(21, src, '20MM');
      } else if (sr === '17.2' || (desc.includes('30mm') && !desc.includes('12mm'))) {
        applyToTarget(21, src, '30MM');
      } else {
        applyToTarget(21, src, '12MM');
      }
    } else if (sr === '18' || desc.includes('breather')) {
      applyToTarget(22, src);
    }
  }

  return result;
}

export const STICKY_DATE_STORAGE_KEY = 'dgvcl_last_saved_performa_date';

export function getStickyDefaultDate(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STICKY_DATE_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }
  return new Date().toISOString().slice(0, 10);
}

export function saveStickyDefaultDate(dateStr: string): void {
  if (typeof window !== 'undefined' && dateStr && dateStr.trim()) {
    try {
      localStorage.setItem(STICKY_DATE_STORAGE_KEY, dateStr.trim());
    } catch {
      // ignore
    }
  }
}

export function createBlankPerforma(id: string, location: string = '', stickyDate?: string): PerformaRecord {
  const defaultDate = stickyDate || getStickyDefaultDate();
  return {
    id,
    date: defaultDate,
    location: location || '',
    transformerRefNo: '',
    transformerMake: '',
    transformerSerialNo: '',
    capacity: '',
    division: 'ANKLESHWAR IND DIVISION',
    subDivision: 'ANKLESHWAR GIDC SDN',
    performaNo: id,
    workOrderNo: 'WO/DGVCL/ANK/2026',
    serviceOrderNo: 'SO/DGVCL/GIDC/2026',
    items: ensureCompleteMasterItems([]),
    measurements: {
      voltageRN: '',
      voltageYN: '',
      voltageBN: '',
      voltageRY: '',
      voltageYB: '',
      voltageBR: '',
      ampereR: '',
      ampereY: '',
      ampereB: '',
      ampereN: ''
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  };
}
