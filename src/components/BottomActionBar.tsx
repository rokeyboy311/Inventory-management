import React from 'react';
import { 
  Save, 
  Table, 
  BarChart3, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download,
  Settings2
} from 'lucide-react';

interface BottomActionBarProps {
  onSave: () => void;
  onOpenView: () => void;
  onOpenAnalytics: () => void;
  onOpenSyncSettings: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  saveStatus: 'idle' | 'syncing' | 'saved' | 'error' | 'offline_queued';
  lastSavedMessage: string;
  totalSubmissionsCount: number;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onSave,
  onOpenView,
  onOpenAnalytics,
  onOpenSyncSettings,
  onExportExcel,
  onExportCSV,
  saveStatus,
  lastSavedMessage,
  totalSubmissionsCount,
}) => {
  return (
    <div className="bg-slate-900 border-t border-slate-800 shadow-2xl sticky bottom-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left: Live Status Feedback Badge */}
          <div className="flex items-center space-x-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2">
              {saveStatus === 'syncing' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-semibold">Auto-Syncing with Excel &amp; Sheets API...</span>
                </div>
              )}

              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{lastSavedMessage || 'Saved & Synced to Excel!'}</span>
                </div>
              )}

              {saveStatus === 'offline_queued' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Saved Locally (Queued for Online Sync)</span>
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold">Sync error - saved to local storage</span>
                </div>
              )}

              {saveStatus === 'idle' && (
                <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Excel Mapping Engine Active</span>
                </div>
              )}
            </div>

            <span className="text-slate-500 text-xs hidden md:inline">|</span>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              Records: <strong>{totalSubmissionsCount}</strong>
            </span>
          </div>

          {/* Right: Core Navigation Buttons (Save, View, Analytics, Export) */}
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
            
            {/* View Button */}
            <button
              type="button"
              onClick={onOpenView}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm hover:text-white"
              title="Open all previous submissions table with search & filter"
            >
              <Table className="w-4 h-4 text-cyan-400" />
              <span>View Data</span>
              <span className="px-1.5 py-0.2 bg-slate-900 rounded-full text-[10px] text-cyan-300 border border-slate-700">
                {totalSubmissionsCount}
              </span>
            </button>

            {/* Analytics Button */}
            <button
              type="button"
              onClick={onOpenAnalytics}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm hover:text-white"
              title="View visual charts & site trends"
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Analytics</span>
            </button>

            {/* Excel Sync & Export Quick Menu */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onExportExcel}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 transition cursor-pointer"
                title="Download Master Excel (.xlsx) file"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={onOpenSyncSettings}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 transition cursor-pointer"
                title="Excel & Sheets API Sync Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            {/* Save Button (Primary Action) */}
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === 'syncing'}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-60 active:scale-98"
            >
              <Save className={`w-4 h-4 ${saveStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{saveStatus === 'syncing' ? 'Saving & Syncing...' : 'Save & Sync to Excel'}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
