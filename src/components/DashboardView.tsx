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
  Package,
  Activity,
  MapPin
} from 'lucide-react';
import { InventorySubmission, MainNavTab } from '../types/inventory';
import { sanitizeFolderName } from '../utils/excelExporter';

interface DashboardViewProps {
  submissions: InventorySubmission[];
  availableLocations: string[];
  onNavigate: (tab: MainNavTab) => void;
  onOpenLocationFile: (location: string, type: 'In house' | 'Maintenance') => void;
  onDownloadAllZip: () => void;
  readingsCount?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  submissions,
  availableLocations,
  onNavigate,
  onOpenLocationFile,
  onDownloadAllZip,
  readingsCount = 0,
}) => {
  const allLocations = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));
  const totalFoldersCount = allLocations.length;
  const totalFilesCount = totalFoldersCount * 2; // Exactly 2 files per location

  const totalSubmissions = submissions.length;
  const inHouseCount = submissions.filter(s => s.locationType === 'In house').length;
  const maintenanceCount = submissions.filter(s => s.locationType === 'Maintenance').length;
  const inHousePct = totalSubmissions > 0 ? Math.round((inHouseCount / totalSubmissions) * 100) : 0;
  const maintenancePct = totalSubmissions > 0 ? (100 - inHousePct) : 0;

  // Top Consumed Materials Calculation
  const topMaterials = useMemo(() => {
    const matMap = new Map<string, { totalQty: number; unit: string; count: number }>();
    for (const sub of submissions) {
      for (const it of sub.items) {
        const key = it.itemName;
        const qty = Number(it.value) || 0;
        const current = matMap.get(key) || { totalQty: 0, unit: it.unit || 'Nos.', count: 0 };
        current.totalQty += qty;
        current.count += 1;
        matMap.set(key, current);
      }
    }
    return Array.from(matMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [submissions]);

  // Location stats
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
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
              VYARA DIVISION ➔ DOLVAN SUB-DIVISION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5">
            Electrical Location Inventory &amp; Material Usage
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live central recording of daily material usage across site work locations. Every location maintains 
            its own folder containing exactly 2 dedicated Excel files (Inventory Usage and Volt-Amp Readings).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('quick_entry')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/40 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>+ Quick Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('readings')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-xs font-semibold transition cursor-pointer"
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Volt-Amp</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('location')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span>Folders</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Location Folders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Work Locations</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalFoldersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">DOLVAN sub-division sites</p>
        </div>

        {/* Daily Entries Logged */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Daily Work Entries</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">{totalSubmissions}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across all field work orders</p>
        </div>

        {/* In House vs Maintenance Entries */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">In House / Maint.</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            <span className="text-emerald-400">{inHouseCount}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-cyan-400">{maintenanceCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{inHousePct}% In house • {maintenancePct}% Maint.</p>
        </div>

        {/* Volt-Amp Readings Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Volt-Amp Readings</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono">{readingsCount || 3}</div>
          <p className="text-[11px] text-slate-500 mt-1">Sheet 2 electrical measurements</p>
        </div>

      </div>

      {/* Top Consumed Materials Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Top Consumed Materials at Electrical Sites</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('materials')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
          >
            <span>View Full Stock Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topMaterials.map((mat, i) => (
            <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-xs font-semibold text-slate-200 truncate">{mat.name}</div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-400 font-mono">{mat.totalQty}</span>
                <span className="text-[11px] text-slate-400 font-mono">{mat.unit}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{mat.count} site logs</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Location Folders Summary + Recent Work Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Location Folders Summary List (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-white text-sm">DOLVAN Section Location Folders</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('location')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
            >
              <span>Explore All</span>
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
                      <div className="text-[10px] text-slate-400">{loc.totalItems} Material line items</div>
                    </div>
                  </div>

                  {/* Relative progress bar */}
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div 
                      style={{ width: `${barPct}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>

                  {/* The 2 File Shortcuts */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenLocationFile(loc.location, 'In house')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-slate-300 truncate">{loc.folderName}_Inventory_Usage.xlsx</span>
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
                        <span className="text-[11px] text-slate-300 truncate">{loc.folderName}_Maintenance_Log.xlsx</span>
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

        {/* Right Column: Recent Work Submissions Feed (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recent Daily Work Entries</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-Time Central Feed</span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[460px] overflow-y-auto pr-1">
              {submissions.slice(0, 8).map((sub) => {
                const cleanFolder = sanitizeFolderName(sub.location);
                return (
                  <div 
                    key={sub.id}
                    onClick={() => onOpenLocationFile(sub.location, sub.locationType)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          sub.locationType === 'In house'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800/60'
                        }`}>
                          {sub.locationType}
                        </span>
                        <span className="font-semibold text-white text-xs truncate">{sub.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        By {sub.submittedBy} • {sub.notes || `${sub.items.length} materials used`}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(sub.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="text-[10px] text-emerald-400 font-semibold">{sub.items.length} items</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('quick_entry')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-cyan-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Record Work for Today</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
