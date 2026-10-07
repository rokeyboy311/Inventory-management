import React, { useMemo } from 'react';
import { 
  FolderTree, 
  FileSpreadsheet, 
  Layers, 
  Home, 
  Wrench, 
  Zap, 
  Download, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Package
} from 'lucide-react';
import { InventorySubmission, MainNavTab } from '../types/inventory';
import { sanitizeFolderName } from '../utils/excelExporter';

interface DashboardViewProps {
  submissions: InventorySubmission[];
  availableLocations: string[];
  onNavigate: (tab: MainNavTab) => void;
  onOpenLocationFile: (location: string, type: 'In house' | 'Maintenance') => void;
  onDownloadAllZip: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  submissions,
  availableLocations,
  onNavigate,
  onOpenLocationFile,
  onDownloadAllZip,
}) => {
  const allLocations = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));
  const totalFoldersCount = allLocations.length;
  const totalFilesCount = totalFoldersCount * 2; // Exactly 2 files per location

  const totalSubmissions = submissions.length;
  const inHouseCount = submissions.filter(s => s.locationType === 'In house').length;
  const maintenanceCount = submissions.filter(s => s.locationType === 'Maintenance').length;
  const inHousePct = totalSubmissions > 0 ? Math.round((inHouseCount / totalSubmissions) * 100) : 0;
  const maintenancePct = totalSubmissions > 0 ? (100 - inHousePct) : 0;

  const totalMaterialsLogged = submissions.reduce((acc, s) => acc + s.items.length, 0);

  // Top Location stats
  const locationStats = useMemo(() => {
    const map: Record<string, { inHouseSubmissions: number; inHouseItems: number; maintSubmissions: number; maintItems: number }> = {};
    for (const loc of allLocations) {
      map[loc] = { inHouseSubmissions: 0, inHouseItems: 0, maintSubmissions: 0, maintItems: 0 };
    }
    for (const sub of submissions) {
      if (!map[sub.location]) {
        map[sub.location] = { inHouseSubmissions: 0, inHouseItems: 0, maintSubmissions: 0, maintItems: 0 };
      }
      if (sub.locationType === 'In house') {
        map[sub.location].inHouseSubmissions += 1;
        map[sub.location].inHouseItems += sub.items.length;
      } else {
        map[sub.location].maintSubmissions += 1;
        map[sub.location].maintItems += sub.items.length;
      }
    }
    return Object.entries(map).map(([loc, data]) => ({
      location: loc,
      folderName: sanitizeFolderName(loc),
      totalSubmissions: data.inHouseSubmissions + data.maintSubmissions,
      totalItems: data.inHouseItems + data.maintItems,
      ...data
    })).sort((a, b) => b.totalSubmissions - a.totalSubmissions);
  }, [allLocations, submissions]);

  const maxSubmissions = Math.max(...locationStats.map(l => l.totalSubmissions), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Welcome & Quick Actions Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Location File System
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Site Inventory &amp; Location Folder Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Every location maintains its own folder containing exactly 2 dedicated Excel files: 
            <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-xs mx-1">[Location]_In_House.xlsx</code> and 
            <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-xs mx-1">[Location]_Maintenance.xlsx</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('quick_entry')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/40 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>+ New Quick Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('location')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span>Explore Folders</span>
          </button>

          <button
            type="button"
            onClick={onDownloadAllZip}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 transition cursor-pointer"
            title="Download All Location Folders (.ZIP)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. KPI Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Location Folders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Location Folders</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalFoldersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Configured site folders</p>
        </div>

        {/* Total Excel Files */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Excel Files</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">{totalFilesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">2 files per location folder</p>
        </div>

        {/* In House Submissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">1st: In house Entries</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {inHouseCount} <span className="text-xs font-normal text-slate-400">({inHousePct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged to In_House files</p>
        </div>

        {/* Maintenance Submissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">2nd: Maintenance Entries</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-mono">
            {maintenanceCount} <span className="text-xs font-normal text-slate-400">({maintenancePct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged to Maintenance files</p>
        </div>

      </div>

      {/* 2. Visual Charts & Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Location Folders Summary List (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Site Location Folders &amp; Activity</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('location')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
            >
              <span>View All Folders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {locationStats.map((loc) => {
              const barPct = Math.round((loc.totalSubmissions / maxSubmissions) * 100);
              return (
                <div 
                  key={loc.location}
                  className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white text-xs sm:text-sm">{loc.location}</span>
                        <div className="text-[11px] text-slate-500 font-mono">📁 {loc.folderName}/</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs text-white font-bold">{loc.totalSubmissions} Entries</span>
                      <div className="text-[10px] text-slate-400">{loc.totalItems} Material items</div>
                    </div>
                  </div>

                  {/* Relative progress bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div 
                      style={{ width: `${barPct}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>

                  {/* Quick File Links inside this folder */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenLocationFile(loc.location, 'In house')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-slate-300 truncate">{loc.folderName}_In_House.xlsx</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0 ml-1">
                        {loc.inHouseSubmissions}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenLocationFile(loc.location, 'Maintenance')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-[11px] text-slate-300 truncate">{loc.folderName}_Maintenance.xlsx</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold shrink-0 ml-1">
                        {loc.maintSubmissions}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In House vs Maintenance Ratio + Recent Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Category Ratio Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Category Distribution</span>
            </h3>

            <div className="space-y-2">
              <div className="h-5 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800 shadow-inner">
                <div 
                  style={{ width: `${inHousePct}%` }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full flex items-center justify-center text-white font-bold text-[10px]"
                >
                  {inHousePct > 12 ? `${inHousePct}%` : ''}
                </div>
                <div 
                  style={{ width: `${maintenancePct}%` }}
                  className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full flex items-center justify-center text-white font-bold text-[10px]"
                >
                  {maintenancePct > 12 ? `${maintenancePct}%` : ''}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-300 text-[11px]">1st: In house</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{inHouseCount}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                    <span className="text-slate-300 text-[11px]">2nd: Maint.</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">{maintenanceCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Inventory File Submissions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent File Updates</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {submissions.slice(0, 6).map((sub) => {
                const cleanFolder = sanitizeFolderName(sub.location);
                const targetFileName = sub.locationType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;
                return (
                  <div 
                    key={sub.id}
                    onClick={() => onOpenLocationFile(sub.location, sub.locationType)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${
                          sub.locationType === 'In house' ? 'text-emerald-400' : 'text-cyan-400'
                        }`} />
                        <span className="font-semibold text-white text-xs truncate">{targetFileName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {sub.location} • {sub.submittedBy}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="text-[10px] text-emerald-400 font-semibold">{sub.items.length} items</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
