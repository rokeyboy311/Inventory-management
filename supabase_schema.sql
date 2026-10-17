-- =====================================================================
-- DGVCL INVENTORY MANAGEMENT - SUPABASE SQL SCHEMA
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Designed for 100% open permissions (Zero permission blockages)
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

-- =====================================================================
-- PERMISSION FREEDOM (Bypass all RLS blocks so changes work seamlessly)
-- =====================================================================

-- Disable Row Level Security on all tables so all reads, inserts, updates, and deletes succeed without permission errors
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performas DISABLE ROW LEVEL SECURITY;

-- In case RLS is re-enabled, grant open public policies
DROP POLICY IF EXISTS "Allow all on teams" ON public.teams;
CREATE POLICY "Allow all on teams" ON public.teams FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on workbooks" ON public.workbooks;
CREATE POLICY "Allow all on workbooks" ON public.workbooks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on performas" ON public.performas;
CREATE POLICY "Allow all on performas" ON public.performas FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant privileges to anon and authenticated roles
GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.workbooks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.performas TO anon, authenticated, service_role;

-- =====================================================================
-- REALTIME LIVE BROADCAST (Enables instant sync across all users)
-- =====================================================================
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

-- =====================================================================
-- INITIAL SEED DATA (Dolvan Maintenance Team + Initial Location Workbook)
-- =====================================================================

INSERT INTO public.teams (id, name, code, division, subdivision, in_charge_engineer, members, status)
VALUES (
    'team-dolvan-maintenance',
    'Dolvan Maintenance Team',
    'DLV-01',
    'VYARA',
    'DOLVAN',
    '{"name": "Er. R. K. Patel", "designation": "Deputy Executive Engineer", "contactNumber": "+91 98250 12345", "email": "rkpatel@dgvcl.co.in"}'::jsonb,
    '["Kishan Kumar", "Ramesh Bhai", "Pravin Solanki"]'::jsonb,
    'active'
)
ON CONFLICT (id) DO NOTHING;
