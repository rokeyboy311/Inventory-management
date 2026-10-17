import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles } from 'lucide-react';
import { Team, TeamFormData } from '../../types/team';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamData: TeamFormData, editingTeamId?: string) => void;
  editingTeam?: Team | null;
}

export function CreateTeamModal({ isOpen, onClose, onSave, editingTeam }: CreateTeamModalProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    membersText: ''
  });

  useEffect(() => {
    if (editingTeam) {
      setFormData({
        name: editingTeam.name,
        membersText: editingTeam.members?.join(', ') || ''
      });
    } else {
      setFormData({
        name: '',
        membersText: ''
      });
    }
  }, [editingTeam, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData, editingTeam?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 via-slate-800 to-cyan-600/30 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingTeam ? 'Edit Team' : 'Create New Team'}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin Control
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                This team will appear directly on the User Dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Team Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Dolvan Maintenance Team"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>

          {/* Team Members List */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Team Members / Technicians (Comma Separated)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Kishan Kumar, Ramesh Bhai, Pravin Solanki"
              value={formData.membersText}
              onChange={(e) => setFormData({ ...formData, membersText: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Optional: Names of staff or technicians assigned to this team.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {editingTeam ? 'Save Team Updates' : 'Create Team Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
