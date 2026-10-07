import React from 'react';
import { 
  Sliders, 
  Clock, 
  ShieldAlert, 
  FolderSync, 
  Layers, 
  Save, 
  UploadCloud,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { SyncConfig, SyncState } from '../types/sync';

interface SyncConfigPanelProps {
  config: SyncConfig;
  syncState: SyncState;
  onUpdateConfig: (newConfig: Partial<SyncConfig>) => void;
  onSaveToLinkedFile: () => void;
  onReloadLinkedFile: () => void;
}

export const SyncConfigPanel: React.FC<SyncConfigPanelProps> = ({
  config,
  syncState,
  onUpdateConfig,
  onSaveToLinkedFile,
  onReloadLinkedFile,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const totalRows = syncState.sheets.reduce((acc, s) => acc + s.rows.length, 0);
  const totalCols = syncState.sheets[syncState.activeSheetIndex]?.columns.length || 0;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Quick Stats / Real-Time Status Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-300">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">{syncState.sheets.length} Sheets</span>
            <span className="text-slate-500">|</span>
            <span>{totalRows} Rows</span>
            <span className="text-slate-500">|</span>
            <span>{totalCols} Columns</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Last Synced:</span>
            <span className="text-slate-200 font-mono">
              {new Date(syncState.lastUpdated).toLocaleTimeString()}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Source: {syncState.syncSource}
            </span>
          </div>

          {config.localFileName && (
            <div className="flex items-center space-x-2 bg-blue-950/50 text-blue-300 px-2.5 py-1 rounded-md border border-blue-800/40">
              <FolderSync className="w-3.5 h-3.5" />
              <span>Linked File: <strong>{config.localFileName}</strong></span>
              <button
                onClick={onSaveToLinkedFile}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1"
                title="Save current grid directly to local Excel file"
              >
                <Save className="w-3 h-3" /> Save to File
              </button>
              <button
                onClick={onReloadLinkedFile}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded transition cursor-pointer"
                title="Reload from local Excel file"
              >
                Reload
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Controls & Config Toggle */}
        <div className="flex items-center space-x-3 ml-auto">
          {/* Auto-Sync Toggle Switch */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <span className="text-slate-300 font-medium">Auto-Sync:</span>
            <button
              onClick={() => onUpdateConfig({ autoSync: !config.autoSync })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                config.autoSync ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  config.autoSync ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-[11px] font-semibold ${config.autoSync ? 'text-emerald-400' : 'text-slate-500'}`}>
              {config.autoSync ? (config.syncIntervalSec === 0 ? 'Live (0s)' : `${config.syncIntervalSec}s`) : 'Paused'}
            </span>
          </div>

          {/* Settings / Config dropdown toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
              isExpanded 
                ? 'bg-slate-700 text-white border-slate-600' 
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Config</span>
          </button>
        </div>
      </div>

      {/* Expanded Sync Settings Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-300 animate-fadeIn">
          
          {/* Sync Frequency */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <label className="font-semibold text-slate-200 flex items-center space-x-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Frequency / Polling</span>
            </label>
            <select
              value={config.syncIntervalSec}
              onChange={(e) => onUpdateConfig({ syncIntervalSec: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={0}>⚡ Immediate (Real-time on cell edit)</option>
              <option value={1}>Every 1 second</option>
              <option value={3}>Every 3 seconds</option>
              <option value={5}>Every 5 seconds (Recommended)</option>
              <option value={10}>Every 10 seconds</option>
              <option value={30}>Every 30 seconds</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Controls how quickly changes are broadcast to all connected Excel clients and browser tabs.
            </p>
          </div>

          {/* Conflict Mode */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <label className="font-semibold text-slate-200 flex items-center space-x-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Conflict Resolution Mode</span>
            </label>
            <select
              value={config.conflictMode}
              onChange={(e) => onUpdateConfig({ conflictMode: e.target.value as SyncConfig['conflictMode'] })}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="latest_wins">Latest Edit Wins (Default)</option>
              <option value="server_wins">Incoming Excel Feed Wins</option>
              <option value="merge">Smart Cell Merge</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Handles multi-user edits when updates occur simultaneously in Excel and Web App.
            </p>
          </div>

          {/* Workbook Details & Info */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <label className="font-semibold text-slate-200 flex items-center space-x-1.5 mb-2">
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Sync Protocol</span>
            </label>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Sync Engine:</span>
                <span className="text-emerald-400 font-mono">SSE + HTTP POST Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Workbook:</span>
                <span className="text-slate-200 truncate max-w-[140px]">{syncState.workbookName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated By:</span>
                <span className="text-slate-200">{syncState.updatedBy}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
