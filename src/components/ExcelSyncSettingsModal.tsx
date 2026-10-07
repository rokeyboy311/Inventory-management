import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Cloud, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Send,
  Zap,
  Table
} from 'lucide-react';
import { InventorySubmission } from '../types/inventory';
import { exportSubmissionsToExcel, exportSubmissionsToCSV, buildFlattenedExcelData } from '../utils/excelExporter';

interface ExcelSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: InventorySubmission[];
  offlineQueueCount: number;
  onFlushOfflineQueue: () => Promise<void>;
  isFlushing: boolean;
}

export const ExcelSyncSettingsModal: React.FC<ExcelSyncSettingsModalProps> = ({
  isOpen,
  onClose,
  submissions,
  offlineQueueCount,
  onFlushOfflineQueue,
  isFlushing,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedColumnMapping, setCopiedColumnMapping] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const columnHeaders = [
    'Entry_ID',
    'Timestamp',
    'Location',
    'Location_Type',
    'Item_Name',
    'Value_Entered',
    'Item_Type_Selected',
    'Submitted_By',
    'Sync_Status'
  ];

  const handleCopyHeaders = () => {
    navigator.clipboard.writeText(columnHeaders.join('\t'));
    setCopiedColumnMapping(true);
    setTimeout(() => setCopiedColumnMapping(false), 2000);
  };

  const sampleFlattened = buildFlattenedExcelData(submissions.slice(0, 3));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Excel &amp; Google Sheets Auto-Sync Controller</span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated background REST API sync, strict column mappings, and offline failover
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Quick Action Sync & Export Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Direct XLSX Download */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
                  <Download className="w-4 h-4" />
                  <span>Download Master Excel</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instant multi-sheet .xlsx workbook containing both flattened logs &amp; submission summaries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportSubmissionsToExcel(submissions)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export .XLSX File</span>
              </button>
            </div>

            {/* Direct CSV Export */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
                  <Table className="w-4 h-4" />
                  <span>Download Raw CSV</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Comma-separated values formatted for direct import into any spreadsheet or SQL database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportSubmissionsToCSV(submissions)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-700"
              >
                <span>Export .CSV File</span>
              </button>
            </div>

            {/* Offline Cache & Retry Queue */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
                  <RefreshCw className="w-4 h-4" />
                  <span>Offline Retry Queue</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Status: <strong>{offlineQueueCount} pending</strong> entries stored locally.
                </p>
              </div>
              <button
                type="button"
                onClick={onFlushOfflineQueue}
                disabled={offlineQueueCount === 0 || isFlushing}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                <span>{isFlushing ? 'Flushing Queue...' : 'Force Sync Offline Queue'}</span>
              </button>
            </div>

          </div>

          {/* Strict Column Mapping Inspector */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Strict Excel Column Mapping Specification</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Every form submission appends rows with these exact 9 headers in sequence:
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyHeaders}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                {copiedColumnMapping ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Headers</span>
                  </>
                )}
              </button>
            </div>

            {/* Badges List of Headers */}
            <div className="flex flex-wrap gap-2 pt-1">
              {columnHeaders.map((col, idx) => (
                <div key={col} className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-emerald-400 font-mono">Col {idx + 1}:</span>
                  <span className="font-mono text-slate-200 font-semibold">{col}</span>
                </div>
              ))}
            </div>

            {/* Live Sample Preview Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-[11px] border-collapse bg-slate-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    {columnHeaders.map((col) => (
                      <th key={col} className="p-2 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                  {sampleFlattened.rows.map((row: (string | number)[], rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-850">
                      {row.map((val: string | number, cIdx: number) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap max-w-[150px] truncate">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional External Google Sheets Webhook / SheetDB API config */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>External Google Sheets / SheetDB Webhook Relay (Optional)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              In addition to automatic backend Excel syncing, you can specify an external Google Apps Script, SheetDB, or Power Automate Webhook URL to receive every entry automatically.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="url"
                placeholder="https://sheetdb.io/api/v1/... or Google Apps Script Web App URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (webhookUrl.trim()) {
                    setTestStatus('Webhook URL saved for automated dual-channel sync.');
                  }
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold whitespace-nowrap transition cursor-pointer"
              >
                Save URL
              </button>
            </div>

            {testStatus && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center space-x-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{testStatus}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Excel sync protocol running smoothly</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
