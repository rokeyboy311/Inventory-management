import React, { useState } from 'react';
import { FileSpreadsheet, Plus, X, MapPin, CheckCircle2 } from 'lucide-react';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCreateLocation: (locationName: string, autoEnter?: boolean) => void;
  canClose?: boolean;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
  onCreateLocation,
  canClose = true
}) => {
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent, autoEnter: boolean = false) => {
    e.preventDefault();
    const trimmed = locationName.trim();
    if (!trimmed) {
      setError('Please enter a location name.');
      return;
    }
    onCreateLocation(trimmed, autoEnter);
    setLocationName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/20 text-emerald-100">
                Step 1 of 4
              </span>
              <h2 className="font-extrabold text-base tracking-tight mt-0.5">Create Location Excel File</h2>
              <p className="text-xs text-emerald-100">Each location gets a dedicated Excel file with dual sheets</p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Location Name
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. KANDHA KONCHAL, MANDVI, SURAT..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
            <p className="text-[11px] text-slate-500 mt-2">
              File will be created as <strong className="text-emerald-700 font-mono">{locationName.trim() ? `${locationName.trim().replace(/\s+/g, '_')}.xlsx` : 'LocationName.xlsx'}</strong>.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>4-Step Location Process:</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-emerald-900 space-y-0.5 pt-1">
              <li><strong>Create location excel file</strong> (Generates separate file)</li>
              <li><strong>Enter location excel file</strong> (Opens workspace for this location)</li>
              <li><strong>Enter records</strong> (Fill maintenance rows in Sheet 1: inventory)</li>
              <li><strong>View bill</strong> (Automatic totals & estimates in Sheet 2: bill)</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create File Only</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Create &amp; Enter File (Step 2)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
