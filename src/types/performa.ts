export interface MaintenanceItemRow {
  id: string;
  srNo: number;
  subIndex?: number;
  description: string;
  unit: string;
  materialYes: boolean;
  labourYes: boolean;
  qty: number | string;
  remarks: string;
}

export interface VoltageAmpereReading {
  voltageRN: string;
  voltageYN: string;
  voltageBN: string;
  ampereR: string;
  ampereY: string;
  ampereB: string;
  ampereN: string;
}

export interface PerformaRecord {
  id: string; // e.g. AHM-001
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  location: string; // Location of Transformer e.g. "Ahmedabad" or "Rio: Vauxia"
  transformerRefNo: string; // e.g. TR-2026-09
  transformerMake: string; // e.g. W&P
  transformerSerialNo: string; // e.g. IT 1434
  capacity: string; // e.g. 200 KVA
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
  remarks: string;
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

export const DEFAULT_PERFORMA_ITEMS_TEMPLATE: Omit<MaintenanceItemRow, 'id'>[] = [
  // 1
  { srNo: 1, subIndex: 1, description: 'Replacement of LT bushing Got/Rubber Washer', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 1, subIndex: 2, description: 'Replacement of HT bushing Got/Rubber Washer', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 2
  { srNo: 2, subIndex: 1, description: 'Providing of half stud on LT side', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 2, subIndex: 2, description: 'Providing of AL Patta on LT side', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 3
  { srNo: 3, subIndex: 1, description: 'Check and Tight earth Connection', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 4
  { srNo: 4, subIndex: 1, description: 'Replacement of damage LT cable with new one of right capacity', unit: 'LS', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 5
  { srNo: 5, subIndex: 1, description: 'Providing of termination in form of RYB And N core including PVC tape', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 6
  { srNo: 6, subIndex: 1, description: 'Termination of 25/50/70 Sq mm cable', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 6, subIndex: 2, description: 'Termination of 95/120/150 Sq mm cable', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 6, subIndex: 3, description: 'Termination of 185 Sq mm cable', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 7
  { srNo: 7, subIndex: 1, description: 'Check Oil leakage and Top up of Oil (oil provide by DGVCL)', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 8
  { srNo: 8, subIndex: 1, description: 'Measurement of Voltage and Ampere', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 9
  { srNo: 9, subIndex: 1, description: 'fixing new box with complete wiring', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 9, subIndex: 2, description: 'Replacement of new box up to 100 Amp', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 9, subIndex: 3, description: 'Replacement of new box above 100 Amp', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 10
  { srNo: 10, subIndex: 1, description: 'Checking and Replacement of Kit-Ket fuse (100Amp)', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 10, subIndex: 2, description: 'Checking and Replacement of Kit-Ket fuse (200Amp)', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 11
  { srNo: 11, subIndex: 1, description: '630 amp HRC fuse base', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 11, subIndex: 2, description: '400 amp HRC fuse base', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 11, subIndex: 3, description: '250 amp HRC fuse base', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 12
  { srNo: 12, subIndex: 1, description: '630 amp HRC fuse Link', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 12, subIndex: 2, description: '400 amp HRC fuse Link', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 12, subIndex: 3, description: '250 amp HRC fuse Link', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 13
  { srNo: 13, subIndex: 1, description: 'Providing of Fuse element on HT side (on D.O fuse)', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 14
  { srNo: 14, subIndex: 1, description: 'Providing and replacement of sundry items like nut, bolt, washer etc.', unit: 'LS', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 15
  { srNo: 15, subIndex: 1, description: 'General Condition Cleaning, Clamping and Proforam forment', unit: 'JOB', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 16
  { srNo: 16, subIndex: 1, description: 'LT side Brass Nut 12MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 16, subIndex: 2, description: 'LT side Brass Nut 20MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 16, subIndex: 3, description: 'LT side Brass Nut 30MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 17
  { srNo: 17, subIndex: 1, description: 'LT side Brass washer 12MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 17, subIndex: 2, description: 'LT side Brass washer 20MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  { srNo: 17, subIndex: 3, description: 'LT side Brass washer 30MM', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' },
  // 18
  { srNo: 18, subIndex: 1, description: 'breather', unit: 'Nos.', materialYes: false, labourYes: false, qty: 0, remarks: '' }
];

export function createBlankPerforma(id: string, location: string = ''): PerformaRecord {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    date: today,
    location: location || '',
    transformerRefNo: '',
    transformerMake: '',
    transformerSerialNo: '',
    capacity: '0',
    items: DEFAULT_PERFORMA_ITEMS_TEMPLATE.map((tpl, idx) => ({
      ...tpl,
      qty: 0,
      materialYes: false,
      labourYes: false,
      remarks: '',
      id: `item-${tpl.srNo}-${tpl.subIndex || 1}-${idx}`
    })),
    measurements: {
      voltageRN: '0',
      voltageYN: '0',
      voltageBN: '0',
      ampereR: '0',
      ampereY: '0',
      ampereB: '0',
      ampereN: '0'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  };
}
