import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  ArrowRight, 
  Layers, 
  Clock, 
  Download, 
  Trash2, 
  FolderOpen,
  Database,
  MapPin,
  RefreshCw,
  FileCheck,
  Sliders
} from 'lucide-react';
import { LocationWorkbook } from '../../types/performa';
import { exportDualSheetLocationExcel } from '../../utils/dolvanTemplate';
import { SupabaseSettingsModal } from '../admin/SupabaseSettingsModal';
import { ItemsSettingsModal } from '../ItemsSettingsModal';
import { getSupabaseSyncStatus } from '../../utils/supabaseClient';

interface UserDashboardProps {
  workbooks: LocationWorkbook[];
  onOpenWorkbook: (workbook: LocationWorkbook) => void;
  onCreateLocationClick: () => void;
  onDeleteWorkbook: (locationId: string) => void;
  onRefreshData?: () => void;
}

export function UserDashboard({
  workbooks,
  onOpenWorkbook,
  onCreateLocationClick,
  onDeleteWorkbook,
  onRefreshData
}: UserDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isItemsSettingsModalOpen, setIsItemsSettingsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const q = searchQuery.toLowerCase().trim();
  const filteredWorkbooks = workbooks.filter(w => 
    (w.locationName || '').toLowerCase().includes(q) ||
    (w.workbookName || '').toLowerCase().includes(q)
  );

  const handleRefresh = async () => {
    if (onRefreshData) {
      setIsRefreshing(true);
      await onRefreshData();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                DGVCL DISCOM WORKSTATION
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Master DB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Location Inventory & Maintenance Excels · Instant Cloud Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Live Cloud Status */}
          {(() => {
            const sync = getSupabaseSyncStatus();
            return (
              <div 
                onClick={() => setIsSupabaseModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs cursor-pointer transition-colors"
                title={sync.status === 'synced' ? "Live Supabase Master DB Connected (All devices synced)" : sync.status === 'tables_missing' ? "Supabase Tables Missing - Click to Setup" : "Supabase Offline / Local"}
              >
                <span className={`w-2 h-2 rounded-full ${sync.status === 'synced' ? 'bg-emerald-400 animate-pulse' : sync.status === 'tables_missing' ? 'bg-amber-400 animate-ping' : 'bg-slate-400'}`} />
                <span className="font-mono text-[11px] text-slate-300">
                  {sync.label}
                </span>
              </div>
            );
          })()}

          {/* Quick Refresh Button */}
          {onRefreshData && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Refresh latest data from cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Items Settings (Master Template) Button */}
          <button
            type="button"
            onClick={() => setIsItemsSettingsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Configure Default Performa Items (Add, Edit, Remove)"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Items Settings</span>
          </button>

          {/* Supabase SQL Database Config Button */}
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Configure Supabase SQL connection and open permissions"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Supabase</span>
          </button>

          {/* + Create Location Excel Button */}
          <button
            type="button"
            onClick={onCreateLocationClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Location Excel</span>
          </button>
        </div>
      </header>

      {/* Supabase Config Modal */}
      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={onRefreshData}
      />

      {/* Items Settings Modal */}
      <ItemsSettingsModal
        isOpen={isItemsSettingsModalOpen}
        onClose={() => setIsItemsSettingsModalOpen(false)}
        onItemsUpdated={onRefreshData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner with 2-Sheet Generator notice */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              All Location Excel Files ({workbooks.length})
            </h3>
            <p className="text-xs text-slate-400">
              Each location file automatically includes dual sheets: <strong className="text-emerald-400">Sheet 1 (inventory)</strong> and <strong className="text-cyan-400">Sheet 2 (bill)</strong>.
            </p>
          </div>

          <div className="relative w-full sm:min-w-[280px] sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search location name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Location Excels Grid */}
        {filteredWorkbooks.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {searchQuery ? `No location found matching "${searchQuery}"` : 'No Location Excel created yet'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery ? 'Try typing another location name.' : 'Click "+ Create Location Excel" to generate your first dual-sheet workbook.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                type="button"
                onClick={onCreateLocationClick}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create First Location</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkbooks.map((wb) => {
              const inventorySheet = wb.sheets['inventory'] || wb.sheets['Performas'];
              const performasCount = inventorySheet?.performas?.length || 0;
              const billSheet = wb.sheets['bill'];
              const billItemsCount = billSheet?.billData?.items?.length || billSheet?.rawRowsCount || 0;
              const grandTotal = billSheet?.billData?.grandTotal || 0;

              return (
                <div
                  key={wb.locationId}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-emerald-950/20 group hover:-translate-y-1 relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">
                            {wb.locationName}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-400">
                            {wb.workbookName}
                          </span>
                        </div>
                      </div>

                      {/* Delete Workbook Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete ${wb.locationName} Excel file and all its performa records?`)) {
                            onDeleteWorkbook(wb.locationId);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={`Delete ${wb.locationName} Excel`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dual Sheets Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Sheet 1: inventory</span>
                        <strong className="text-emerald-400 font-mono text-xs">
                          {performasCount} Performas
                        </strong>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Sheet 2: bill</span>
                        <strong className="text-cyan-400 font-mono text-xs">
                          {billItemsCount} Items {grandTotal > 0 ? `(₹${grandTotal.toLocaleString()})` : ''}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Modified: {wb.lastModified ? new Date(wb.lastModified).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>

                  {/* Actions: Open and Download */}
                  <div className="pt-4 flex items-center gap-2 border-t border-slate-800/80 mt-4">
                    <button
                      type="button"
                      onClick={() => onOpenWorkbook(wb)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportDualSheetLocationExcel(wb);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                      title="Download dual-sheet .xlsx"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserDashboard;
