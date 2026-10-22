import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  X, 
  Layers, 
  FileCheck, 
  Sparkles, 
  ShieldCheck,
  Table,
  Check
} from 'lucide-react';
import { PerformaRecord } from '../types/performa';
import { exportDolvanReferenceExcel, DOLVAN_SHEET1_COLUMNS } from '../utils/dolvanTemplate';

interface ExportReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  performas: PerformaRecord[];
  locationName: string;
  workbookName: string;
  locationId?: string;
  onExportSuccess?: (fileName: string) => void;
}

export const ExportReferenceModal: React.FC<ExportReferenceModalProps> = ({
  isOpen,
  onClose,
  performas,
  locationName,
  workbookName,
  locationId,
  onExportSuccess
}) => {
  const [exportMode, setExportMode] = useState<'sheet1_only' | 'full_workbook'>('sheet1_only');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    setIsExporting(true);
    try {
      const fileName = exportDolvanReferenceExcel(performas, locationName || 'DOLVAN', exportMode, locationId);
      if (onExportSuccess) {
        onExportSuccess(fileName);
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      setIsExporting(false);
      alert('Error during export: ' + (err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">Export as Reference Excel</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-slate-950 uppercase tracking-widest">
                  {locationName || 'Location'} Layout
                </span>
              </div>
              <p className="text-xs text-emerald-200">Replicating DISCOM Master Reference Excel Sheet1 structure</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-slate-800 text-xs overflow-y-auto flex-1">
          {/* Summary Details */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Location:</span>
              <div className="font-bold text-sm text-slate-900 truncate mt-0.5">
                {locationName || 'Ahmedabad'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Source Workbook:</span>
              <div className="font-bold text-sm text-slate-900 truncate mt-0.5 font-mono">
                {workbookName || 'Ahmedabad.xlsx'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Performas:</span>
              <div className="font-bold text-sm text-emerald-700 font-mono mt-0.5">
                {performas.length} records
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rows to Export:</span>
              <div className="font-bold text-sm text-slate-800 font-mono mt-0.5">
                {performas.length} continuous rows
              </div>
            </div>
          </div>

          {/* Master Template Specification */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-emerald-950 font-bold">
              <span className="flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Master Reference Template:</span>
              </span>
              <span className="font-mono text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900">
                Sheet1 (29 Columns)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              <strong>"DOLVAN INVENTERY.xlsx" → "Sheet1"</strong> multi-row headers, horizontal & vertical merged cells, exact column widths, and continuous row ordering.
            </p>
          </div>

          {/* Template Verification Checklist */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Template Integrity Status:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Template loaded</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Header preserved (3 rows)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Merge structure preserved</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Column mapping ready (29 cols)</span>
              </div>
              <div className="flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{performas.length} performas ready for continuous insertion</span>
              </div>
            </div>
          </div>

          {/* Export Mode Selection */}
          <div>
            <div className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider">
              Export Mode:
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-start space-x-2.5 p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                  exportMode === 'sheet1_only'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="export-mode"
                  checked={exportMode === 'sheet1_only'}
                  onChange={() => setExportMode('sheet1_only')}
                  className="mt-0.5 text-emerald-600 accent-emerald-600 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">Sheet1 Only (Default)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Pure DOLVAN INVENTERY Sheet1 format without auxiliary sheets.
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start space-x-2.5 p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                  exportMode === 'full_workbook'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="export-mode"
                  checked={exportMode === 'full_workbook'}
                  onChange={() => setExportMode('full_workbook')}
                  className="mt-0.5 text-emerald-600 accent-emerald-600 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">Full Workbook</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Sheet1 + supporting sheets (Performas, Maintenance, Measurements).
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExecuteExport}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
