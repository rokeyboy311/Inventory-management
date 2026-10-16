import React from 'react';
import { ImportSummary } from '../types/performa';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  PlusCircle, 
  RefreshCw, 
  X,
  ArrowRight
} from 'lucide-react';

interface ImportSummaryModalProps {
  summary: ImportSummary | null;
  onClose: () => void;
  onImportNewOnly: () => void;
  onUpdateExistingAndAddNew: () => void;
  onReplaceAll?: () => void;
  isReimport?: boolean;
}

export const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({
  summary,
  onClose,
  onImportNewOnly,
  onUpdateExistingAndAddNew,
  onReplaceAll,
  isReimport = false
}) => {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900">Excel Import Summary</h2>
              <p className="text-xs text-slate-500">Sheet: <span className="font-semibold text-blue-700">{summary.sheetName}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metrics Cards */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Existing */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <div className="text-xs text-blue-700 font-semibold mb-0.5">Existing</div>
              <div className="text-2xl font-extrabold text-blue-900 font-mono">{summary.existingCount}</div>
            </div>

            {/* New */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-xs text-emerald-700 font-semibold mb-0.5">New</div>
              <div className="text-2xl font-extrabold text-emerald-900 font-mono">{summary.newCount}</div>
            </div>

            {/* Duplicates */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <div className="text-xs text-amber-700 font-semibold mb-0.5">Duplicates</div>
              <div className="text-2xl font-extrabold text-amber-900 font-mono">{summary.duplicatesCount}</div>
            </div>

            {/* Warnings */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <div className="text-xs text-rose-700 font-semibold mb-0.5">Warnings</div>
              <div className="text-2xl font-extrabold text-rose-900 font-mono">{summary.warningsCount}</div>
            </div>
          </div>

          {/* Detailed warnings if any */}
          {summary.warnings.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Import Analysis Notes</span>
              </div>
              {summary.warnings.map((w, idx) => (
                <div key={idx} className="text-[11px] text-slate-600 pl-5">
                  • {w}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Choose how you would like to merge these records into your current workbook dataset.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onImportNewOnly}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Import New Only ({summary.newCount})
          </button>

          <button
            type="button"
            onClick={onUpdateExistingAndAddNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-all"
          >
            Update Existing + Add New ({summary.newCount + summary.existingCount})
          </button>

          {isReimport && onReplaceAll && (
            <button
              type="button"
              onClick={onReplaceAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium"
            >
              Replace All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
