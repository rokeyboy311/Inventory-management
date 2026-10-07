import React, { useMemo } from 'react';
import { 
  X, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Building2, 
  Wrench, 
  Home, 
  Layers, 
  Package,
  Calendar
} from 'lucide-react';
import { InventorySubmission } from '../types/inventory';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: InventorySubmission[];
}

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
  submissions,
}) => {
  if (!isOpen) return null;

  // 1. KPI Calculations
  const totalSubmissions = submissions.length;
  const inHouseCount = submissions.filter(s => s.locationType === 'In house').length;
  const maintenanceCount = submissions.filter(s => s.locationType === 'Maintenance').length;
  const inHousePercentage = totalSubmissions > 0 ? Math.round((inHouseCount / totalSubmissions) * 100) : 0;
  const maintenancePercentage = totalSubmissions > 0 ? (100 - inHousePercentage) : 0;

  const totalItemsLogged = submissions.reduce((acc, sub) => acc + sub.items.length, 0);

  // 2. Location-wise Breakdown
  const locationStats = useMemo(() => {
    const map: Record<string, { totalSubmissions: number; inHouse: number; maintenance: number; totalItems: number }> = {};
    for (const sub of submissions) {
      if (!map[sub.location]) {
        map[sub.location] = { totalSubmissions: 0, inHouse: 0, maintenance: 0, totalItems: 0 };
      }
      map[sub.location].totalSubmissions += 1;
      map[sub.location].totalItems += sub.items.length;
      if (sub.locationType === 'In house') {
        map[sub.location].inHouse += 1;
      } else {
        map[sub.location].maintenance += 1;
      }
    }
    return Object.entries(map).map(([loc, data]) => ({ location: loc, ...data }));
  }, [submissions]);

  // Max location submissions for scaling bar chart
  const maxLocationSubmissions = Math.max(...locationStats.map(l => l.totalSubmissions), 1);

  // 3. Item-wise Breakdown (Count of times each item was logged and numeric sums if available)
  const itemStats = useMemo(() => {
    const map: Record<string, { count: number; numericSum: number; numericCount: number; typesUsed: Set<string> }> = {};
    for (const sub of submissions) {
      for (const item of sub.items) {
        if (!map[item.itemName]) {
          map[item.itemName] = { count: 0, numericSum: 0, numericCount: 0, typesUsed: new Set() };
        }
        map[item.itemName].count += 1;
        if (item.selectedType) {
          map[item.itemName].typesUsed.add(item.selectedType);
        }
        const num = Number(item.value);
        if (!isNaN(num) && item.value !== '') {
          map[item.itemName].numericSum += num;
          map[item.itemName].numericCount += 1;
        }
      }
    }
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        numericSum: data.numericSum,
        numericCount: data.numericCount,
        typesCount: data.typesUsed.size
      }))
      .sort((a, b) => b.count - a.count);
  }, [submissions]);

  const maxItemCount = Math.max(...itemStats.map(i => i.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Inventory Analytics &amp; Site Utilization Dashboard</span>
              </h2>
              <p className="text-xs text-slate-400">
                Visual analysis of item usage, site distributions, and In house vs Maintenance comparisons
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. KPI Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total Submissions */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-medium">Total Entries</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalSubmissions}</div>
              <p className="text-[11px] text-slate-500 mt-1">Logged across all sites</p>
            </div>

            {/* Total Items Dispatched */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-medium">Materials Logged</span>
                <Package className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalItemsLogged}</div>
              <p className="text-[11px] text-slate-500 mt-1">Total row line-items</p>
            </div>

            {/* In house Ratio */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-medium">In house Tasks</span>
                <Home className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {inHouseCount} <span className="text-xs font-normal text-slate-400">({inHousePercentage}%)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">1st Category assignments</p>
            </div>

            {/* Maintenance Ratio */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-medium">Maintenance Tasks</span>
                <Wrench className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {maintenanceCount} <span className="text-xs font-normal text-slate-400">({maintenancePercentage}%)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">2nd Category repairs</p>
            </div>

          </div>

          {/* 2. Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart A: In house vs Maintenance Split Comparison */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-teal-400" />
                  <span>In house vs Maintenance Split</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">2 Categories</span>
              </div>

              {/* Graphical Percentage Bar */}
              <div className="space-y-2">
                <div className="h-6 w-full rounded-full bg-slate-900 overflow-hidden flex shadow-inner border border-slate-800">
                  <div 
                    style={{ width: `${inHousePercentage}%` }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full flex items-center justify-center text-white font-bold text-[10px] transition-all duration-500"
                  >
                    {inHousePercentage > 10 ? `${inHousePercentage}%` : ''}
                  </div>
                  <div 
                    style={{ width: `${maintenancePercentage}%` }}
                    className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full flex items-center justify-center text-white font-bold text-[10px] transition-all duration-500"
                  >
                    {maintenancePercentage > 10 ? `${maintenancePercentage}%` : ''}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-slate-300">1st: In house</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{inHouseCount} entries</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                      <span className="font-medium text-slate-300">2nd: Maintenance</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400">{maintenanceCount} entries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart B: Location Breakdown Bar Visualization */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Submissions by Site Location</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{locationStats.length} Sites</span>
              </div>

              <div className="space-y-3">
                {locationStats.map((loc) => {
                  const percent = Math.round((loc.totalSubmissions / maxLocationSubmissions) * 100);
                  return (
                    <div key={loc.location} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300 truncate max-w-[200px]">{loc.location}</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {loc.totalSubmissions} records ({loc.totalItems} items)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                        <div 
                          style={{ width: `${percent}%` }}
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 3. Item Usage & Volume Ranking Table */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Materials Usage Frequency &amp; Aggregates</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{itemStats.length} Distinct Materials</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3">Times Logged</th>
                    <th className="py-2.5 px-3">Relative Volume</th>
                    <th className="py-2.5 px-3">Numeric Sum (If numeric)</th>
                    <th className="py-2.5 px-3">Unique Types Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {itemStats.map((it) => {
                    const barWidth = Math.round((it.count / maxItemCount) * 100);
                    return (
                      <tr key={it.name} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-semibold text-white">{it.name}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{it.count}</td>
                        <td className="py-2.5 px-3 w-48">
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              style={{ width: `${barWidth}%` }}
                              className="bg-emerald-500 h-full rounded-full"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {it.numericCount > 0 ? it.numericSum.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {it.typesCount > 0 ? `${it.typesCount} specs` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Real-time aggregation of {totalSubmissions} inventory records</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
