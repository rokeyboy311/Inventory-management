import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  FileSpreadsheet, 
  ShieldCheck, 
  Play, 
  HelpCircle,
  HardDrive,
  Share2,
  Users,
  Link2
} from 'lucide-react';
import { GoogleSheetsService } from '../services/googleSheetsSync';
import { generateGoogleAppsScriptCode } from '../utils/googleAppsScriptTemplate';
import { InventorySubmission } from '../types/inventory';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: InventorySubmission[];
  onSubmissionsRestored: (submissions: InventorySubmission[]) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onSubmissionsRestored,
}) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTeamLink, setCopiedTeamLink] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sheetName?: string } | null>(null);
  
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncAllMsg, setSyncAllMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [fetchingAll, setFetchingAll] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'connect' | 'team_auto' | 'script' | 'instructions'>('connect');

  const appsScriptCode = generateGoogleAppsScriptCode();

  useEffect(() => {
    if (isOpen) {
      const currentUrl = GoogleSheetsService.getScriptUrl();
      setScriptUrl(currentUrl);
      setAutoSync(GoogleSheetsService.isAutoSyncEnabled());
      setTestResult(null);
      setSyncAllMsg(null);
      setFetchMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyTeamLink = () => {
    const link = GoogleSheetsService.getShareableTeamLink(scriptUrl.trim());
    if (!link) {
      alert('Please save your Google Apps Script Web App URL first.');
      return;
    }
    navigator.clipboard.writeText(link);
    setCopiedTeamLink(true);
    setTimeout(() => setCopiedTeamLink(false), 3000);
  };

  const handleSaveAndTest = async () => {
    if (!scriptUrl.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid Google Apps Script Web App URL.' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    // Save URL locally & to shared server
    GoogleSheetsService.setScriptUrl(scriptUrl.trim(), true);
    GoogleSheetsService.setAutoSyncEnabled(autoSync);

    const result = await GoogleSheetsService.testConnection(scriptUrl.trim());
    setTestLoading(false);
    setTestResult({
      success: result.success,
      message: result.message,
      sheetName: result.sheetName
    });
  };

  const handlePushAllToCloud = async () => {
    if (!scriptUrl.trim()) {
      alert('Please configure and connect your Google Apps Script Web App URL first.');
      return;
    }
    setSyncingAll(true);
    setSyncAllMsg(null);

    const res = await GoogleSheetsService.pushAllSubmissions(submissions, scriptUrl.trim());
    setSyncingAll(false);
    if (res.success) {
      setSyncAllMsg({ type: 'success', text: res.message || `Successfully backed up ${submissions.length} entries to Google Sheets!` });
    } else {
      setSyncAllMsg({ type: 'error', text: res.message || 'Error syncing data with Google Sheets.' });
    }
  };

  const handleFetchAllFromCloud = async () => {
    if (!scriptUrl.trim()) {
      alert('Please configure and connect your Google Apps Script Web App URL first.');
      return;
    }
    setFetchingAll(true);
    setFetchMsg(null);

    const res = await GoogleSheetsService.fetchSubmissions(scriptUrl.trim());
    setFetchingAll(false);
    if (res.success && res.submissions.length > 0) {
      onSubmissionsRestored(res.submissions);
      setFetchMsg({ type: 'success', text: `Successfully loaded ${res.submissions.length} entries from Google Sheets!` });
    } else if (res.success && res.submissions.length === 0) {
      setFetchMsg({ type: 'success', text: 'Connected to Google Sheets, but the sheet has no entries yet.' });
    } else {
      setFetchMsg({ type: 'error', text: res.message || 'Failed to fetch data from cloud.' });
    }
  };

  const isConnected = !!scriptUrl.trim() && (testResult ? testResult.success : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950/40">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Google Sheets &amp; Google Drive Cloud Connect</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  100% Free Lifetime
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                GitHub + Vercel Deployment • Permanent Cloud Storage • Auto-Restore on Cache Clear
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 space-x-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'connect'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Connection &amp; Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team_auto')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'team_auto'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Users Auto-Connect 👥</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'script'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Apps Script Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Setup Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: CONNECT & SYNC CONTROLS */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    scriptUrl.trim() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                      <span>Cloud Sync Status:</span>
                      {scriptUrl.trim() ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Google Sheets Connected
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Not Connected</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {scriptUrl.trim() 
                        ? 'All submissions auto-sync to your Google Sheet in Google Drive. Cache clear will not delete records.' 
                        : 'Connect your free Google Apps Script Web App URL below to start auto-syncing.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <input 
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => {
                        setAutoSync(e.target.checked);
                        GoogleSheetsService.setAutoSyncEnabled(e.target.checked);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs font-medium">Auto-Sync on Save</span>
                  </label>
                </div>
              </div>

              {/* Web App URL Configuration */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-slate-200 font-bold">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAndTest}
                    disabled={testLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                    <span>{testLoading ? 'Testing...' : 'Save & Test Connection'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl flex items-center space-x-2 border text-xs ${
                    testResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.sheetName && <p className="text-[11px] opacity-80">Sheet: {testResult.sheetName}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Cloud Sync Actions: Pull & Push */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Action 1: Pull from Google Sheets (Restore Records) */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-1">
                      <DownloadCloud className="w-4 h-4" />
                      <span>1. Restore / Fetch from Google Sheets</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      If your browser cache is cleared or you open the app on another device, click here to instantly restore all historical records from Google Sheets.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleFetchAllFromCloud}
                      disabled={fetchingAll || !scriptUrl.trim()}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
                    >
                      <DownloadCloud className={`w-4 h-4 ${fetchingAll ? 'animate-bounce' : ''}`} />
                      <span>{fetchingAll ? 'Fetching from Google Sheets...' : 'Fetch All Cloud Records'}</span>
                    </button>
                    {fetchMsg && (
                      <p className={`text-[11px] ${fetchMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fetchMsg.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action 2: Push All to Google Sheets (Backup All) */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-1">
                      <UploadCloud className="w-4 h-4" />
                      <span>2. Backup Local Records to Google Sheets</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Backup all current <strong>{submissions.length} entries</strong> to Google Sheets and Google Drive with a single click.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handlePushAllToCloud}
                      disabled={syncingAll || !scriptUrl.trim()}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
                    >
                      <UploadCloud className={`w-4 h-4 ${syncingAll ? 'animate-pulse' : ''}`} />
                      <span>{syncingAll ? 'Syncing to Google Sheets...' : `Backup ${submissions.length} Entries to Cloud`}</span>
                    </button>
                    {syncAllMsg && (
                      <p className={`text-[11px] ${syncAllMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {syncAllMsg.text}
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: ALL USERS AUTO CONNECT */}
          {activeTab === 'team_auto' && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Automatic Connection Setup for All Users</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                        Zero Setup for Field Workers
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Ensure site engineers, supervisors, and workers connect automatically without any manual settings:
                    </p>
                  </div>
                </div>
              </div>

              {/* Method 1: One-Click Shareable Team Link */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <h4 className="font-bold text-white text-xs">
                      Method 1: One-Click Team Link (Quick &amp; Easy via WhatsApp / Email)
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    Fastest
                  </span>
                </div>

                <p className="text-slate-400 text-[11px]">
                  Copy the link below and share it with your team. When they open this link, their browser will automatically link with your Google Sheet and Google Drive in 1 second!
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={GoogleSheetsService.getShareableTeamLink(scriptUrl.trim()) || 'Save your Google Apps Script URL above first'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono text-[11px] focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyTeamLink}
                    disabled={!scriptUrl.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                  >
                    {copiedTeamLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTeamLink ? 'Link Copied! ✓' : 'Copy Team Link'}</span>
                  </button>
                </div>
              </div>

              {/* Method 2: Global Server Sync */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h4 className="font-bold text-white text-xs">
                    Method 2: Central Server Auto-Sync (Shared Backend URL)
                  </h4>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  When you save your Google Apps Script URL in this modal, it is automatically saved to the backend server. Whenever any team member opens your site, their browser automatically retrieves this shared URL and stays connected.
                </p>
              </div>

              {/* Method 3: Vercel Environment Variable */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h4 className="font-bold text-white text-xs">
                    Method 3: Vercel Environment Variable (Permanent Global Default)
                  </h4>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  If your project is hosted on Vercel, configure this environment variable once to connect every visitor automatically worldwide:
                </p>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <p className="text-slate-400 font-sans text-[10px]">Add to Vercel Dashboard &gt; Project Settings &gt; Environment Variables:</p>
                  <p className="text-cyan-300">Key: <span className="text-white font-bold">VITE_GOOGLE_SHEETS_SCRIPT_URL</span></p>
                  <p className="text-emerald-300 truncate">Value: <span className="text-slate-200">{scriptUrl.trim() || 'Your Apps Script Web App URL'}</span></p>
                </div>
                <p className="text-[10px] text-slate-500">
                  After saving, click "Redeploy" in Vercel. Any user opening the site from any browser or phone will automatically connect to your Google Sheet!
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: GOOGLE APPS SCRIPT CODE */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-xs">Google Apps Script Ready-to-use Code</h3>
                  <p className="text-[11px] text-slate-400">
                    Copy this code and paste it into your Google Sheet under <strong>Extensions &gt; Apps Script</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-96 leading-relaxed select-all">
                  <code>{appsScriptCode}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: STEP-BY-STEP INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs text-slate-300">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>How to Connect Google Sheets and Google Drive (2-Minute Setup):</span>
                </h3>

                <ol className="list-decimal list-inside space-y-3 pl-1 leading-relaxed">
                  <li className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-white">Step 1: Create a new Google Sheet</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Open <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-mono">sheets.new</a> in your browser and name the sheet (e.g. <em>"Site Inventory Master"</em>).
                    </p>
                  </li>

                  <li className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-white">Step 2: Open Apps Script</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      In the Google Sheet top menu, click <strong>Extensions &gt; Apps Script</strong>.
                    </p>
                  </li>

                  <li className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-white">Step 3: Paste Code</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Remove any existing code in the editor, copy the entire script from the <strong>"Google Apps Script Code"</strong> tab above, paste it, and save (Ctrl+S / Cmd+S).
                    </p>
                  </li>

                  <li className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-white">Step 4: Deploy as Web App (Important)</strong>
                    <div className="text-slate-400 text-[11px] mt-1 space-y-1">
                      <p>1. At the top right, click <strong>Deploy &gt; New deployment</strong>.</p>
                      <p>2. Click the gear icon (⚙️) next to Select type and select <strong>Web app</strong>.</p>
                      <p>3. Set <strong>Execute as:</strong> "Me".</p>
                      <p>4. Set <strong>Who has access:</strong> <span className="text-amber-300 font-bold">"Anyone"</span> (allows your web app to save entries).</p>
                      <p>5. Click <strong>Deploy</strong> and grant access permissions with your Google Account.</p>
                    </div>
                  </li>

                  <li className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-white">Step 5: Paste Web App URL here</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Copy the generated <strong>Web app URL</strong> (ending in <code className="text-emerald-400 font-mono">/exec</code>) and paste it into the <strong>"Google Apps Script Web App URL"</strong> field on the Connection tab.
                    </p>
                  </li>
                </ol>
              </div>

              {/* Vercel Environment Variables Tip */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vercel Deployment Tips (Global Setup):</span>
                </h4>
                <p className="text-slate-300 text-[11px]">
                  If you want every user to connect automatically without manual configuration, add this to Vercel Dashboard &gt; Project Settings &gt; <strong>Environment Variables</strong>:
                </p>
                <code className="block bg-slate-950 p-2 rounded-lg text-emerald-300 font-mono text-[11px] border border-slate-800">
                  VITE_GOOGLE_SHEETS_SCRIPT_URL = &lt;Your Apps Script Web App URL&gt;
                </code>
                <p className="text-slate-400 text-[10px]">
                  After saving, click "Redeploy" in Vercel. All users visiting your site from any device will automatically connect to your Google Sheet!
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Free Lifetime Storage in your own Google Drive</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
