export type FieldType = 'input_only' | 'dropdown_only' | 'dual';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface InventoryItemDefinition {
  id: string;
  name: string;
  fieldType: FieldType;
  defaultValue?: string | number;
  inputPlaceholder?: string;
  dropdownPlaceholder?: string;
  options?: string[]; // e.g. ["100", "200", "500"] for Lug, ["1.5 sq mm", "2.5 sq mm", "4 sq mm", "Armoured"] for Cable
  unit?: string;
  isDeletable?: boolean;
}

export interface InventoryItemValue {
  itemId: string;
  itemName: string;
  fieldType: FieldType;
  value: string | number;
  selectedType?: string | null; // which option was chosen, e.g. "100" or "200" or "500"
  unit?: string;
  optionValues?: Record<string, string | number>; // allows direct values per sub-option
}

export interface InventorySubmission {
  id: string;
  timestamp: string;
  location: string;
  locationType: 'In house' | 'Maintenance';
  submittedBy: string;
  notes?: string;
  syncStatus: 'Synced' | 'Pending' | 'Offline Queued' | 'Error';
  items: InventoryItemValue[];
}

export interface LocationFileMeta {
  fileName: string;
  type: 'In house' | 'Maintenance';
  submissionsCount: number;
  itemsCount: number;
  lastUpdated: string;
}

export interface LocationFolderMeta {
  locationName: string;
  folderName: string;
  lastUpdated: string;
  files: LocationFileMeta[];
}

export type MainNavTab = 'dashboard' | 'location' | 'quick_entry';
