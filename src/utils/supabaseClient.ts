import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Team } from '../types/team';
import { LocationWorkbook, PerformaRecord, createBlankPerforma } from '../types/performa';

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
  cachedClient = null;
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
let supabaseSchemaReady: boolean | null = null;

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
// Storage Optimization Helpers (Compact Data Representation)
// -------------------------------------------------------------

/**
 * Compacts a PerformaRecord so default false/zero/empty values don't bloat database storage.
 * Strips empty strings and unmodified default rows while preserving 100% fidelity on restore.
 */
export function compactPerformaRecord(record: PerformaRecord): PerformaRecord {
  const cleanItems = (record.items || []).map(it => ({
    id: it.id,
    srNo: it.srNo,
    ...(it.subIndex !== undefined ? { subIndex: it.subIndex } : {}),
    ...(it.srLabel ? { srLabel: it.srLabel } : {}),
    description: it.description,
    unit: it.unit,
    materialYes: !!it.materialYes,
    labourYes: !!it.labourYes,
    qty: it.qty === undefined || it.qty === null ? '' : it.qty,
    ...(it.sizeFields ? { sizeFields: it.sizeFields } : {}),
    ...(it.sizeQtys ? { sizeQtys: it.sizeQtys } : {})
  }));

  const m = record.measurements || {
    voltageRN: '0', voltageYN: '0', voltageBN: '0',
    ampereR: '0', ampereY: '0', ampereB: '0', ampereN: '0'
  };

  return {
    id: record.id.trim(),
    date: (record.date || '').trim(),
    location: (record.location || '').trim(),
    transformerRefNo: (record.transformerRefNo || '').trim(),
    transformerMake: (record.transformerMake || '').trim(),
    transformerSerialNo: (record.transformerSerialNo || '').trim(),
    capacity: (record.capacity || '').trim(),
    items: cleanItems,
    measurements: {
      voltageRN: String(m.voltageRN || '0').trim(),
      voltageYN: String(m.voltageYN || '0').trim(),
      voltageBN: String(m.voltageBN || '0').trim(),
      ...(m.voltageRY && m.voltageRY !== '0' ? { voltageRY: String(m.voltageRY).trim() } : {}),
      ...(m.voltageYB && m.voltageYB !== '0' ? { voltageYB: String(m.voltageYB).trim() } : {}),
      ...(m.voltageBR && m.voltageBR !== '0' ? { voltageBR: String(m.voltageBR).trim() } : {}),
      ampereR: String(m.ampereR || '0').trim(),
      ampereY: String(m.ampereY || '0').trim(),
      ampereB: String(m.ampereB || '0').trim(),
      ampereN: String(m.ampereN || '0').trim()
    },
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
    status: 'saved'
  };
}

/**
 * Compacts a LocationWorkbook before saving to DB:
 * - Deduplicates performas by ID
 * - Removes unsaved temporary drafts from persistent DB
 * - Compacts each performa and bill item
 */
export function optimizeWorkbookForStorage(wb: LocationWorkbook): LocationWorkbook {
  const optimizedSheets: Record<string, any> = {};

  for (const [sheetKey, sheet] of Object.entries(wb.sheets || {})) {
    if (!sheet) continue;
    const seenIds = new Set<string>();
    const compactedPerformas: PerformaRecord[] = [];

    for (const p of sheet.performas || []) {
      if (!p || !p.id) continue;
      const normId = p.id.trim().toLowerCase();
      if (!normId || seenIds.has(normId)) continue;
      seenIds.add(normId);
      compactedPerformas.push(compactPerformaRecord(p));
    }

    optimizedSheets[sheetKey] = {
      ...sheet,
      performas: compactedPerformas,
      rawRowsCount: sheet.type === 'bill'
        ? (sheet.billData?.items?.length || 0)
        : compactedPerformas.length
    };
  }

  return {
    ...wb,
    locationId: wb.locationId.trim(),
    locationName: wb.locationName.trim(),
    workbookName: wb.workbookName.trim(),
    activeSheetName: wb.activeSheetName || 'inventory',
    sheets: optimizedSheets,
    lastModified: new Date().toISOString()
  };
}

// -------------------------------------------------------------
// Connection Test & Schema Health
// -------------------------------------------------------------
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; schemaReady?: boolean }> {
  try {
    const testUrl = url || getSupabaseConfig()?.url;
    const testKey = key || getSupabaseConfig()?.key;

    if (!testUrl || !testKey) {
      return { success: false, message: 'Supabase URL or Key is missing.' };
    }

    const client = createClient(testUrl, testKey);
    const { error } = await client.from('teams').select('id').limit(1);

    if (error) {
      const isMissingTable = 
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.code === 'PGRST204' ||
        (error.message && (
          error.message.toLowerCase().includes('schema cache') || 
          error.message.toLowerCase().includes('does not exist') ||
          error.message.toLowerCase().includes('could not find the table')
        ));

      if (isMissingTable) {
        supabaseSchemaReady = false;
        return { 
          success: false, 
          schemaReady: false,
          message: 'Connected to Supabase project, but database tables (teams, workbooks, performas) are missing in the schema. Please run supabase_schema.sql in your Supabase SQL Editor.' 
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    supabaseSchemaReady = true;
    return { success: true, schemaReady: true, message: 'Successfully connected to Supabase Master Database! Live real-time sync active across all devices.' };
  } catch (e: any) {
    return { success: false, message: `Connection failed: ${e.message || String(e)}` };
  }
}

export async function checkSupabaseHealth(): Promise<{ isConnected: boolean; schemaReady: boolean; message: string }> {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.key) {
    return { isConnected: false, schemaReady: false, message: 'Supabase credentials not configured' };
  }
  const client = getSupabaseClient();
  if (!client) {
    return { isConnected: false, schemaReady: false, message: 'Could not initialize Supabase client' };
  }
  try {
    const { error } = await client.from('teams').select('id').limit(1);
    if (error) {
      const isMissingTable = 
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.code === 'PGRST204' ||
        (error.message && (
          error.message.toLowerCase().includes('schema cache') || 
          error.message.toLowerCase().includes('does not exist') ||
          error.message.toLowerCase().includes('could not find the table')
        ));

      if (isMissingTable) {
        supabaseSchemaReady = false;
        return {
          isConnected: true,
          schemaReady: false,
          message: 'Tables (teams, workbooks, performas) are not created yet in Supabase.'
        };
      }
      return { isConnected: false, schemaReady: false, message: error.message };
    }
    supabaseSchemaReady = true;
    return { isConnected: true, schemaReady: true, message: 'Supabase Master Database Connected & Active' };
  } catch (err: any) {
    return { isConnected: false, schemaReady: false, message: err?.message || 'Connection error' };
  }
}

// -------------------------------------------------------------
// Database CRUD Operations (Dual Central Server DB + Supabase)
// -------------------------------------------------------------

export async function fetchTeamsFromSupabase(): Promise<Team[] | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('teams').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        supabaseSchemaReady = true;
        return data.map((row: any) => ({
          id: row.id,
          name: row.name,
          code: row.code || '',
          division: row.division || '',
          subdivision: row.subdivision || '',
          inChargeEngineer: row.in_charge_engineer || undefined,
          members: Array.isArray(row.members) ? row.members : [],
          locationExcelIds: Array.isArray(row.location_excel_ids) ? row.location_excel_ids : [],
          status: row.status || 'active',
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } else if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        supabaseSchemaReady = false;
      }
    } catch (err) {
      console.warn('Supabase fetchTeams error:', err);
    }
  }
  return null;
}

export async function upsertTeamSupabase(team: Team): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: team.id,
      name: team.name,
      code: team.code || '',
      division: team.division || '',
      subdivision: team.subdivision || '',
      in_charge_engineer: team.inChargeEngineer || {},
      members: team.members || [],
      location_excel_ids: team.locationExcelIds || [],
      status: team.status || 'active',
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('teams').upsert(row);
    if (error) {
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
    if (error || !data) {
      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        supabaseSchemaReady = false;
      }
      return null;
    }
    supabaseSchemaReady = true;

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
    const optimized = optimizeWorkbookForStorage(wb);
    const row = {
      location_id: optimized.locationId,
      team_id: optimized.teamId,
      location_name: optimized.locationName,
      workbook_name: optimized.workbookName,
      active_sheet_name: optimized.activeSheetName || 'inventory',
      sheets: optimized.sheets,
      last_modified: optimized.lastModified
    };

    const { error } = await client.from('workbooks').upsert(row);
    if (error) {
      return false;
    }

    // Also sync individual relational performas to `performas` table and prune deleted ones
    const invSheet = optimized.sheets['inventory'] || optimized.sheets['Performas'];
    const currentPerformas: PerformaRecord[] = invSheet?.performas || [];
    const currentIds = currentPerformas.map(p => `${optimized.locationId}__${p.id}`);

    // Upsert active performas
    if (currentPerformas.length > 0) {
      const performaRows = currentPerformas.map(p => ({
        id: `${optimized.locationId}__${p.id}`,
        location_id: optimized.locationId,
        date: p.date || '',
        location: p.location || optimized.locationName,
        transformer_ref_no: p.transformerRefNo || '',
        transformer_make: p.transformerMake || '',
        transformer_serial_no: p.transformerSerialNo || '',
        capacity: p.capacity || '',
        items: p.items || [],
        measurements: p.measurements || {},
        status: 'saved',
        updated_at: new Date().toISOString()
      }));
      await client.from('performas').upsert(performaRows);
    }

    // Delete any orphaned performas for this location_id so storage stays optimized
    const { data: existingRows } = await client
      .from('performas')
      .select('id')
      .eq('location_id', optimized.locationId);

    if (existingRows && existingRows.length > 0) {
      const toDelete = existingRows
        .map((r: any) => r.id)
        .filter((id: string) => !currentIds.includes(id));
      if (toDelete.length > 0) {
        await client.from('performas').delete().in('id', toDelete);
      }
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
    // Delete all child performas first to reclaim storage
    await client.from('performas').delete().eq('location_id', locationId);
    const { error } = await client.from('workbooks').delete().eq('location_id', locationId);
    return !error;
  } catch {
    return false;
  }
}

export async function deletePerformaSupabase(locationId: string, performaId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const compositeId = `${locationId}__${performaId}`;
    await client.from('performas').delete().in('id', [compositeId, performaId]);
    return true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Realtime Live Cross-User Sync Subscription (Supabase PostgreSQL Changes)
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
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workbooks' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performas' },
        () => onChange()
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
  if (!config || !config.url || !config.key) return false;
  if (supabaseSchemaReady === false) return false;
  return true;
}

export function isSupabaseSchemaReady(): boolean | null {
  return supabaseSchemaReady;
}

export function getSupabaseSyncStatus(): {
  status: 'synced' | 'tables_missing' | 'offline';
  label: string;
} {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.key) {
    return { status: 'offline', label: 'Offline / Local' };
  }
  if (supabaseSchemaReady === false) {
    return { status: 'tables_missing', label: 'DB Tables Missing' };
  }
  if (supabaseSchemaReady === true) {
    return { status: 'synced', label: 'Cloud Synced' };
  }
  return { status: 'offline', label: 'Checking Sync...' };
}

export const SUPABASE_SCHEMA_SQL = `-- =====================================================================
-- DGVCL INVENTORY MANAGEMENT - SUPABASE SQL SCHEMA
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qpxyucolxkzvyjjceywa/sql
-- =====================================================================

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    division TEXT NOT NULL DEFAULT '',
    subdivision TEXT NOT NULL DEFAULT '',
    in_charge_engineer JSONB NOT NULL DEFAULT '{}'::jsonb,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    location_excel_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Location Workbooks Table (Stores Dual Sheets: inventory + bill)
CREATE TABLE IF NOT EXISTS public.workbooks (
    location_id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    workbook_name TEXT NOT NULL,
    active_sheet_name TEXT NOT NULL DEFAULT 'inventory',
    sheets JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_modified TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Performas Table (Relational records for fast queries & analytics)
CREATE TABLE IF NOT EXISTS public.performas (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    transformer_ref_no TEXT,
    transformer_make TEXT,
    transformer_serial_no TEXT,
    capacity TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'saved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Open Permissions (Bypass RLS so all clients can read and write without auth errors)
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performas DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on teams" ON public.teams;
CREATE POLICY "Allow all on teams" ON public.teams FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on workbooks" ON public.workbooks;
CREATE POLICY "Allow all on workbooks" ON public.workbooks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on performas" ON public.performas;
CREATE POLICY "Allow all on performas" ON public.performas FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.workbooks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.performas TO anon, authenticated, service_role;

-- 5. Realtime Live Broadcast (Instant sync across Desktop & Mobile)
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.workbooks REPLICA IDENTITY FULL;
ALTER TABLE public.performas REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workbooks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workbooks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'performas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.performas;
  END IF;
END $$;
`;
