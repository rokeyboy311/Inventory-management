import { MaintenanceItemRow, DEFAULT_PERFORMA_ITEMS_TEMPLATE } from '../types/performa';

export interface ItemMasterTemplate {
  id: string;
  srNo: number;
  subIndex?: number;
  srLabel: string;
  description: string;
  unit: string;
  sizeFields?: string[];
  defaultRate?: number;
  defaultLabourRate?: number;
}

const MASTER_ITEMS_STORAGE_KEY = 'dgvcl_custom_master_items_v3';

// Standard contractor rates by item label or description keyword
const STANDARD_ITEM_RATES: Record<string, { rate: number; labourRate: number }> = {
  '1': { rate: 120, labourRate: 40 },    // LT Bushing Goti
  '1.1': { rate: 150, labourRate: 50 },  // HT Bushing Goti
  '2': { rate: 220, labourRate: 50 },    // Half stud
  '2.1': { rate: 350, labourRate: 80 },  // AL Patta
  '3': { rate: 0, labourRate: 150 },     // Earth connection
  '4': { rate: 450, labourRate: 100 },   // LT damaged cable
  '5': { rate: 250, labourRate: 90 },    // RYBN core
  '6': { rate: 120, labourRate: 60 },    // Term 25/50/70
  '6.1': { rate: 160, labourRate: 80 },  // Term 95/120/150
  '6.2': { rate: 220, labourRate: 90 },  // Term 185
  '7': { rate: 180, labourRate: 50 },    // Oil leakage / top-up
  '8': { rate: 0, labourRate: 100 },     // Voltage/Amp measurement
  '9': { rate: 950, labourRate: 250 },   // Fixing new box
  '9.1': { rate: 850, labourRate: 200 }, // Box 100A / Above
  '10': { rate: 280, labourRate: 60 },   // Kit-Kat fuse
  '11': { rate: 420, labourRate: 70 },   // HRC fuse base
  '12': { rate: 260, labourRate: 50 },   // HRC fuse link
  '13': { rate: 80, labourRate: 30 },    // Fuse element DO
  '14': { rate: 90, labourRate: 30 },    // Sundry items
  '15': { rate: 0, labourRate: 250 },    // General condition
  '16': { rate: 60, labourRate: 25 },    // Brass nut
  '17': { rate: 40, labourRate: 20 },    // Brass washer
  '18': { rate: 380, labourRate: 70 },   // Breather
};

/**
 * Builds the canonical initial master items list from the default performa template
 */
export function buildDefaultMasterItems(): ItemMasterTemplate[] {
  return DEFAULT_PERFORMA_ITEMS_TEMPLATE.map((tpl, idx) => {
    const srKey = tpl.srLabel || String(tpl.srNo);
    const rates = STANDARD_ITEM_RATES[srKey] || { rate: 150, labourRate: 50 };
    return {
      id: `master-item-${tpl.srNo}-${tpl.subIndex || 1}-${idx}`,
      srNo: tpl.srNo,
      subIndex: tpl.subIndex,
      srLabel: tpl.srLabel || String(tpl.srNo),
      description: tpl.description,
      unit: tpl.unit,
      sizeFields: tpl.sizeFields ? [...tpl.sizeFields] : undefined,
      defaultRate: rates.rate,
      defaultLabourRate: rates.labourRate
    };
  });
}

/**
 * Loads current master items from localStorage, or initializes with defaults
 */
export function getMasterItemsList(): ItemMasterTemplate[] {
  if (typeof window === 'undefined') {
    return buildDefaultMasterItems();
  }
  try {
    const raw = localStorage.getItem(MASTER_ITEMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading master items template from storage:', err);
  }

  const defaults = buildDefaultMasterItems();
  saveMasterItemsList(defaults);
  return defaults;
}

/**
 * Saves master items list to storage and notifies listeners
 */
export function saveMasterItemsList(items: ItemMasterTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTER_ITEMS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('dgvcl_master_items_changed', { detail: items }));
  } catch (err) {
    console.error('Failed to save master items to storage:', err);
  }
}

/**
 * Adds a new item to the master items list
 */
export function addMasterItem(newItem: Omit<ItemMasterTemplate, 'id'>): ItemMasterTemplate[] {
  const current = getMasterItemsList();
  const id = `master-item-custom-${Date.now()}`;
  const item: ItemMasterTemplate = {
    ...newItem,
    id,
    srLabel: newItem.srLabel || String(current.length + 1)
  };
  const updated = [...current, item];
  saveMasterItemsList(updated);
  return updated;
}

/**
 * Updates an existing item in the master list
 */
export function updateMasterItem(id: string, changes: Partial<ItemMasterTemplate>): ItemMasterTemplate[] {
  const current = getMasterItemsList();
  const updated = current.map(it => (it.id === id ? { ...it, ...changes } : it));
  saveMasterItemsList(updated);
  return updated;
}

/**
 * Removes an item from the master items list
 */
export function deleteMasterItem(id: string): ItemMasterTemplate[] {
  const current = getMasterItemsList();
  const updated = current.filter(it => it.id !== id);
  saveMasterItemsList(updated);
  return updated;
}

/**
 * Resets master items to the standard DISCOM 23-item template
 */
export function resetMasterItemsToDefault(): ItemMasterTemplate[] {
  const defaults = buildDefaultMasterItems();
  saveMasterItemsList(defaults);
  return defaults;
}

/**
 * Converts master item templates into blank MaintenanceItemRow instances for a performa
 */
export function convertMasterItemsToRows(masterItems: ItemMasterTemplate[]): MaintenanceItemRow[] {
  return masterItems.map((m, idx) => ({
    id: `item-${m.srLabel}-${idx}`,
    srNo: m.srNo,
    subIndex: m.subIndex,
    srLabel: m.srLabel,
    description: m.description,
    unit: m.unit,
    materialYes: false,
    labourYes: false,
    qty: '',
    sizeFields: m.sizeFields ? [...m.sizeFields] : undefined,
    sizeQtys: m.sizeFields ? Object.fromEntries(m.sizeFields.map(f => [f, ''])) : undefined
  }));
}
