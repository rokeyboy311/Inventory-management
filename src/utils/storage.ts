import { LocationWorkbook, PerformaRecord, ensureCompleteMasterItems } from '../types/performa';
import { Team } from '../types/team';
import { createDolvanSamplePerforma, createDefaultBillSheet } from './dolvanTemplate';
import { getDefaultPrefixForLocation } from './idGenerator';
import { syncBillFromInventory } from './billSync';
import { 
  fetchTeamsFromSupabase, 
  upsertTeamSupabase, 
  deleteTeamSupabase, 
  fetchWorkbooksFromSupabase, 
  upsertWorkbookSupabase, 
  deleteWorkbookSupabase,
  deletePerformaSupabase,
  optimizeWorkbookForStorage
} from './supabaseClient';

const DB_NAME = 'PerformaDataEngineDB';
const DB_VERSION = 2;
const STORE_WORKBOOKS = 'workbooks';
const STORE_DRAFTS = 'drafts';
const STORE_TEAMS = 'teams';

// Real-time Cross-tab Sync
export const syncBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('dgvcl_inventory_sync_channel')
  : null;

// IndexedDB Helper (Lightweight local offline mirror)
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
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
      if (!db.objectStoreNames.contains(STORE_TEAMS)) {
        db.createObjectStore(STORE_TEAMS, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Replaces the local offline mirror with the authoritative list from Supabase Master Database.
 */
async function syncLocalStoreAuthoritatively<T>(storeName: string, items: T[], localStorageKey: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(items));
  } catch {
    try {
      localStorage.removeItem('performa_workbooks_v1');
      localStorage.setItem(localStorageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// Team Storage Management (Supabase Master Database)
// -------------------------------------------------------------
export function createDefaultTeams(): Team[] {
  return [
    {
      id: 'team-dolvan-maintenance',
      name: 'Dolvan Maintenance Team',
      members: ['Kishan Kumar', 'Ramesh Bhai', 'Pravin Solanki'],
      locationExcelIds: ['dolvan'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'team-vyara-central',
      name: 'Vyara Maintenance Team',
      members: ['Suresh Gamit', 'Bharat Vasava'],
      locationExcelIds: ['kandha_konchal'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export async function loadTeamsFromStorage(): Promise<Team[]> {
  // 1. Load directly from Supabase Master Database
  try {
    const remoteTeams = await fetchTeamsFromSupabase();
    if (remoteTeams) {
      if (remoteTeams.length > 0) {
        await syncLocalStoreAuthoritatively(STORE_TEAMS, remoteTeams, 'dgvcl_teams_v1');
        return remoteTeams;
      } else {
        // Seed default teams into Supabase if empty
        const defaults = createDefaultTeams();
        for (const t of defaults) {
          await upsertTeamSupabase(t);
        }
        await syncLocalStoreAuthoritatively(STORE_TEAMS, defaults, 'dgvcl_teams_v1');
        return defaults;
      }
    }
  } catch (err) {
    console.warn('Supabase load teams error, falling back to local cache:', err);
  }

  // 2. Offline fallback: IndexedDB / localStorage
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TEAMS, 'readonly');
      const store = tx.objectStore(STORE_TEAMS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Team[];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          const local = localStorage.getItem('dgvcl_teams_v1');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                resolve(parsed);
                return;
              }
            } catch {
              // ignore
            }
          }
          const defaults = createDefaultTeams();
          defaults.forEach(t => saveTeamToStorage(t));
          resolve(defaults);
        }
      };
      req.onerror = () => resolve(createDefaultTeams());
    });
  } catch {
    return createDefaultTeams();
  }
}

export async function saveTeamToStorage(team: Team): Promise<void> {
  const updatedTeam: Team = {
    ...team,
    id: team.id.trim(),
    name: team.name.trim(),
    updatedAt: new Date().toISOString()
  };

  // 1. Save directly to Supabase Master Database
  try {
    await upsertTeamSupabase(updatedTeam);
  } catch (err) {
    console.warn('Supabase save team error:', err);
  }

  // 2. Update local offline mirror
  try {
    const localRaw = localStorage.getItem('dgvcl_teams_v1');
    const currentList: Team[] = localRaw ? JSON.parse(localRaw) : [];
    const idx = currentList.findIndex(t => t.id === updatedTeam.id);
    if (idx >= 0) {
      currentList[idx] = updatedTeam;
    } else {
      currentList.push(updatedTeam);
    }
    await syncLocalStoreAuthoritatively(STORE_TEAMS, currentList, 'dgvcl_teams_v1');
  } catch {
    // ignore
  }

  syncBroadcastChannel?.postMessage({ type: 'TEAM_UPDATED', teamId: updatedTeam.id });
}

export async function deleteTeamFromStorage(teamId: string): Promise<void> {
  // 1. Delete directly from Supabase Master Database
  try {
    await deleteTeamSupabase(teamId);
  } catch (err) {
    console.warn('Supabase delete team error:', err);
  }

  // 2. Update local offline mirror
  try {
    const localRaw = localStorage.getItem('dgvcl_teams_v1');
    const currentList: Team[] = localRaw ? JSON.parse(localRaw) : [];
    const filtered = currentList.filter(t => t.id !== teamId);
    await syncLocalStoreAuthoritatively(STORE_TEAMS, filtered, 'dgvcl_teams_v1');
  } catch {
    // ignore
  }

  syncBroadcastChannel?.postMessage({ type: 'TEAM_DELETED', teamId });
}

// -------------------------------------------------------------
// Location Workbook Storage (Supabase Master Database)
// -------------------------------------------------------------

export function createNewLocationWorkbookWithDualSheets(locationName: string, teamId: string = 'default'): LocationWorkbook {
  const trimmedLoc = locationName.trim();
  const cleanLoc = trimmedLoc.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'LOCATION';
  const locId = `loc_${cleanLoc.toLowerCase()}_${Date.now()}`;
  const initialBill = syncBillFromInventory([], trimmedLoc);

  return {
    locationId: locId,
    teamId,
    locationName: trimmedLoc,
    workbookName: `${cleanLoc}.xlsx`,
    activeSheetName: 'inventory',
    sheets: {
      'inventory': {
        name: 'inventory',
        type: 'inventory',
        performas: [],
        isCompatible: true,
        rawRowsCount: 0
      },
      'bill': {
        name: 'bill',
        type: 'bill',
        performas: [],
        billData: initialBill,
        isCompatible: true,
        rawRowsCount: initialBill.items.length
      }
    },
    lastModified: new Date().toISOString()
  };
}

export function createInitialWorkbook(locationName: string = 'Dolvan', teamId: string = 'default'): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, teamId);
}

export function createNewLocationWorkbook(locationName: string): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, 'default');
}

/**
 * Loads all workbooks directly from the Supabase Master Database with authoritative local merging.
 * Never drops locally created location workbooks.
 */
export async function loadWorkbooksFromStorage(): Promise<LocationWorkbook[]> {
  // Always read local cache first so offline records / newly added local workbooks are never lost
  const localCache = await getLocalWorkbooksCache();

  // 1. Load directly from Supabase Master Database
  try {
    const remoteWorkbooks = await fetchWorkbooksFromSupabase();
    if (remoteWorkbooks) {
      if (remoteWorkbooks.length > 0) {
        // Authoritative merge by locationId: preserve all local workbooks
        const map = new Map<string, LocationWorkbook>();
        for (const w of remoteWorkbooks) {
          map.set(w.locationId, optimizeWorkbookForStorage(w));
        }

        for (const lw of localCache) {
          if (!map.has(lw.locationId)) {
            // Local workbook not yet synced to remote: retain it and push to Supabase
            map.set(lw.locationId, lw);
            upsertWorkbookSupabase(lw).catch(() => {});
          } else {
            const rw = map.get(lw.locationId)!;
            if (lw.lastModified && rw.lastModified && new Date(lw.lastModified) > new Date(rw.lastModified)) {
              map.set(lw.locationId, lw);
              upsertWorkbookSupabase(lw).catch(() => {});
            }
          }
        }

        const mergedList = Array.from(map.values());
        await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, mergedList, 'performa_workbooks_v2');
        return mergedList;
      } else {
        // Supabase is ready but has 0 workbooks: push local cache up
        if (localCache.length > 0) {
          for (const wb of localCache) {
            await upsertWorkbookSupabase(wb);
          }
          return localCache;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase load workbooks warning, falling back to local cache:', err);
  }

  // 2. Offline fallback: IndexedDB / localStorage
  if (localCache.length > 0) return localCache;

  return [];
}

async function getLocalWorkbooksCache(): Promise<LocationWorkbook[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_WORKBOOKS, 'readonly');
      const store = tx.objectStore(STORE_WORKBOOKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as LocationWorkbook[];
        if (results && results.length > 0) {
          resolve(results.map(w => optimizeWorkbookForStorage(w)));
        } else {
          const local = localStorage.getItem('performa_workbooks_v2');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                resolve(parsed.map((w: any) => optimizeWorkbookForStorage(w)));
                return;
              }
            } catch {
              // ignore
            }
          }
          resolve([]);
        }
      };
      req.onerror = () => {
        const local = localStorage.getItem('performa_workbooks_v2');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              resolve(parsed.map((w: any) => optimizeWorkbookForStorage(w)));
              return;
            }
          } catch {}
        }
        resolve([]);
      };
    });
  } catch {
    const local = localStorage.getItem('performa_workbooks_v2');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed.map((w: any) => optimizeWorkbookForStorage(w));
        }
      } catch {}
    }
    return [];
  }
}

/**
 * Saves a single workbook directly to local offline mirror first, then Supabase Master Database.
 */
export async function saveWorkbookToStorage(workbook: LocationWorkbook): Promise<void> {
  const optimized = optimizeWorkbookForStorage(workbook);

  // 1. Update local offline mirror FIRST so it is guaranteed immediately saved
  try {
    const localRaw = localStorage.getItem('performa_workbooks_v2');
    const currentList: LocationWorkbook[] = localRaw ? JSON.parse(localRaw) : [];
    const idx = currentList.findIndex(w => w.locationId === optimized.locationId);
    if (idx >= 0) {
      currentList[idx] = optimized;
    } else {
      currentList.push(optimized);
    }
    await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, currentList, 'performa_workbooks_v2');
  } catch (err) {
    console.warn('Local save workbook error:', err);
  }

  // 2. Save directly to Supabase Master Database
  try {
    await upsertWorkbookSupabase(optimized);
  } catch (err) {
    console.warn('Supabase save workbook error:', err);
  }

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_UPDATED', locationId: optimized.locationId });
}

/**
 * Physically deletes a Location Workbook directly from Supabase Master Database and local mirror.
 */
export async function deleteWorkbookFromStorage(locationId: string): Promise<void> {
  // 1. Delete directly from Supabase Master Database
  try {
    await deleteWorkbookSupabase(locationId);
  } catch (err) {
    console.warn('Supabase delete workbook error:', err);
  }

  // 2. Delete from local mirror
  try {
    const localRaw = localStorage.getItem('performa_workbooks_v2');
    const currentList: LocationWorkbook[] = localRaw ? JSON.parse(localRaw) : [];
    const filtered = currentList.filter(w => w.locationId !== locationId);
    await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, filtered, 'performa_workbooks_v2');

    const draft = getUnsavedDraft();
    if (draft && draft.locationId === locationId) {
      clearUnsavedDraft();
    }
  } catch {
    // ignore
  }

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_DELETED', locationId });
}

/**
 * Physically deletes a single Performa record directly from Supabase Master Database and local mirror.
 */
export async function deletePerformaFromStorage(locationId: string, performaId: string, updatedWorkbook: LocationWorkbook): Promise<void> {
  const optimized = optimizeWorkbookForStorage(updatedWorkbook);

  // 1. Delete from Supabase Master Database
  try {
    await deletePerformaSupabase(locationId, performaId);
    await upsertWorkbookSupabase(optimized);
  } catch (err) {
    console.warn('Supabase delete performa error:', err);
  }

  // 2. Update local mirror
  try {
    const localRaw = localStorage.getItem('performa_workbooks_v2');
    const currentList: LocationWorkbook[] = localRaw ? JSON.parse(localRaw) : [];
    const idx = currentList.findIndex(w => w.locationId === optimized.locationId);
    if (idx >= 0) {
      currentList[idx] = optimized;
    }
    await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, currentList, 'performa_workbooks_v2');
  } catch {
    // ignore
  }

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_UPDATED', locationId: optimized.locationId });
}

// -------------------------------------------------------------
// Draft protection helpers (Single lightweight slot, auto-cleared on save/delete)
// -------------------------------------------------------------
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
  } catch {
    // ignore
  }
}

export function getUnsavedDraft(): UnsavedDraftState | null {
  try {
    const str = localStorage.getItem('performa_active_draft');
    if (!str) return null;
    return JSON.parse(str) as UnsavedDraftState;
  } catch {
    return null;
  }
}

export function clearUnsavedDraft(): void {
  try {
    localStorage.removeItem('performa_active_draft');
  } catch {
    // ignore
  }
}

export async function triggerDatabaseOptimization(): Promise<{ beforeBytes: number; afterBytes: number } | null> {
  try {
    const workbooks = await loadWorkbooksFromStorage();
    let beforeBytes = 0;
    let afterBytes = 0;
    for (const wb of workbooks) {
      beforeBytes += JSON.stringify(wb).length;
      const opt = optimizeWorkbookForStorage(wb);
      afterBytes += JSON.stringify(opt).length;
      await saveWorkbookToStorage(opt);
    }
    return { beforeBytes, afterBytes };
  } catch {
    return null;
  }
}

