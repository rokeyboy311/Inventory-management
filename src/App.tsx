/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Menu, X, Cloud, Settings, Download, Zap, FolderTree, Activity, Package, Receipt, Radio } from 'lucide-react';
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
  BillRecord,
  TC_MAINTENANCE_MASTER_ITEMS
} from './types/inventory';
import { SyncService } from './services/syncService';
import { GoogleSheetsService } from './services/googleSheetsSync';
import { exportAllLocationFoldersZIP, sanitizeFolderName } from './utils/excelExporter';

const STORAGE_KEY_ITEMS = 'site_inventory_items_config_v5';

// Reference Master Items (19 Items Exact Layout)
const defaultItemDefinitions: InventoryItemDefinition[] = TC_MAINTENANCE_MASTER_ITEMS;

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
  const [locationType, setLocationType] = useState<'In house' | 'Maintenance'>('Maintenance');
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
    'mat-bushing-goti': { value: '', selectedType: 'HT', optionValues: { 'HT': '', 'LT': '' } },
    'mat-al-patta': { value: '', selectedType: '100', optionValues: { '100': '' } },
    'mat-earth-connection': { value: '1' },
    'mat-lt-cable': { value: '', selectedType: 'Nos.', optionValues: { 'Nos.': '', 'C- 1(70)': '', 'C- 2(150)': '' } },
    'mat-termination-core': { value: '', selectedType: '70', optionValues: { '70': '', '150': '' } },
    'mat-termination-upto-sqmm': { value: '1' },
    'mat-voltage-amp-measurement': { value: '1' },
    'mat-oil-leakage': { value: '', selectedType: 'Ltr', optionValues: { 'Ltr': '' } },
    'mat-lt-dist-box': { value: '0' },
    'mat-kit-ket-fuse': { value: '', selectedType: '100Amp', optionValues: { '100Amp': '', '200Amp': '' } },
    'mat-hrc-fuse-base': { value: '', selectedType: '400', optionValues: { '400': '' } },
    'mat-hrc-fuse-link': { value: '', selectedType: '400', optionValues: { '400': '' } },
    'mat-fuse-element-do': { value: '' },
    'mat-sundry-items': { value: '' },
    'mat-general-condition': { value: '3' },
    'mat-brass-nuts': { value: '', selectedType: '12 mm', optionValues: { '12 mm': '' } },
    'mat-brass-washer': { value: '', selectedType: '12 mm', optionValues: { '12 mm': '' } },
    'mat-breather-silica': { value: '', selectedType: '500 gm', optionValues: { '500 gm': '' } },
    'mat-half-stud': { value: '', selectedType: '12 MM', optionValues: { '12 MM': '' } }
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
  
  // File Viewer Modal State (Supports both Location Files and Canonical Sub-Division Primary Workbook)
  const [viewerFile, setViewerFile] = useState<{ 
    isOpen: boolean; 
    location: string; 
    locationType: 'In house' | 'Maintenance';
    subDivisionName?: string;
    isSubdivisionWorkbookView?: boolean;
  }>({
    isOpen: false,
    location: '',
    locationType: 'In house',
    subDivisionName: 'DOLVAN',
    isSubdivisionWorkbookView: false
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

    // 7. Fetch Divisions
    fetch('/api/divisions')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.divisions && d.divisions.length > 0) {
          setDivisions(d.divisions);
        }
      })
      .catch(() => {});

    // 8. Fetch Sub-Divisions
    fetch('/api/subdivisions')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.subdivisions && d.subdivisions.length > 0) {
          setSubdivisions(d.subdivisions);
        }
      })
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
          } else if (payload.type === 'LOCATION_CREATED' || 
                     payload.type === 'DIVISION_CREATED' || 
                     payload.type === 'DIVISION_UPDATED' || 
                     payload.type === 'SUBDIVISION_CREATED' || 
                     payload.type === 'SUBDIVISION_UPDATED' || 
                     payload.type === 'SUBDIVISION_DELETED') {
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
    setViewerFile({ 
      isOpen: true, 
      location: loc, 
      locationType: type,
      isSubdivisionWorkbookView: false 
    });
  };

  const handleOpenSubdivisionWorkbook = (_subId: string, subName: string) => {
    setViewerFile({
      isOpen: true,
      location: subName,
      locationType: 'Maintenance',
      subDivisionName: subName,
      isSubdivisionWorkbookView: true
    });
  };

  const handleCreateDivision = async (name: string, code: string) => {
    try {
      const res = await fetch('/api/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      if (res.ok) {
        refreshServerData();
      }
    } catch (err) {
      console.error('Failed to create division:', err);
    }
  };

  const handleRenameDivision = async (divId: string, newName: string, newCode?: string) => {
    try {
      const res = await fetch(`/api/divisions/${divId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, code: newCode })
      });
      if (res.ok) {
        refreshServerData();
      }
    } catch (err) {
      console.error('Failed to rename division:', err);
    }
  };

  const handleCreateSubdivision = async (divisionId: string, name: string, code: string) => {
    try {
      const res = await fetch('/api/subdivisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ divisionId, name, code })
      });
      if (res.ok) {
        refreshServerData();
      }
    } catch (err) {
      console.error('Failed to create subdivision:', err);
    }
  };

  const handleRenameSubdivision = async (subId: string, newName: string, newCode?: string) => {
    try {
      const res = await fetch(`/api/subdivisions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, code: newCode })
      });
      if (res.ok) {
        refreshServerData();
      }
    } catch (err) {
      console.error('Failed to rename subdivision:', err);
    }
  };

  const handleDeleteSubdivision = async (subId: string) => {
    try {
      const res = await fetch(`/api/subdivisions/${subId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        refreshServerData();
      }
    } catch (err) {
      console.error('Failed to delete subdivision:', err);
    }
  };

  const handleQuickEntryForLocation = (loc: string, type: 'In house' | 'Maintenance') => {
    setLocation(loc);
    setLocationType(type);
    setActiveTab('quick_entry');
  };

  // Mobile responsive drawers
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  // Top Consumables for Activity Rail
  const railConsumables = useMemo(() => {
    const map = new Map<string, { qty: number; unit: string }>();
    for (const sub of submissions) {
      for (const it of sub.items) {
        const val = Number(it.value) || 0;
        if (val > 0) {
          const cur = map.get(it.itemName) || { qty: 0, unit: it.unit || 'Nos.' };
          cur.qty += val;
          map.set(it.itemName, cur);
        }
      }
    }
    if (map.size === 0) {
      return [
        { name: 'LT Cable 70sqmm', qty: '70M' },
        { name: 'Bushing Goti', qty: '13U' },
        { name: 'Al. Patta KVA', qty: '04U' },
        { name: 'Silica Gel', qty: '03K' }
      ];
    }
    return Array.from(map.entries())
      .map(([name, data]) => {
        const u = (data.unit || '').toLowerCase();
        const suffix = u.includes('meter') ? 'M' : u.includes('kg') ? 'K' : 'U';
        return { name, qty: `${String(data.qty).padStart(2, '0')}${suffix}` };
      })
      .slice(0, 4);
  }, [submissions]);

  const getTabTitle = (tab: MainNavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Daily Material Consumption & Inventory';
      case 'quick_entry':
        return 'Daily Material Usage Quick Entry Terminal';
      case 'location':
        return 'Division & Sub-Division Folder Explorer';
      case 'readings':
        return 'Transformer Volt-Amp Reading Terminal';
      case 'materials':
        return 'Material Master & Stock Ledger';
      case 'billing':
        return 'Contractor Maintenance Bill & GST Terminal';
      default:
        return 'Daily Material Consumption & Inventory';
    }
  };

  const getTabPath = (tab: MainNavTab) => {
    switch (tab) {
      case 'dashboard': return 'INDEX';
      case 'quick_entry': return 'QUICK_ENTRY';
      case 'location': return 'FOLDERS';
      case 'readings': return 'VOLT_AMP';
      case 'materials': return 'STOCK_LEDGER';
      case 'billing': return 'BILL_GST';
      default: return 'TERMINAL';
    }
  };

  return (
    <div className="min-h-screen bg-[#111113] text-[#e2e2e7] font-terminal selection:bg-[#00ffaa] selection:text-[#111113] flex flex-col">
      
      {/* Mobile Header Bar (< 1280px) */}
      <div className="xl:hidden flex items-center justify-between px-4 py-3 bg-[#1c1c1f] border-b border-[rgba(226,226,231,0.12)] sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button 
            type="button" 
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="p-1.5 text-[rgba(226,226,231,0.7)] hover:text-[#00ffaa] border border-[rgba(226,226,231,0.2)] rounded cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-display text-base tracking-wider text-[#00ffaa] uppercase border-l-2 border-[#00ffaa] pl-2 font-bold">
            ELECTRICAL INVENTORY
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('quick_entry')}
            className="px-2.5 py-1 bg-[#00ffaa] text-[#111113] text-xs font-bold uppercase rounded-sm cursor-pointer"
          >
            + CMD
          </button>
          <button
            type="button"
            onClick={() => setMobileRailOpen(prev => !prev)}
            className="p-1.5 text-[rgba(226,226,231,0.7)] hover:text-[#00ffaa] border border-[rgba(226,226,231,0.2)] rounded cursor-pointer text-xs font-mono"
            title="Toggle Activity Feed"
          >
            FEED
          </button>
        </div>
      </div>

      {/* 3-Column Terminal Grid (Variation 3) */}
      <div className="xl:grid xl:grid-cols-[280px_1fr_320px] lg:grid lg:grid-cols-[260px_1fr] flex-1 min-h-screen">
        
        {/* COLUMN 1: SIDEBAR */}
        <aside className={`
          bg-[#1c1c1f] border-r border-[rgba(226,226,231,0.12)] p-6 flex flex-col
          fixed inset-y-0 left-0 z-50 w-72 lg:static lg:w-auto lg:z-auto transition-transform duration-200
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Close button for mobile */}
          <div className="lg:hidden flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 text-[rgba(226,226,231,0.5)] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo in Oswald */}
          <div className="font-display text-2xl tracking-[0.1em] uppercase text-[#00ffaa] mb-8 border-l-4 border-[#00ffaa] pl-4 leading-tight">
            ELECTRICAL<br />INVENTORY
          </div>

          {/* Main Terminal Nav */}
          <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-2 font-mono">
            Main Terminal
          </div>

          <nav className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'dashboard' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Dashboard</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">_root</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('quick_entry'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'quick_entry' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Quick Entry</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">+cmd</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('location'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'location' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Location Folders</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">_dir</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('readings'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'readings' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Volt-Amp Log</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">read</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('materials'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'materials' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Stock View</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">pkg</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('billing'); setMobileSidebarOpen(false); }}
              className={`py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                activeTab === 'billing' ? 'text-[#00ffaa] font-bold' : 'text-[#e2e2e7] hover:text-[#00ffaa]'
              }`}
            >
              <span>Billing &amp; GST</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">rec</span>
            </button>

            <button
              type="button"
              onClick={() => { setIsGoogleDriveModalOpen(true); setMobileSidebarOpen(false); }}
              className="py-3 px-1 border-b border-[rgba(226,226,231,0.12)] text-xs cursor-pointer flex items-center justify-between transition-colors text-[#e2e2e7] hover:text-[#00ffaa]"
            >
              <span>Cloud Sync</span>
              <span className="text-[11px] font-mono text-[rgba(226,226,231,0.4)]">net</span>
            </button>
          </nav>

          {/* Quick Tools */}
          <div className="mt-6 pt-4 border-t border-[rgba(226,226,231,0.08)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-2 font-mono">
              System Operations
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex-1 py-1.5 px-2 bg-[rgba(226,226,231,0.06)] hover:bg-[rgba(226,226,231,0.12)] border border-[rgba(226,226,231,0.15)] text-[10px] uppercase font-mono text-[rgba(226,226,231,0.8)] hover:text-white rounded cursor-pointer transition text-center"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => exportAllLocationFoldersZIP(submissions, availableLocations, itemDefinitions)}
                className="flex-1 py-1.5 px-2 bg-[rgba(226,226,231,0.06)] hover:bg-[rgba(226,226,231,0.12)] border border-[rgba(226,226,231,0.15)] text-[10px] uppercase font-mono text-[#00ffaa] rounded cursor-pointer transition text-center"
              >
                All ZIP
              </button>
            </div>
          </div>

          {/* Footer Environment Info */}
          <div className="mt-auto pt-6 text-[11px] text-[rgba(226,226,231,0.4)] leading-relaxed font-mono border-t border-[rgba(226,226,231,0.08)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1">
              System Environment
            </div>
            VYARA DIVISION<br />
            DOLVAN SUB-DIVISION<br />
            LOCATION COUNT: {String(availableLocations.length).padStart(2, '0')}<br /><br />
            STATUS: <span className="text-[#00ffaa] font-bold">{isOnline ? 'CONNECTED' : 'OFFLINE QUEUE'}</span>
          </div>
        </aside>

        {/* COLUMN 2: MAIN TERMINAL */}
        <div className="flex flex-col min-w-0 overflow-y-auto">
          
          {/* Main Terminal Header */}
          <div className="p-6 sm:p-8 border-b border-[rgba(226,226,231,0.12)] bg-[#111113]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-2 font-mono">
              Path: VYARA/DOLVAN/{getTabPath(activeTab)}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase text-white tracking-wide leading-tight">
              {getTabTitle(activeTab)}
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 p-4 sm:p-6 lg:px-8 border-b border-[rgba(226,226,231,0.12)] gap-4 sm:gap-6 bg-[#161618]">
            <div className="stat-item">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1 font-mono">Site Locations</div>
              <div className="font-display text-3xl sm:text-4xl text-[#00ffaa] font-bold">{String(availableLocations.length).padStart(2, '0')}</div>
            </div>
            <div className="stat-item">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1 font-mono">Field Logs</div>
              <div className="font-display text-3xl sm:text-4xl text-[#00ffaa] font-bold">{String(submissions.length).padStart(2, '0')}</div>
            </div>
            <div className="stat-item">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1 font-mono">V-A Sheets</div>
              <div className="font-display text-3xl sm:text-4xl text-[#00ffaa] font-bold">{String(readings.length).padStart(2, '0')}</div>
            </div>
            <div className="stat-item">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-1 font-mono">Maint Mode</div>
              <div className="font-display text-3xl sm:text-4xl text-[#00ccff] font-bold">
                {String(submissions.filter(s => s.locationType === 'Maintenance').length).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* View Container */}
          <div className="flex-1 overflow-y-auto">
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
                onOpenSubdivisionWorkbook={handleOpenSubdivisionWorkbook}
                onCreateDivision={handleCreateDivision}
                onRenameDivision={handleRenameDivision}
                onCreateSubdivision={handleCreateSubdivision}
                onRenameSubdivision={handleRenameSubdivision}
                onDeleteSubdivision={handleDeleteSubdivision}
              />
            )}

            {activeTab === 'readings' && (
              <ReadingsView
                readings={readings}
                locations={locationsList.length > 0 ? locationsList : initialDefaultLocations.map((l, i) => ({ id: `loc-${i}`, divisionId: 'div-vyara', subdivisionId: 'sub-dolvan', name: l, code: `L-${i}`, status: 'active', createdAt: '', updatedAt: '' }))}
                transformers={transformers}
                onAddReading={handleAddReading}
                onExportReadingsExcel={() => {}}
              />
            )}

            {activeTab === 'materials' && (
              <MaterialsStockView
                materials={materials}
                recentTransactions={stockTransactions}
                onAddStockTransaction={handleAddStockTransaction}
                onAddNewMaterial={handleAddNewMaterial}
              />
            )}

            {activeTab === 'billing' && (
              <BillingView
                bills={bills}
                onAddBill={handleAddBill}
              />
            )}
          </div>
        </div>

        {/* COLUMN 3: ACTIVITY RAIL */}
        <aside className={`
          bg-[#1c1c1f] border-l border-[rgba(226,226,231,0.12)] p-6 flex flex-col justify-between
          fixed inset-y-0 right-0 z-50 w-80 xl:static xl:w-auto xl:z-auto transition-transform duration-200 overflow-y-auto
          ${mobileRailOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
        `}>
          {/* Close button for mobile rail */}
          <div className="xl:hidden flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setMobileRailOpen(false)}
              className="p-1 text-[rgba(226,226,231,0.5)] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-3 font-mono">
              Recent Data Feed
            </div>

            <div className="space-y-3">
              {submissions.length === 0 ? (
                <>
                  <div className="p-3 border border-[rgba(226,226,231,0.12)] bg-[#111113]">
                    <div className="text-[10px] text-[#00ffaa] mb-1 font-mono">14:22:08 // 08 OCT</div>
                    <div className="text-xs text-[rgba(226,226,231,0.85)] leading-relaxed">
                      <span className="bg-[rgba(226,226,231,0.12)] text-[#00ffaa] px-1.5 py-0.5 text-[9px] rounded uppercase font-bold mr-1">In House</span>
                      Kandha Konchal: Replacement of LT damaged cable (70m).
                    </div>
                  </div>
                  <div className="p-3 border border-[rgba(226,226,231,0.12)] bg-[#111113]">
                    <div className="text-[10px] text-[#00ffaa] mb-1 font-mono">09:15:44 // 07 OCT</div>
                    <div className="text-xs text-[rgba(226,226,231,0.85)] leading-relaxed">
                      <span className="bg-[rgba(226,226,231,0.12)] text-[#00ccff] px-1.5 py-0.5 text-[9px] rounded uppercase font-bold mr-1">Maint</span>
                      Kandha Nishal Faliyu: Neutral terminal tightening.
                    </div>
                  </div>
                </>
              ) : (
                submissions.slice(0, 5).map((sub, i) => {
                  const d = new Date(sub.timestamp);
                  const timeStr = !isNaN(d.getTime())
                    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} // ${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}`
                    : `LOG_ENTRY_${i + 1}`;
                  const mainItem = sub.items.find(it => it.value && Number(it.value) > 0);
                  const desc = mainItem ? `${mainItem.itemName} (${mainItem.value} ${mainItem.unit || ''})` : sub.notes || 'Routine check OK';

                  return (
                    <div key={sub.id} className="p-3 border border-[rgba(226,226,231,0.12)] bg-[#111113]">
                      <div className="text-[10px] text-[#00ffaa] mb-1 font-mono">{timeStr}</div>
                      <div className="text-xs text-[rgba(226,226,231,0.85)] leading-relaxed">
                        <span className="px-1.5 py-0.5 text-[9px] rounded uppercase font-bold mr-1 bg-[rgba(0,204,255,0.15)] text-[#00ccff] border border-[rgba(0,204,255,0.3)]">
                          MAINT
                        </span>
                        <strong className="text-white">{sub.location}</strong>: {desc}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Rail Bottom: Top Consumables & Action */}
          <div className="mt-8 pt-6 border-t border-[rgba(226,226,231,0.12)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(226,226,231,0.4)] mb-3 font-mono">
              Top Consumables
            </div>

            <div className="text-xs font-mono space-y-2 mb-6">
              {railConsumables.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[rgba(226,226,231,0.8)]">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="text-[#00ffaa] font-bold shrink-0">{item.qty}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('quick_entry');
                setMobileRailOpen(false);
              }}
              className="w-full py-3.5 px-4 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-display text-sm font-bold uppercase tracking-wider transition cursor-pointer text-center block"
            >
              Record Daily Work
            </button>
          </div>
        </aside>

      </div>

      {/* Backdrop for mobile drawers */}
      {(mobileSidebarOpen || mobileRailOpen) && (
        <div 
          onClick={() => { setMobileSidebarOpen(false); setMobileRailOpen(false); }}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden"
        />
      )}

      {/* Modals */}
      <LocationFileViewerModal
        isOpen={viewerFile.isOpen}
        onClose={() => setViewerFile(prev => ({ ...prev, isOpen: false }))}
        location={viewerFile.location}
        locationType={viewerFile.locationType}
        subDivisionName={viewerFile.subDivisionName}
        isSubdivisionWorkbookView={viewerFile.isSubdivisionWorkbookView}
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
