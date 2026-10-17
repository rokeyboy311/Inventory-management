import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  UploadCloud, 
  FileText, 
  Save, 
  Undo2, 
  Redo2, 
  Eye, 
  Printer, 
  FileSpreadsheet, 
  FileCheck, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Layers, 
  ListOrdered,
  PlusCircle,
  AlertCircle,
  Table,
  FolderPlus,
  ArrowLeft,
  Trash2,
  Download,
  Shield,
  Users,
  Database
} from 'lucide-react';

import { 
  PerformaRecord, 
  LocationWorkbook, 
  ImportSummary, 
  createBlankPerforma,
  DEFAULT_PERFORMA_ITEMS_TEMPLATE,
  BillSheetDefinition
} from './types/performa';

import { Team } from './types/team';

import { 
  getNextPerformaId, 
  checkDuplicatePerformaId 
} from './utils/idGenerator';

import { 
  loadWorkbooksFromStorage, 
  saveWorkbookToStorage, 
  deleteWorkbookFromStorage,
  saveUnsavedDraft, 
  getUnsavedDraft, 
  clearUnsavedDraft,
  createNewLocationWorkbookWithDualSheets,
  loadTeamsFromStorage,
  saveTeamToStorage,
  syncBroadcastChannel,
  UnsavedDraftState
} from './utils/storage';

import { 
  parseUploadedExcel, 
  analyzeSheetForPerformas, 
  exportPerformasToExcel, 
  downloadSampleExcel 
} from './utils/excelHandler';

import { 
  exportDualSheetLocationExcel, 
  createDefaultBillSheet 
} from './utils/dolvanTemplate';

import { A4PerformaDocument } from './components/A4PerformaDocument';
import { ExcelImportSidebar } from './components/ExcelImportSidebar';
import { PerformaListDrawer } from './components/PerformaListDrawer';
import { ImportSummaryModal } from './components/ImportSummaryModal';
import { DraftRecoveryBanner } from './components/DraftRecoveryBanner';
import { CreateLocationModal } from './components/CreateLocationModal';
import { ExcelDataTable } from './components/ExcelDataTable';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAInstallModal } from './components/PWAInstallModal';
import { EngineerProfileModal } from './components/EngineerProfileModal';
import { ExportReferenceModal } from './components/ExportReferenceModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { UserDashboard } from './components/user/UserDashboard';
import { BillSheetViewer } from './components/BillSheetViewer';
import { SupabaseSettingsModal } from './components/admin/SupabaseSettingsModal';

export function App() {
  // -------------------------------------------------------------
  // Route Management: /admin vs /
  // -------------------------------------------------------------
  const [currentRoute, setCurrentRoute] = useState<'user' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'user';
  });

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      if (path.startsWith('/admin') || path === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('user');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('user');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // -------------------------------------------------------------
  // Core State: Teams & Workbooks
  // -------------------------------------------------------------
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isWorkbookOpen, setIsWorkbookOpen] = useState(false);

  // All workbooks / locations
  const [workbooks, setWorkbooks] = useState<LocationWorkbook[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>('dolvan');
  const [activeSheetName, setActiveSheetName] = useState<string>('inventory');

  // Main view tab: 'form' (A4 document) vs 'table' (Excel sheet data table) vs 'files' (Mobile sidebar)
  const [mainViewTab, setMainViewTab] = useState<'form' | 'table' | 'files'>('form');

  // Modals
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isExportReferenceModalOpen, setIsExportReferenceModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Active performa currently in the A4 editor
  const [currentPerforma, setCurrentPerforma] = useState<PerformaRecord>(() => 
    createBlankPerforma('DOL-001', '')
  );

  // Original ID of current performa if editing an existing record
  const [originalEditingId, setOriginalEditingId] = useState<string | null>(null);

  // Duplicate ID warning state
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'print'>('edit');

  // Excel upload & import state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('2.4 MB');
  const [pendingParsedWorkbook, setPendingParsedWorkbook] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Performa records list drawer
  const [isRecordsDrawerOpen, setIsRecordsDrawerOpen] = useState(false);

  // Draft recovery
  const [unsavedDraft, setUnsavedDraft] = useState<UnsavedDraftState | null>(null);

  // Status message
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<PerformaRecord[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Direct file input ref for top action bar upload
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);

  // Active workbook helper
  const activeWorkbook = workbooks.find(w => w.locationId === activeLocationId) || workbooks[0];
  const activeSheet = activeWorkbook?.sheets[activeSheetName] || activeWorkbook?.sheets['inventory'] || activeWorkbook?.sheets['Performas'];
  const activePerformas: PerformaRecord[] = activeSheet?.performas || [];

  // Show notification banner helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Initialize history with a clean baseline record
  const initHistory = (rec: PerformaRecord) => {
    setHistory([JSON.parse(JSON.stringify(rec))]);
    setHistoryIndex(0);
  };

  // Push to history for undo / redo
  const pushToHistory = (rec: PerformaRecord) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push(JSON.parse(JSON.stringify(rec)));
      if (nextHistory.length > 30) nextHistory.shift();
      return nextHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  // -------------------------------------------------------------
  // Initial Data Loading & Real-time Sync
  // -------------------------------------------------------------
  const reloadData = async () => {
    const loadedTeams = await loadTeamsFromStorage();
    const loadedWorkbooks = await loadWorkbooksFromStorage();
    setTeams(loadedTeams);
    setWorkbooks(loadedWorkbooks);

    // If selected team is not set, set default first team
    if (!selectedTeam && loadedTeams.length > 0) {
      setSelectedTeam(loadedTeams[0]);
    }
  };

  useEffect(() => {
    reloadData();

    // Listen to real-time broadcast channel from Admin/User tabs
    const handleBroadcast = () => {
      reloadData();
    };

    syncBroadcastChannel?.addEventListener('message', handleBroadcast);
    return () => {
      syncBroadcastChannel?.removeEventListener('message', handleBroadcast);
    };
  }, []);

  // Update last saved timestamp
  const recordSaveTimestamp = () => {
    const now = new Date();
    setLastSavedTime(now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Auto-save draft on performa edits
  useEffect(() => {
    if (activeWorkbook && currentPerforma && currentPerforma.id) {
      saveUnsavedDraft(activeWorkbook.locationId, activeSheetName, currentPerforma);
    }
  }, [currentPerforma, activeLocationId, activeSheetName]);

  // Handle Performa change in editor
  const handlePerformaChange = (updated: PerformaRecord) => {
    setCurrentPerforma(updated);
    pushToHistory(updated);
    if (duplicateError) {
      setDuplicateError(null);
    }
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentPerforma({ ...prev });
      showNotification('Undo applied', 'info');
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentPerforma({ ...next });
      showNotification('Redo applied', 'info');
    }
  };

  // -------------------------------------------------------------
  // Location Excel Creation (Dual Sheets: inventory + bill)
  // -------------------------------------------------------------
  const handleCreateLocationWorkbook = async (locationName: string) => {
    const teamId = selectedTeam ? selectedTeam.id : (teams[0]?.id || 'team-dolvan-maintenance');
    const newWb = createNewLocationWorkbookWithDualSheets(locationName, teamId);
    const updated = [...workbooks, newWb];
    setWorkbooks(updated);
    setActiveLocationId(newWb.locationId);
    setActiveSheetName('inventory');
    await saveWorkbookToStorage(newWb);

    // Initial performa starts with sample data row
    const sample = newWb.sheets['inventory']?.performas[0] || createBlankPerforma('DOL-001', locationName);
    setCurrentPerforma(sample);
    setOriginalEditingId(sample.id);
    initHistory(sample);
    setIsCreateLocationModalOpen(false);
    setIsWorkbookOpen(true);
    setMainViewTab('form');
    showNotification(`Excel file "${newWb.workbookName}" created with 2 sheets: inventory & bill!`);
  };

  // -------------------------------------------------------------
  // Performa CRUD Operations
  // -------------------------------------------------------------

  // Save current Performa record into dataset
  const saveCurrentPerformaInternal = (performaToSave: PerformaRecord): boolean => {
    if (!activeWorkbook || !activeSheet) return false;

    const trimmedId = performaToSave.id.trim();
    if (!trimmedId) {
      setDuplicateError('Performa ID cannot be empty');
      return false;
    }

    // Check duplicate
    const isDuplicate = checkDuplicatePerformaId(
      trimmedId,
      activePerformas,
      originalEditingId || undefined
    );

    if (isDuplicate) {
      setDuplicateError(`Performa ID "${trimmedId}" already exists.`);
      return false;
    }

    const nextPerformas = [...activePerformas];
    const existingIndex = originalEditingId 
      ? nextPerformas.findIndex(p => p.id.trim().toLowerCase() === originalEditingId.trim().toLowerCase())
      : -1;

    const recordToPersist: PerformaRecord = {
      ...performaToSave,
      id: trimmedId,
      status: 'saved',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Retain original row position for edited records
      nextPerformas[existingIndex] = recordToPersist;
    } else {
      // Append new records to the end
      nextPerformas.push(recordToPersist);
    }

    // Update workbook
    const updatedSheets = {
      ...activeWorkbook.sheets,
      [activeSheetName]: {
        ...activeSheet,
        performas: nextPerformas,
        rawRowsCount: nextPerformas.length
      }
    };

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: updatedSheets,
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );

    setWorkbooks(updatedWorkbooks);
    saveWorkbookToStorage(updatedWorkbook);
    recordSaveTimestamp();
    clearUnsavedDraft();
    setUnsavedDraft(null);
    setDuplicateError(null);
    return true;
  };

  // Action: Save & Close / Save Draft
  const handleSaveAndClose = () => {
    const success = saveCurrentPerformaInternal(currentPerforma);
    if (success) {
      setOriginalEditingId(currentPerforma.id);
      showNotification(`Saved Performa ${currentPerforma.id} successfully!`);
    }
  };

  // Action: Save & Add Another (Continuous Entry)
  const handleSaveAndAddAnother = () => {
    const success = saveCurrentPerformaInternal(currentPerforma);
    if (!success) return;

    const updatedPerformas = [...activePerformas];
    const existingIndex = originalEditingId 
      ? updatedPerformas.findIndex(p => p.id.trim().toLowerCase() === originalEditingId.trim().toLowerCase())
      : -1;

    if (existingIndex >= 0) {
      updatedPerformas[existingIndex] = currentPerforma;
    } else {
      updatedPerformas.push(currentPerforma);
    }

    const nextId = getNextPerformaId(updatedPerformas, activeWorkbook.locationName);
    const freshPerforma = createBlankPerforma(nextId, currentPerforma.location || '');
    freshPerforma.date = currentPerforma.date;

    setCurrentPerforma(freshPerforma);
    setOriginalEditingId(null);
    setDuplicateError(null);
    initHistory(freshPerforma);

    showNotification(`Performa ${currentPerforma.id} saved! Now entering ${nextId}`, 'info');
  };

  // Action: + Add New Performa
  const handleStartNewPerforma = () => {
    if (!activeWorkbook) return;
    const nextId = getNextPerformaId(activePerformas, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    setDuplicateError(null);
    initHistory(fresh);
    setViewMode('edit');
    setMainViewTab('form');
    showNotification(`New blank performa created: ${nextId}`);
  };

  // Select an existing performa to view / edit
  const handleSelectPerforma = (id: string) => {
    const found = activePerformas.find(p => p.id === id);
    if (found) {
      setCurrentPerforma({ ...found });
      setOriginalEditingId(found.id);
      setDuplicateError(null);
      initHistory(found);
      setViewMode('edit');
      setMainViewTab('form');
      showNotification(`Editing Performa ${found.id}`);
    }
  };

  // Delete performa with confirmation
  const handleDeletePerforma = (idToDelete?: string) => {
    const targetId = idToDelete || currentPerforma.id;
    if (!window.confirm(`Are you sure you want to delete Performa ${targetId}?`)) {
      return;
    }

    const filtered = activePerformas.filter(p => p.id !== targetId);
    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: {
        ...activeWorkbook.sheets,
        [activeSheetName]: {
          ...activeSheet,
          performas: filtered,
          rawRowsCount: filtered.length
        }
      },
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );

    setWorkbooks(updatedWorkbooks);
    saveWorkbookToStorage(updatedWorkbook);

    // Next entry continues from highest Sr No
    const nextId = getNextPerformaId(filtered, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    initHistory(fresh);

    showNotification(`Deleted Performa ${targetId}`, 'info');
  };

  // Update Bill Sheet
  const handleUpdateBillSheet = (updatedBill: BillSheetDefinition) => {
    if (!activeWorkbook) return;
    const updatedSheets = {
      ...activeWorkbook.sheets,
      'bill': {
        name: 'bill',
        type: 'bill' as const,
        performas: [],
        isCompatible: true,
        rawRowsCount: updatedBill.items.length,
        billData: updatedBill
      }
    };

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: updatedSheets,
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );
    setWorkbooks(updatedWorkbooks);
    saveWorkbookToStorage(updatedWorkbook);
  };

  // Navigation between performas
  const currentIndex = activePerformas.findIndex(p => p.id === currentPerforma.id);
  const canGoPrev = currentIndex > 0 || (currentIndex === -1 && activePerformas.length > 0);

  const handlePrevPerforma = () => {
    if (currentIndex > 0) {
      handleSelectPerforma(activePerformas[currentIndex - 1].id);
    } else if (currentIndex === -1 && activePerformas.length > 0) {
      handleSelectPerforma(activePerformas[activePerformas.length - 1].id);
    }
  };

  const handleNextPerforma = () => {
    if (currentIndex >= 0 && currentIndex < activePerformas.length - 1) {
      handleSelectPerforma(activePerformas[currentIndex + 1].id);
    } else {
      handleStartNewPerforma();
    }
  };

  // Print
  const handlePrint = () => {
    setViewMode('print');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // -------------------------------------------------------------
  // ROUTE 1: ADMIN PANEL (/admin)
  // -------------------------------------------------------------
  if (currentRoute === 'admin') {
    return (
      <AdminPanel
        onNavigateToUser={(teamId) => {
          navigateTo('/');
          if (teamId) {
            const found = teams.find(t => t.id === teamId);
            if (found) {
              setSelectedTeam(found);
              setIsWorkbookOpen(false);
            }
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // ROUTE 2: USER DASHBOARD (/) - TEAM & EXCEL SELECTION
  // -------------------------------------------------------------
  if (!isWorkbookOpen) {
    return (
      <>
        <UserDashboard
          teams={teams}
          workbooks={workbooks}
          selectedTeam={selectedTeam}
          onSelectTeam={(team) => {
            setSelectedTeam(team);
          }}
          onClearSelectedTeam={() => {
            setSelectedTeam(null);
          }}
          onOpenWorkbook={(wb) => {
            setActiveLocationId(wb.locationId);
            const targetSheet = wb.sheets['inventory'] ? 'inventory' : Object.keys(wb.sheets)[0];
            setActiveSheetName(targetSheet);
            setIsWorkbookOpen(true);
            setMainViewTab('form');

            const sheet = wb.sheets[targetSheet];
            const performas = sheet?.performas || [];
            if (performas.length > 0) {
              setCurrentPerforma(performas[0]);
              setOriginalEditingId(performas[0].id);
              initHistory(performas[0]);
            } else {
              const nextId = getNextPerformaId([], wb.locationName);
              const blank = createBlankPerforma(nextId, '');
              setCurrentPerforma(blank);
              setOriginalEditingId(null);
              initHistory(blank);
            }
          }}
          onCreateLocationClick={() => setIsCreateLocationModalOpen(true)}
          onDeleteWorkbook={async (locId) => {
            await deleteWorkbookFromStorage(locId);
            const reloaded = await loadWorkbooksFromStorage();
            setWorkbooks(reloaded);
            showNotification('Location Excel deleted.');
          }}
          onNavigateToAdmin={() => navigateTo('/admin')}
        />

        {/* Create Location Modal */}
        <CreateLocationModal
          isOpen={isCreateLocationModalOpen}
          onClose={() => setIsCreateLocationModalOpen(false)}
          onCreateLocation={handleCreateLocationWorkbook}
          canClose={true}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // ROUTE 3: LOCATION EXCEL WORKSPACE (Performa CRUD + Dual Sheets)
  // -------------------------------------------------------------
  const isBillSheet = activeSheetName === 'bill';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-md">
        {/* Left: Back to Team + Location & Workbook Info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsWorkbookOpen(false)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Back to All Excels"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  {activeWorkbook?.locationName || 'DOLVAN'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeWorkbook?.workbookName}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Team: <strong className="text-emerald-400">{selectedTeam?.name || 'Dolvan Maintenance Team'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Dual Sheet Switcher: inventory vs bill */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setActiveSheetName('inventory');
              setMainViewTab('form');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSheetName === 'inventory' || activeSheetName === 'Performas'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sheet 1: inventory</span>
          </button>

          <button
            onClick={() => {
              setActiveSheetName('bill');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSheetName === 'bill'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sheet 2: bill</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Supabase SQL Database Config */}
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-600"
            title="Configure Supabase SQL connection and open permissions"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supabase</span>
          </button>

          {/* Dual-Sheet Excel Download */}
          <button
            type="button"
            onClick={() => {
              if (activeWorkbook) {
                exportDualSheetLocationExcel(activeWorkbook);
                showNotification(`Downloaded ${activeWorkbook.locationName}_INVENTORY_BILL.xlsx`);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            title="Download Excel with both sheets"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        )}

        {isBillSheet ? (
          // Sheet 2: Bill Viewer
          <BillSheetViewer
            billData={activeWorkbook?.sheets['bill']?.billData || createDefaultBillSheet(activeWorkbook?.locationName || 'Location')}
            locationName={activeWorkbook?.locationName || 'Location'}
            onUpdateBill={handleUpdateBillSheet}
          />
        ) : (
          // Sheet 1: Inventory Performa CRUD & Excel Data Table
          <div className="max-w-6xl mx-auto space-y-4">
            {/* View Mode & CRUD Action Bar */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              {/* Left: View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setMainViewTab('form')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mainViewTab === 'form'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 Performa Form</span>
                </button>
                <button
                  onClick={() => setMainViewTab('table')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mainViewTab === 'table'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Excel Sheet Table ({activePerformas.length})</span>
                </button>
              </div>

              {/* Right: CRUD Actions */}
              <div className="flex items-center space-x-2">
                {/* + Add Entry Button */}
                <button
                  onClick={handleStartNewPerforma}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Entry</span>
                </button>

                {/* Save Current */}
                {mainViewTab === 'form' && (
                  <>
                    <button
                      onClick={handleSaveAndClose}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>

                    {/* Delete Entry (if editing) */}
                    {originalEditingId && (
                      <button
                        onClick={() => handleDeletePerforma(originalEditingId)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content Rendering: Form or Table */}
            {mainViewTab === 'form' ? (
              <A4PerformaDocument
                performa={currentPerforma}
                onChange={handlePerformaChange}
                onSaveAndAddAnother={handleSaveAndAddAnother}
                onSaveAndClose={handleSaveAndClose}
                onDelete={() => handleDeletePerforma(currentPerforma.id)}
                isExisting={!!originalEditingId}
                duplicateError={duplicateError}
                onClearDuplicateError={() => setDuplicateError(null)}
                viewMode={viewMode}
              />
            ) : (
              <ExcelDataTable
                workbookName={activeWorkbook?.workbookName || 'Workbook.xlsx'}
                sheetName="inventory (DOLVAN)"
                performas={activePerformas}
                onEditPerforma={(id) => {
                  handleSelectPerforma(id);
                }}
                onDeletePerforma={(id) => {
                  handleDeletePerforma(id);
                }}
                onAddNewPerforma={handleStartNewPerforma}
                onExportExcel={() => {
                  if (activeWorkbook) {
                    exportDualSheetLocationExcel(activeWorkbook);
                  }
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateLocationModal
        isOpen={isCreateLocationModalOpen}
        onClose={() => setIsCreateLocationModalOpen(false)}
        onCreateLocation={handleCreateLocationWorkbook}
        canClose={true}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={reloadData}
      />
    </div>
  );
}

export default App;

