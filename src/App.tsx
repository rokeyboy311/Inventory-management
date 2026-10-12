/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MainNavigationHeader } from './components/MainNavigationHeader';
import { DashboardView } from './components/DashboardView';
import { LocationExplorerView } from './components/LocationExplorerView';
import { QuickEntryView } from './components/QuickEntryView';
import { ReadingsView } from './components/ReadingsView';
import { MaterialsStockView } from './components/MaterialsStockView';
import { BillingView } from './components/BillingView';
import { LocationFileViewerModal } from './components/LocationFileViewerModal';
import { AddCustomItemModal } from './components/AddCustomItemModal';
import { EditSubmissionModal } from './components/EditSubmissionModal';
import { ItemSettingsModal } from './components/ItemSettingsModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { 
  InventoryItemDefinition, 
  InventorySubmission, 
  InventoryItemValue,
  MainNavTab,
  Location,
  Transformer,
  Division,
  SubDivision,
  Material,
  TransformerReading,
  StockTransaction,
  BillRecord
} from './types/inventory';
import { SyncService } from './services/syncService';
import { GoogleSheetsService } from './services/googleSheetsSync';
import { exportAllLocationFoldersZIP, sanitizeFolderName } from './utils/excelExporter';

const STORAGE_KEY_ITEMS = 'site_inventory_items_config_v3';

// Reference Items from "DOLVAN INVENTERY.xlsx"
const defaultItemDefinitions: InventoryItemDefinition[] = [
  {
    id: 'mat-bushing',
    name: 'Replacement of bushing goti',
    fieldType: 'dual',
    inputPlaceholder: 'Enter quantity',
    dropdownPlaceholder: 'Select type (HT / LT)',
    options: ['HT', 'LT'],
    unit: 'Nos.',
    isDeletable: false
  },
  {
    id: 'mat-al-patta',
    name: 'Providing LT side AL. Patta KVA',
    fieldType: 'dual',
    inputPlaceholder: 'Enter quantity',
    dropdownPlaceholder: 'Select rating',
    options: ['100 KVA', '63 KVA', '200 KVA'],
    unit: 'Nos.',
    isDeletable: false
  },
  {
    id: 'mat-earth',
    name: 'Check and Tight Earth Connection',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: '1 [set by def.]',
    unit: 'Job',
    isDeletable: false
  },
  {
    id: 'mat-cable',
    name: 'Replacement of LT damaged cable',
    fieldType: 'dual',
    inputPlaceholder: 'Enter length',
    dropdownPlaceholder: 'Select cable size',
    options: ['C-1 (70 sq mm)', 'C-2 (150 sq mm)', '25 sq mm'],
    unit: 'Meter',
    isDeletable: false
  },
  {
    id: 'mat-termination',
    name: 'Providing of new termination R,Y,B,N',
    fieldType: 'dual',
    inputPlaceholder: 'Enter quantity',
    dropdownPlaceholder: 'Select termination size',
    options: ['70 sq mm (4-Core)', '150 sq mm (4-Core)', 'Up to spec'],
    unit: 'Sets',
    isDeletable: false
  },
  {
    id: 'mat-box',
    name: 'Distribution Terminal Box',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter count',
    unit: 'Nos.',
    isDeletable: false
  },
  {
    id: 'mat-stud',
    name: 'Half Stud / Fasteners',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter count',
    unit: 'Nos.',
    isDeletable: false
  },
  {
    id: 'mat-breather',
    name: 'Breather & Silica Gel',
    fieldType: 'dual',
    inputPlaceholder: 'Enter quantity',
    dropdownPlaceholder: 'Select type',
    options: ['Silica Gel Refill', 'Complete Breather'],
    unit: 'Kg',
    isDeletable: false
  }
];

const initialDefaultLocations = [
  'KANDHA KONCHAL',
  'KANDHA NISHAL FALIYU',
  'KANDHA DHADHAR FALIYU',
  'PIDADARA CHODIYAVAD',
  'PIDADARA PATEL FALIYA'
];

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');

  // Hierarchy Masters State
  const [divisions, setDivisions] = useState<Division[]>([
    { id: 'div-vyara', name: 'VYARA', code: 'VYR', status: 'active', createdAt: '', updatedAt: '' }
  ]);
  const [subdivisions, setSubdivisions] = useState<SubDivision[]>([
    { id: 'sub-dolvan', divisionId: 'div-vyara', name: 'DOLVAN', code: 'DLV', status: 'active', createdAt: '', updatedAt: '' }
  ]);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [readings, setReadings] = useState<TransformerReading[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);

  // Location & Quick Entry Form State
  const [location, setLocation] = useState<string>(initialDefaultLocations[0]);
  const [locationType, setLocationType] = useState<'In house' | 'Maintenance'>('In house');
  const [selectedTcId, setSelectedTcId] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submittedBy, setSubmittedBy] = useState<string>('Rajesh Patel (Lead Electrical)');
  const [availableLocations, setAvailableLocations] = useState<string[]>(initialDefaultLocations);
  const [notes, setNotes] = useState<string>('');

  // Dynamic Item Definitions & Form Values State
  const [itemDefinitions, setItemDefinitions] = useState<InventoryItemDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultItemDefinitions;
  });

  const [formValues, setFormValues] = useState<Record<string, { 
    value: string | number; 
    selectedType?: string | null;
    optionValues?: Record<string, string | number>;
  }>>({
    'mat-bushing': { value: '', selectedType: 'HT', optionValues: { 'HT': '', 'LT': '' } },
    'mat-al-patta': { value: '', selectedType: '100 KVA', optionValues: { '100 KVA': '', '63 KVA': '', '200 KVA': '' } },
    'mat-earth': { value: '1' },
    'mat-cable': { value: '', selectedType: 'C-1 (70 sq mm)', optionValues: { 'C-1 (70 sq mm)': '', 'C-2 (150 sq mm)': '', '25 sq mm': '' } },
    'mat-termination': { value: '', selectedType: '70 sq mm (4-Core)', optionValues: { '70 sq mm (4-Core)': '', '150 sq mm (4-Core)': '', 'Up to spec': '' } },
    'mat-box': { value: '' },
    'mat-stud': { value: '' },
    'mat-breather': { value: '', selectedType: 'Silica Gel Refill', optionValues: { 'Silica Gel Refill': '', 'Complete Breather': '' } }
  });

  // Submissions & Sync State
  const [submissions, setSubmissions] = useState<InventorySubmission[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'offline_queued'>('idle');
  const [lastSavedMessage, setLastSavedMessage] = useState<string>('');

  // Modals State
  const [isAddCustomItemOpen, setIsAddCustomItemOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<InventorySubmission | null>(null);
  
  // File Viewer Modal State
  const [viewerFile, setViewerFile] = useState<{ isOpen: boolean; location: string; locationType: 'In house' | 'Maintenance' }>({
    isOpen: false,
    location: '',
    locationType: 'In house'
  });

  // Load Initial Central Data from Persistent Server API
  const refreshServerData = () => {
    // 1. Fetch entries
    fetch('/api/inventory/entries')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.submissions) {
          setSubmissions(data.submissions);
          SyncService.saveLocalSubmissions(data.submissions);
          const locs = Array.from(new Set([...initialDefaultLocations, ...data.submissions.map((s: InventorySubmission) => s.location)]));
          setAvailableLocations(locs);
        }
      })
      .catch(() => {
        const local = SyncService.loadLocalSubmissions();
        if (local.length > 0) setSubmissions(local);
      });

    // 2. Fetch Locations
    fetch('/api/locations')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.locations) {
          setLocationsList(d.locations);
          const names = Array.from(new Set([...initialDefaultLocations, ...d.locations.map((l: Location) => l.name)]));
          setAvailableLocations(names);
        }
      })
      .catch(() => {});

    // 3. Fetch Transformers
    fetch('/api/transformers')
      .then(r => r.json())
      .then(d => d.success && setTransformers(d.transformers))
      .catch(() => {});

    // 4. Fetch Materials & Stock
    fetch('/api/stock')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setMaterials(d.materials);
          setStockTransactions(d.recentTransactions || []);
        }
      })
      .catch(() => {});

    // 5. Fetch Volt-Amp Readings
    fetch('/api/readings')
      .then(r => r.json())
      .then(d => d.success && setReadings(d.readings))
      .catch(() => {});

    // 6. Fetch Bills
    fetch('/api/bills')
      .then(r => r.json())
      .then(d => d.success && setBills(d.bills))
      .catch(() => {});
  };

  useEffect(() => {
    refreshServerData();
    setOfflineQueueCount(SyncService.getOfflineQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      SyncService.flushOfflineQueue().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          setOfflineQueueCount(0);
          setLastSavedMessage(`Back online! Synced ${syncedCount} offline entries.`);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 4000);
          refreshServerData();
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Real-Time SSE Listener (Phase 25 Multi-User Shared Data)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ENTRY_CREATED' || payload.type === 'submission_created') {
            refreshServerData();
          } else if (payload.type === 'ENTRY_UPDATED' || payload.type === 'submission_updated') {
            refreshServerData();
          } else if (payload.type === 'ENTRY_DELETED' || payload.type === 'submission_deleted') {
            refreshServerData();
          } else if (payload.type === 'READING_CREATED') {
            if (payload.data) {
              setReadings(prev => [payload.data, ...prev.filter(r => r.id !== payload.data.id)]);
            }
          } else if (payload.type === 'STOCK_UPDATED') {
            fetch('/api/stock')
              .then(r => r.json())
              .then(d => d.success && setMaterials(d.materials));
          } else if (payload.type === 'LOCATION_CREATED') {
            refreshServerData();
          }
        } catch (e) {
          console.error('SSE error:', e);
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Form value change handler
  const handleValueChange = (itemId: string, field: 'value' | 'selectedType', val: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
  };

  const handleOptionValueChange = (itemId: string, subOption: string, val: string | number) => {
    setFormValues(prev => {
      const current = prev[itemId] || { value: '', optionValues: {} };
      const nextOptionValues = {
        ...(current.optionValues || {}),
        [subOption]: val
      };
      return {
        ...prev,
        [itemId]: {
          ...current,
          value: val,
          selectedType: subOption,
          optionValues: nextOptionValues
        }
      };
    });
  };

  // Add custom dynamic row
  const handleAddCustomItem = (newItemDef: InventoryItemDefinition) => {
    const updated = [...itemDefinitions, newItemDef];
    setItemDefinitions(updated);
    try { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated)); } catch {}

    setFormValues(prev => ({
      ...prev,
      [newItemDef.id]: {
        value: newItemDef.defaultValue !== undefined ? newItemDef.defaultValue : '',
        selectedType: newItemDef.options?.[0] || null,
        optionValues: {}
      }
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = itemDefinitions.filter(i => i.id !== itemId);
    setItemDefinitions(updated);
    try { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated)); } catch {}
    setFormValues(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleResetForm = () => {
    const freshValues: Record<string, any> = {};
    itemDefinitions.forEach(item => {
      freshValues[item.id] = {
        value: item.defaultValue !== undefined ? item.defaultValue : '',
        selectedType: item.options?.[0] || null,
        optionValues: {}
      };
    });
    setFormValues(freshValues);
    setNotes('');
  };

  const handleRestoreDefaults = () => {
    setItemDefinitions(defaultItemDefinitions);
    try { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(defaultItemDefinitions)); } catch {}
    const fresh: Record<string, any> = {};
    defaultItemDefinitions.forEach(d => {
      fresh[d.id] = {
        value: d.defaultValue !== undefined ? d.defaultValue : '',
        selectedType: d.options?.[0] || null,
        optionValues: {}
      };
    });
    setFormValues(fresh);
  };

  const handleQuickFillDemo = () => {
    setFormValues({
      'mat-bushing': { value: 3, selectedType: 'HT', optionValues: { 'HT': 3, 'LT': 4 } },
      'mat-al-patta': { value: 4, selectedType: '100 KVA', optionValues: { '100 KVA': 4, '63 KVA': '', '200 KVA': '' } },
      'mat-earth': { value: '1' },
      'mat-cable': { value: 25, selectedType: 'C-1 (70 sq mm)', optionValues: { 'C-1 (70 sq mm)': 25, 'C-2 (150 sq mm)': '', '25 sq mm': '' } },
      'mat-termination': { value: 1, selectedType: '70 sq mm (4-Core)', optionValues: { '70 sq mm (4-Core)': 1, '150 sq mm (4-Core)': '', 'Up to spec': '' } },
      'mat-box': { value: '1' },
      'mat-stud': { value: '2' },
      'mat-breather': { value: 2, selectedType: 'Silica Gel Refill', optionValues: { 'Silica Gel Refill': 2, 'Complete Breather': '' } }
    });
    setNotes('Routine maintenance and flashover goti overhaul');
  };

  const handleAddCustomLocation = async (newLoc: string) => {
    const clean = newLoc.trim().toUpperCase();
    if (!availableLocations.includes(clean)) {
      setAvailableLocations(prev => [clean, ...prev]);
      try {
        await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subdivisionId: 'sub-dolvan', name: clean })
        });
        refreshServerData();
      } catch {}
    }
  };

  const handleDeleteLocationFolder = (loc: string) => {
    setAvailableLocations(prev => prev.filter(l => l !== loc));
  };

  // Core Save & Sync Execution (Phase 12, 13, 14, 50 Transactional Daily Entry)
  const handleSaveAndSync = async () => {
    if (!location) {
      alert('Please select a main Site Location.');
      return;
    }

    const itemsPayload = itemDefinitions.map(def => {
      const entry = formValues[def.id] || { value: '' };
      return {
        materialId: def.id,
        materialName: def.name,
        quantity: Number(entry.value) || 0,
        value: entry.value,
        selectedType: entry.selectedType || (def.options ? def.options[0] : null),
        unit: def.unit || 'Nos.',
        optionValues: entry.optionValues
      };
    });

    const hasAnyValue = itemsPayload.some(it => {
      const hasDirect = (it.value !== '' && it.value !== undefined && Number(it.value) > 0);
      const hasOpt = it.optionValues && Object.values(it.optionValues).some(v => v !== '' && Number(v) > 0);
      return hasDirect || hasOpt;
    });

    if (!hasAnyValue) {
      if (!confirm('No material quantities entered. Do you want to submit anyway?')) {
        return;
      }
    }

    setSaveStatus('syncing');

    const cleanFolder = sanitizeFolderName(location);
    const targetFileName = locationType === 'In house' ? `${cleanFolder}_Inventory_Usage.xlsx` : `${cleanFolder}_Maintenance_Log.xlsx`;
    const newId = `ENTRY-${entryDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newSubmission: InventorySubmission = {
      id: newId,
      timestamp: new Date().toISOString(),
      location,
      locationType,
      transformerId: selectedTcId || undefined,
      submittedBy: submittedBy.trim() || 'Site Personnel',
      notes: notes.trim() || undefined,
      syncStatus: isOnline ? 'Synced' : 'Offline Queued',
      items: itemsPayload.map(p => ({
        itemId: p.materialId,
        itemName: p.materialName,
        fieldType: 'dual',
        value: p.value,
        selectedType: p.selectedType,
        unit: p.unit,
        optionValues: p.optionValues
      }))
    };

    const syncResult = await SyncService.syncSubmission(newSubmission);

    setSubmissions(prev => [newSubmission, ...prev]);
    setOfflineQueueCount(SyncService.getOfflineQueue().length);

    if (syncResult.status === 'Synced') {
      setSaveStatus('saved');
      setLastSavedMessage(`Saved into folder "${cleanFolder}/" in file "${targetFileName}"!`);
      refreshServerData();
    } else if (syncResult.status === 'Offline Queued') {
      setSaveStatus('offline_queued');
      setLastSavedMessage(`Saved locally. Cloud sync pending.`);
    } else {
      setSaveStatus('error');
      setLastSavedMessage('Sync error: Stored in offline queue.');
    }

    setTimeout(() => {
      handleResetForm();
      setSaveStatus('idle');
    }, 3500);
  };

  // Volt-Amp Reading save
  const handleAddReading = async (readingData: Partial<TransformerReading>) => {
    const res = await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readingData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save reading');
    }
    const data = await res.json();
    setReadings(prev => [data.reading, ...prev]);
  };

  // Stock Transaction save
  const handleAddStockTransaction = async (txData: any) => {
    await fetch('/api/stock/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData)
    });
    refreshServerData();
  };

  // Add Material to Master
  const handleAddNewMaterial = async (matData: Partial<Material>) => {
    await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matData)
    });
    refreshServerData();
  };

  // Add Bill
  const handleAddBill = async (billData: Partial<BillRecord>) => {
    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    if (res.ok) {
      const data = await res.json();
      setBills(prev => [data.bill, ...prev]);
    }
  };

  const handleOpenFileViewer = (loc: string, type: 'In house' | 'Maintenance') => {
    setViewerFile({ isOpen: true, location: loc, locationType: type });
  };

  const handleQuickEntryForLocation = (loc: string, type: 'In house' | 'Maintenance') => {
    setLocation(loc);
    setLocationType(type);
    setActiveTab('quick_entry');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 6-Tab Navigation Header */}
      <MainNavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        offlineCount={offlineQueueCount}
        totalLocationsCount={availableLocations.length}
        onDownloadAllZip={() => exportAllLocationFoldersZIP(submissions, availableLocations, itemDefinitions)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenGoogleDriveSync={() => setIsGoogleDriveModalOpen(true)}
        isGoogleSheetsConnected={Boolean(GoogleSheetsService.getScriptUrl())}
      />

      {/* Main Viewport depending on active tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <DashboardView
            submissions={submissions}
            availableLocations={availableLocations}
            onNavigate={setActiveTab}
            onOpenLocationFile={handleOpenFileViewer}
            onDownloadAllZip={() => exportAllLocationFoldersZIP(submissions, availableLocations, itemDefinitions)}
            readingsCount={readings.length}
          />
        )}

        {/* Tab 2: Quick Entry View (The Main Feature) */}
        {activeTab === 'quick_entry' && (
          <QuickEntryView
            location={location}
            onLocationChange={setLocation}
            locationType={locationType}
            onLocationTypeChange={setLocationType}
            submittedBy={submittedBy}
            onSubmittedByChange={setSubmittedBy}
            availableLocations={availableLocations}
            onAddCustomLocation={handleAddCustomLocation}
            itemDefinitions={itemDefinitions}
            formValues={formValues}
            onValueChange={handleValueChange}
            onOptionValueChange={handleOptionValueChange}
            onOpenAddCustomItem={() => setIsAddCustomItemOpen(true)}
            onDeleteItem={handleDeleteItem}
            onResetForm={handleResetForm}
            onQuickFillDemo={handleQuickFillDemo}
            onRestoreDefaults={handleRestoreDefaults}
            notes={notes}
            onNotesChange={setNotes}
            onSaveAndSync={handleSaveAndSync}
            saveStatus={saveStatus}
            lastSavedMessage={lastSavedMessage}
            onOpenTargetFile={handleOpenFileViewer}
            divisions={divisions}
            subdivisions={subdivisions}
            locationsList={locationsList}
            transformers={transformers}
            selectedTransformerId={selectedTcId}
            onTransformerChange={setSelectedTcId}
            entryDate={entryDate}
            onEntryDateChange={setEntryDate}
          />
        )}

        {/* Tab 3: Locations Explorer (Division -> Sub-Division -> 2 Files) */}
        {activeTab === 'location' && (
          <LocationExplorerView
            submissions={submissions}
            availableLocations={availableLocations}
            itemDefinitions={itemDefinitions}
            onAddLocation={handleAddCustomLocation}
            onDeleteLocationFolder={handleDeleteLocationFolder}
            onOpenFileViewer={handleOpenFileViewer}
            onQuickEntryForLocation={handleQuickEntryForLocation}
            transformers={transformers}
            locationsList={locationsList}
            divisions={divisions}
            subdivisions={subdivisions}
            onNavigateToReadings={() => setActiveTab('readings')}
          />
        )}

        {/* Tab 4: Volt-Amp Readings (Dedicated Sheet 2 Register) */}
        {activeTab === 'readings' && (
          <ReadingsView
            readings={readings}
            locations={locationsList.length > 0 ? locationsList : initialDefaultLocations.map((l, i) => ({ id: `loc-${i}`, divisionId: 'div-vyara', subdivisionId: 'sub-dolvan', name: l, code: `L-${i}`, status: 'active', createdAt: '', updatedAt: '' }))}
            transformers={transformers}
            onAddReading={handleAddReading}
            onExportReadingsExcel={() => {}}
          />
        )}

        {/* Tab 5: Material Stock Register */}
        {activeTab === 'materials' && (
          <MaterialsStockView
            materials={materials}
            recentTransactions={stockTransactions}
            onAddStockTransaction={handleAddStockTransaction}
            onAddNewMaterial={handleAddNewMaterial}
          />
        )}

        {/* Tab 6: Billing Reference Module */}
        {activeTab === 'billing' && (
          <BillingView
            bills={bills}
            onAddBill={handleAddBill}
          />
        )}

      </main>

      {/* Modals */}
      <LocationFileViewerModal
        isOpen={viewerFile.isOpen}
        onClose={() => setViewerFile(prev => ({ ...prev, isOpen: false }))}
        location={viewerFile.location}
        locationType={viewerFile.locationType}
        submissions={submissions}
        itemDefinitions={itemDefinitions}
        onDeleteSubmission={async (id) => {
          await fetch(`/api/inventory/entries/${id}`, { method: 'DELETE' });
          setSubmissions(prev => prev.filter(s => s.id !== id));
        }}
        onEditSubmission={(sub) => setEditingSubmission(sub)}
        onAddEntryForThisFile={handleQuickEntryForLocation}
      />

      <ItemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        itemDefinitions={itemDefinitions}
        onSaveItemDefinitions={(defs) => {
          setItemDefinitions(defs);
          try { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(defs)); } catch {}
        }}
        onResetToDefaults={handleRestoreDefaults}
      />

      <AddCustomItemModal
        isOpen={isAddCustomItemOpen}
        onClose={() => setIsAddCustomItemOpen(false)}
        onAddItem={handleAddCustomItem}
      />

      <EditSubmissionModal
        submission={editingSubmission}
        onClose={() => setEditingSubmission(null)}
        onSaveEdit={async (updated) => {
          await fetch(`/api/entries/${updated.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });
          refreshServerData();
        }}
      />

      <GoogleDriveSyncModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        submissions={submissions}
        onSubmissionsRestored={(restored) => {
          setSubmissions(restored);
          SyncService.saveLocalSubmissions(restored);
          refreshServerData();
        }}
      />

    </div>
  );
}
