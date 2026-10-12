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

export interface InventorySubmission {
  id: string;
  timestamp: string;
  divisionId?: string;
  subdivisionId?: string;
  locationId?: string;
  location: string;
  locationType: 'In house' | 'Maintenance';
  transformerId?: string;
  transformerSerial?: string;
  submittedBy: string;
  notes?: string;
  version?: number;
  syncStatus: 'Synced' | 'Pending' | 'Offline Queued' | 'Error';
  items: InventoryItemValue[];
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
