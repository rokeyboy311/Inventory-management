import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  Download, 
  HelpCircle, 
  Check, 
  X, 
  Layers, 
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { ColumnMappingConfig } from '../types/performa';

interface ExcelImportSidebarProps {
  onFileUpload: (file: File) => void;
  uploadedFileName: string | null;
  uploadedFileSize?: string;
  onClearUploadedFile: () => void;
  availableSheets: string[];
  activeSheetName: string;
  onSelectSheet: (sheetName: string) => void;
  onDownloadSample: () => void;
  isSheetCompatible: boolean;
  totalPerformasCount: number;
  onViewTable?: () => void;
  onOpenNewPerforma?: () => void;
}

export const ExcelImportSidebar: React.FC<ExcelImportSidebarProps> = ({
  onFileUpload,
  uploadedFileName,
  uploadedFileSize = '2.4 MB',
  onClearUploadedFile,
  availableSheets,
  activeSheetName,
  onSelectSheet,
  onDownloadSample,
  isSheetCompatible,
  totalPerformasCount,
  onViewTable,
  onOpenNewPerforma
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEditMapping, setShowEditMapping] = useState(false);
  
  const defaultMappings: ColumnMappingConfig = {
    location: 'Location of Transformer',
    performaId: 'Performa ID',
    date: 'Date',
    transformerRefNo: 'Transformer Ref. No',
    transformerMake: 'Transformer Make',
    transformerSerialNo: 'Transformer Serial No',
    capacity: 'Capacity',
    material: 'Material',
    labour: 'Labour',
    qty: 'QTY',
    remarks: 'Remarks'
  };

  const [mappings, setMappings] = useState<ColumnMappingConfig>(defaultMappings);
  const [tempMappings, setTempMappings] = useState<ColumnMappingConfig>(defaultMappings);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleAutoMap = () => {
    setMappings(defaultMappings);
  };

  const handleOpenEditMapping = () => {
    setTempMappings({ ...mappings });
    setShowEditMapping(true);
  };

  const handleSaveMapping = () => {
    setMappings({ ...tempMappings });
    setShowEditMapping(false);
  };

  const handleResetMapping = () => {
    setTempMappings(defaultMappings);
  };

  return (
    <div className="w-full space-y-4 text-slate-800">
      {/* 1. Excel Import Card */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Excel Import</h3>
            <p className="text-[11px] text-slate-500">Upload your Excel file to auto-fill the performa.</p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
              : 'border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/40'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-1.5">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-blue-700">Select Excel File</div>
          <div className="text-[10px] text-slate-500 mt-0.5">.xlsx, .xls, .csv (Max 10MB)</div>
        </div>

        {/* Uploaded File Chip */}
        {uploadedFileName && (
          <div className="mt-3 flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                X
              </div>
              <div className="truncate">
                <div className="font-medium text-emerald-950 truncate">{uploadedFileName}</div>
                <div className="text-[10px] text-emerald-600">{uploadedFileSize}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearUploadedFile(); }}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2 cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Sheet Selection Card */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Sheet Selection</h3>
            <p className="text-[11px] text-slate-500">Choose sheet from your workbook.</p>
          </div>
        </div>

        <div className="mt-2">
          <select
            value={activeSheetName}
            onChange={(e) => onSelectSheet(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-600 focus:bg-white outline-none cursor-pointer"
          >
            {availableSheets.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet} {sheet === activeSheetName ? `(${totalPerformasCount} records)` : ''}
              </option>
            ))}
          </select>
        </div>

        {!isSheetCompatible && (
          <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              The sheet "{activeSheetName}" is not formatted as standard Performa rows. Select "Performas" or use Auto-Map.
            </span>
          </div>
        )}

        {/* Quick Actions inside sheet */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col space-y-2">
          {onOpenNewPerforma && (
            <button
              type="button"
              onClick={onOpenNewPerforma}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>+ Add Performa (Sr No. {totalPerformasCount + 1})</span>
            </button>
          )}

          {onViewTable && (
            <button
              type="button"
              onClick={onViewTable}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View All Saved Records ({totalPerformasCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Column Mapping Card */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">Column Mapping</h3>
              <p className="text-[11px] text-slate-500">Map Excel columns to performa fields</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoMap}
          className="w-full mb-3 flex items-center justify-center space-x-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto Map</span>
        </button>

        {/* Mapping list */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-500 font-semibold px-1 pb-1 border-b border-slate-100">
            <span>Excel Column</span>
            <span>Performa Field</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Location</span>
            <span className="font-medium text-blue-700">{mappings.location}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Transformer No</span>
            <span className="font-medium text-blue-700">{mappings.transformerRefNo}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Make</span>
            <span className="font-medium text-blue-700">{mappings.transformerMake}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Serial No</span>
            <span className="font-medium text-blue-700">{mappings.transformerSerialNo}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Capacity</span>
            <span className="font-medium text-blue-700">{mappings.capacity}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Date</span>
            <span className="font-medium text-blue-700">{mappings.date}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Material</span>
            <span className="font-medium text-blue-700">{mappings.material}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Labour</span>
            <span className="font-medium text-blue-700">{mappings.labour}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Qty</span>
            <span className="font-medium text-blue-700">{mappings.qty}</span>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-600">Remarks</span>
            <span className="font-medium text-blue-700">{mappings.remarks}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenEditMapping}
          className="w-full mt-3 flex items-center justify-center space-x-1.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Mapping</span>
        </button>
      </div>

      {/* 4. Sample Data Card */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Sample Data</h3>
            <p className="text-[11px] text-slate-500">You can download a sample Excel file to see the required format.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDownloadSample}
          className="w-full mt-2 flex items-center justify-center space-x-2 py-2 border border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample</span>
        </button>
      </div>

      {/* 5. Help & Info Card */}
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-2.5 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Help & Info</span>
        </div>

        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start space-x-2">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Data is processed locally in your browser</span>
          </li>
          <li className="flex items-start space-x-2">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Supports .xlsx, .xls, .csv files</span>
          </li>
          <li className="flex items-start space-x-2">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>You can edit all fields directly on the form</span>
          </li>
          <li className="flex items-start space-x-2">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Use Preview before printing or exporting</span>
          </li>
        </ul>
      </div>

      {/* Interactive Edit Mapping Modal */}
      {showEditMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Custom Column Mapping</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditMapping(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
              {Object.keys(tempMappings).map((key) => {
                const k = key as keyof ColumnMappingConfig;
                return (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-600 capitalize w-36 truncate">
                      {k.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <input
                      type="text"
                      value={tempMappings[k]}
                      onChange={(e) => setTempMappings({ ...tempMappings, [k]: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-blue-600 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetMapping}
                className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditMapping(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMapping}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Save Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
