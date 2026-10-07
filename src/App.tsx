/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MainNavigationHeader } from './components/MainNavigationHeader';
import { DashboardView } from './components/DashboardView';
import { LocationExplorerView } from './components/LocationExplorerView';
import { QuickEntryView } from './components/QuickEntryView';
import { LocationFileViewerModal } from './components/LocationFileViewerModal';
import { AddCustomItemModal } from './components/AddCustomItemModal';
import { EditSubmissionModal } from './components/EditSubmissionModal';
import { ItemSettingsModal } from './components/ItemSettingsModal';
import { 
  InventoryItemDefinition, 
  InventorySubmission, 
  InventoryItemValue,
  MainNavTab 
} from './types/inventory';
import { SyncService } from './services/syncService';
import { 
  exportAllLocationFoldersZIP, 
  sanitizeFolderName 
} from './utils/excelExporter';

const STORAGE_KEY_ITEMS = 'site_inventory_items_config_v2';

// Default standard items with Lug (100, 200, 500) as requested
const defaultItemDefinitions: InventoryItemDefinition[] = [
  {
    id: 'power',
    name: 'Power',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter Power',
    unit: 'kW / Volts',
    isDeletable: false
  },
  {
    id: 'earth_compaction',
    name: 'Earth Compaction',
    fieldType: 'input_only',
    defaultValue: '1',
    inputPlaceholder: '1 [set by def.]',
    unit: 'ratio',
    isDeletable: false
  },
  {
    id: 'lug',
    name: 'Lug',
    fieldType: 'dual',
    inputPlaceholder: 'Enter quantity',
    dropdownPlaceholder: 'Select option',
    options: ['100', '200', '500'],
    unit: 'pcs',
    isDeletable: false
  },
  {
    id: 'box',
    name: 'Box',
    fieldType: 'input_only',
    inputPlaceholder: 'Enter',
    unit: 'boxes',
    isDeletable: false
  },
  {
    id: 'cable',
    name: 'Cable',
    fieldType: 'dual',
    inputPlaceholder: 'Enter length',
    dropdownPlaceholder: 'Select spec/type',
    options: [
      '1.5 sq mm',
      '2.5 sq mm',
      '4 sq mm',
      'Armoured'
    ],
    unit: 'meters',
    isDeletable: false
  }
];

const initialDefaultLocations = [
  'Site A - Main Substation',
  'Site B - Generator Room',
  'Warehouse 1 - Central Depot',
  'Project Alpha - Tower C',
  'Substation 4 - North Zone'
];

export default function App() {
  // Navigation Tabs State (Dashboard, Location, Quick Entry)
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');

  // Location & Entry State
  const [location, setLocation] = useState<string>(initialDefaultLocations[0]);
  const [locationType, setLocationType] = useState<'In house' | 'Maintenance'>('In house');
  const [submittedBy, setSubmittedBy] = useState<string>('Site Engineer');
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
    power: { value: '' },
    earth_compaction: { value: '1' },
    lug: { value: '', selectedType: '100', optionValues: { '100': '', '200': '', '500': '' } },
    box: { value: '' },
    cable: { value: '', selectedType: '1.5 sq mm', optionValues: { '1.5 sq mm': '', '2.5 sq mm': '', '4 sq mm': '', 'Armoured': '' } }
  });

  // Submissions Database & Sync State
  const [submissions, setSubmissions] = useState<InventorySubmission[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'offline_queued'>('idle');
  const [lastSavedMessage, setLastSavedMessage] = useState<string>('');

  // Modals State
  const [isAddCustomItemOpen, setIsAddCustomItemOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<InventorySubmission | null>(null);
  
  // File Viewer Modal State
  const [viewerFile, setViewerFile] = useState<{ isOpen: boolean; location: string; locationType: 'In house' | 'Maintenance' }>({
    isOpen: false,
    location: '',
    locationType: 'In house'
  });

  // Save item definitions to localStorage
  const handleSaveItemDefinitions = (newDefs: InventoryItemDefinition[]) => {
    setItemDefinitions(newDefs);
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newDefs));
    } catch {}
  };

  const handleResetToDefaultItems = () => {
    setItemDefinitions(defaultItemDefinitions);
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(defaultItemDefinitions));
    } catch {}
  };

  // Initial Data Fetch & Offline Sync Setup
  useEffect(() => {
    const local = SyncService.loadLocalSubmissions();
    if (local.length > 0) {
      setSubmissions(local);
    }

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
        console.log('Using local cached submissions');
      });

    setOfflineQueueCount(SyncService.getOfflineQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      SyncService.flushOfflineQueue().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          setOfflineQueueCount(0);
          setLastSavedMessage(`Back online! Synchronized ${syncedCount} offline entries.`);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 4000);
          fetch('/api/inventory/entries')
            .then(r => r.json())
            .then(d => d.submissions && setSubmissions(d.submissions));
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'submission_created' && payload.data?.submission) {
            setSubmissions(prev => {
              if (prev.some(s => s.id === payload.data.submission.id)) return prev;
              const next = [payload.data.submission, ...prev];
              SyncService.saveLocalSubmissions(next);
              return next;
            });
          } else if (payload.type === 'submission_updated' && payload.data?.submission) {
            setSubmissions(prev => prev.map(s => s.id === payload.data.submission.id ? payload.data.submission : s));
          } else if (payload.type === 'submission_deleted' && payload.data?.id) {
            setSubmissions(prev => prev.filter(s => s.id !== payload.data.id));
          }
        } catch (e) {
          console.error('SSE event error:', e);
        }
      };
    } catch {
      // Ignore SSE failure in fallback
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Update a form field value
  const handleValueChange = (itemId: string, field: 'value' | 'selectedType', val: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
  };

  // Update a specific sub-option value for multi-option items (like Lug -> 100, 200, 500)
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

  // Add custom dynamic row on the fly
  const handleAddCustomItem = (newItemDef: InventoryItemDefinition) => {
    const updated = [...itemDefinitions, newItemDef];
    handleSaveItemDefinitions(updated);
    const initialOptVals: Record<string, string | number> = {};
    if (newItemDef.options) {
      newItemDef.options.forEach(o => { initialOptVals[o] = ''; });
    }
    setFormValues(prev => ({
      ...prev,
      [newItemDef.id]: {
        value: newItemDef.defaultValue !== undefined ? newItemDef.defaultValue : '',
        selectedType: newItemDef.options?.[0] || null,
        optionValues: initialOptVals
      }
    }));
  };

  // Delete an item row
  const handleDeleteItem = (itemId: string) => {
    const updated = itemDefinitions.filter(i => i.id !== itemId);
    handleSaveItemDefinitions(updated);
    setFormValues(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Reset form to defaults
  const handleResetForm = () => {
    const freshValues: Record<string, { value: string | number; selectedType?: string | null; optionValues?: Record<string, string | number> }> = {};
    itemDefinitions.forEach(item => {
      const optVals: Record<string, string | number> = {};
      if (item.options) {
        item.options.forEach(o => { optVals[o] = ''; });
      }
      freshValues[item.id] = {
        value: item.defaultValue !== undefined ? item.defaultValue : '',
        selectedType: item.options?.[0] || null,
        optionValues: optVals
      };
    });
    setFormValues(freshValues);
    setNotes('');
  };

  // Restore default rows
  const handleRestoreDefaults = () => {
    handleResetToDefaultItems();
    const freshValues: Record<string, { value: string | number; selectedType?: string | null; optionValues?: Record<string, string | number> }> = {
      power: { value: '' },
      earth_compaction: { value: '1' },
      lug: { value: '', selectedType: '100', optionValues: { '100': '', '200': '', '500': '' } },
      box: { value: '' },
      cable: { value: '', selectedType: '1.5 sq mm', optionValues: { '1.5 sq mm': '', '2.5 sq mm': '', '4 sq mm': '', 'Armoured': '' } }
    };
    setFormValues(freshValues);
  };

  // Quick fill demo values
  const handleQuickFillDemo = () => {
    setFormValues({
      power: { value: '415 V 3-Phase (120 kW)' },
      earth_compaction: { value: '1' },
      lug: { value: 35, selectedType: '100', optionValues: { '100': 15, '200': 20, '500': 5 } },
      box: { value: '8 Weatherproof DB Enclosures' },
      cable: { value: 120, selectedType: '4 sq mm', optionValues: { '1.5 sq mm': 40, '2.5 sq mm': 30, '4 sq mm': 50, 'Armoured': 10 } }
    });
    setNotes('Routine check & circuit overhaul');
  };

  // Add new location dynamically
  const handleAddCustomLocation = (newLoc: string) => {
    if (!availableLocations.includes(newLoc)) {
      setAvailableLocations(prev => [newLoc, ...prev]);
    }
  };

  // Delete an entire location folder
  const handleDeleteLocationFolder = (loc: string) => {
    setAvailableLocations(prev => prev.filter(l => l !== loc));
    setSubmissions(prev => {
      const updated = prev.filter(s => s.location !== loc);
      SyncService.saveLocalSubmissions(updated);
      return updated;
    });
  };

  // Core Save & Auto-Sync Execution
  const handleSaveAndSync = async () => {
    if (!location) {
      alert('Please select a main Site Location from the header dropdown.');
      return;
    }

    const itemsPayload: InventoryItemValue[] = itemDefinitions.map(def => {
      const entry = formValues[def.id] || { value: '' };
      return {
        itemId: def.id,
        itemName: def.name,
        fieldType: def.fieldType,
        value: entry.value,
        selectedType: entry.selectedType || (def.options ? def.options[0] : null),
        unit: def.unit,
        optionValues: entry.optionValues
      };
    });

    const hasAnyValue = itemsPayload.some(it => {
      const hasDirect = (it.value !== '' && it.value !== undefined);
      const hasOpt = it.optionValues && Object.values(it.optionValues).some(v => v !== '' && v !== undefined);
      return hasDirect || hasOpt;
    });

    if (!hasAnyValue) {
      if (!confirm('All material input fields are currently empty. Do you want to submit anyway?')) {
        return;
      }
    }

    setSaveStatus('syncing');

    const cleanFolder = sanitizeFolderName(location);
    const targetFileName = locationType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;
    const newId = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newSubmission: InventorySubmission = {
      id: newId,
      timestamp: new Date().toISOString(),
      location,
      locationType,
      submittedBy: submittedBy.trim() || 'Site Supervisor',
      notes: notes.trim() || undefined,
      syncStatus: isOnline ? 'Synced' : 'Offline Queued',
      items: itemsPayload
    };

    const syncResult = await SyncService.syncSubmission(newSubmission);

    setSubmissions(prev => {
      const updated = [newSubmission, ...prev];
      SyncService.saveLocalSubmissions(updated);
      return updated;
    });

    setOfflineQueueCount(SyncService.getOfflineQueue().length);

    if (syncResult.status === 'Synced') {
      setSaveStatus('saved');
      setLastSavedMessage(`Saved into folder "${cleanFolder}/" in file "${targetFileName}"!`);
    } else if (syncResult.status === 'Offline Queued') {
      setSaveStatus('offline_queued');
      setLastSavedMessage(`Offline: Queued into "${targetFileName}".`);
    } else {
      setSaveStatus('error');
      setLastSavedMessage('Sync error: Saved locally.');
    }

    setTimeout(() => {
      handleResetForm();
      setSaveStatus('idle');
    }, 3500);
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string) => {
    try {
      await fetch(`/api/inventory/entries/${id}`, { method: 'DELETE' });
    } catch {
      // Local fallback
    }
    setSubmissions(prev => {
      const updated = prev.filter(s => s.id !== id);
      SyncService.saveLocalSubmissions(updated);
      return updated;
    });
  };

  // Edit submission save
  const handleSaveEditSubmission = async (updated: InventorySubmission) => {
    try {
      await fetch(`/api/inventory/entries/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {
      // Local fallback
    }
    setSubmissions(prev => {
      const list = prev.map(s => s.id === updated.id ? updated : s);
      SyncService.saveLocalSubmissions(list);
      return list;
    });
  };

  // Open Location File Viewer
  const handleOpenFileViewer = (loc: string, type: 'In house' | 'Maintenance') => {
    setViewerFile({
      isOpen: true,
      location: loc,
      locationType: type
    });
  };

  // Jump to Quick Entry pre-filled for a location & type
  const handleQuickEntryForLocation = (loc: string, type: 'In house' | 'Maintenance') => {
    setLocation(loc);
    setLocationType(type);
    setActiveTab('quick_entry');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 3-Tab Main Navigation Header (Dashboard, Location, Quick Entry) + Settings */}
      <MainNavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        offlineCount={offlineQueueCount}
        totalLocationsCount={availableLocations.length}
        onDownloadAllZip={() => exportAllLocationFoldersZIP(submissions, availableLocations, itemDefinitions)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
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
          />
        )}

        {/* Tab 2: Location Explorer View (Folders & 2 Files Each) */}
        {activeTab === 'location' && (
          <LocationExplorerView
            submissions={submissions}
            availableLocations={availableLocations}
            itemDefinitions={itemDefinitions}
            onAddLocation={handleAddCustomLocation}
            onDeleteLocationFolder={handleDeleteLocationFolder}
            onOpenFileViewer={handleOpenFileViewer}
            onQuickEntryForLocation={handleQuickEntryForLocation}
          />
        )}

        {/* Tab 3: Quick Entry View */}
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
          />
        )}

      </main>

      {/* Modals */}
      
      {/* 1. Location Specific File Spreadsheet Viewer Modal (2-Tier Hierarchical Merged Headers) */}
      <LocationFileViewerModal
        isOpen={viewerFile.isOpen}
        onClose={() => setViewerFile(prev => ({ ...prev, isOpen: false }))}
        location={viewerFile.location}
        locationType={viewerFile.locationType}
        submissions={submissions}
        itemDefinitions={itemDefinitions}
        onDeleteSubmission={handleDeleteSubmission}
        onEditSubmission={(sub) => setEditingSubmission(sub)}
        onAddEntryForThisFile={handleQuickEntryForLocation}
      />

      {/* 2. Global Item & Options Settings Modal */}
      <ItemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        itemDefinitions={itemDefinitions}
        onSaveItemDefinitions={handleSaveItemDefinitions}
        onResetToDefaults={handleResetToDefaultItems}
      />

      {/* 3. Add Dynamic Custom Row Modal */}
      <AddCustomItemModal
        isOpen={isAddCustomItemOpen}
        onClose={() => setIsAddCustomItemOpen(false)}
        onAddItem={handleAddCustomItem}
      />

      {/* 4. Edit Submission Modal */}
      <EditSubmissionModal
        submission={editingSubmission}
        onClose={() => setEditingSubmission(null)}
        onSaveEdit={handleSaveEditSubmission}
      />

    </div>
  );
}
