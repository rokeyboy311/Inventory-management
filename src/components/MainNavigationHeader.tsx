import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FolderTree, 
  Zap, 
  Wifi, 
  WifiOff, 
  Download,
  FileArchive,
  Layers
} from 'lucide-react';
import { MainNavTab } from '../types/inventory';

interface MainNavigationHeaderProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  isOnline: boolean;
  offlineCount: number;
  totalLocationsCount: number;
  onDownloadAllZip: () => void;
  onOpenSettings: () => void;
}

export const MainNavigationHeader: React.FC<MainNavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  isOnline,
  offlineCount,
  totalLocationsCount,
  onDownloadAllZip,
  onOpenSettings,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-xl sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Site Inventory Manager
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Folder-Wise Excel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Location Folders • 2 Files Each (In House &amp; Maintenance) • Real-Time Sync
              </p>
            </div>
          </div>

          {/* 3 Main Navigation Tabs (Dashboard, Location, Quick Entry) */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            
            {/* 1. Dashboard Tab */}
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. Location (Folders & Files) Tab */}
            <button
              type="button"
              onClick={() => onTabChange('location')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                activeTab === 'location'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>Location</span>
              <span className="px-1.5 py-0.2 bg-slate-900/80 rounded-full text-[10px] text-cyan-300 border border-slate-700 font-mono">
                {totalLocationsCount}
              </span>
            </button>

            {/* 3. Quick Entry Tab */}
            <button
              type="button"
              onClick={() => onTabChange('quick_entry')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'quick_entry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-blue-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick Entry</span>
            </button>

          </nav>

          {/* Right Action Tools: Settings, Network Status & Download All ZIP */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            
            {/* Global Item Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold transition cursor-pointer"
              title="Configure Global Items & Sub-Option Columns (e.g. Lug 100, 200, 500)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Item Settings</span>
            </button>

            {/* Download All Location Folders Package */}
            <button
              type="button"
              onClick={onDownloadAllZip}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition cursor-pointer"
              title="Download all Location folders with their In House & Maintenance Excel files (.ZIP)"
            >
              <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download All (ZIP)</span>
            </button>

            {/* Live Connection Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              isOnline 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}>
              {isOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="font-medium">Offline</span>
                </>
              )}
            </div>

            {offlineCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] animate-pulse">
                {offlineCount} Queued
              </span>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
