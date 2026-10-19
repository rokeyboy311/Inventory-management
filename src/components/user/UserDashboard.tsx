import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  ArrowRight, 
  Shield, 
  Layers, 
  Clock, 
  FileCheck, 
  Download, 
  Trash2, 
  Sparkles,
  ChevronLeft,
  Phone,
  FolderOpen,
  Database
} from 'lucide-react';
import { Team } from '../../types/team';
import { LocationWorkbook } from '../../types/performa';
import { exportDualSheetLocationExcel } from '../../utils/dolvanTemplate';
import { SupabaseSettingsModal } from '../admin/SupabaseSettingsModal';
import { isSupabaseConnected, getSupabaseSyncStatus } from '../../utils/supabaseClient';

interface UserDashboardProps {
  teams: Team[];
  workbooks: LocationWorkbook[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  onClearSelectedTeam: () => void;
  onOpenWorkbook: (workbook: LocationWorkbook) => void;
  onCreateLocationClick: () => void;
  onDeleteWorkbook: (locationId: string) => void;
  onNavigateToAdmin: () => void;
}

export function UserDashboard({
  teams,
  workbooks,
  selectedTeam,
  onSelectTeam,
  onClearSelectedTeam,
  onOpenWorkbook,
  onCreateLocationClick,
  onDeleteWorkbook,
  onNavigateToAdmin
}: UserDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Workbooks filtered for active team (unassigned workbooks fall back cleanly to primary team)
  const isPrimaryTeam = teams.length > 0 && selectedTeam?.id === teams[0].id;
  const teamWorkbooks = selectedTeam 
    ? workbooks.filter(w => w.teamId === selectedTeam.id || (!w.teamId && isPrimaryTeam))
    : [];

  const q = searchQuery.toLowerCase();
  const filteredWorkbooks = teamWorkbooks.filter(w => 
    (w.locationName || '').toLowerCase().includes(q) ||
    (w.workbookName || '').toLowerCase().includes(q)
  );

  const filteredTeams = teams.filter(t => {
    const membersMatch = (t.members || []).some(m => m.toLowerCase().includes(q));
    return (
      (t.name || '').toLowerCase().includes(q) ||
      membersMatch
    );
  });

  // -------------------------------------------------------------
  // View 1: Team Selection Screen (When no team is selected yet)
  // -------------------------------------------------------------
  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Header */}
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                DGVCL DISCOM WORKSTATION
              </h1>
              <p className="text-xs text-slate-400">
                User Dashboard · Field Maintenance & Location Inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Cloud Status */}
            {(() => {
              const sync = getSupabaseSyncStatus();
              return (
                <div 
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs cursor-pointer transition-colors"
                  title={sync.status === 'synced' ? "Live Supabase Master DB Connected (All devices synced)" : sync.status === 'tables_missing' ? "Supabase Tables Missing - Click to Setup" : "Supabase Offline / Local"}
                >
                  <span className={`w-2 h-2 rounded-full ${sync.status === 'synced' ? 'bg-emerald-400 animate-pulse' : sync.status === 'tables_missing' ? 'bg-amber-400 animate-ping' : 'bg-slate-400'}`} />
                  <span className="font-mono text-[11px] text-slate-300">
                    {sync.label}
                  </span>
                </div>
              );
            })()}

            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Configure Supabase SQL connection and open permissions"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase SQL</span>
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Panel (/admin)</span>
            </button>
          </div>
        </header>

        <SupabaseSettingsModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />

        {/* Main Content: Select Team */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="max-w-2xl space-y-2 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Step 1: Select Your Team
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Choose Your Team to Access Location Excels
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Select your team below to view and manage Location Excel files (with dual <strong>inventory</strong> & <strong>bill</strong> sheets).
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available Teams ({filteredTeams.length})
            </p>
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search team name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.map((team) => {
              const teamExcelsCount = workbooks.filter(w => w.teamId === team.id).length;

              return (
                <div
                  key={team.id}
                  onClick={() => onSelectTeam(team)}
                  className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-emerald-950/30 group hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {teamExcelsCount} Excel{teamExcelsCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Maintenance Team
                      </p>
                    </div>

                    {/* Members (if any) */}
                    {team.members && team.members.length > 0 && (
                      <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Members
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {team.members.map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      {teamExcelsCount} Location Excel{teamExcelsCount === 1 ? '' : 's'}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open Team <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 2: Team Workspace & Location Excels Hub (Team Selected)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClearSelectedTeam}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Back to All Teams"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white">
                {selectedTeam.name}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Team Location Excels & Workbooks · Real-time Cloud Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            title="Configure Supabase SQL connection and open permissions"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase SQL</span>
          </button>

          <button
            onClick={onClearSelectedTeam}
            className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Switch Team
          </button>

          <button
            onClick={onCreateLocationClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Location Excel</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner with 2-Sheet Generator notice */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              All Location Excel Files ({teamWorkbooks.length})
            </h3>
            <p className="text-xs text-slate-400">
              Every created file automatically contains 2 sheets: <strong>inventory</strong> (DOLVAN INVENTERY layout with sample data) and <strong>bill</strong>.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search location excel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Location Excels List */}
        {filteredWorkbooks.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Location Excel created yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Click "Create Location Excel" to generate your first dual-sheet workbook for {selectedTeam.name}.
              </p>
            </div>
            <button
              onClick={onCreateLocationClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Location Excel Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkbooks.map((wb) => {
              const inventorySheet = wb.sheets['inventory'] || wb.sheets['Performas'];
              const performasCount = inventorySheet?.performas?.length || 0;
              const hasBill = !!wb.sheets['bill'];

              return (
                <div
                  key={wb.locationId}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-black/40 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {wb.locationName}
                          </h3>
                          <p className="text-xs font-mono text-slate-400">
                            {wb.workbookName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete workbook "${wb.workbookName}"?`)) {
                            onDeleteWorkbook(wb.locationId);
                          }
                        }}
                        title="Delete Excel File"
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dual Sheets Badges */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        Sheet 1: inventory ({performasCount} TCs)
                      </span>
                      {hasBill && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Sheet 2: bill
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last updated: {new Date(wb.lastModified || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => exportDualSheetLocationExcel(wb)}
                      title="Download Dual-Sheet .xlsx"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>.xlsx</span>
                    </button>

                    <button
                      onClick={() => onOpenWorkbook(wb)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <span>Open Excel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
