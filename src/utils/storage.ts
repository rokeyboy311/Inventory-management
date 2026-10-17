import { LocationWorkbook, PerformaRecord, createBlankPerforma } from '../types/performa';
import { Team } from '../types/team';
import { createDolvanSamplePerforma, createDefaultBillSheet } from './dolvanTemplate';
import { 
  fetchTeamsFromSupabase, 
  upsertTeamSupabase, 
  deleteTeamSupabase, 
  fetchWorkbooksFromSupabase, 
  upsertWorkbookSupabase, 
  deleteWorkbookSupabase 
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

// IndexedDB Helper
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

// -------------------------------------------------------------
// Team Storage Management
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
  // First attempt to load from Supabase if connected
  try {
    const remoteTeams = await fetchTeamsFromSupabase();
    if (remoteTeams && remoteTeams.length > 0) {
      localStorage.setItem('dgvcl_teams_v1', JSON.stringify(remoteTeams));
      return remoteTeams;
    } else if (remoteTeams && remoteTeams.length === 0) {
      // Remote connected but table is empty. Seed remote teams into Supabase!
      const defaults = createDefaultTeams();
      for (const t of defaults) {
        await upsertTeamSupabase(t);
      }
      localStorage.setItem('dgvcl_teams_v1', JSON.stringify(defaults));
      return defaults;
    }
  } catch {
    // fallback to local
  }

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
            } catch (e) {
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
  } catch (err) {
    const local = localStorage.getItem('dgvcl_teams_v1');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return createDefaultTeams();
  }
}

export async function saveTeamToStorage(team: Team): Promise<void> {
  // Save locally
  try {
    const all = await loadTeamsFromStorage();
    const idx = all.findIndex(t => t.id === team.id);
    if (idx >= 0) {
      all[idx] = team;
    } else {
      all.push(team);
    }
    localStorage.setItem('dgvcl_teams_v1', JSON.stringify(all));
  } catch (e) {
    // ignore
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TEAMS, 'readwrite');
      const store = tx.objectStore(STORE_TEAMS);
      const req = store.put(team);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // handled in localStorage fallback
  }

  // Guaranteed sync to Supabase Cloud
  try {
    await upsertTeamSupabase(team);
  } catch (err) {
    console.warn('Supabase team sync error:', err);
  }

  syncBroadcastChannel?.postMessage({ type: 'TEAM_UPDATED', teamId: team.id });
}

export async function deleteTeamFromStorage(teamId: string): Promise<void> {
  try {
    const all = await loadTeamsFromStorage();
    const filtered = all.filter(t => t.id !== teamId);
    localStorage.setItem('dgvcl_teams_v1', JSON.stringify(filtered));
  } catch (e) {
    // ignore
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TEAMS, 'readwrite');
      const store = tx.objectStore(STORE_TEAMS);
      const req = store.delete(teamId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // fallback
  }

  // Delete from Supabase in background
  deleteTeamSupabase(teamId).catch(() => {});

  syncBroadcastChannel?.postMessage({ type: 'TEAM_DELETED', teamId });
}

// -------------------------------------------------------------
// Location Workbook Storage (Automatic 2 Sheets: inventory + bill)
// -------------------------------------------------------------

/**
 * Creates brand new Location Workbook with 2 sheets:
 * 1. 'inventory': exact DOLVAN INVENTERY layout with pre-populated sample row!
 * 2. 'bill': billing calculation sheet
 */
export function createNewLocationWorkbookWithDualSheets(locationName: string, teamId: string = 'team-dolvan-maintenance'): LocationWorkbook {
  const cleanLoc = locationName.trim();
  const id = cleanLoc.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'loc';
  const samplePerforma = createDolvanSamplePerforma(cleanLoc);
  const defaultBill = createDefaultBillSheet(cleanLoc);

  return {
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
  };
}

// Initial seed workbook for initial launch
export function createInitialWorkbook(locationName: string = 'Dolvan', teamId: string = 'team-dolvan-maintenance'): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, teamId);
}

// Legacy alias for compatibility
export function createNewLocationWorkbook(locationName: string): LocationWorkbook {
  return createNewLocationWorkbookWithDualSheets(locationName, 'team-dolvan-maintenance');
}

/**
 * Loads all workbooks from IndexedDB (with localStorage fallback).
 */
export async function loadWorkbooksFromStorage(): Promise<LocationWorkbook[]> {
  // First attempt to load from Supabase if connected
  try {
    const remoteWorkbooks = await fetchWorkbooksFromSupabase();
    if (remoteWorkbooks && remoteWorkbooks.length > 0) {
      localStorage.setItem('performa_workbooks_v2', JSON.stringify(remoteWorkbooks));
      return remoteWorkbooks;
    } else if (remoteWorkbooks && remoteWorkbooks.length === 0) {
      // Remote connected but table is empty. Seed initial Dolvan workbook into Supabase!
      const initial = [createInitialWorkbook('Dolvan')];
      await upsertWorkbookSupabase(initial[0]);
      localStorage.setItem('performa_workbooks_v2', JSON.stringify(initial));
      return initial;
    }
  } catch {
    // fallback
  }

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
              if (Array.isArray(parsed) && parsed.length > 0) {
                resolve(parsed);
                return;
              }
            } catch (e) {
              // ignore
            }
          }
          // Seed with initial Dolvan workbook
          const initial = [createInitialWorkbook('Dolvan')];
          saveWorkbookToStorage(initial[0]);
          resolve(initial);
        }
      };
      req.onerror = () => {
        resolve([createInitialWorkbook('Dolvan')]);
      };
    });
  } catch (err) {
    const local = localStorage.getItem('performa_workbooks_v2');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [createInitialWorkbook('Dolvan')];
  }
}

/**
 * Saves a single workbook into IndexedDB and keeps localStorage in sync.
 */
export async function saveWorkbookToStorage(workbook: LocationWorkbook): Promise<void> {
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
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_WORKBOOKS, 'readwrite');
      const store = tx.objectStore(STORE_WORKBOOKS);
      const req = store.put(workbook);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // fallback
  }

  // Guaranteed sync to Supabase Cloud
  try {
    await upsertWorkbookSupabase(workbook);
  } catch (err) {
    console.warn('Supabase workbook sync error:', err);
  }

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_UPDATED', locationId: workbook.locationId });
}

export async function deleteWorkbookFromStorage(locationId: string): Promise<void> {
  try {
    const allWorkbooks = await loadWorkbooksFromStorage();
    const filtered = allWorkbooks.filter(w => w.locationId !== locationId);
    localStorage.setItem('performa_workbooks_v2', JSON.stringify(filtered));
  } catch (e) {
    // ignore
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_WORKBOOKS, 'readwrite');
      const store = tx.objectStore(STORE_WORKBOOKS);
      const req = store.delete(locationId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // fallback
  }

  // Delete from Supabase in background
  deleteWorkbookSupabase(locationId).catch(() => {});

  syncBroadcastChannel?.postMessage({ type: 'WORKBOOK_DELETED', locationId });
}

// -------------------------------------------------------------
// Draft protection helpers
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
