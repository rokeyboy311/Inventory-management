import { LocationWorkbook, PerformaRecord, createBlankPerforma } from '../types/performa';

const DB_NAME = 'PerformaDataEngineDB';
const DB_VERSION = 1;
const STORE_WORKBOOKS = 'workbooks';
const STORE_DRAFTS = 'drafts';

// IndexedDB Helper
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_WORKBOOKS)) {
        db.createObjectStore(STORE_WORKBOOKS, { keyPath: 'locationId' });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'key' });
      }
    };
  });
}

// Create brand new blank Location Workbook
export function createNewLocationWorkbook(locationName: string): LocationWorkbook {
  const cleanLoc = locationName.trim();
  const id = cleanLoc.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'loc';
  return {
    locationId: id,
    locationName: cleanLoc,
    workbookName: `${cleanLoc}.xlsx`,
    activeSheetName: 'Performas',
    sheets: {
      'Performas': {
        name: 'Performas',
        type: 'performas',
        performas: [],
        isCompatible: true,
        rawRowsCount: 0
      },
      'Maintenance': {
        name: 'Maintenance',
        type: 'maintenance',
        performas: [],
        isCompatible: true,
        rawRowsCount: 0
      },
      'Measurements': {
        name: 'Measurements',
        type: 'measurements',
        performas: [],
        isCompatible: true,
        rawRowsCount: 0
      }
    },
    lastModified: new Date().toISOString()
  };
}

// Default initial workbook for initial launch
export function createInitialWorkbook(locationName: string = 'Ahmedabad'): LocationWorkbook {
  const wb = createNewLocationWorkbook(locationName);
  return wb;
}

/**
 * Loads all workbooks from IndexedDB (with localStorage fallback).
 */
export async function loadWorkbooksFromStorage(): Promise<LocationWorkbook[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_WORKBOOKS, 'readonly');
      const store = tx.objectStore(STORE_WORKBOOKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as LocationWorkbook[];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          // Check localStorage fallback
          const local = localStorage.getItem('performa_workbooks_v2');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              resolve(parsed);
              return;
            } catch (e) {
              // ignore
            }
          }
          // Seed with initial Ahmedabad workbook
          const initial = [createInitialWorkbook('Ahmedabad')];
          saveWorkbookToStorage(initial[0]);
          resolve(initial);
        }
      };
      req.onerror = () => {
        resolve([createInitialWorkbook('Ahmedabad')]);
      };
    });
  } catch (err) {
    // LocalStorage fallback
    const local = localStorage.getItem('performa_workbooks_v2');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // ignore
      }
    }
    return [createInitialWorkbook('Ahmedabad')];
  }
}

/**
 * Saves a single workbook into IndexedDB and keeps localStorage in sync.
 */
export async function saveWorkbookToStorage(workbook: LocationWorkbook): Promise<void> {
  // Sync to localStorage
  try {
    const allWorkbooks = await loadWorkbooksFromStorage();
    const idx = allWorkbooks.findIndex(w => w.locationId === workbook.locationId);
    if (idx >= 0) {
      allWorkbooks[idx] = workbook;
    } else {
      allWorkbooks.push(workbook);
    }
    localStorage.setItem('performa_workbooks_v2', JSON.stringify(allWorkbooks));
  } catch (e) {
    // ignore
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKBOOKS, 'readwrite');
      const store = tx.objectStore(STORE_WORKBOOKS);
      const req = store.put(workbook);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // If IndexedDB failed, localStorage was already updated above
  }
}

/**
 * Draft protection helpers.
 */
export interface UnsavedDraftState {
  key: string;
  locationId: string;
  sheetName: string;
  performa: PerformaRecord;
  savedAt: string;
}

export function saveUnsavedDraft(locationId: string, sheetName: string, performa: PerformaRecord): void {
  try {
    const draft: UnsavedDraftState = {
      key: `draft_${locationId}_${sheetName}`,
      locationId,
      sheetName,
      performa,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('performa_active_draft', JSON.stringify(draft));
  } catch (e) {
    // ignore
  }
}

export function getUnsavedDraft(): UnsavedDraftState | null {
  try {
    const str = localStorage.getItem('performa_active_draft');
    if (!str) return null;
    return JSON.parse(str) as UnsavedDraftState;
  } catch (e) {
    return null;
  }
}

export function clearUnsavedDraft(): void {
  try {
    localStorage.removeItem('performa_active_draft');
  } catch (e) {
    // ignore
  }
}
