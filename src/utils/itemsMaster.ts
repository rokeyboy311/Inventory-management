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
  '8': { rate: 150, labourRate: 50 },    // Voltage/Amp measurement
  '9': { rate: 950, labourRate: 250 },   // Fixing new box
  '9.1': { rate: 850, labourRate: 200 }, // Replacement of new box up to 100 Amp
  '9.2': { rate: 950, labourRate: 250 }, // Replacement of new box above 100 Amp
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

export function getLocationItemsStorageKey(locationId?: string): string {
  if (!locationId || locationId === 'global') return MASTER_ITEMS_STORAGE_KEY;
  return `dgvcl_custom_master_items_loc_${locationId}`;
}

function expandNormalizedMasterItems(items: ItemMasterTemplate[]): ItemMasterTemplate[] {
  const result: ItemMasterTemplate[] = [];
  for (const it of items) {
    if (
      (it.srLabel === '6' || (it.description && it.description.toLowerCase().includes('25/50/70'))) &&
      it.sizeFields
    ) {
      const { sizeFields, ...rest } = it;
      result.push(rest);
    } else if (
      it.srLabel === '9.1' &&
      (it.description?.includes('above') || (it.sizeFields && it.sizeFields.includes('Above 100 Amp')))
    ) {
      result.push({
        id: `master-item-9-2-upTo100`,
        srNo: 9,
        subIndex: 2,
        srLabel: '9.1',
        description: 'Replacement of new box up to 100 Amp',
        unit: 'Nos.',
        defaultRate: 850,
        defaultLabourRate: 200
      });
      result.push({
        id: `master-item-9-3-above100`,
        srNo: 9,
        subIndex: 3,
        srLabel: '9.2',
        description: 'Replacement of new box above 100 Amp',
        unit: 'Nos.',
        defaultRate: 950,
        defaultLabourRate: 250
      });
    } else {
      result.push(it);
    }
  }
  return result;
}

/**
 * Loads current master items for a specific location from localStorage, or initializes with defaults
 */
export function getMasterItemsList(locationId?: string): ItemMasterTemplate[] {
  if (typeof window === 'undefined') {
    return buildDefaultMasterItems();
  }
  const key = getLocationItemsStorageKey(locationId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return expandNormalizedMasterItems(parsed);
      }
    }

    // Fallback: if location doesn't have custom items yet, check global custom items
    if (locationId && locationId !== 'global') {
      const globalRaw = localStorage.getItem(MASTER_ITEMS_STORAGE_KEY);
      if (globalRaw) {
        const parsedGlobal = JSON.parse(globalRaw);
        if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
          return expandNormalizedMasterItems(parsedGlobal);
        }
      }
    }
  } catch (err) {
    console.warn(`Error reading master items template for location ${locationId}:`, err);
  }

  const defaults = buildDefaultMasterItems();
  if (!locationId || locationId === 'global') {
    saveMasterItemsList(defaults, 'global');
  }
  return defaults;
}

/**
 * Saves master items list for a specific location to storage and notifies listeners
 */
export function saveMasterItemsList(items: ItemMasterTemplate[], locationId?: string): void {
  if (typeof window === 'undefined') return;
  const key = getLocationItemsStorageKey(locationId);
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('dgvcl_master_items_changed', { detail: { items, locationId } }));
  } catch (err) {
    console.error(`Failed to save master items to storage for location ${locationId}:`, err);
  }
}

/**
 * Adds a new item to the master items list for a specific location
 */
export function addMasterItem(newItem: Omit<ItemMasterTemplate, 'id'>, locationId?: string): ItemMasterTemplate[] {
  const current = getMasterItemsList(locationId);
  const id = `master-item-custom-${Date.now()}`;
  const item: ItemMasterTemplate = {
    ...newItem,
    id,
    srLabel: newItem.srLabel || String(current.length + 1)
  };
  const updated = [...current, item];
  saveMasterItemsList(updated, locationId);
  return updated;
}

/**
 * Updates an existing item in the master list for a specific location
 */
export function updateMasterItem(id: string, changes: Partial<ItemMasterTemplate>, locationId?: string): ItemMasterTemplate[] {
  const current = getMasterItemsList(locationId);
  const updated = current.map(it => (it.id === id ? { ...it, ...changes } : it));
  saveMasterItemsList(updated, locationId);
  return updated;
}

/**
 * Removes an item from the master items list for a specific location
 */
export function deleteMasterItem(id: string, locationId?: string): ItemMasterTemplate[] {
  const current = getMasterItemsList(locationId);
  const updated = current.filter(it => it.id !== id);
  saveMasterItemsList(updated, locationId);
  return updated;
}

/**
 * Resets master items to the standard DISCOM 23-item template for a specific location
 */
export function resetMasterItemsToDefault(locationId?: string): ItemMasterTemplate[] {
  const defaults = buildDefaultMasterItems();
  saveMasterItemsList(defaults, locationId);
  return defaults;
}

/**
 * Copies master items from one location to another
 */
export function copyMasterItemsFromLocation(fromLocationId: string, toLocationId: string): ItemMasterTemplate[] {
  const sourceItems = getMasterItemsList(fromLocationId);
  saveMasterItemsList(sourceItems, toLocationId);
  return sourceItems;
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
