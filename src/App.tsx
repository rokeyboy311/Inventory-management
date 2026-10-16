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
  FolderPlus
} from 'lucide-react';

import { 
  PerformaRecord, 
  LocationWorkbook, 
  ImportSummary, 
  createBlankPerforma,
  DEFAULT_PERFORMA_ITEMS_TEMPLATE
} from './types/performa';

import { 
  getNextPerformaId, 
  checkDuplicatePerformaId 
} from './utils/idGenerator';

import { 
  loadWorkbooksFromStorage, 
  saveWorkbookToStorage, 
  saveUnsavedDraft, 
  getUnsavedDraft, 
  clearUnsavedDraft,
  createNewLocationWorkbook,
  UnsavedDraftState
} from './utils/storage';

import { 
  parseUploadedExcel, 
  analyzeSheetForPerformas, 
  exportPerformasToExcel, 
  downloadSampleExcel 
} from './utils/excelHandler';

import { A4PerformaDocument } from './components/A4PerformaDocument';
import { ExcelImportSidebar } from './components/ExcelImportSidebar';
import { PerformaListDrawer } from './components/PerformaListDrawer';
import { ImportSummaryModal } from './components/ImportSummaryModal';
import { DraftRecoveryBanner } from './components/DraftRecoveryBanner';
import { CreateLocationModal } from './components/CreateLocationModal';
import { ExcelDataTable } from './components/ExcelDataTable';

export function App() {
  // Direct file input ref for top action bar upload
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);

  // All workbooks / locations
  const [workbooks, setWorkbooks] = useState<LocationWorkbook[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>('ahmedabad');
  const [activeSheetName, setActiveSheetName] = useState<string>('Performas');

  // Main view tab: 'form' (A4 document) vs 'table' (Excel sheet data table)
  const [mainViewTab, setMainViewTab] = useState<'form' | 'table'>('form');

  // Create Location Excel Modal
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);

  // Active performa currently in the A4 editor
  const [currentPerforma, setCurrentPerforma] = useState<PerformaRecord>(() => 
    createBlankPerforma('AHM-001', '')
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

  // Active workbook helper
  const activeWorkbook = workbooks.find(w => w.locationId === activeLocationId) || workbooks[0];
  const activeSheet = activeWorkbook?.sheets[activeSheetName] || activeWorkbook?.sheets['Performas'];
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

  // Initial load from storage
  useEffect(() => {
    async function init() {
      const loaded = await loadWorkbooksFromStorage();
      setWorkbooks(loaded);

      if (loaded.length > 0) {
        const initialWb = loaded[0];
        setActiveLocationId(initialWb.locationId);
        setActiveSheetName(initialWb.activeSheetName || 'Performas');

        const sheet = initialWb.sheets[initialWb.activeSheetName || 'Performas'];
        const performas = sheet?.performas || [];
        
        // As per requirement: When arriving at the file, start from the next continuous Sr No
        // so no entries are displaced or added out of order
        const nextId = getNextPerformaId(performas, initialWb.locationName);
        const blank = createBlankPerforma(nextId, '');
        setCurrentPerforma(blank);
        setOriginalEditingId(null);
        initHistory(blank);
      } else {
        // If no workbooks, open create location modal immediately
        setIsCreateLocationModalOpen(true);
      }

      // Check for unsaved draft
      const draft = getUnsavedDraft();
      if (draft) {
        setUnsavedDraft(draft);
      }
    }
    init();
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

  // Handle Create Location Excel File
  const handleCreateLocationWorkbook = (locationName: string) => {
    const newWb = createNewLocationWorkbook(locationName);
    const updated = [...workbooks, newWb];
    setWorkbooks(updated);
    setActiveLocationId(newWb.locationId);
    setActiveSheetName('Performas');
    saveWorkbookToStorage(newWb);

    // Initial blank performa starting at Sr No. 1
    const nextId = getNextPerformaId([], newWb.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    initHistory(fresh);
    setIsCreateLocationModalOpen(false);
    setMainViewTab('form');
    showNotification(`Excel file "${newWb.workbookName}" created! Entry starts at Sr No. 1`);
  };

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
      // Retain original position / row in the Excel dataset for edited records!
      nextPerformas[existingIndex] = recordToPersist;
    } else {
      // Genuine NEW records MUST ALWAYS BE APPENDED TO THE END!
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

  // Action: Save & Add Another (Multi-Performa Continuous Data Entry Workflow)
  const handleSaveAndAddAnother = () => {
    const success = saveCurrentPerformaInternal(currentPerforma);
    if (!success) return;

    // Determine the next continuous Performa ID
    // System inspects ALL existing records (including the one just saved)
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

    // Create fresh blank performa with next ID, all 0, all No
    const freshPerforma = createBlankPerforma(nextId, currentPerforma.location || '');
    freshPerforma.date = currentPerforma.date; // keep same date convenience

    setCurrentPerforma(freshPerforma);
    setOriginalEditingId(null);
    setDuplicateError(null);
    initHistory(freshPerforma);

    showNotification(`Performa ${currentPerforma.id} saved! Now entering ${nextId}`, 'info');
  };

  // Action: + Add New Performa (from top bar, table, or drawer)
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
    if (!window.confirm(`Are you sure you want to delete Performa ${targetId}? Existing IDs will NOT be renamed.`)) {
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

  // Navigation between performas [< Prev] [Next >]
  const currentIndex = activePerformas.findIndex(p => p.id === currentPerforma.id);
  const canGoPrev = currentIndex > 0 || (currentIndex === -1 && activePerformas.length > 0);

  const handlePrevPerforma = () => {
    if (currentIndex > 0) {
      handleSelectPerforma(activePerformas[currentIndex - 1].id);
    } else if (currentIndex === -1 && activePerformas.length > 0) {
      // Currently on an unsaved new performa, navigate to the latest saved record
      handleSelectPerforma(activePerformas[activePerformas.length - 1].id);
    } else if (currentIndex === 0) {
      showNotification('Already at the first record', 'info');
    }
  };

  const handleNextPerforma = () => {
    if (currentIndex >= 0 && currentIndex < activePerformas.length - 1) {
      handleSelectPerforma(activePerformas[currentIndex + 1].id);
    } else {
      // At the end or on latest: start next continuous record
      handleStartNewPerforma();
    }
  };

  // Location selector change
  const handleLocationChange = (locId: string) => {
    const found = workbooks.find(w => w.locationId === locId);
    if (found) {
      setActiveLocationId(found.locationId);
      const sheetName = found.activeSheetName || Object.keys(found.sheets)[0] || 'Performas';
      setActiveSheetName(sheetName);

      const performas = found.sheets[sheetName]?.performas || [];
      const nextId = getNextPerformaId(performas, found.locationName);
      const fresh = createBlankPerforma(nextId, '');
      setCurrentPerforma(fresh);
      setOriginalEditingId(null);
      setDuplicateError(null);
      initHistory(fresh);
      setMainViewTab('form');
      showNotification(`Opened ${found.workbookName}. Next entry starts at Sr No. ${performas.length + 1} (${nextId})`);
    }
  };

  // Sheet selector change
  const handleSheetChange = (sheetName: string) => {
    setActiveSheetName(sheetName);
    const sheet = activeWorkbook.sheets[sheetName];
    const performas = sheet?.performas || [];
    const nextId = getNextPerformaId(performas, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    initHistory(fresh);
    showNotification(`Switched to sheet "${sheetName}". Next entry starts at Sr No. ${performas.length + 1} (${nextId})`);
  };

  // Excel File Upload & Analysis
  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

      const parsed = await parseUploadedExcel(file);
      setPendingParsedWorkbook(parsed.workbook);

      // Check sheets
      const defaultSheet = parsed.sheetNames.includes('Performas') 
        ? 'Performas' 
        : parsed.sheetNames[0];

      // Analyze sheet for existing vs new performas
      const summary = analyzeSheetForPerformas(
        parsed.workbook,
        defaultSheet,
        activePerformas,
        activeWorkbook.locationName
      );
      summary.workbookName = file.name;

      setImportSummary(summary);
    } catch (err) {
      alert('Error reading Excel file: ' + (err as Error).message);
    }
  };

  // Apply Import: Import New Only
  const handleImportNewOnly = () => {
    if (!importSummary) return;

    const newPerformas = importSummary.parsedPerformas.filter(p => 
      importSummary.newIds.includes(p.id)
    );

    // Append new records to the end of existing dataset!
    const combined = [...activePerformas, ...newPerformas];

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: {
        ...activeWorkbook.sheets,
        [activeSheetName]: {
          ...activeSheet,
          performas: combined,
          rawRowsCount: combined.length
        }
      },
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );

    setWorkbooks(updatedWorkbooks);
    saveWorkbookToStorage(updatedWorkbook);
    setImportSummary(null);

    // Setup next entry after the last imported record
    const nextId = getNextPerformaId(combined, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    initHistory(fresh);

    showNotification(`Imported ${newPerformas.length} new records! Next starts at Sr No. ${combined.length + 1}`);
  };

  // Apply Import: Update Existing + Add New
  const handleUpdateExistingAndAddNew = () => {
    if (!importSummary) return;

    const updatedList = [...activePerformas];

    importSummary.parsedPerformas.forEach(incoming => {
      const idx = updatedList.findIndex(p => p.id.trim().toUpperCase() === incoming.id.trim().toUpperCase());
      if (idx >= 0) {
        // Update in-place to retain original sequence
        updatedList[idx] = incoming;
      } else {
        // Append genuine new record to the end
        updatedList.push(incoming);
      }
    });

    const updatedWorkbook: LocationWorkbook = {
      ...activeWorkbook,
      sheets: {
        ...activeWorkbook.sheets,
        [activeSheetName]: {
          ...activeSheet,
          performas: updatedList,
          rawRowsCount: updatedList.length
        }
      },
      lastModified: new Date().toISOString()
    };

    const updatedWorkbooks = workbooks.map(w => 
      w.locationId === updatedWorkbook.locationId ? updatedWorkbook : w
    );

    setWorkbooks(updatedWorkbooks);
    saveWorkbookToStorage(updatedWorkbook);
    setImportSummary(null);

    // Setup next entry after the last record
    const nextId = getNextPerformaId(updatedList, activeWorkbook.locationName);
    const fresh = createBlankPerforma(nextId, '');
    setCurrentPerforma(fresh);
    setOriginalEditingId(null);
    initHistory(fresh);

    showNotification(`Merged ${importSummary.parsedPerformas.length} records! Next starts at Sr No. ${updatedList.length + 1}`);
  };

  // Export Excel workbook (continuous storage)
  const handleExportExcel = () => {
    if (!activeWorkbook) return;

    // If active sheet has saved records, export them
    if (activePerformas.length > 0) {
      exportPerformasToExcel(
        activePerformas,
        activeWorkbook.workbookName,
        activeSheetName
      );
      showNotification(`Exported ${activePerformas.length} records to "${activeWorkbook.workbookName}"!`);
      return;
    }

    // If active sheet has 0 records saved, but user is currently filling a performa, save and export it
    if (currentPerforma && currentPerforma.id) {
      saveCurrentPerformaInternal(currentPerforma);
      exportPerformasToExcel(
        [currentPerforma],
        activeWorkbook.workbookName,
        activeSheetName
      );
      showNotification(`Saved and exported Performa ${currentPerforma.id} to "${activeWorkbook.workbookName}"!`);
      return;
    }

    alert('Please enter or save at least one performa before exporting.');
  };

  // Download Sample Excel
  const handleDownloadSample = () => {
    downloadSampleExcel(activeWorkbook?.locationName || 'Ahmedabad');
    showNotification('Sample Excel downloaded!');
  };

  // Draft recovery actions
  const handleContinueDraft = () => {
    if (unsavedDraft) {
      setCurrentPerforma(unsavedDraft.performa);
      setOriginalEditingId(unsavedDraft.performa.id);
      setActiveSheetName(unsavedDraft.sheetName);
      initHistory(unsavedDraft.performa);
      setUnsavedDraft(null);
      showNotification('Restored unsaved draft!');
    }
  };

  const handleDiscardDraft = () => {
    clearUnsavedDraft();
    setUnsavedDraft(null);
    showNotification('Draft discarded.');
  };

  // Print / PDF action
  const handlePrint = () => {
    window.print();
  };

  // Check if current performa is an existing saved record
  const isExistingRecord = activePerformas.some(
    p => p.id.trim().toLowerCase() === (originalEditingId || currentPerforma.id).trim().toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#edf2f7] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Hidden file input for reliable toolbar Excel upload */}
      <input
        ref={toolbarFileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Draft Recovery Notification Banner */}
      <DraftRecoveryBanner
        draft={unsavedDraft}
        onContinueEditing={handleContinueDraft}
        onDiscardDraft={handleDiscardDraft}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : notification.type === 'info'
              ? 'bg-sky-600 text-white border-sky-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className="bg-[#1e3a8a] text-white shadow-md print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-200 flex items-center justify-center font-bold shadow-inner">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                  Transformer Maintenance Performa
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-700/80 text-blue-200 uppercase tracking-widest border border-blue-600">
                  Continuous Entry
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                Excel Import • Edit • Preview • Print / PDF • Export Excel
              </p>
            </div>
          </div>

          {/* Right Controls: Create Location Excel & A4 Document Badge */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateLocationModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Location Excel</span>
            </button>

            <div className="flex items-center space-x-2 bg-blue-950/60 border border-blue-700/60 rounded-xl px-3 py-1.5 text-xs text-blue-100">
              <FileText className="w-4 h-4 text-blue-300" />
              <div>
                <div className="font-bold text-[11px] leading-tight">A4 Document</div>
                <div className="text-[10px] text-blue-300 font-mono">210mm × 297mm</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Action Toolbar */}
      <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => toolbarFileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Excel</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewPerforma}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>New Performa</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                historyIndex > 0
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
              title="Undo change"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                historyIndex < history.length - 1
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
              title="Redo change"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* View Tab Switch: Performa Form vs Excel Records Table */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMainViewTab('form')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  mainViewTab === 'form'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Performa Form</span>
              </button>

              <button
                type="button"
                onClick={() => setMainViewTab('table')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  mainViewTab === 'table'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Excel Records ({activePerformas.length})</span>
              </button>
            </div>
          </div>

          {/* Right Buttons: Preview, Print / PDF, Export Excel */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setMainViewTab('form');
                setViewMode(viewMode === 'preview' ? 'edit' : 'preview');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                viewMode === 'preview' && mainViewTab === 'form'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewMode === 'preview' ? 'Edit Mode' : 'Preview'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-Header: Location & Sheet Selector + Continuous Sequence Navigator */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 print:hidden">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Location & Workbook Selection */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1 font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Location File:</span>
              <select
                value={activeLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 text-xs outline-none cursor-pointer"
              >
                {workbooks.map(w => (
                  <option key={w.locationId} value={w.locationId}>
                    {w.locationName} ({w.workbookName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 font-semibold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sheet:</span>
              <select
                value={activeSheetName}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-indigo-800 text-xs outline-none cursor-pointer"
              >
                {activeWorkbook && Object.keys(activeWorkbook.sheets).map(sheet => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sequential Navigator: [< Prev] [Next >] and [+ Add New Performa] */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
              <span>Sequence:</span>
              <span className="font-bold text-slate-800">
                {currentIndex >= 0 
                  ? `Sr No. ${currentIndex + 1} of ${activePerformas.length}` 
                  : `Next: Sr No. ${activePerformas.length + 1}`}
              </span>
            </div>

            <button
              type="button"
              disabled={!canGoPrev}
              onClick={handlePrevPerforma}
              className={`p-1 rounded border text-xs ${
                canGoPrev 
                  ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer' 
                  : 'text-slate-300 border-slate-200 cursor-not-allowed'
              }`}
              title="Previous Performa"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleNextPerforma}
              className="p-1 rounded border bg-white text-slate-700 hover:bg-slate-50 border-slate-300 text-xs cursor-pointer"
              title={currentIndex < activePerformas.length - 1 ? 'Next Performa' : 'Add Next Performa'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleStartNewPerforma}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Sr No. {activePerformas.length + 1}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Excel Import & Tools Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 print:hidden">
          <ExcelImportSidebar
            onFileUpload={handleFileUpload}
            uploadedFileName={uploadedFileName}
            uploadedFileSize={uploadedFileSize}
            onClearUploadedFile={() => {
              setUploadedFileName(null);
              setPendingParsedWorkbook(null);
            }}
            availableSheets={activeWorkbook ? Object.keys(activeWorkbook.sheets) : ['Performas']}
            activeSheetName={activeSheetName}
            onSelectSheet={handleSheetChange}
            onDownloadSample={handleDownloadSample}
            isSheetCompatible={activeSheet?.isCompatible ?? true}
            totalPerformasCount={activePerformas.length}
            onViewTable={() => setMainViewTab('table')}
            onOpenNewPerforma={handleStartNewPerforma}
          />
        </aside>

        {/* Center / Right Column: Form OR Excel Data Table */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col items-center w-full">
          {mainViewTab === 'table' ? (
            <ExcelDataTable
              workbookName={activeWorkbook?.workbookName || 'Ahmedabad.xlsx'}
              sheetName={activeSheetName}
              performas={activePerformas}
              onEditPerforma={handleSelectPerforma}
              onDeletePerforma={handleDeletePerforma}
              onAddNewPerforma={handleStartNewPerforma}
              onExportExcel={handleExportExcel}
            />
          ) : (
            <A4PerformaDocument
              performa={currentPerforma}
              onChange={handlePerformaChange}
              onSaveAndAddAnother={handleSaveAndAddAnother}
              onSaveAndClose={handleSaveAndClose}
              onDelete={() => handleDeletePerforma()}
              isExisting={isExistingRecord}
              duplicateError={duplicateError}
              onClearDuplicateError={() => setDuplicateError(null)}
              viewMode={viewMode}
            />
          )}
        </section>
      </main>

      {/* Bottom Footer Status Bar */}
      <footer className="bg-white border-t border-slate-200 py-2.5 px-4 text-xs text-slate-600 print:hidden mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800">Ready</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Last saved: {lastSavedTime}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              Active: <strong className="text-blue-700 font-mono">{currentPerforma.id}</strong> in {activeSheetName}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium mr-1">View mode:</span>
            <button
              type="button"
              onClick={() => { setViewMode('edit'); setMainViewTab('form'); }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'edit' && mainViewTab === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Edit Form
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('preview'); setMainViewTab('form'); }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'preview' && mainViewTab === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Preview A4
            </button>
            <button
              type="button"
              onClick={() => setMainViewTab('table')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                mainViewTab === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Excel Table
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Print
            </button>
          </div>
        </div>
      </footer>

      {/* Performa Records Drawer */}
      <PerformaListDrawer
        isOpen={isRecordsDrawerOpen}
        onClose={() => setIsRecordsDrawerOpen(false)}
        performas={activePerformas}
        activePerformaId={currentPerforma.id}
        onSelectPerforma={handleSelectPerforma}
        onAddNewPerforma={handleStartNewPerforma}
        onDeletePerforma={handleDeletePerforma}
        sheetName={activeSheetName}
        locationName={activeWorkbook?.locationName || 'Ahmedabad'}
      />

      {/* Create Location Excel Modal */}
      <CreateLocationModal
        isOpen={isCreateLocationModalOpen}
        onClose={() => setIsCreateLocationModalOpen(false)}
        onCreateLocation={handleCreateLocationWorkbook}
        canClose={workbooks.length > 0}
      />

      {/* Excel Import Summary & Merge Modal */}
      <ImportSummaryModal
        summary={importSummary}
        onClose={() => setImportSummary(null)}
        onImportNewOnly={handleImportNewOnly}
        onUpdateExistingAndAddNew={handleUpdateExistingAndAddNew}
        isReimport={uploadedFileName?.includes('Sample') || false}
      />
    </div>
  );
}

export default App;
