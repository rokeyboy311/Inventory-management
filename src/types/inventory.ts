/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Type Definitions for Division → Sub-Division → Location Inventory System
 */

export type StatusType = 'active' | 'inactive';

export interface Division {
  id: string;
  name: string;
  code: string;
  status: StatusType;
  googleDriveFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubDivision {
  id: string;
  divisionId: string;
  name: string;
  code: string;
  status: StatusType;
  googleDriveFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  divisionId: string;
  subdivisionId: string;
  name: string;
  code: string;
  address?: string;
  status: StatusType;
  googleDriveFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transformer {
  id: string;
  locationId: string;
  serialNumber: string;
  make: string;
  capacity: string; // e.g. "100 KVA", "63 KVA", "25 KVA"
  status: StatusType;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialVariant {
  id: string;
  materialId: string;
  variantName: string; // e.g. "HT", "LT", "70 sq mm (C-1)", "150 sq mm (C-2)", "100 KVA"
  unit?: string;
  status: StatusType;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string; // "Nos.", "Meter", "Job", "Sets", "Kg", "Litres"
  status: StatusType;
  referenceField?: string;
  variants: MaterialVariant[];
  openingStock: number;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export type FieldType = 'input_only' | 'dropdown_only' | 'dual';

export interface InventoryItemDefinition {
  id: string;
  name: string;
  category?: string;
  fieldType: FieldType;
  defaultValue?: string | number;
  inputPlaceholder?: string;
  dropdownPlaceholder?: string;
  options?: string[]; // Variant names
  unit?: string;
  isDeletable?: boolean;
  status?: StatusType;
}

export interface DailyEntryItem {
  id: string;
  entryId: string;
  materialId: string;
  materialName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unit: string;
  remark?: string;
}

export interface DailyEntry {
  id: string;
  divisionId: string;
  subdivisionId: string;
  locationId: string;
  transformerId?: string;
  entryDate: string; // YYYY-MM-DD
  enteredBy: string;
  locationType: 'In house' | 'Maintenance';
  remarks?: string;
  version: number;
  syncStatus: 'Synced' | 'Pending' | 'Offline Queued' | 'Error';
  items: DailyEntryItem[];
  createdAt: string;
  updatedAt: string;
}

// Backward-compatible interface for Quick Entry & existing components
export interface InventoryItemValue {
  itemId: string;
  itemName: string;
  fieldType: FieldType;
  value: string | number;
  selectedType?: string | null;
  unit?: string;
  optionValues?: Record<string, string | number>;
}

export interface TransformerReportMeta {
  companyName?: string;
  reportTitle?: string;
  workName?: string;
  division?: string;
  workOrderNo?: string;
  workOrderDate?: string;
  reportNo?: string;
  reportDate?: string;
  transformerRating?: string;
  transformerMake?: string;
  transformerSerialNo?: string;
  voltageRatio?: string;
  contractorRep?: string;
  discomRep?: string;
}

export interface InventorySubmission {
  id: string;
  timestamp: string;
  divisionId?: string;
  subdivisionId?: string;
  locationId?: string;
  location: string;
  locationType?: 'In house' | 'Maintenance';
  transformerId?: string;
  transformerSerial?: string;
  transformerMake?: string;
  transformerCapacity?: string;
  submittedBy: string;
  notes?: string;
  version?: number;
  syncStatus: 'Synced' | 'Pending' | 'Offline Queued' | 'Error';
  items: InventoryItemValue[];
  reportMeta?: TransformerReportMeta;
}

export interface TransformerReading {
  id: string;
  srNo: number;
  divisionId: string;
  subdivisionId: string;
  locationId: string;
  locationName: string;
  transformerId: string;
  transformerSerial: string;
  transformerMake: string;
  transformerCapacity: string;
  readingDate: string; // YYYY-MM-DD
  readingTime?: string;
  voltageRN: number;
  voltageYN: number;
  voltageBN: number;
  ampereR: number;
  ampereY: number;
  ampereB: number;
  ampereN: number;
  enteredBy: string;
  remarks?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type StockTransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  variantId?: string;
  variantName?: string;
  type: StockTransactionType;
  quantity: number;
  unit: string;
  referenceType: 'daily_entry' | 'stock_receipt' | 'manual_adjustment';
  referenceId?: string;
  divisionId?: string;
  subdivisionId?: string;
  locationId?: string;
  date: string;
  enteredBy: string;
  notes?: string;
  createdAt: string;
}

export interface FileRegistryRecord {
  id: string;
  divisionId: string;
  subdivisionId: string;
  locationId: string;
  locationName: string;
  fileType: 'inventory_usage' | 'volt_amp_reading';
  fileName: string;
  googleDriveFolderId?: string;
  googleDriveFileId?: string;
  lastSyncedAt: string;
  syncStatus: 'Synced' | 'Pending' | 'Error';
  recordsCount: number;
}

export interface AuditLogRecord {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
}

export interface BillRecord {
  id: string;
  billNumber: string;
  date: string;
  divisionId: string;
  subdivisionId: string;
  contractorName: string;
  contractorGstin: string;
  items: BillItem[];
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalGst: number;
  roundOff: number;
  netAmount: number;
  remarks?: string;
  status: 'Draft' | 'Approved' | 'Paid';
  createdAt: string;
  updatedAt: string;
}

export interface LocationFileMeta {
  fileName: string;
  type: 'In house' | 'Maintenance' | 'volt_amp_reading';
  submissionsCount: number;
  itemsCount: number;
  lastUpdated: string;
}

export interface LocationFolderMeta {
  locationId: string;
  locationName: string;
  folderName: string;
  divisionName: string;
  subdivisionName: string;
  lastUpdated: string;
  files: LocationFileMeta[];
}

export type MainNavTab = 'dashboard' | 'location' | 'quick_entry' | 'readings' | 'materials' | 'billing';

export const STANDARD_5_ITEMS: InventoryItemDefinition[] = [
  {
    id: 'item-lug',
    name: 'Lug',
    category: 'Hardware',
    fieldType: 'dual',
    defaultValue: '10',
    inputPlaceholder: 'Enter Qty',
    options: ['100', '200', '500'],
    unit: 'Nos.',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'item-cable',
    name: 'Cable',
    category: 'Cabling',
    fieldType: 'dual',
    defaultValue: '25',
    inputPlaceholder: 'Enter Length',
    options: ['11KV', '33KV', 'LT'],
    unit: 'Mtr',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'item-earth-compaction',
    name: 'Earth Compaction',
    category: 'Earthing',
    fieldType: 'input_only',
    defaultValue: '2.5',
    inputPlaceholder: 'Enter Reading',
    unit: 'Ohm',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'item-power',
    name: 'Power',
    category: 'Electrical',
    fieldType: 'input_only',
    defaultValue: '415',
    inputPlaceholder: 'Enter Voltage/KW',
    unit: 'KW',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'item-box',
    name: 'Terminal Box',
    category: 'Enclosures',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: 'Enter Box Qty',
    unit: 'Nos.',
    isDeletable: false,
    status: 'active'
  }
];

export const TC_MAINTENANCE_MASTER_ITEMS: InventoryItemDefinition[] = [
  {
    id: 'mat-bushing-goti',
    name: 'Replacement of  bushing goti',
    category: 'Bushing',
    fieldType: 'dual',
    options: ['HT', 'LT'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    dropdownPlaceholder: 'HT / LT',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-al-patta',
    name: 'Providing LT side AL. Patta KVA',
    category: 'Busbar',
    fieldType: 'dual',
    options: ['100'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    dropdownPlaceholder: '100',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-earth-connection',
    name: 'Check and Tight Earth Connection',
    category: 'Earthing',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: '1 [Default]',
    unit: 'Nos.',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-lt-cable',
    name: 'Replacement of LT damaged cable',
    category: 'Cabling',
    fieldType: 'dual',
    options: ['Nos.', 'C- 1(70)', 'C- 2(150)'],
    unit: 'Mtr',
    inputPlaceholder: 'Enter length / count',
    dropdownPlaceholder: 'Select specification',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-termination-core',
    name: 'Providing of new termination in form of R,Y,B and N core including PVC tape',
    category: 'Termination',
    fieldType: 'dual',
    options: ['70', '150'],
    unit: 'Sets',
    inputPlaceholder: 'Enter sets',
    dropdownPlaceholder: '70 / 150',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-termination-upto-sqmm',
    name: 'Providing of termination up to sq mm cable',
    category: 'Termination',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: 'Enter count',
    unit: 'Sets',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-voltage-amp-measurement',
    name: 'Measurement and voltage ampeare',
    category: 'Testing',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: '1 [Checked]',
    unit: 'Job',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-oil-leakage',
    name: 'Check oil leakage and fill up',
    category: 'Insulation',
    fieldType: 'dual',
    options: ['Ltr'],
    unit: 'Ltr',
    inputPlaceholder: 'Enter oil liters',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-lt-dist-box',
    name: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity',
    category: 'Enclosures',
    fieldType: 'input_only',
    defaultValue: '0',
    inputPlaceholder: '0 or count',
    unit: 'Nos.',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-kit-ket-fuse',
    name: 'Checking and replacement of Kit-Ket fuse if required',
    category: 'Protection',
    fieldType: 'dual',
    options: ['100Amp', '200Amp'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter fuse count',
    dropdownPlaceholder: '100Amp / 200Amp',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-hrc-fuse-base',
    name: 'Replacement of HRC Fuse Base',
    category: 'Protection',
    fieldType: 'dual',
    options: ['400'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-hrc-fuse-link',
    name: 'Replacement of HRC Fuse Link',
    category: 'Protection',
    fieldType: 'dual',
    options: ['400'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-fuse-element-do',
    name: 'Providing of Fuse elemant (D.O.)',
    category: 'Protection',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter count',
    unit: 'Nos.',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-sundry-items',
    name: 'Providing of Sundry items (Nut,Bolt,Washer)',
    category: 'Hardware',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter sets/count',
    unit: 'Sets',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-general-condition',
    name: 'General Condition',
    category: 'Inspection',
    fieldType: 'input_only',
    defaultValue: '3',
    inputPlaceholder: 'Enter condition code',
    unit: 'Status',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-brass-nuts',
    name: 'LT Side Brass Nuts',
    category: 'Hardware',
    fieldType: 'dual',
    options: ['12 mm'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-brass-washer',
    name: 'LT Side Brass Washer',
    category: 'Hardware',
    fieldType: 'dual',
    options: ['12 mm'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-breather-silica',
    name: 'Breather',
    category: 'Maintenance',
    fieldType: 'dual',
    options: ['500 gm'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  },
  {
    id: 'mat-half-stud',
    name: 'HALF STUD',
    category: 'Hardware',
    fieldType: 'dual',
    options: ['12 MM'],
    unit: 'Nos.',
    inputPlaceholder: 'Enter count',
    isDeletable: false,
    status: 'active'
  }
];

export const RUDRA_ELECTRICAL_18_ITEMS = TC_MAINTENANCE_MASTER_ITEMS;
