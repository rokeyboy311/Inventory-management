import React, { useState } from 'react';
import { FileSpreadsheet, Plus, X, MapPin, CheckCircle2 } from 'lucide-react';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCreateLocation: (locationName: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = locationName.trim();
    if (!trimmed) {
      setError('Please enter a location name.');
      return;
    }
    onCreateLocation(trimmed);
    setLocationName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Create Location Excel File</h2>
              <p className="text-xs text-blue-100">Setup a new expandable Performa workbook</p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                placeholder="e.g. KANDHA KONCHAL, AHMEDABAD, SURAT..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
            <p className="text-[11px] text-slate-500 mt-2">
              This will create <strong className="text-blue-700 font-mono">{locationName.trim() ? `${locationName.trim()}.xlsx` : 'YourLocation.xlsx'}</strong>.
              All performas will be saved row-by-row into this Excel file with column mapping.
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-blue-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Continuous Sequential Setup:</span>
            </div>
            <p className="text-[11px] text-blue-800">
              New performa entry will start automatically at <strong className="font-mono">Sr No. 1</strong> with default 0 and "No" selected. Next entries will append consecutively.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Excel Workbook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
