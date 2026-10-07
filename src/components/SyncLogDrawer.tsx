import React from 'react';
import { X, Activity, Trash2, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { SyncLog } from '../types/sync';

interface SyncLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SyncLog[];
  onClearLogs: () => void;
}

export const SyncLogDrawer: React.FC<SyncLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Real-Time Sync Audit Logs</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs italic">
            No sync events recorded yet. Changes will appear here in real-time.
          </div>
        ) : (
          logs.map((log) => {
            const isSuccess = log.status === 'success';
            const isWarning = log.status === 'warning';
            return (
              <div
                key={log.id}
                className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isSuccess && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {!isSuccess && !isWarning && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="font-semibold text-slate-200">{log.event}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {log.details}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Source: <strong className="text-slate-400">{log.source}</strong></span>
                  {log.rowsAffected !== undefined && (
                    <span>{log.rowsAffected} rows affected</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>Sync events stream in real-time over SSE</span>
      </div>

    </div>
  );
};
