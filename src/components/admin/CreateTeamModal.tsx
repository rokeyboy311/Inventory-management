import React, { useState, useEffect } from 'react';
import { X, Users, Shield, MapPin, Phone, Mail, UserCheck, Sparkles } from 'lucide-react';
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
    code: '',
    division: 'VYARA',
    subdivision: 'DOLVAN',
    inChargeName: '',
    inChargeDesignation: 'Junior Engineer',
    inChargePhone: '',
    inChargeEmail: '',
    membersText: ''
  });

  useEffect(() => {
    if (editingTeam) {
      setFormData({
        name: editingTeam.name,
        code: editingTeam.code,
        division: editingTeam.division,
        subdivision: editingTeam.subdivision,
        inChargeName: editingTeam.inChargeEngineer.name,
        inChargeDesignation: editingTeam.inChargeEngineer.designation,
        inChargePhone: editingTeam.inChargeEngineer.contactNumber,
        inChargeEmail: editingTeam.inChargeEngineer.email || '',
        membersText: editingTeam.members.join(', ')
      });
    } else {
      setFormData({
        name: '',
        code: '',
        division: 'VYARA',
        subdivision: 'DOLVAN',
        inChargeName: '',
        inChargeDesignation: 'Junior Engineer',
        inChargePhone: '',
        inChargeEmail: '',
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 via-slate-800 to-cyan-600/30 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingTeam ? 'Edit Maintenance Team' : 'Create New Team'}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin Control
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                This team will appear directly in the User Dashboard for field engineers.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Team Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dolvan Maintenance Team A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Team Code
              </label>
              <input
                type="text"
                placeholder="e.g. DLV-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Division & Sub-Division */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Division
              </label>
              <input
                type="text"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="e.g. VYARA"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Sub-Division
              </label>
              <input
                type="text"
                value={formData.subdivision}
                onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
                placeholder="e.g. DOLVAN"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* In-Charge Engineer Details */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> In-Charge Engineer / Officer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Engineer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Er. R. K. Patel"
                  value={formData.inChargeName}
                  onChange={(e) => setFormData({ ...formData, inChargeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Junior Engineer / DEE"
                  value={formData.inChargeDesignation}
                  onChange={(e) => setFormData({ ...formData, inChargeDesignation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98250 12345"
                  value={formData.inChargePhone}
                  onChange={(e) => setFormData({ ...formData, inChargePhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. engineer@dgvcl.co.in"
                  value={formData.inChargeEmail}
                  onChange={(e) => setFormData({ ...formData, inChargeEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Team Members List */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Team Members / Technicians (Comma Separated)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Kishan Kumar, Ramesh Bhai, Pravin Solanki"
              value={formData.membersText}
              onChange={(e) => setFormData({ ...formData, membersText: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
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
