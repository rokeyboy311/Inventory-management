import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  MapPin, 
  FileSpreadsheet, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { Team, TeamFormData } from '../../types/team';
import { LocationWorkbook } from '../../types/performa';
import { 
  loadTeamsFromStorage, 
  saveTeamToStorage, 
  deleteTeamFromStorage, 
  loadWorkbooksFromStorage,
  syncBroadcastChannel 
} from '../../utils/storage';
import { CreateTeamModal } from './CreateTeamModal';
import { SupabaseSettingsModal } from './SupabaseSettingsModal';

interface AdminPanelProps {
  onNavigateToUser: (teamId?: string) => void;
}

export function AdminPanel({ onNavigateToUser }: AdminPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [workbooks, setWorkbooks] = useState<LocationWorkbook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    const loadedTeams = await loadTeamsFromStorage();
    const loadedWbs = await loadWorkbooksFromStorage();
    setTeams(loadedTeams);
    setWorkbooks(loadedWbs);
  };

  useEffect(() => {
    refreshData();

    // Listen to real-time broadcast channel from other tabs
    const handleBroadcast = () => {
      refreshData();
    };

    syncBroadcastChannel?.addEventListener('message', handleBroadcast);
    return () => {
      syncBroadcastChannel?.removeEventListener('message', handleBroadcast);
    };
  }, []);

  const handleCreateOrUpdateTeam = async (formData: TeamFormData, editingId?: string) => {
    const membersList = formData.membersText
      ? formData.membersText.split(',').map(m => m.trim()).filter(Boolean)
      : [];

    if (editingId) {
      const existing = teams.find(t => t.id === editingId);
      if (existing) {
        const updated: Team = {
          ...existing,
          name: formData.name.trim(),
          code: formData.code.trim() || existing.code,
          division: formData.division.trim() || 'VYARA',
          subdivision: formData.subdivision.trim() || 'DOLVAN',
          inChargeEngineer: {
            name: formData.inChargeName.trim() || 'Er. In-Charge',
            designation: formData.inChargeDesignation.trim() || 'Junior Engineer',
            contactNumber: formData.inChargePhone.trim(),
            email: formData.inChargeEmail?.trim()
          },
          members: membersList.length > 0 ? membersList : existing.members,
          updatedAt: new Date().toISOString()
        };
        await saveTeamToStorage(updated);
        showNotify(`Team "${updated.name}" updated successfully!`);
      }
    } else {
      const newId = `team-${Date.now()}-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newTeam: Team = {
        id: newId,
        name: formData.name.trim(),
        code: formData.code.trim() || `TM-${Math.floor(100 + Math.random() * 900)}`,
        division: formData.division.trim() || 'VYARA',
        subdivision: formData.subdivision.trim() || 'DOLVAN',
        inChargeEngineer: {
          name: formData.inChargeName.trim() || 'Er. In-Charge',
          designation: formData.inChargeDesignation.trim() || 'Junior Engineer',
          contactNumber: formData.inChargePhone.trim(),
          email: formData.inChargeEmail?.trim()
        },
        members: membersList.length > 0 ? membersList : ['Technician 1'],
        locationExcelIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTeamToStorage(newTeam);
      showNotify(`New Team "${newTeam.name}" created and synced to User Dashboard!`);
    }

    refreshData();
  };

  const handleDeleteTeam = async (team: Team) => {
    if (window.confirm(`Are you sure you want to delete "${team.name}"? This team will be removed from the User Dashboard.`)) {
      await deleteTeamFromStorage(team.id);
      showNotify(`Team "${team.name}" removed.`);
      refreshData();
    }
  };

  const filteredTeams = teams.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.code || '').toLowerCase().includes(q) ||
      (t.subdivision || '').toLowerCase().includes(q) ||
      (t.division || '').toLowerCase().includes(q) ||
      (t.inChargeEngineer?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                DGVCL DISCOM ADMIN
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected Panel
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Teams created here automatically sync to the User Dashboard (`/`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase SQL Database Config Button */}
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            title="Configure Supabase SQL connection and open permissions"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase SQL</span>
          </button>

          {/* Quick Switch to User Dashboard */}
          <button
            onClick={() => onNavigateToUser()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>User Dashboard (/)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Create Team CTA */}
          <button
            onClick={() => {
              setEditingTeam(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Team</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Teams</p>
              <h3 className="text-2xl font-black text-white mt-1">{teams.length}</h3>
              <p className="text-[11px] text-emerald-400 mt-1">Live in User Dashboard</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Excels</p>
              <h3 className="text-2xl font-black text-white mt-1">{workbooks.length}</h3>
              <p className="text-[11px] text-cyan-400 mt-1">Dual-Sheet Workbooks</p>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Sync Status</p>
              <h3 className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time Synchronized
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">IndexedDB + BroadcastChannel</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Maintenance Teams Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or edit any team. Click "Open as User" to see what the field engineers see.
            </p>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by team, engineer, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No teams found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try matching another team name or code.' : 'Click "Create New Team" to add your first maintenance team.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.map((team) => {
              // Count workbooks belonging to this team
              const teamWorkbooks = workbooks.filter(w => w.teamId === team.id);

              return (
                <div
                  key={team.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-black/40 group"
                >
                  <div className="space-y-3.5">
                    {/* Team Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {team.code}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {team.division} / {team.subdivision}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                          {team.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setIsModalOpen(true);
                          }}
                          title="Edit Team"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          title="Delete Team"
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Engineer In-Charge */}
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        In-Charge Engineer
                      </p>
                      <p className="text-xs font-bold text-slate-200">
                        {team.inChargeEngineer?.name || 'Er. In-Charge'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {team.inChargeEngineer?.designation || 'Junior Engineer'}
                      </p>
                      {team.inChargeEngineer?.contactNumber && (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1 font-mono">
                          <Phone className="w-3 h-3" />
                          {team.inChargeEngineer.contactNumber}
                        </p>
                      )}
                    </div>

                    {/* Members List */}
                    {team.members && team.members.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Assigned Technicians ({team.members.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.members.map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Card Footer Action */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span>{teamWorkbooks.length} Location Excel{teamWorkbooks.length === 1 ? '' : 's'}</span>
                    </div>

                    <button
                      onClick={() => onNavigateToUser(team.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <span>Open as User</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrUpdateTeam}
        editingTeam={editingTeam}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={refreshData}
      />
    </div>
  );
}
