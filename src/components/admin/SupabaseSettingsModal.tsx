import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Key, 
  Server,
  RefreshCw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection,
  DEFAULT_SUPABASE_PROJECT_URL 
} from '../../utils/supabaseClient';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

export function SupabaseSettingsModal({ isOpen, onClose, onConnectionChanged }: SupabaseSettingsModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      if (config) {
        setUrl(config.url || DEFAULT_SUPABASE_PROJECT_URL);
        setKey(config.key);
        setStatus('idle');
        setStatusMessage('Currently configured. Click "Test Connection" to verify.');
      } else {
        setUrl(DEFAULT_SUPABASE_PROJECT_URL);
        setKey('');
        setStatus('idle');
        setStatusMessage('Enter your Supabase project API Key below to sync all users live.');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatus('error');
      setStatusMessage('Please enter both Supabase URL and API Key.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Connecting to Supabase...');

    const res = await testSupabaseConnection(url.trim(), key.trim());
    if (res.success) {
      saveSupabaseConfig(url.trim(), key.trim());
      setStatus('success');
      setStatusMessage(res.message);
      if (onConnectionChanged) onConnectionChanged();
    } else {
      setStatus('error');
      setStatusMessage(res.message);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setStatus('idle');
    setStatusMessage('Disconnected. App will use local offline IndexedDB.');
    if (onConnectionChanged) onConnectionChanged();
  };

  const copySqlSchema = () => {
    const sql = `-- =====================================================================
-- DGVCL INVENTORY MANAGEMENT - SUPABASE SQL SCHEMA
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =====================================================================

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

-- Open Permissions (Disable RLS so changes work without permission blocks)
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performas DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.workbooks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.performas TO anon, authenticated, service_role;

-- Realtime Live Broadcast
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
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 via-slate-800 to-teal-600/30 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Supabase SQL Database Login
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Open Permissions
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect your Supabase project to sync teams and Location Excels in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleTestAndSave} className="p-6 space-y-4 overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            status === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : status === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            {status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Server className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage || 'Supabase Connection Status'}</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                RLS is bypassed or disabled so you can read, insert, and update without permission denial.
              </p>
            </div>
          </div>

          {/* Supabase URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Supabase Project URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://your-project-ref.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Supabase Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Supabase API Key (Anon or Service Role) <span className="text-red-400">*</span>
              </label>
              <a 
                href="https://supabase.com/dashboard/project/qpxyucolxkzvyjjceywa/settings/api" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 font-medium"
              >
                <span>Get key from Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Copy SQL Schema Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Supabase SQL Setup Script
              </span>
              <button
                type="button"
                onClick={copySqlSchema}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Run this SQL script in your Supabase Dashboard (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">SQL Editor <ExternalLink className="w-2.5 h-2.5" /></a>). It creates the tables and sets 100% open permissions.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {getSupabaseConfig() ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold transition-all border border-red-500/20"
              >
                Disconnect Supabase
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={status === 'testing'}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {status === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
