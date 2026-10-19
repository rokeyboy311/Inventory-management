import { LocationWorkbook, PerformaRecord } from '../types/performa';
import { Team } from '../types/team';
import { createDolvanSamplePerforma, createDefaultBillSheet } from './dolvanTemplate';
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

// IndexedDB Helper (Lightweight local mirror only, kept strictly pruned to match Central DB)
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
 * Replaces the entire IndexedDB store with the exact authoritative list from the Central Database,
 * guaranteeing that any deleted records are physically wiped from local browser storage as well.
 */
async function syncLocalStoreAuthoritatively<T>(storeName: string, items: T[], localStorageKey: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(items));
  } catch {
    // If localStorage is near quota, remove old bloated keys first
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
// Central Server API Helpers (Shared across all users)
// -------------------------------------------------------------
async function fetchTeamsFromServer(): Promise<Team[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/db/teams', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      return json.data as Team[];
    }
  } catch {
    // fallback if offline
  }
  return null;
}

async function saveTeamToServer(team: Team): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/db/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteTeamFromServer(teamId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`/api/db/teams/${encodeURIComponent(teamId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchWorkbooksFromServer(): Promise<LocationWorkbook[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/db/workbooks', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      return json.data as LocationWorkbook[];
    }
  } catch {
    // fallback if offline
  }
  return null;
}

async function saveWorkbookToServer(wb: LocationWorkbook): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/db/workbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wb)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteWorkbookFromServer(locationId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`/api/db/workbooks/${encodeURIComponent(locationId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deletePerformaFromServer(locationId: string, performaId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(
      `/api/db/workbooks/${encodeURIComponent(locationId)}/performas/${encodeURIComponent(performaId)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function triggerDatabaseOptimization(): Promise<{ beforeBytes: number; afterBytes: number } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/db/optimize', { method: 'POST' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success) {
      return { beforeBytes: json.beforeBytes, afterBytes: json.afterBytes };
    }
  } catch {
    // ignore
  }
  return null;
}

// -------------------------------------------------------------
// Team Storage Management (Save, Edit, Delete, View from Database)
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
  // 1. Try Supabase Cloud if tables are ready
  try {
    const remoteTeams = await fetchTeamsFromSupabase();
    if (remoteTeams && remoteTeams.length > 0) {
      // Keep Central Server DB in sync with Supabase
      for (const t of remoteTeams) {
        saveTeamToServer(t).catch(() => {});
      }
      await syncLocalStoreAuthoritatively(STORE_TEAMS, remoteTeams, 'dgvcl_teams_v1');
      return remoteTeams;
    }
  } catch {
    // continue to Central Server DB
  }

  // 2. Load from Central Server DB (/api/db/teams) so ALL users see the exact same teams
  const serverTeams = await fetchTeamsFromServer();
  if (serverTeams && serverTeams.length > 0) {
    await syncLocalStoreAuthoritatively(STORE_TEAMS, serverTeams, 'dgvcl_teams_v1');
    return serverTeams;
  }

  // 3. Offline fallback: IndexedDB / localStorage
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

  // 1. Save to Central Server Database immediately so all users view it
  await saveTeamToServer(updatedTeam);

  // 2. Save to Supabase Cloud if active
  try {
    await upsertTeamSupabase(updatedTeam);
  } catch {
    // ignore
  }

  // 3. Update local mirror cleanly without duplicating
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
  // 1. Delete from Central Server Database (and optimize storage)
  await deleteTeamFromServer(teamId);

  // 2. Delete from Supabase Cloud
  try {
    await deleteTeamSupabase(teamId);
  } catch {
    // ignore
  }

  // 3. Physically delete from local mirror
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
// Location Workbook Storage (Automatic 2 Sheets: inventory + bill)
// -------------------------------------------------------------

export function createNewLocationWorkbookWithDualSheets(locationName: string, teamId: string = 'team-dolvan-maintenance'): LocationWorkbook {
  const cleanLoc = locationName.trim();
  const id = cleanLoc.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'loc';
  const samplePerforma = createDolvanSamplePerforma(cleanLoc);
  const defaultBill = createDefaultBillSheet(cleanLoc);

  return optimizeWorkbookForStorage({
    locationId: id,
    teamId,
    locationName: cleanLoc,
    workbookName: `${cleanLoc}.xlsx`,
    activeSheetName: 'inventory',
    sheets: {
      'inventory': {
        name: 'inventory',
        type: 'inventory',
        performas: [samplePerforma],
        isCompatible: true,
        rawRowsCount: 1
      },
      'bill': {
        name: 'bill',
        type: 'bill',
        performas: [],
        isCompatible: true,
        rawRowsCount: defaultBill.items.length,
        billData: defaultBill
      }
    },
    lastModified: new Date().toISOString()
  });
}

export function createInitialWorkbook(locationName: string = 'Dolvan', teamId: string = 'team-dolvan-maintenance'): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, teamId);
}

export function createNewLocationWorkbook(locationName: string): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, 'team-dolvan-maintenance');
}

/**
 * Loads all workbooks from the shared database (Supabase + Central Server DB) so ALL users see the exact same data.
 */
export async function loadWorkbooksFromStorage(): Promise<LocationWorkbook[]> {
  // 1. First attempt to load from Supabase if tables are ready
  try {
    const remoteWorkbooks = await fetchWorkbooksFromSupabase();
    if (remoteWorkbooks && remoteWorkbooks.length > 0) {
      const optimizedList = remoteWorkbooks.map(w => optimizeWorkbookForStorage(w));
      // Sync to Central Server DB as well
      for (const wb of optimizedList) {
        saveWorkbookToServer(wb).catch(() => {});
      }
      await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, optimizedList, 'performa_workbooks_v2');
      return optimizedList;
    }
  } catch {
    // continue to Central Server DB
  }

  // 2. Load from Central Server DB (/api/db/workbooks) - shared across all users!
  const serverWorkbooks = await fetchWorkbooksFromServer();
  if (serverWorkbooks) {
    if (serverWorkbooks.length > 0) {
      const optimizedList = serverWorkbooks.map(w => optimizeWorkbookForStorage(w));
      await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, optimizedList, 'performa_workbooks_v2');
      return optimizedList;
    } else {
      // Seed initial Dolvan workbook into Central Server DB if empty
      const initial = [createInitialWorkbook('Dolvan')];
      await saveWorkbookToServer(initial[0]);
      await syncLocalStoreAuthoritatively(STORE_WORKBOOKS, initial, 'performa_workbooks_v2');
      return initial;
    }
  }

  // 3. Offline fallback: IndexedDB / localStorage
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
          const local = localStorage.getItem('performa_workbooks_v2');
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
          const initial = [createInitialWorkbook('Dolvan')];
          saveWorkbookToStorage(initial[0]);
          resolve(initial);
        }
      };
      req.onerror = () => {
        resolve([createInitialWorkbook('Dolvan')]);
      };
    });
  } catch {
    return [createInitialWorkbook('Dolvan')];
  }
}

/**
 * Compacts and saves a single workbook to Central Server DB, Supabase Cloud, and local mirror.
 */
export async function saveWorkbookToStorage(workbook: LocationWorkbook): Promise<void> {
  const optimized = optimizeWorkbookForStorage(workbook);

  // 1. Save to Central Server Database (shared across all users & devices)
  await saveWorkbookToServer(optimized);

  // 2. Save to Supabase Cloud (if tables are provisioned)
  try {
    await upsertWorkbookSupabase(optimized);
  } catch {
    // ignore
  }

  // 3. Update local mirror cleanly without duplicating
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
  } catch {
    // ignore
  }

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_UPDATED', locationId: optimized.locationId });
}

/**
 * Physically deletes a Location Workbook from Central Server DB, Supabase Cloud, and local storage,
 * reclaiming storage space immediately.
 */
export async function deleteWorkbookFromStorage(locationId: string): Promise<void> {
  // 1. Delete from Central Server Database (compacts DB on disk)
  await deleteWorkbookFromServer(locationId);

  // 2. Delete from Supabase Cloud (cascades child performas)
  try {
    await deleteWorkbookSupabase(locationId);
  } catch {
    // ignore
  }

  // 3. Physically delete from local mirror and clear any lingering drafts for this location
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
 * Physically deletes a single Performa record from a Location Workbook across Central Server DB,
 * Supabase (`workbooks` + `performas` table), and local storage to free up space.
 */
export async function deletePerformaFromStorage(locationId: string, performaId: string, updatedWorkbook: LocationWorkbook): Promise<void> {
  const optimized = optimizeWorkbookForStorage(updatedWorkbook);

  // 1. Delete from Central Server DB & save compacted workbook
  await deletePerformaFromServer(locationId, performaId);
  await saveWorkbookToServer(optimized);

  // 2. Delete from Supabase `performas` table & update `workbooks` row
  try {
    await deletePerformaSupabase(locationId, performaId);
    await upsertWorkbookSupabase(optimized);
  } catch {
    // ignore
  }

  // 3. Update local mirror cleanly
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
