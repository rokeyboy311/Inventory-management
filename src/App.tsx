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
  Database,
  Target
} from 'lucide-react';

import { 
  PerformaRecord, 
  LocationWorkbook, 
  ImportSummary, 
  createBlankPerforma,
  DEFAULT_PERFORMA_ITEMS_TEMPLATE,
  BillSheetDefinition,
  ensureCompleteMasterItems
} from './types/performa';

import { 
  getNextPerformaId, 
  checkDuplicatePerformaId,
  sortPerformasBySequence,
  normalizePerformaIdInput
} from './utils/idGenerator';

import { 
  loadWorkbooksFromStorage, 
  saveWorkbookToStorage, 
  deleteWorkbookFromStorage,
  deletePerformaFromStorage,
  saveUnsavedDraft, 
  getUnsavedDraft, 
  clearUnsavedDraft,
  createNewLocationWorkbookWithDualSheets,
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
import { ExportReferenceModal } from './components/ExportReferenceModal';
import { UserDashboard } from './components/user/UserDashboard';
import { BillSheetViewer } from './components/BillSheetViewer';
import { SupabaseSettingsModal } from './components/admin/SupabaseSettingsModal';
import { ItemsSettingsModal } from './components/ItemsSettingsModal';
import { SupabaseSyncBanner } from './components/SupabaseSyncBanner';
import { subscribeToDatabaseChanges, isSupabaseConnected, getSupabaseSyncStatus } from './utils/supabaseClient';
import { syncBillFromInventory } from './utils/billSync';
import { calculateDgvclBillFromInventory, getTenderTargetForLocation } from './utils/dgvclBillEngine';
import { RefreshCw, Sliders } from 'lucide-react';

export function App() {
  // -------------------------------------------------------------
  // Clean URL: Redirect any legacy /admin path to /
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin')) {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  // -------------------------------------------------------------
  // Core State: Location Workbooks
  // -------------------------------------------------------------
  const [isWorkbookOpen, setIsWorkbookOpen] = useState(false);

  // All workbooks / locations
  const [workbooks, setWorkbooks] = useState<LocationWorkbook[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>('');
  const [activeSheetName, setActiveSheetName] = useState<string>('inventory');

  // Main view tab: 'form' (A4 document) vs 'table' (Excel sheet data table) vs 'files' (Mobile sidebar)
  const [mainViewTab, setMainViewTab] = useState<'form' | 'table' | 'files'>('form');

  // Modals
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isItemsSettingsModalOpen, setIsItemsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isExportReferenceModalOpen, setIsExportReferenceModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Active performa currently in the A4 editor
  const [currentPerforma, setCurrentPerforma] = useState<PerformaRecord>(() => 
    createBlankPerforma('TC-001', '')
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
  const activeWorkbook = workbooks.find(w => w.locationId === activeLocationId) || (workbooks.length > 0 ? workbooks[0] : null);
  const effectiveSheetName = (activeWorkbook?.sheets && activeSheetName in activeWorkbook.sheets)
    ? activeSheetName
    : (activeWorkbook?.sheets && 'inventory' in activeWorkbook.sheets ? 'inventory' : Object.keys(activeWorkbook?.sheets || {})[0] || 'inventory');
  const activeSheet = activeWorkbook?.sheets ? activeWorkbook.sheets[effectiveSheetName] : undefined;
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
    const loadedWorkbooks = await loadWorkbooksFromStorage();
    setWorkbooks(loadedWorkbooks);
    if (loadedWorkbooks.length > 0) {
      setActiveLocationId(prev => {
        const exists = loadedWorkbooks.some(w => w.locationId === prev);
        return exists && prev ? prev : loadedWorkbooks[0].locationId;
      });
    }
  };

  useEffect(() => {
    reloadData();

    // 1. Live Realtime listener across all users and devices
    const unsubscribeRealtime = subscribeToDatabaseChanges(() => {
      reloadData();
    });

    // 2. Broadcast channel listener for tabs on same device
    const handleBroadcast = () => {
      reloadData();
    };
    syncBroadcastChannel?.addEventListener('message', handleBroadcast);

    // 3. Cloud polling heartbeat every 10 seconds to ensure complete sync across devices
    const syncHeartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // save mobile battery & data when tab is minimized/screen off
      }
      reloadData();
    }, 10000);

    return () => {
      if (unsubscribeRealtime) unsubscribeRealtime();
      syncBroadcastChannel?.removeEventListener('message', handleBroadcast);
      clearInterval(syncHeartbeat);
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
  const handleCreateLocationWorkbook = async (locationName: string, autoEnter: boolean = false) => {
    const newWb = createNewLocationWorkbookWithDualSheets(locationName);
    const updated = [...workbooks, newWb];
    setWorkbooks(updated);
    setActiveLocationId(newWb.locationId);
    setActiveSheetName('inventory');
    await saveWorkbookToStorage(newWb);

    setIsCreateLocationModalOpen(false);

    if (autoEnter) {
      // Step 2: enter location excel file directly
      const nextId = getNextPerformaId([], newWb.locationName);
      const blank = createBlankPerforma(nextId, newWb.locationName, undefined, newWb.locationId);
      setCurrentPerforma(blank);
      setOriginalEditingId(null);
      initHistory(blank);
      setIsWorkbookOpen(true);
      setMainViewTab('form');
      showNotification(`Entered ${newWb.locationName} Excel (Sheet 1: inventory). Step 3: Enter your records!`);
    } else {
      showNotification(`Step 1 Done! Excel file "${newWb.workbookName}" created. Click "Enter File (Sheet 1)" to start.`);
    }
  };

  // -------------------------------------------------------------
  // Performa CRUD Operations
  // -------------------------------------------------------------

  // Save current Performa record into dataset (auto-places new Performa ID at its exact Excel sequence row)
  const saveCurrentPerformaInternal = (performaToSave: PerformaRecord): boolean => {
    if (!activeWorkbook || !activeSheet) return false;

    const rawTrimmed = performaToSave.id.trim();
    if (!rawTrimmed) {
      setDuplicateError('Performa ID cannot be empty');
      return false;
    }

    const trimmedId = normalizePerformaIdInput(rawTrimmed, activePerformas, activeWorkbook.locationName);

    const nextPerformas = [...activePerformas];
    // Find if this ID already exists in the sheet (either by originalEditingId or matching trimmedId)
    const directMatchIndex = nextPerformas.findIndex(
      p => p.id.trim().toLowerCase() === trimmedId.toLowerCase()
    );
    const originalIndex = originalEditingId
      ? nextPerformas.findIndex(p => p.id.trim().toLowerCase() === originalEditingId.trim().toLowerCase())
      : -1;

    const targetIndex = directMatchIndex >= 0 ? directMatchIndex : originalIndex;

    const recordToPersist: PerformaRecord = {
      ...performaToSave,
      id: trimmedId,
      status: 'saved',
      updatedAt: new Date().toISOString()
    };

    if (targetIndex >= 0) {
      // Update existing record in place
      nextPerformas[targetIndex] = recordToPersist;
      if (originalEditingId && originalEditingId.trim().toLowerCase() !== trimmedId.toLowerCase()) {
        deletePerformaFromStorage(activeWorkbook.locationId, originalEditingId, {
          ...activeWorkbook,
          sheets: {
            ...activeWorkbook.sheets,
            [effectiveSheetName]: {
              ...activeSheet,
              performas: nextPerformas,
              rawRowsCount: nextPerformas.length
            }
          }
        }).catch(() => {});
      }
    } else {
      // Insert new Performa ID and sort by sequence so it goes to its exact Excel row place!
      nextPerformas.push(recordToPersist);
    }

    const sortedPerformas = sortPerformasBySequence(nextPerformas);

    // Auto-sync Sheet 2 (bill) with all materials in Sheet 1 (inventory) using location rates
    const existingBillData = activeWorkbook.sheets['bill']?.billData;
    const syncedBill = syncBillFromInventory(sortedPerformas, activeWorkbook.locationName, existingBillData, activeWorkbook.locationId);

    // Update workbook
    const updatedSheets = {
      ...activeWorkbook.sheets,
      [effectiveSheetName]: {
        ...activeSheet,
        name: activeSheet.name || effectiveSheetName,
        performas: sortedPerformas,
        rawRowsCount: sortedPerformas.length
      },
      'bill': {
        name: 'bill',
        type: 'bill' as const,
        performas: [],
        billData: syncedBill,
        isCompatible: true,
        rawRowsCount: syncedBill.items.length
      }
    };

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: updatedSheets,
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.some(w => w.locationId === updatedWorkbook.locationId)
      ? workbooks.map(w => w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w)
      : [...workbooks, updatedWorkbook];

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
    const currentLocName = activeWorkbook?.locationName || '';
    const normalizedId = normalizePerformaIdInput(
      currentPerforma.id,
      activePerformas,
      currentLocName
    );
    const updatedRec = { ...currentPerforma, id: normalizedId, location: currentPerforma.location || currentLocName };
    setCurrentPerforma(updatedRec);
    const success = saveCurrentPerformaInternal(updatedRec);
    if (success) {
      setOriginalEditingId(normalizedId);
      const sorted = sortPerformasBySequence([
        ...activePerformas.filter(p => p.id.trim().toLowerCase() !== normalizedId.toLowerCase()),
        updatedRec
      ]);
      const rowPos = sorted.findIndex(p => p.id.trim().toLowerCase() === normalizedId.toLowerCase()) + 1;
      showNotification(`Saved Performa ${normalizedId} at Excel Row #${rowPos}!`);
    }
  };

  // Action: Save & Add Another (Continuous Entry with Sticky Date Memory)
  const handleSaveAndAddAnother = () => {
    const currentLocName = activeWorkbook?.locationName || '';
    const normalizedId = normalizePerformaIdInput(
      currentPerforma.id,
      activePerformas,
      currentLocName
    );
    const updatedRec = { ...currentPerforma, id: normalizedId, location: currentPerforma.location || currentLocName };
    const success = saveCurrentPerformaInternal(updatedRec);
    if (!success) return;

    const updatedPerformas = sortPerformasBySequence([
      ...activePerformas.filter(p => p.id.trim().toLowerCase() !== normalizedId.toLowerCase()),
      updatedRec
    ]);

    const nextId = getNextPerformaId(updatedPerformas, currentLocName);
    // Retain Sticky Date, prefill current location and location items
    const freshPerforma = createBlankPerforma(nextId, currentLocName, updatedRec.date, activeWorkbook?.locationId);

    setCurrentPerforma(freshPerforma);
    setOriginalEditingId(null);
    setDuplicateError(null);
    initHistory(freshPerforma);

    showNotification(`Performa ${normalizedId} saved to Excel! Ready for next entry (${nextId})`, 'info');
  };

  // Action: + Add New Performa
  const handleStartNewPerforma = () => {
    if (!activeWorkbook) return;
    const nextId = getNextPerformaId(activePerformas, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, activeWorkbook.locationName, currentPerforma.date, activeWorkbook.locationId);
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

  // Delete performa with confirmation & physical DB cleanup
  const handleDeletePerforma = async (idToDelete?: string) => {
    if (!activeWorkbook || !activeSheet) return;
    const targetId = (idToDelete || currentPerforma.id).trim();
    if (!window.confirm(`Are you sure you want to permanently delete Performa ${targetId} from the database?`)) {
      return;
    }

    const filtered = activePerformas.filter(p => p.id.trim().toLowerCase() !== targetId.toLowerCase());
    const existingBillData = activeWorkbook.sheets['bill']?.billData;
    const syncedBill = syncBillFromInventory(filtered, activeWorkbook.locationName, existingBillData, activeWorkbook.locationId);

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: {
        ...activeWorkbook.sheets,
        [effectiveSheetName]: {
          ...activeSheet,
          name: activeSheet.name || effectiveSheetName,
          performas: filtered,
          rawRowsCount: filtered.length
        },
        'bill': {
          name: 'bill',
          type: 'bill' as const,
          performas: [],
          billData: syncedBill,
          isCompatible: true,
          rawRowsCount: syncedBill.items.length
        }
      },
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );

    setWorkbooks(updatedWorkbooks);
    await deletePerformaFromStorage(activeWorkbook.locationId, targetId, updatedWorkbook);
    clearUnsavedDraft();

    // Next entry continues from remaining Performas or opens first available record
    if (filtered.length > 0 && targetId.toLowerCase() === currentPerforma.id.trim().toLowerCase()) {
      const nextToSelect = filtered[filtered.length - 1];
      setCurrentPerforma({ ...nextToSelect });
      setOriginalEditingId(nextToSelect.id);
      initHistory(nextToSelect);
    } else if (filtered.length === 0) {
      const nextId = getNextPerformaId([], activeWorkbook.locationName);
      const fresh = createBlankPerforma(nextId, activeWorkbook.locationName, undefined, activeWorkbook.locationId);
      setCurrentPerforma(fresh);
      setOriginalEditingId(null);
      initHistory(fresh);
    }

    showNotification(`Permanently deleted Performa ${targetId} from Database & reclaimed storage`, 'info');
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
  // ROUTE 1: USER DASHBOARD (/) - LOCATION EXCELS WORKSTATION
  // -------------------------------------------------------------
  if (!isWorkbookOpen) {
    return (
      <>
        <SupabaseSyncBanner onSyncReady={reloadData} onOpenSettingsModal={() => setIsSupabaseModalOpen(true)} />
        <UserDashboard
          workbooks={workbooks}
          onOpenWorkbook={(wb, initialSheet = 'inventory') => {
            setActiveLocationId(wb.locationId);
            const targetSheet = (initialSheet && wb.sheets && wb.sheets[initialSheet])
              ? initialSheet
              : (wb.sheets && wb.sheets['inventory'] ? 'inventory' : Object.keys(wb.sheets || {})[0] || 'inventory');
            setActiveSheetName(targetSheet);
            setIsWorkbookOpen(true);
            setMainViewTab(targetSheet === 'bill' ? 'table' : 'form');

            const sheet = wb.sheets ? wb.sheets[targetSheet] : undefined;
            const performas = sheet?.performas || [];
            if (performas.length > 0) {
              const loadedRecord = {
                ...performas[0],
                items: ensureCompleteMasterItems(performas[0].items || [], wb.locationId)
              };
              setCurrentPerforma(loadedRecord);
              setOriginalEditingId(performas[0].id);
              initHistory(loadedRecord);
            } else {
              const nextId = getNextPerformaId([], wb.locationName);
              const blank = createBlankPerforma(nextId, wb.locationName, undefined, wb.locationId);
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
          onRefreshData={reloadData}
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
  // ROUTE 2: LOCATION EXCEL WORKSPACE (Performa CRUD + Dual Sheets)
  // -------------------------------------------------------------
  const isBillSheet = activeSheetName === 'bill';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <SupabaseSyncBanner onSyncReady={reloadData} onOpenSettingsModal={() => setIsSupabaseModalOpen(true)} />
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
                  {activeWorkbook?.locationName || 'Location'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeWorkbook?.workbookName}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Sheets: <span className="text-emerald-400 font-semibold">inventory (Sheet 1)</span> &amp; <span className="text-cyan-400 font-semibold">bill (Sheet 2)</span>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-emerald-200 font-mono hidden sm:inline">Step 3: Records</span>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-cyan-200 font-mono hidden sm:inline">Step 4: View Bill</span>
          </button>
        </div>

        {/* Live Tender Budget Goal Tracker Badge */}
        {(() => {
          const tenderTarget = activeWorkbook?.tenderTargetAmount || (activeWorkbook?.locationId ? getTenderTargetForLocation(activeWorkbook.locationId) : 2000000);
          const tenderPercent = activeWorkbook?.tenderPercentage || 20;
          const calc = calculateDgvclBillFromInventory(activePerformas, activeWorkbook?.locationName || 'Location', {
            tenderTargetAmount: tenderTarget,
            tenderPercentage: tenderPercent
          });
          const isReached = calc.tenderTargetAchieved;
          return (
            <div 
              onClick={() => setActiveSheetName('bill')}
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isReached 
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
              title="Click to view detailed DGVCL GST Bill & Tender Target Tracker"
            >
              <Target className={`w-3.5 h-3.5 ${isReached ? 'text-emerald-400 animate-pulse' : 'text-blue-400'}`} />
              <span className="font-semibold">Tender:</span>
              <span className="font-mono font-bold text-white">₹{calc.grandTotal.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">/ ₹{(tenderTarget / 100000).toFixed(0)}L</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                isReached ? 'bg-emerald-500/30 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {calc.progressPercent}%
              </span>
            </div>
          );
        })()}

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Live Cloud Status */}
          {(() => {
            const sync = getSupabaseSyncStatus();
            return (
              <div 
                onClick={() => setIsSupabaseModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs cursor-pointer transition-colors"
                title={sync.status === 'synced' ? "Live Supabase Master DB Connected (All devices synced)" : sync.status === 'tables_missing' ? "Supabase Tables Missing - Click to Setup" : "Supabase Offline / Local"}
              >
                <span className={`w-2 h-2 rounded-full ${sync.status === 'synced' ? 'bg-emerald-400 animate-pulse' : sync.status === 'tables_missing' ? 'bg-amber-400 animate-ping' : 'bg-slate-400'}`} />
                <span className="hidden md:inline font-mono text-[11px] text-slate-300">
                  {sync.label}
                </span>
              </div>
            );
          })()}

          {/* Quick Sync Button */}
          <button
            type="button"
            onClick={async () => {
              await reloadData();
              showNotification('Synchronized latest data from cloud');
            }}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Force refresh data from cloud"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Items Settings Button */}
          <button
            type="button"
            onClick={() => setIsItemsSettingsModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-600 cursor-pointer"
            title="Configure Default Performa Items (Add, Edit, Remove)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Items Settings</span>
          </button>

          {/* Supabase SQL Database Config */}
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-600 cursor-pointer"
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
                showNotification(`Downloaded ${activeWorkbook.locationName}.xlsx`);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Excel with both sheets (inventory and bill)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
          // Sheet 2: Bill Viewer (automatically populated with materials added in inventory)
          <BillSheetViewer
            billData={activeWorkbook?.sheets['bill']?.billData || createDefaultBillSheet(activeWorkbook?.locationName || 'Location')}
            locationName={activeWorkbook?.locationName || 'Location'}
            locationId={activeWorkbook?.locationId}
            performas={activePerformas}
            onUpdateBill={handleUpdateBillSheet}
            onSwitchToInventory={() => {
              setActiveSheetName('inventory');
              setMainViewTab('form');
            }}
            onExportExcel={() => {
              if (activeWorkbook) {
                exportDualSheetLocationExcel(activeWorkbook);
              }
            }}
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
                allPerformas={activePerformas}
                locationId={activeWorkbook?.locationId}
                onChange={handlePerformaChange}
                onSaveAndAddAnother={handleSaveAndAddAnother}
                onSaveAndClose={handleSaveAndClose}
                onDelete={() => handleDeletePerforma(currentPerforma.id)}
                isExisting={!!originalEditingId}
                excelRowPosition={
                  currentIndex >= 0 ? currentIndex + 1 : activePerformas.length + 1
                }
                duplicateError={duplicateError}
                onClearDuplicateError={() => setDuplicateError(null)}
                viewMode={viewMode}
              />
            ) : (
              <ExcelDataTable
                workbookName={activeWorkbook?.workbookName || 'Workbook.xlsx'}
                sheetName={`inventory (${activeWorkbook?.locationName || 'Location'})`}
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

      <ItemsSettingsModal
        isOpen={isItemsSettingsModalOpen}
        onClose={() => setIsItemsSettingsModalOpen(false)}
        workbooks={workbooks}
        activeLocationId={activeWorkbook?.locationId}
        onItemsUpdated={async (updatedLocId) => {
          await reloadData();
          // Update current performa items if actively open in form
          const targetLocId = updatedLocId || activeWorkbook?.locationId;
          setCurrentPerforma(prev => ({
            ...prev,
            items: ensureCompleteMasterItems(prev.items || [], targetLocId)
          }));
        }}
      />
    </div>
  );
}

export default App;

