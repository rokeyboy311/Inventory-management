import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  FileSpreadsheet, 
  Send, 
  Play, 
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { 
  getVbaMacroSnippet, 
  getOfficeScriptSnippet, 
  getPythonSnippet, 
  getGoogleSheetsScriptSnippet 
} from '../utils/codeSnippets';

interface WebhookIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestWebhookPing: () => Promise<void>;
  isPinging: boolean;
}

export const WebhookIntegrationModal: React.FC<WebhookIntegrationModalProps> = ({
  isOpen,
  onClose,
  onTestWebhookPing,
  isPinging,
}) => {
  const [activeTab, setActiveTab] = useState<'vba' | 'office' | 'python' | 'gsheet' | 'curl'>('vba');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${origin}/api/webhook/excel-inbound`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'vba':
        return getVbaMacroSnippet(webhookUrl);
      case 'office':
        return getOfficeScriptSnippet(webhookUrl);
      case 'python':
        return getPythonSnippet(webhookUrl);
      case 'gsheet':
        return getGoogleSheetsScriptSnippet(webhookUrl);
      case 'curl':
        return `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "sheetName": "Live_Excel_Push",
    "workbookName": "Excel_Test.xlsx",
    "sender": "cURL REST Client",
    "columns": ["Product", "Price", "Qty", "Status"],
    "rows": [
      ["Surface Studio 2", 3499, 12, "In Stock"],
      ["Dell UltraSharp 32", 899, 25, "In Stock"]
    ]
  }'`;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect Excel with Real-Time Data Sync</h2>
              <p className="text-xs text-slate-400">
                Setup real-time bi-directional sync with Microsoft Excel Desktop, Excel 365, or Python
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Webhook Endpoint Banner */}
        <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">Live Webhook URL:</span>
            <code className="bg-slate-950 px-3 py-1 rounded-md text-emerald-400 font-mono border border-slate-800">
              {webhookUrl}
            </code>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                alert('Webhook URL copied to clipboard!');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy URL</span>
            </button>
            <button
              onClick={onTestWebhookPing}
              disabled={isPinging}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPinging ? 'Sending Test...' : 'Send Test Ping'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-2 space-x-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('vba')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'vba'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Desktop (VBA Macro)</span>
          </button>

          <button
            onClick={() => setActiveTab('office')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'office'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Excel 365 (Office Scripts)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Python Live Watcher</span>
          </button>

          <button
            onClick={() => setActiveTab('gsheet')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'gsheet'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('curl')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'curl'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>cURL / REST API</span>
          </button>
        </div>

        {/* Code Content & Step-by-Step Instructions */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Instructions Box */}
          <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 text-xs text-slate-300">
            {activeTab === 'vba' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>Open Microsoft Excel on your computer.</li>
                <li>Press <kbd className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 font-mono">Alt + F11</kbd> to open the VBA Editor.</li>
                <li>Click <strong>Insert &gt; Module</strong> and paste the script below.</li>
                <li>Run <code className="text-emerald-300">SyncActiveSheetToWebApp</code> or save the workbook to sync in real-time!</li>
              </ol>
            )}
            {activeTab === 'office' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your workbook in <strong>Excel for Web (Microsoft 365)</strong>.</li>
                <li>Go to the <strong>Automate</strong> tab &gt; click <strong>New Script</strong>.</li>
                <li>Paste the script below and click <strong>Run</strong> or set an automated trigger.</li>
              </ol>
            )}
            {activeTab === 'python' && (
              <p>
                Run this lightweight background watcher to automatically push edits whenever your local <code className="text-emerald-300">.xlsx</code> file is saved!
              </p>
            )}
            {activeTab === 'gsheet' && (
              <p>
                Open Google Sheets &gt; <strong>Extensions &gt; Apps Script</strong> &gt; Paste code. Edits will sync to your web app in real time!
              </p>
            )}
            {activeTab === 'curl' && (
              <p>
                Send HTTP POST requests from any programming language (Python, Node.js, C#, PHP) or Zapier / Power Automate.
              </p>
            )}
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer z-10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800 max-h-72">
              <code>{getActiveCode()}</code>
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Real-Time Channel (SSE + JSON API)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
