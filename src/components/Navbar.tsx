import React, { useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RefreshCw, 
  Webhook, 
  Activity, 
  FolderSync, 
  CheckCircle2, 
  Zap
} from 'lucide-react';
import { SyncState, SyncConfig } from '../types/sync';

interface NavbarProps {
  syncState: SyncState;
  config: SyncConfig;
  isConnected: boolean;
  isSyncing: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConnectLocalFile: () => void;
  onManualSync: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onOpenWebhookModal: () => void;
  onToggleLogs: () => void;
  onToggleSimModal: () => void;
  logsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncState,
  config,
  isConnected,
  isSyncing,
  onFileUpload,
  onConnectLocalFile,
  onManualSync,
  onExportExcel,
  onExportCSV,
  onExportJSON,
  onOpenWebhookModal,
  onToggleLogs,
  onToggleSimModal,
  logsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Excel LiveSync Pro</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Real-Time v{syncState.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {syncState.workbookName} • Bi-directional Excel &amp; Cloud Sync
              </p>
            </div>
          </div>

          {/* Center: Live Sync Status Pulse */}
          <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-xs font-medium text-slate-300">
                {isConnected ? 'SSE Live Stream Connected' : 'Connecting to Sync Hub...'}
              </span>
            </div>
            {config.localFileName && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <FolderSync className="w-3 h-3" />
                Local: {config.localFileName}
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />

            {/* Upload/Connect Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Upload an Excel (.xlsx / .csv) file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>

            {/* Direct Local File System Access Link */}
            {typeof window !== 'undefined' && 'showOpenFilePicker' in window && (
              <button
                onClick={onConnectLocalFile}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Connect direct to local Excel file via browser File System API"
              >
                <FolderSync className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Link Local File</span>
              </button>
            )}

            {/* Webhook / VBA Macro setup */}
            <button
              onClick={onOpenWebhookModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition cursor-pointer"
              title="Connect Excel Desktop VBA / Office Scripts / Webhook"
            >
              <Webhook className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Connect Excel / API</span>
            </button>

            {/* Live Data Simulator / Test Feeder */}
            <button
              onClick={onToggleSimModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/50 transition cursor-pointer"
              title="Simulate incoming real-time Excel stream"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Live Feeder</span>
            </button>

            {/* Manual Sync Refresh Button */}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Push latest changes to sync hub"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <button
                    onClick={() => { onExportExcel(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Download .XLSX (Excel)</span>
                  </button>
                  <button
                    onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Download .CSV</span>
                  </button>
                  <button
                    onClick={() => { onExportJSON(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                  >
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span>Download .JSON</span>
                  </button>
                </div>
              )}
            </div>

            {/* Activity Logs Drawer Toggle */}
            <button
              onClick={onToggleLogs}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Real-Time Sync Logs & Audits"
            >
              <Activity className="w-4 h-4" />
              {logsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
