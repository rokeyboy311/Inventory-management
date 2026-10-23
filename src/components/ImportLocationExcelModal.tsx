import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Receipt, 
  ArrowRight,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { LocationWorkbook } from '../types/performa';
import { createLocationWorkbookFromExcelImport, parseInventoryExcelFile, parseBillExcelFile } from '../utils/inventoryExcelImporter';

interface ImportLocationExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (workbook: LocationWorkbook, autoEnter: boolean) => void;
}

export const ImportLocationExcelModal: React.FC<ImportLocationExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [locationName, setLocationName] = useState('');
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [autoEnter, setAutoEnter] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inventoryPreview, setInventoryPreview] = useState<{ count: number; detectedLoc: string } | null>(null);
  const [billPreview, setBillPreview] = useState<{ ratesCount: number; tenderPct: number } | null>(null);

  const invInputRef = useRef<HTMLInputElement>(null);
  const billInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInventoryFileSelected = async (file: File) => {
    setInventoryFile(file);
    setErrorMsg(null);
    try {
      const res = await parseInventoryExcelFile(file, locationName);
      setInventoryPreview({ count: res.performas.length, detectedLoc: res.detectedLocationName });
      if (!locationName && res.detectedLocationName) {
        setLocationName(res.detectedLocationName);
      }
    } catch (err: any) {
      setErrorMsg(`Inventory file error: ${err.message || 'Could not parse Excel'}`);
      setInventoryPreview(null);
    }
  };

  const handleBillFileSelected = async (file: File) => {
    setBillFile(file);
    try {
      const res = await parseBillExcelFile(file);
      setBillPreview({ ratesCount: Object.keys(res.customRates).length, tenderPct: res.tenderPercentage });
    } catch {
      setBillPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryFile) {
      setErrorMsg('Please select or upload an Inventory Excel file (.xlsx).');
      return;
    }

    const finalLoc = (locationName || inventoryPreview?.detectedLoc || inventoryFile.name.replace(/\.[^/.]+$/, '')).trim();
    if (!finalLoc) {
      setErrorMsg('Please enter a Location Name.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await createLocationWorkbookFromExcelImport({
        locationName: finalLoc,
        inventoryFile,
        billFile
      });

      onImportSuccess(result.workbook, autoEnter);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import Excel files. Please check file format.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setLocationName('');
    setInventoryFile(null);
    setBillFile(null);
    setInventoryPreview(null);
    setBillPreview(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Import Excel Location</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dual-Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Load existing DGVCL inventory &amp; bill records to create a live editable location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Location Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Enter Location Name</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. GIDC ANKLESHWAR, DOLVAN, or VAPI"
              required
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
            />
            <p className="text-[11px] text-slate-400">
              This name will title the location workbook (e.g. <span className="text-emerald-400 font-mono">{locationName ? `${locationName.trim()}.xlsx` : 'GIDC.xlsx'}</span>)
            </p>
          </div>

          {/* 2. Upload Inventory File */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Upload Inventory File (.xlsx)</span>
                <span className="text-red-400">*</span>
              </div>
              {inventoryPreview && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {inventoryPreview.count} Performas
                </span>
              )}
            </label>

            <div
              onClick={() => invInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                inventoryFile 
                  ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10' 
                  : 'border-slate-700 bg-slate-950/50 hover:border-emerald-500/40 hover:bg-slate-950'
              }`}
            >
              <input
                ref={invInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleInventoryFileSelected(e.target.files[0]);
                  }
                }}
              />
              {inventoryFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{inventoryFile.name}</span>
                      <span className="text-[10px] text-slate-400">{(inventoryFile.size / 1024).toFixed(1)} KB · Ready to import</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInventoryFile(null);
                      setInventoryPreview(null);
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 py-1">
                  <UploadCloud className="w-7 h-7 text-emerald-400 mx-auto" />
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400 hover:underline">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Supports GIDC INVENTORY, DOLVAN, or standard performas Excel (.xlsx)</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Upload Bill File (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Upload Bill File (.xlsx)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </div>
              {billPreview && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  {billPreview.ratesCount} SOR Rates · {billPreview.tenderPct}%
                </span>
              )}
            </label>

            <div
              onClick={() => billInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                billFile 
                  ? 'border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-cyan-500/40 hover:bg-slate-950'
              }`}
            >
              <input
                ref={billInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleBillFileSelected(e.target.files[0]);
                  }
                }}
              />
              {billFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{billFile.name}</span>
                      <span className="text-[10px] text-slate-400">{(billFile.size / 1024).toFixed(1)} KB · Custom rates applied</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBillFile(null);
                      setBillPreview(null);
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1 py-0.5">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-cyan-400 hover:underline">Click to upload Bill file</span> (e.g. BILL FORM AND GST GIDC)
                  </div>
                  <p className="text-[10px] text-slate-500">
                    If not uploaded, authentic standard DGVCL SOR Schedule &amp; 20% tender calculation will be applied automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto Enter Checkbox */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoEnter}
                onChange={(e) => setAutoEnter(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span>Enter Location File immediately after import to continue adding entries</span>
            </label>
          </div>

          {/* Flow Information Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All performas will be saved in <strong className="text-emerald-400 font-semibold">Sheet 1 (inventory)</strong> and synchronized with <strong className="text-cyan-400 font-semibold">Sheet 2 (bill)</strong>. You can seamlessly continue adding entry #{inventoryPreview ? inventoryPreview.count + 1 : 1} right after import.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !inventoryFile}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                isLoading || !inventoryFile
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading &amp; Creating Location...</span>
                </>
              ) : (
                <>
                  <span>Create Location &amp; Load Data</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
