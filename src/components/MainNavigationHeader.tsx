import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FolderTree, 
  Zap, 
  Activity, 
  Package, 
  Receipt, 
  Wifi, 
  WifiOff, 
  FileArchive, 
  Cloud, 
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
  onOpenGoogleDriveSync: () => void;
  isGoogleSheetsConnected?: boolean;
}

export const MainNavigationHeader: React.FC<MainNavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  isOnline,
  offlineCount,
  totalLocationsCount,
  onDownloadAllZip,
  onOpenSettings,
  onOpenGoogleDriveSync,
  isGoogleSheetsConnected = false,
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
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Division Inventory System
                </h1>
                <span 
                  onClick={() => onTabChange('location')}
                  title="Folder Hierarchy: VYARA Division ➔ DOLVAN Sub-Division (Click to view folders)"
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-mono flex items-center space-x-1 cursor-pointer transition"
                >
                  <span>📁 VYARA</span>
                  <span className="text-emerald-300 font-bold">➔</span>
                  <span>📂 DOLVAN</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                Division → Sub-Division → Location • Daily Work • Material Consumption • TC Readings
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            
            {/* 1. Dashboard Tab */}
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* 2. Quick Entry Tab (The Main Feature) */}
            <button
              type="button"
              onClick={() => onTabChange('quick_entry')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'quick_entry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Quick Entry</span>
            </button>

            {/* 3. Location Folders Tab */}
            <button
              type="button"
              onClick={() => onTabChange('location')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'location'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locations</span>
              <span className="px-1.5 py-0.2 bg-slate-900 rounded-full text-[10px] text-cyan-300 border border-slate-700 font-mono">
                {totalLocationsCount}
              </span>
            </button>

            {/* 4. Volt-Amp Readings Tab (Sheet 2) */}
            <button
              type="button"
              onClick={() => onTabChange('readings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'readings'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Volt-Amp</span>
            </button>

            {/* 5. Material Stock Register Tab */}
            <button
              type="button"
              onClick={() => onTabChange('materials')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'materials'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stock</span>
            </button>

            {/* 6. Bill Module Tab ("BILL FORM AND GST DOLVAN.xls") */}
            <button
              type="button"
              onClick={() => onTabChange('billing')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'billing'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Billing</span>
            </button>

          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 text-xs">
            
            {/* Google Drive & Sheets Cloud Sync */}
            <button
              type="button"
              onClick={onOpenGoogleDriveSync}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
                isGoogleSheetsConnected 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
              title="Google Drive & Central Sheets Cloud Sync"
            >
              <Cloud className={`w-3.5 h-3.5 ${isGoogleSheetsConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">
                {isGoogleSheetsConnected ? 'Drive Synced ✓' : 'Cloud Sync'}
              </span>
            </button>

            {/* Item Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition cursor-pointer"
              title="Configure Material Masters & Form Rows"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline ml-1">Settings</span>
            </button>

            {/* Download All ZIP */}
            <button
              type="button"
              onClick={onDownloadAllZip}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition cursor-pointer"
              title="Download all Location Excel files in ZIP package"
            >
              <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export ZIP</span>
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
