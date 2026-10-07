import React, { useState } from 'react';
import { X, Save, Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { InventorySubmission, InventoryItemValue } from '../types/inventory';

interface EditSubmissionModalProps {
  submission: InventorySubmission | null;
  onClose: () => void;
  onSaveEdit: (updated: InventorySubmission) => Promise<void>;
}

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  submission,
  onClose,
  onSaveEdit,
}) => {
  if (!submission) return null;

  const [location, setLocation] = useState(submission.location);
  const [locationType, setLocationType] = useState(submission.locationType);
  const [submittedBy, setSubmittedBy] = useState(submission.submittedBy);
  const [notes, setNotes] = useState(submission.notes || '');
  const [items, setItems] = useState<InventoryItemValue[]>(
    submission.items.map(it => ({
      ...it,
      optionValues: it.optionValues ? { ...it.optionValues } : {}
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemValueChange = (index: number, field: 'value' | 'selectedType', val: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleSubOptionValueChange = (index: number, optionKey: string, val: string | number) => {
    const updated = [...items];
    const item = { ...updated[index] };
    const currentOptVals = { ...(item.optionValues || {}) };
    if (val === '' || val === undefined) {
      delete currentOptVals[optionKey];
    } else {
      currentOptVals[optionKey] = val;
    }
    item.optionValues = currentOptVals;
    updated[index] = item;
    setItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Location cannot be empty');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSaveEdit({
        ...submission,
        location: location.trim(),
        locationType,
        submittedBy: submittedBy.trim() || 'Site Supervisor',
        notes: notes.trim() || undefined,
        items
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Entry #{submission.id}</h2>
              <p className="text-xs text-slate-400">Modify quantities, specifications, and notes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center space-x-2 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Site Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Location Type</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as 'In house' | 'Maintenance')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="In house">1st: In house</option>
                <option value="Maintenance">2nd: Maintenance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Submitted By</label>
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Notes / Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Items Editing */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-white">Item Values & Sub-options</h3>
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const optVals = item.optionValues || {};
                const hasSubOptions = Object.keys(optVals).length > 0;

                return (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{item.itemName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.fieldType}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Primary Value / Qty</label>
                        <input
                          type="text"
                          placeholder="Value / Qty"
                          value={item.value !== undefined ? String(item.value) : ''}
                          onChange={(e) => handleItemValueChange(idx, 'value', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      {item.fieldType !== 'input_only' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Specification / Selected Type</label>
                          <input
                            type="text"
                            placeholder="Selected Type (e.g. 100, 200, 500, Armoured)"
                            value={item.selectedType || ''}
                            onChange={(e) => handleItemValueChange(idx, 'selectedType', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* If item has sub-options values recorded */}
                    {hasSubOptions && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <label className="text-[10px] text-emerald-400 font-semibold block mb-1.5">
                          Sub-Option Specific Quantities (Excel Columns)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(optVals).map(([optKey, optVal]) => (
                            <div key={optKey} className="bg-slate-900 p-1.5 rounded-lg border border-slate-700/60">
                              <span className="text-[10px] text-slate-300 font-mono block truncate">{optKey}</span>
                              <input
                                type="text"
                                value={optVal !== undefined ? String(optVal) : ''}
                                onChange={(e) => handleSubOptionValueChange(idx, optKey, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-emerald-300 text-center font-bold mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save & Sync Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
