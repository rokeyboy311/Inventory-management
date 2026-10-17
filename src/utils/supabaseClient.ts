import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Team } from '../types/team';
import { LocationWorkbook } from '../types/performa';

const STORAGE_KEY = 'supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  key: string;
  connectedAt?: string;
}

// -------------------------------------------------------------
// Config Retrieval & Storage
// -------------------------------------------------------------
export const DEFAULT_SUPABASE_PROJECT_URL = 'https://qpxyucolxkzvyjjceywa.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_krImNaaO9rPkB2VS2KrulA_J6gXfZ1g';

export function getSupabaseConfig(): SupabaseConfig | null {
  // 1. Check localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SupabaseConfig;
        if (parsed.url && parsed.key) return parsed;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check import.meta.env
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_PROJECT_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                 (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                 (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || 
                 (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
                 DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  return null;
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window === 'undefined') return;
  const config: SupabaseConfig = {
    url: url.trim(),
    key: key.trim(),
    connectedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cachedClient = null; // reset cached instance
}

export function clearSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
}

// -------------------------------------------------------------
// Supabase Client Instance
// -------------------------------------------------------------
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (!config || !config.url || !config.key) return null;

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Connection Test
// -------------------------------------------------------------
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testUrl = url || getSupabaseConfig()?.url;
    const testKey = key || getSupabaseConfig()?.key;

    if (!testUrl || !testKey) {
      return { success: false, message: 'Supabase URL or Key is missing.' };
    }

    const client = createClient(testUrl, testKey);
    // Simple ping to teams or query database
    const { data, error } = await client.from('teams').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, but credentials are valid, notice will show
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { 
          success: true, 
          message: 'Connected to Supabase! (Now run supabase_schema.sql in Supabase SQL Editor)' 
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase Database!' };
  } catch (e: any) {
    return { success: false, message: `Connection failed: ${e.message || String(e)}` };
  }
}

// -------------------------------------------------------------
// Database CRUD Operations (Open Permissions)
// -------------------------------------------------------------

export async function fetchTeamsFromSupabase(): Promise<Team[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('teams').select('*').order('created_at', { ascending: true });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      division: row.division,
      subdivision: row.subdivision,
      inChargeEngineer: row.in_charge_engineer || { name: '', designation: '', contactNumber: '' },
      members: Array.isArray(row.members) ? row.members : [],
      locationExcelIds: Array.isArray(row.location_excel_ids) ? row.location_excel_ids : [],
      status: row.status || 'active',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.warn('Supabase fetchTeams error:', err);
    return null;
  }
}

export async function upsertTeamSupabase(team: Team): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: team.id,
      name: team.name,
      code: team.code,
      division: team.division,
      subdivision: team.subdivision,
      in_charge_engineer: team.inChargeEngineer,
      members: team.members,
      location_excel_ids: team.locationExcelIds,
      status: team.status,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('teams').upsert(row);
    if (error) {
      console.warn('Supabase upsert team error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteTeamSupabase(teamId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('teams').delete().eq('id', teamId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchWorkbooksFromSupabase(): Promise<LocationWorkbook[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('workbooks').select('*');
    if (error || !data) return null;

    return data.map((row: any) => ({
      locationId: row.location_id,
      teamId: row.team_id,
      locationName: row.location_name,
      workbookName: row.workbook_name,
      activeSheetName: row.active_sheet_name || 'inventory',
      sheets: row.sheets || {},
      lastModified: row.last_modified
    }));
  } catch (err) {
    console.warn('Supabase fetchWorkbooks error:', err);
    return null;
  }
}

export async function upsertWorkbookSupabase(wb: LocationWorkbook): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      location_id: wb.locationId,
      team_id: wb.teamId,
      location_name: wb.locationName,
      workbook_name: wb.workbookName,
      active_sheet_name: wb.activeSheetName || 'inventory',
      sheets: wb.sheets,
      last_modified: new Date().toISOString()
    };

    const { error } = await client.from('workbooks').upsert(row);
    if (error) {
      console.warn('Supabase upsert workbook error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteWorkbookSupabase(locationId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('workbooks').delete().eq('location_id', locationId);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Realtime Live Cross-User Sync Subscription
// -------------------------------------------------------------
export function subscribeToDatabaseChanges(onChange: () => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('dgvcl_live_cross_user_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('[Supabase Realtime] Team update event:', payload.eventType);
          onChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workbooks' },
        (payload) => {
          console.log('[Supabase Realtime] Workbook update event:', payload.eventType);
          onChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription registration warning:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  const config = getSupabaseConfig();
  return !!(config && config.url && config.key);
}

