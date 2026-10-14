import React, { useMemo } from 'react';
import { 
  FolderTree, 
  FileSpreadsheet, 
  Layers, 
  Zap, 
  Download, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Package, 
  Activity, 
  MapPin,
  Eye,
  FileCheck
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
    }));
  }, [allLocations, submissions]);

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
    const res = Array.from(matMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 4);

    if (res.length === 0) {
      return [
        { name: 'LT Cable 70sqmm', totalQty: 70, unit: 'Mtr', count: 2 },
        { name: 'Bushing Goti', totalQty: 13, unit: 'Nos.', count: 3 },
        { name: 'Al. Patta KVA', totalQty: 4, unit: 'Nos.', count: 1 },
        { name: 'Silica Gel', totalQty: 3, unit: 'Kg', count: 1 },
      ];
    }
    return res;
  }, [submissions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Section Header with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(226,226,231,0.12)]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1">
            Section Overview // Live Registry
          </div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">
            Site Location Folders &amp; Target Excel Files
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('quick_entry')}
            className="px-4 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer font-terminal"
          >
            <Zap className="w-3.5 h-3.5 text-[#111113]" />
            <span>+ Quick Entry</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('location')}
            className="px-3.5 py-2 bg-transparent hover:bg-[rgba(226,226,231,0.06)] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] text-[#e2e2e7] text-xs uppercase transition flex items-center space-x-1.5 cursor-pointer font-terminal"
          >
            <FolderTree className="w-3.5 h-3.5 text-[#00ffaa]" />
            <span>Folder Tree</span>
          </button>

          <button
            type="button"
            onClick={onDownloadAllZip}
            className="p-2 bg-transparent hover:bg-[rgba(226,226,231,0.06)] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] text-[#00ffaa] text-xs transition cursor-pointer"
            title="Download All Location Folders (.ZIP)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Locations Pane - Variation 3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locationStats.map((loc, idx) => {
          const dirCode = `DIR_${String(idx + 1).padStart(2, '0')}`;
          const hasEntries = loc.totalSubmissions > 0;

          return (
            <div 
              key={loc.location}
              className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] hover:border-[#00ffaa] p-5 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1">
                  <span className="text-[#00ffaa] font-mono">{dirCode}</span>
                  <span className="font-mono">{loc.totalSubmissions} LOGGED</span>
                </div>

                <h3 className="font-display text-xl uppercase tracking-wide text-white mt-1 mb-3 group-hover:text-[#00ffaa] transition-colors">
                  {loc.location}
                </h3>

                <div className="text-xs text-[rgba(226,226,231,0.4)] mb-4 font-mono leading-relaxed">
                  {hasEntries ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[rgba(226,226,231,0.7)]">
                        <span className="text-white font-mono">[XLS] {loc.folderName}_Inventory_Usage.xlsx</span>
                        <span className="text-[#00ffaa] text-[10px]">{loc.inHouseSubmissions} entries</span>
                      </div>
                      <div className="flex items-center justify-between text-[rgba(226,226,231,0.7)]">
                        <span className="text-white font-mono">[XLS] {loc.folderName}_Maintenance_Log.xlsx</span>
                        <span className="text-[#00ccff] text-[10px]">{loc.maintSubmissions} entries</span>
                      </div>
                    </div>
                  ) : (
                    <div className="opacity-40 italic">
                      No recent data entries detected in this folder.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[rgba(226,226,231,0.08)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenLocationFile(loc.location, 'Maintenance')}
                  className="px-3 py-1.5 bg-transparent border border-[#00ccff] text-[#00ccff] hover:bg-[#00ccff] hover:text-[#111113] text-[11px] font-bold uppercase transition font-terminal cursor-pointer"
                >
                  Access Files
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('quick_entry')}
                  className="px-3 py-1.5 bg-[rgba(226,226,231,0.06)] hover:bg-[rgba(226,226,231,0.12)] text-[#e2e2e7] hover:text-[#00ffaa] text-[11px] uppercase transition font-terminal cursor-pointer"
                >
                  + Entry
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Consumables Breakdown */}
      <div className="p-5 bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-2 flex items-center justify-between">
          <span>Top Consumables Breakdown</span>
          <button 
            type="button" 
            onClick={() => onNavigate('materials')}
            className="text-[#00ffaa] hover:underline cursor-pointer"
          >
            Full Ledger ➔
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          {topMaterials.map((mat, i) => (
            <div key={i} className="p-3 bg-[#111113] border border-[rgba(226,226,231,0.08)]">
              <div className="text-xs text-[rgba(226,226,231,0.6)] truncate">{mat.name}</div>
              <div className="font-display text-2xl text-[#00ffaa] mt-1">
                {mat.totalQty} <span className="text-xs font-mono text-[rgba(226,226,231,0.4)]">{mat.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
