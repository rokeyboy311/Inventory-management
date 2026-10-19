import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Database,
  CloudLightning,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { 
  checkSupabaseHealth, 
  SUPABASE_SCHEMA_SQL,
  getSupabaseConfig 
} from '../utils/supabaseClient';

interface SupabaseSyncBannerProps {
  onSyncReady?: () => void;
  onOpenSettingsModal?: () => void;
}

export function SupabaseSyncBanner({ onSyncReady, onOpenSettingsModal }: SupabaseSyncBannerProps) {
  const [health, setHealth] = useState<{
    isConnected: boolean;
    schemaReady: boolean;
    message: string;
    checking: boolean;
  }>({
    isConnected: false,
    schemaReady: false,
    message: 'Checking database status...',
    checking: true
  });

  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const performHealthCheck = async () => {
    setHealth(prev => ({ ...prev, checking: true }));
    const result = await checkSupabaseHealth();
    setHealth({
      isConnected: result.isConnected,
      schemaReady: result.schemaReady,
      message: result.message,
      checking: false
    });

    if (result.isConnected && result.schemaReady) {
      if (onSyncReady) {
        onSyncReady();
      }
    }
  };

  useEffect(() => {
    performHealthCheck();

    // Re-check periodically
    const interval = setInterval(() => {
      performHealthCheck();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = SUPABASE_SCHEMA_SQL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const config = getSupabaseConfig();
  const projectId = config?.url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'qpxyucolxkzvyjjceywa';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;

  // If tables are ready and synced, show a compact non-intrusive banner or nothing
  if (health.schemaReady) {
    return null; // All good, master database is fully synced!
  }

  // If dismissed temporarily, show a compact floating pill
  if (isDismissed) {
    return (
      <div className="bg-amber-950/80 border-b border-amber-600/40 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Supabase Master DB Tables Missing (Desktop & Mobile live sync paused)</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDismissed(false)}
            className="text-amber-400 hover:text-white underline text-[11px] font-semibold"
          >
            Show Fix Instructions
          </button>
          <button 
            onClick={performHealthCheck}
            disabled={health.checking}
            className="p-1 hover:bg-amber-900/50 rounded"
            title="Check again"
          >
            <RefreshCw className={`w-3 h-3 ${health.checking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b-2 border-amber-500 shadow-xl text-slate-100 z-40 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-start justify-between gap-3">
          {/* Main Info */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5 border border-amber-500/30">
              <Database className="w-5 h-5 animate-pulse" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Supabase Master Database Setup Required (1-Click SQL)
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Sync Inactive
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                ડેસ્કટોપ અને મોબાઈલ વચ્ચે એક જ માસ્ટર ડેટાબેઝ સિંક રાખવા માટે Supabase SQL Editor માં ફક્ત 1 વાર આ સ્ક્રિપ્ટ રન કરો:
              </p>

              {isExpanded && (
                <div className="pt-1.5 pb-1 space-y-2 text-[11px]">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30 font-mono text-slate-300 text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                    <span className="truncate text-emerald-400">
                      CREATE TABLE IF NOT EXISTS public.teams ... public.workbooks ... public.performas
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                      <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={sqlEditorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Supabase SQL Editor</span>
                    </a>

                    <button
                      type="button"
                      onClick={performHealthCheck}
                      disabled={health.checking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${health.checking ? 'animate-spin' : ''}`} />
                      <span>{health.checking ? 'Checking DB...' : 'Verify & Sync Now'}</span>
                    </button>

                    {onOpenSettingsModal && (
                      <button
                        type="button"
                        onClick={onOpenSettingsModal}
                        className="text-slate-400 hover:text-slate-200 underline text-xs ml-1"
                      >
                        Change Keys / Settings
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
