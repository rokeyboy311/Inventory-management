import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PerformaRecord,
  MaintenanceItemRow,
  CustomMacroPreset,
  saveStickyDefaultDate,
  ensureCompleteMasterItems,
  isNonZeroQtyValue,
  computeSummaryQtyFromSizes
} from '../types/performa';
import {
  AlertCircle,
  Save,
  PlusCircle,
  Trash2,
  Copy,
  RotateCcw,
  Camera,
  Keyboard,
  Smartphone,
  CheckCircle2,
  Sparkles,
  MapPin,
  Search,
  Eye,
  EyeOff,
  BookmarkPlus,
  X,
  Loader2,
  Check
} from 'lucide-react';

interface A4PerformaDocumentProps {
  performa: PerformaRecord;
  allPerformas?: PerformaRecord[];
  onChange: (updated: PerformaRecord) => void;
  onSaveAndClose: () => void;
  onSaveAndAddAnother: () => void;
  onDelete?: () => void;
  onAutoSelectExisting?: (existingRecord: PerformaRecord) => void;
  isExisting: boolean;
  excelRowPosition?: number;
  viewMode: 'edit' | 'preview' | 'print';
  duplicateError: string | null;
  onClearDuplicateError: () => void;
}

const QUICK_MAKES = ['Aman', 'Voltamp', 'ABB', 'Crompton', 'Bharat Bijlee', 'Kotsons', 'Other'];
const QUICK_CAPACITIES = ['10', '16', '25', '63', '63/22', '100', '200', '315', '500'];
const QUICK_QTY_CHIPS = [1, 2, 3, 4, 6, 8];

const CUSTOM_MACROS_STORAGE_KEY = 'dgvcl_custom_macro_presets_v2';

export const A4PerformaDocument: React.FC<A4PerformaDocumentProps> = ({
  performa,
  allPerformas = [],
  onChange,
  onSaveAndClose,
  onSaveAndAddAnother,
  onDelete,
  isExisting,
  excelRowPosition = 1,
  viewMode,
  duplicateError,
  onClearDuplicateError
}) => {
  const isReadOnly = viewMode === 'preview' || viewMode === 'print';

  // Ensure all 23 master rows (with size sub-fields) are present in exact order
  const items = useMemo(
    () => ensureCompleteMasterItems(performa.items || []),
    [performa.items]
  );

  // Entry mode: 'desktop_numpad' vs 'mobile_tap'
  const [entryMode, setEntryMode] = useState<'desktop_numpad' | 'mobile_tap'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile_tap';
    }
    return 'desktop_numpad';
  });

  // Row filter mode: 'all' | 'common' | 'active_only'
  const [rowFilterMode, setRowFilterMode] = useState<'all' | 'common' | 'active_only'>('all');
  const [itemSearch, setItemSearch] = useState('');
  const [focusedRowIdx, setFocusedRowIdx] = useState<number | null>(null);

  // Custom saved macros
  const [customMacros, setCustomMacros] = useState<CustomMacroPreset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CUSTOM_MACROS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [isSavingMacro, setIsSavingMacro] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');

  // AI Photo Scanner state
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Transformer Make Suggestions & Autofill History
  const [storedMakes, setStoredMakes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('saved_transformer_makes_history_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed.filter((m: any) => typeof m === 'string' && m.trim());
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const saveMakeToHistory = (val: string) => {
    const trimmed = (val || '').trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') return;
    setStoredMakes(prev => {
      const updated = Array.from(new Set([trimmed, ...prev])).slice(0, 50);
      try {
        localStorage.setItem('saved_transformer_makes_history_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const makeSuggestions = useMemo(() => {
    const set = new Set<string>();
    QUICK_MAKES.filter(m => m !== 'Other').forEach(m => set.add(m));
    ['GETCO', 'BHEL'].forEach(m => set.add(m));
    storedMakes.forEach(m => set.add(m));
    allPerformas.forEach(p => {
      const m = (p.transformerMake || '').trim();
      if (m && m.toLowerCase() !== 'other') set.add(m);
    });
    return Array.from(set);
  }, [allPerformas, storedMakes]);

  const matchingMakes = useMemo(() => {
    const query = (performa.transformerMake || '').trim().toLowerCase();
    if (!query) {
      return makeSuggestions.slice(0, 8);
    }
    const prefixMatches: string[] = [];
    const containsMatches: string[] = [];
    makeSuggestions.forEach(m => {
      const low = m.toLowerCase();
      if (low.startsWith(query)) {
        prefixMatches.push(m);
      } else if (low.includes(query)) {
        containsMatches.push(m);
      }
    });
    return [...prefixMatches, ...containsMatches].slice(0, 8);
  }, [makeSuggestions, performa.transformerMake]);

  // Refs for ultra-fast keyboard navigation
  const locationInputRef = useRef<HTMLInputElement>(null);
  const makeInputRef = useRef<HTMLInputElement>(null);
  const serialInputRef = useRef<HTMLInputElement>(null);
  const capacityInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const sizeInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Previous performa for "Copy Previous Performa" macro
  const previousPerforma = useMemo(() => {
    const others = allPerformas.filter(p => p.id !== performa.id);
    if (others.length === 0) return null;
    return others[others.length - 1];
  }, [allPerformas, performa.id]);

  // Global keyboard shortcuts: Ctrl+Enter or Alt+S -> Save & Next Performa
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;
      if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        saveStickyDefaultDate(performa.date);
        onSaveAndAddAnother();
        setTimeout(() => {
          locationInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isReadOnly, performa, onSaveAndAddAnother]);

  // Update header field
  const handleHeaderChange = (field: keyof PerformaRecord, value: string) => {
    if (isReadOnly) return;
    if (field === 'date' && value) {
      saveStickyDefaultDate(value);
    }
    onChange({
      ...performa,
      items,
      [field]: value
    });
  };

  // Check if a row has any active quantity (either single qty or any sizeQtys)
  const hasRowAnyQty = (row: MaintenanceItemRow): boolean => {
    if (row.sizeFields && row.sizeFields.length > 0 && row.sizeQtys) {
      return row.sizeFields.some(sf => isNonZeroQtyValue(row.sizeQtys?.[sf]));
    }
    return isNonZeroQtyValue(row.qty);
  };

  // ============================================================================
  // FEATURE 1: "AUTO-YES" SMART QUANTITY ENGINE (SINGLE & MULTI-SIZE FIELDS)
  // ============================================================================
  const handleItemQtyChange = (index: number, rawVal: string | number) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index] };

    const strVal = String(rawVal);
    current.qty = rawVal;

    if (isNonZeroQtyValue(strVal)) {
      current.materialYes = true;
      current.labourYes = true;
    } else {
      current.materialYes = false;
      current.labourYes = false;
    }

    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Multi-size field change handler (e.g., Nos., C-1(70), C-2(150) or 25, 50, 70 or 12MM, 20MM, 30MM)
  const handleItemSizeQtyChange = (index: number, sizeKey: string, rawVal: string | number) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index] };
    const nextSizeQtys: Record<string, number | string> = {
      ...(current.sizeQtys || {}),
      [sizeKey]: rawVal
    };
    current.sizeQtys = nextSizeQtys;
    current.qty = computeSummaryQtyFromSizes(current.sizeFields, nextSizeQtys, '');

    const anySizeFilled = (current.sizeFields || []).some(sf =>
      isNonZeroQtyValue(nextSizeQtys[sf])
    );

    if (anySizeFilled) {
      current.materialYes = true;
      current.labourYes = true;
    } else {
      current.materialYes = false;
      current.labourYes = false;
    }

    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Clear all size fields on a multi-size row
  const handleClearRowSizeQtys = (index: number) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index] };
    if (current.sizeFields) {
      current.sizeQtys = Object.fromEntries(current.sizeFields.map(f => [f, '']));
    }
    current.qty = '';
    current.materialYes = false;
    current.labourYes = false;
    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Manual Override & Blank-QTY Activation (e.g., SR 7 Oil Leakage or SR 3 Earth Connection)
  const handleToggleRowBothYesBlankQty = (index: number) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index] };
    const isCurrentlyActive = current.materialYes || current.labourYes;

    if (isCurrentlyActive) {
      current.materialYes = false;
      current.labourYes = false;
      current.qty = '';
      if (current.sizeFields) {
        current.sizeQtys = Object.fromEntries(current.sizeFields.map(f => [f, '']));
      }
    } else {
      current.materialYes = true;
      current.labourYes = true;
      if (current.qty === 0 || current.qty === '0') {
        current.qty = '';
      }
    }

    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Individual Material or Labour pill toggle (Manual Override)
  const handleToggleSinglePill = (index: number, field: 'materialYes' | 'labourYes') => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index] };
    current[field] = !current[field];

    if (!current.materialYes && !current.labourYes) {
      current.qty = '';
      if (current.sizeFields) {
        current.sizeQtys = Object.fromEntries(current.sizeFields.map(f => [f, '']));
      }
    }

    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // ============================================================================
  // FEATURE 2: ZERO-KEYBOARD 1-TAP QUANTITY CHIPS
  // ============================================================================
  const handleTapQtyChip = (index: number, chipVal: number | 'clear' | 'plus') => {
    if (isReadOnly) return;
    if (chipVal === 'clear') {
      handleItemQtyChange(index, '');
      return;
    }
    if (chipVal === 'plus') {
      const currNum = parseInt(String(items[index]?.qty || '0'), 10);
      const nextNum = (isNaN(currNum) ? 0 : currNum) + 1;
      handleItemQtyChange(index, nextNum);
      return;
    }
    const currentQtyStr = String(items[index]?.qty ?? '').trim();
    if (currentQtyStr === String(chipVal)) {
      handleItemQtyChange(index, '');
    } else {
      handleItemQtyChange(index, chipVal);
    }
  };

  // ============================================================================
  // FEATURE 3: DESKTOP "NUMPAD + ENTER" SPEED-RUNNER MODE
  // ============================================================================
  const visibleRowIndices = useMemo(() => {
    const indices: number[] = [];
    items.forEach((item, idx) => {
      if (itemSearch.trim()) {
        const q = itemSearch.toLowerCase();
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSr = (item.srLabel || String(item.srNo)).toLowerCase().includes(q);
        const matchSize = (item.sizeFields || []).some(sf => sf.toLowerCase().includes(q));
        if (!matchDesc && !matchSr && !matchSize) return;
      }
      if (rowFilterMode === 'active_only') {
        const isActive = item.materialYes || item.labourYes || hasRowAnyQty(item);
        if (!isActive) return;
      } else if (rowFilterMode === 'common') {
        const commonSrLabels = new Set(['1', '1.1', '2', '2.1', '3', '4', '5', '6', '6.1', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17']);
        if (!commonSrLabels.has(item.srLabel || String(item.srNo))) return;
      }
      indices.push(idx);
    });
    return indices;
  }, [items, itemSearch, rowFilterMode]);

  const focusRowFirstInput = (rowIndex: number) => {
    const row = items[rowIndex];
    if (row?.sizeFields && row.sizeFields.length > 0) {
      const el = sizeInputRefs.current[`${rowIndex}-0`];
      if (el) {
        el.focus();
        el.select();
        return;
      }
    }
    const nextEl = qtyInputRefs.current[rowIndex];
    if (nextEl) {
      nextEl.focus();
      nextEl.select();
    }
  };

  const handleQtyKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    sizeIdx?: number
  ) => {
    const posInVisible = visibleRowIndices.indexOf(rowIndex);
    const row = items[rowIndex];
    const totalSizes = row?.sizeFields?.length || 0;

    if (e.key === 'Enter') {
      e.preventDefault();
      // If inside a multi-size row, Enter moves to next size field first, then next row
      if (sizeIdx !== undefined && sizeIdx < totalSizes - 1) {
        const nextSizeEl = sizeInputRefs.current[`${rowIndex}-${sizeIdx + 1}`];
        if (nextSizeEl) {
          nextSizeEl.focus();
          nextSizeEl.select();
          return;
        }
      }
      if (posInVisible >= 0 && posInVisible < visibleRowIndices.length - 1) {
        focusRowFirstInput(visibleRowIndices[posInVisible + 1]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (posInVisible >= 0 && posInVisible < visibleRowIndices.length - 1) {
        focusRowFirstInput(visibleRowIndices[posInVisible + 1]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (posInVisible > 0) {
        focusRowFirstInput(visibleRowIndices[posInVisible - 1]);
      } else {
        capacityInputRef.current?.focus();
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      handleToggleRowBothYesBlankQty(rowIndex);
    }
  };

  // ============================================================================
  // FEATURE 4: 1-CLICK "SMART PRESET / MACRO" TEMPLATES BAR
  // ============================================================================
  const applyMacroHelper = (
    updater: (row: MaintenanceItemRow, idx: number) => MaintenanceItemRow
  ) => {
    if (isReadOnly) return;
    const nextItems = items.map((row, idx) => updater({ ...row }, idx));
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Macro 1: Standard Routine Service
  const handleMacroRoutineService = () => {
    applyMacroHelper(row => {
      const sr = row.srLabel || String(row.srNo);
      if (sr === '3' || sr === '5' || sr === '8' || sr === '14' || sr === '15') {
        return { ...row, materialYes: true, labourYes: true, qty: 1 };
      }
      if (sr === '7') {
        return { ...row, materialYes: true, labourYes: true, qty: '' };
      }
      return row;
    });
  };

  // Macro 2: LT Bushing + Stud + Nut/Washer Pack
  const handleMacroBushingStudNutPack = () => {
    applyMacroHelper(row => {
      const sr = row.srLabel || String(row.srNo);
      if (sr === '1' || sr === '2') {
        return { ...row, materialYes: true, labourYes: true, qty: 4 };
      }
      if (sr === '16' || sr === '17') {
        const nextSizeQtys = { ...(row.sizeQtys || {}), '12MM': 8, '20MM': 8 };
        return {
          ...row,
          materialYes: true,
          labourYes: true,
          sizeQtys: nextSizeQtys,
          qty: computeSummaryQtyFromSizes(row.sizeFields, nextSizeQtys, 16)
        };
      }
      return row;
    });
  };

  // Macro 3: Box + Fuse + Cable Pack
  const handleMacroBoxFuseCablePack = () => {
    applyMacroHelper(row => {
      const sr = row.srLabel || String(row.srNo);
      if (sr === '9') {
        return { ...row, materialYes: true, labourYes: true, qty: 1 };
      }
      if (sr === '6') {
        const nextSizeQtys = { ...(row.sizeQtys || {}), '70': 3 };
        return {
          ...row,
          materialYes: true,
          labourYes: true,
          sizeQtys: nextSizeQtys,
          qty: 3
        };
      }
      if (sr === '10') {
        const nextSizeQtys = { ...(row.sizeQtys || {}), '100Amp': 3 };
        return {
          ...row,
          materialYes: true,
          labourYes: true,
          sizeQtys: nextSizeQtys,
          qty: 3
        };
      }
      if (sr === '13') {
        return { ...row, materialYes: true, labourYes: true, qty: 3 };
      }
      return row;
    });
  };

  // Macro 4: Copy Previous Performa (clones date, make, capacity, and all rows; clears Location & Serial)
  const handleCopyPreviousPerforma = () => {
    if (isReadOnly || !previousPerforma) return;
    const clonedItems = ensureCompleteMasterItems(previousPerforma.items || []).map(it => ({
      ...it,
      ...(it.sizeQtys ? { sizeQtys: { ...it.sizeQtys } } : {})
    }));
    onChange({
      ...performa,
      date: previousPerforma.date || performa.date,
      transformerMake: previousPerforma.transformerMake || performa.transformerMake,
      capacity: previousPerforma.capacity || performa.capacity,
      location: '',
      transformerSerialNo: '',
      items: clonedItems,
      measurements: { ...previousPerforma.measurements }
    });
    setTimeout(() => {
      locationInputRef.current?.focus();
    }, 50);
  };

  // Macro 5: Clear All Rows
  const handleClearAllRows = () => {
    if (isReadOnly) return;
    const clearedItems = items.map(it => ({
      ...it,
      materialYes: false,
      labourYes: false,
      qty: '',
      ...(it.sizeFields
        ? { sizeQtys: Object.fromEntries(it.sizeFields.map(f => [f, ''])) }
        : {})
    }));
    onChange({
      ...performa,
      items: clearedItems
    });
  };

  // Save current active rows as a custom reusable Macro Preset
  const handleSaveCurrentAsCustomMacro = () => {
    if (!newMacroName.trim()) return;
    const itemsMap: CustomMacroPreset['itemsMap'] = {};
    items.forEach((it, idx) => {
      if (it.materialYes || it.labourYes || hasRowAnyQty(it)) {
        itemsMap[idx] = {
          materialYes: it.materialYes,
          labourYes: it.labourYes,
          qty: it.qty,
          ...(it.sizeQtys ? { sizeQtys: { ...it.sizeQtys } } : {})
        };
      }
    });
    const newPreset: CustomMacroPreset = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim(),
      itemsMap
    };
    const updated = [...customMacros, newPreset];
    setCustomMacros(updated);
    try {
      localStorage.setItem(CUSTOM_MACROS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewMacroName('');
    setIsSavingMacro(false);
  };

  const handleApplyCustomMacro = (preset: CustomMacroPreset) => {
    applyMacroHelper((row, idx) => {
      const saved = preset.itemsMap[idx];
      if (saved) {
        return {
          ...row,
          materialYes: saved.materialYes,
          labourYes: saved.labourYes,
          qty: saved.qty,
          ...(saved.sizeQtys ? { sizeQtys: { ...saved.sizeQtys } } : {})
        };
      }
      return row;
    });
  };

  const handleDeleteCustomMacro = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customMacros.filter(m => m.id !== id);
    setCustomMacros(updated);
    try {
      localStorage.setItem(CUSTOM_MACROS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };



  // ============================================================================
  // FEATURE 7: 1-TAP AI PHOTO SCANNER (GALLERY IMAGE -> COMPRESS -> OCR FORM)
  // ============================================================================
  const compressImageForScan = (file: File): Promise<{ imageBase64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read selected photo file'));
      reader.onload = () => {
        const rawDataUrl = String(reader.result || '');
        const img = new Image();
        img.onload = () => {
          try {
            const MAX_DIM = 1600;
            let width = img.width;
            let height = img.height;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ imageBase64: rawDataUrl, mimeType: file.type || 'image/jpeg' });
              return;
            }
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ imageBase64: compressedDataUrl, mimeType: 'image/jpeg' });
          } catch {
            resolve({ imageBase64: rawDataUrl, mimeType: file.type || 'image/jpeg' });
          }
        };
        img.onerror = () => {
          resolve({ imageBase64: rawDataUrl, mimeType: file.type || 'image/jpeg' });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const normalizeScannedDate = (rawDate?: string): string | null => {
    if (!rawDate || typeof rawDate !== 'string') return null;
    const trimmed = rawDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmyMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (dmyMatch) {
      const dd = dmyMatch[1].padStart(2, '0');
      const mm = dmyMatch[2].padStart(2, '0');
      let yyyy = dmyMatch[3];
      if (yyyy.length === 2) {
        yyyy = `20${yyyy}`;
      }
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);
    setScanStatusMessage('Optimizing & scanning Performa photo with AI Vision...');

    try {
      const { imageBase64, mimeType } = await compressImageForScan(file);

      let extracted: any = null;

      const res = await fetch('/api/ai/scan-performa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (${res.status}). Please retry.`);
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not parse performa photo');
      }

      extracted = json.data || {};

      const nextItems = ensureCompleteMasterItems([]);
      let scannedRowsCount = 0;

      if (Array.isArray(extracted.activeRows)) {
        for (const activeRow of extracted.activeRows) {
          const rIdx = Number(activeRow.rowIndex);
          if (!isNaN(rIdx) && rIdx >= 0 && rIdx < nextItems.length) {
            const targetRow = { ...nextItems[rIdx] };
            const rawQty =
              activeRow.qty !== undefined && activeRow.qty !== null
                ? String(activeRow.qty).trim()
                : '';

            if (targetRow.sizeFields && targetRow.sizeFields.length > 0) {
              const nextSizeQtys = { ...(targetRow.sizeQtys || {}) };
              if (activeRow.sizeQtys && typeof activeRow.sizeQtys === 'object') {
                for (const sf of targetRow.sizeFields) {
                  if (isNonZeroQtyValue(activeRow.sizeQtys[sf])) {
                    nextSizeQtys[sf] = String(activeRow.sizeQtys[sf]).trim();
                  }
                }
              } else if (
                activeRow.sizeKey &&
                targetRow.sizeFields.includes(String(activeRow.sizeKey)) &&
                isNonZeroQtyValue(rawQty)
              ) {
                nextSizeQtys[String(activeRow.sizeKey)] = rawQty;
              } else if (isNonZeroQtyValue(rawQty)) {
                nextSizeQtys[targetRow.sizeFields[0]] = rawQty;
              }
              targetRow.sizeQtys = nextSizeQtys;
              targetRow.qty = computeSummaryQtyFromSizes(targetRow.sizeFields, nextSizeQtys, '');
            } else {
              targetRow.qty = rawQty;
            }

            const hasQty = hasRowAnyQty(targetRow);
            const isMatYes = hasQty ? true : Boolean(activeRow.materialYes);
            const isLabYes = hasQty ? true : Boolean(activeRow.labourYes);

            if (isMatYes || isLabYes || hasQty) {
              scannedRowsCount++;
              targetRow.materialYes = isMatYes;
              targetRow.labourYes = isLabYes;
              if (!hasQty && !targetRow.sizeFields && rIdx !== 10) {
                targetRow.qty = 1;
              }
              nextItems[rIdx] = targetRow;
            }
          }
        }
      }

      const hasScannedMeasurements = Boolean(
        extracted.measurements?.voltageRN ||
          extracted.measurements?.voltageYN ||
          extracted.measurements?.voltageBN ||
          extracted.measurements?.ampereR ||
          extracted.measurements?.ampereY ||
          extracted.measurements?.ampereB ||
          extracted.measurements?.ampereN
      );

      // If Voltage/Ampere readings were detected on the sheet, ensure SR 8 (index 11) is marked active
      if (hasScannedMeasurements && nextItems[11]) {
        nextItems[11] = {
          ...nextItems[11],
          materialYes: true,
          labourYes: true,
          qty: isNonZeroQtyValue(nextItems[11].qty) ? nextItems[11].qty : 1
        };
      }

      const nextMeasurements = {
        ...(performa.measurements || {}),
        ...(extracted.measurements?.voltageRN ? { voltageRN: String(extracted.measurements.voltageRN).trim() } : {}),
        ...(extracted.measurements?.voltageYN ? { voltageYN: String(extracted.measurements.voltageYN).trim() } : {}),
        ...(extracted.measurements?.voltageBN ? { voltageBN: String(extracted.measurements.voltageBN).trim() } : {}),
        ...(extracted.measurements?.ampereR ? { ampereR: String(extracted.measurements.ampereR).trim() } : {}),
        ...(extracted.measurements?.ampereY ? { ampereY: String(extracted.measurements.ampereY).trim() } : {}),
        ...(extracted.measurements?.ampereB ? { ampereB: String(extracted.measurements.ampereB).trim() } : {}),
        ...(extracted.measurements?.ampereN ? { ampereN: String(extracted.measurements.ampereN).trim() } : {})
      };

      const normalizedDate = normalizeScannedDate(extracted.date);
      const nextDate = normalizedDate || performa.date;
      if (normalizedDate) {
        saveStickyDefaultDate(normalizedDate);
      }

      onChange({
        ...performa,
        location: extracted.location ? String(extracted.location).trim() : performa.location,
        date: nextDate,
        transformerMake: extracted.transformerMake ? String(extracted.transformerMake).trim() : performa.transformerMake,
        transformerSerialNo: extracted.transformerSerialNo ? String(extracted.transformerSerialNo).trim() : performa.transformerSerialNo,
        capacity: extracted.capacity ? String(extracted.capacity).replace(/kva/gi, '').trim() : performa.capacity,
        items: nextItems,
        measurements: nextMeasurements
      });

      setScanStatusMessage(
        `AI Scan Complete! Extracted header details & ${scannedRowsCount} active maintenance rows. Review & click Save & Next.`
      );
      setTimeout(() => setScanStatusMessage(null), 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Photo Scan failed';
      setScanStatusMessage(`Scan notice: ${msg}`);
      setTimeout(() => setScanStatusMessage(null), 7000);
    } finally {
      setIsScanningPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Active rows count
  const activeItemsCount = items.filter(
    i => i.materialYes || i.labourYes || hasRowAnyQty(i)
  ).length;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden file input for 1-Tap AI Photo Scanner (Gallery Picker) */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* ============================================================================
          TOP COCKPIT CONTROL BAR: MODE SWITCHER, AI SCANNER & SMART MACRO PRESETS
      ============================================================================ */}
      {!isReadOnly && (
        <div className="w-full max-w-[1040px] mb-3 bg-slate-900 border border-slate-700 rounded-xl p-2.5 sm:p-3.5 shadow-xl space-y-2.5 print:hidden">
          {/* Row 1: Cockpit Mode Switcher + 1-Tap AI Photo Scan + Row Filter Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            {/* Left: Desktop Numpad vs Mobile 1-Tap Chip Mode */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEntryMode('mobile_tap')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    entryMode === 'mobile_tap'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>1-Tap Chips Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('desktop_numpad');
                    setTimeout(() => focusRowFirstInput(0), 50);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    entryMode === 'desktop_numpad'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Desktop Numpad Mode</span>
                </button>
              </div>

              {/* 1-Tap AI Photo Scan Button */}
              <button
                type="button"
                disabled={isScanningPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
                title="Select an image of a handwritten Performa sheet from gallery to auto-fill"
              >
                {isScanningPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{isScanningPhoto ? 'Scanning Sheet...' : '📷 Scan Performa Photo'}</span>
              </button>
            </div>

            {/* Right: Row Filter Toggle */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRowFilterMode('all')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    rowFilterMode === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All {items.length} Rows
                </button>
                <button
                  type="button"
                  onClick={() => setRowFilterMode('common')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    rowFilterMode === 'common'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Common Rows
                </button>
                <button
                  type="button"
                  onClick={() => setRowFilterMode('active_only')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    rowFilterMode === 'active_only'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rowFilterMode === 'active_only' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>Active Only ({activeItemsCount})</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Scan Status Banner */}
          {scanStatusMessage && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isScanningPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{scanStatusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanStatusMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Row 2: FEATURE 4 — 1-CLICK SMART PRESET / MACRO TEMPLATES BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                1-Tap Macros:
              </span>

              <button
                type="button"
                onClick={handleMacroRoutineService}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Sets SR 3=1, SR 5=1, SR 7=Yes, SR 8=1, SR 14=1, SR 15=1"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>⚡ Standard Routine Service</span>
              </button>

              <button
                type="button"
                onClick={handleMacroBushingStudNutPack}
                className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Sets SR 1=4, SR 2=4, SR 16 (12MM/20MM)=8, SR 17 (12MM/20MM)=8"
              >
                <span>🔩 LT Bushing + Stud + Nut/Washer Pack</span>
              </button>

              <button
                type="button"
                onClick={handleMacroBoxFuseCablePack}
                className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Sets SR 6 (70)=3, SR 9=1, SR 10 (100Amp)=3, SR 13=3"
              >
                <span>📦 Box + Fuse + Cable Pack</span>
              </button>

              {previousPerforma && (
                <button
                  type="button"
                  onClick={handleCopyPreviousPerforma}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Clones Date, Make, Capacity, and all rows from last saved performa; leaves Location & Serial blank"
                >
                  <Copy className="w-3 h-3" />
                  <span>📋 Copy Previous Performa</span>
                </button>
              )}

              {/* Custom User-Saved Macros */}
              {customMacros.map(macro => (
                <button
                  key={macro.id}
                  type="button"
                  onClick={() => handleApplyCustomMacro(macro)}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>★ {macro.name}</span>
                  <span
                    onClick={(e) => handleDeleteCustomMacro(macro.id, e)}
                    className="hover:text-red-400 px-0.5"
                    title="Delete custom macro"
                  >
                    ×
                  </span>
                </button>
              ))}

              {/* Save Custom Macro Button */}
              {isSavingMacro ? (
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5">
                  <input
                    type="text"
                    value={newMacroName}
                    onChange={(e) => setNewMacroName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentAsCustomMacro()}
                    placeholder="Preset name..."
                    className="bg-transparent text-xs text-white outline-none w-24"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsCustomMacro}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingMacro(false)}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSavingMacro(true)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Save current active rows as a custom 1-click macro button"
                >
                  <BookmarkPlus className="w-3 h-3 text-amber-400" />
                  <span>+ Save Macro</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAllRows}
                className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>🗑️ Clear All</span>
              </button>
            </div>

            {/* Instant Row Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Jump / filter SR or item..."
                className="w-full pl-8 pr-7 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {itemSearch && (
                <button
                  type="button"
                  onClick={() => setItemSearch('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateError && (
        <div className="w-full max-w-[1040px] mb-3 bg-amber-50 border-2 border-amber-500 rounded-xl p-3 shadow flex items-center justify-between text-amber-900">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm font-bold">{duplicateError}</div>
          </div>
          <button
            type="button"
            onClick={onClearDuplicateError}
            className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================================
          MAIN COCKPIT DOCUMENT CONTAINER
          Displays ONLY the 5 Required Header Fields + Consolidated Master Rows + Voltage/Ampere
      ============================================================================ */}
      <div
        id="printable-a4-document"
        className="w-full max-w-[1040px] bg-white text-slate-900 border sm:border-2 border-slate-800 shadow-2xl rounded-xl sm:rounded-md p-2.5 sm:p-5 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full"
      >
        {/* Compact Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b-2 border-slate-800">
          <div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight uppercase text-slate-900">
              Work Report of Transformer Maintenance Work
            </h1>
            <p className="text-[11px] text-slate-500 font-mono print:hidden">
              Zero-Mouse Numpad &amp; Multi-Size High-Speed Entry Cockpit • Excel Row #{excelRowPosition}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
              Active Items: {activeItemsCount} / {items.length}
            </span>
          </div>
        </div>

        {/* ============================================================================
            SECTION 2: STICKY COMPACT 4-FIELD TRANSFORMER HEADER BAR
            (Strictly displays: 1. Location, 2. Make [Autofill], 3. Serial No, 4. Capacity KVA)
            Location of Transformer is entered freshly and separately by the user each time.
        ============================================================================ */}
        <div className="sticky top-12 z-20 bg-slate-100/95 backdrop-blur-md border-2 border-slate-800 rounded-md p-2.5 sm:p-3 mb-4 shadow-md print:static print:shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
            {/* FIELD 1: Location of Transformer (Standalone user input — entered separately every time) */}
            <div className="md:col-span-5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>1. Location of Transformer</span>
              </label>
              <input
                ref={locationInputRef}
                type="text"
                disabled={isReadOnly}
                value={performa.location}
                onChange={(e) => handleHeaderChange('location', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    makeInputRef.current?.focus();
                  }
                }}
                placeholder="Enter Location of Transformer..."
                className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-400 rounded focus:border-blue-600 outline-none text-xs sm:text-sm font-bold text-slate-900"
              />
            </div>

            {/* FIELD 2: Transformer Make (Input + Datalist Autofill + 1-Tap Quick-Select Pills) */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                <span>2. Transformer Make</span>
                {performa.transformerMake && (
                  <span className="text-[9px] text-blue-600 font-semibold print:hidden">Autofill on</span>
                )}
              </label>
              <input
                ref={makeInputRef}
                type="text"
                list="transformer-make-suggestions"
                autoComplete="off"
                disabled={isReadOnly}
                value={performa.transformerMake}
                onChange={(e) => handleHeaderChange('transformerMake', e.target.value)}
                onBlur={() => {
                  if (performa.transformerMake) {
                    saveMakeToHistory(performa.transformerMake);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    const currentVal = (performa.transformerMake || '').trim();
                    if (currentVal && matchingMakes.length > 0) {
                      const firstMatch = matchingMakes[0];
                      if (firstMatch.toLowerCase().startsWith(currentVal.toLowerCase()) && firstMatch.toLowerCase() !== currentVal.toLowerCase()) {
                        e.preventDefault();
                        handleHeaderChange('transformerMake', firstMatch);
                        saveMakeToHistory(firstMatch);
                        serialInputRef.current?.focus();
                        return;
                      }
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (performa.transformerMake) {
                        saveMakeToHistory(performa.transformerMake);
                      }
                      serialInputRef.current?.focus();
                    }
                  }
                }}
                placeholder="Select or type Make..."
                className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-400 rounded focus:border-blue-600 outline-none text-xs font-bold text-slate-900 mb-1"
              />
              <datalist id="transformer-make-suggestions">
                {makeSuggestions.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {!isReadOnly && (
                <div className="flex flex-wrap gap-1 print:hidden">
                  {matchingMakes.map(make => {
                    const isSelected = (performa.transformerMake || '').toLowerCase() === make.toLowerCase();
                    return (
                      <button
                        key={make}
                        type="button"
                        onClick={() => {
                          handleHeaderChange('transformerMake', make === 'Other' ? '' : make);
                          if (make !== 'Other') {
                            saveMakeToHistory(make);
                            serialInputRef.current?.focus();
                          }
                        }}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                            : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {make}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FIELD 3: Transformer Serial Number (Enter moves directly to Capacity) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1 truncate" title="Transformer Serial Number">
                3. Serial No.
              </label>
              <input
                ref={serialInputRef}
                type="text"
                disabled={isReadOnly}
                value={performa.transformerSerialNo}
                onChange={(e) => handleHeaderChange('transformerSerialNo', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    capacityInputRef.current?.focus();
                    capacityInputRef.current?.select();
                  }
                }}
                placeholder="743"
                className="w-full px-2 py-1.5 bg-white border-2 border-slate-400 rounded focus:border-blue-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
              />
            </div>

            {/* FIELD 4: Capacity (KVA) (Alphanumeric + 1-Tap Quick Capacity Chips -> jumps straight to Row 1!) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                4. Capacity (KVA)
              </label>
              <input
                ref={capacityInputRef}
                type="text"
                disabled={isReadOnly}
                value={performa.capacity}
                onChange={(e) => handleHeaderChange('capacity', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const firstRowIdx = visibleRowIndices[0] ?? 0;
                    focusRowFirstInput(firstRowIdx);
                  }
                }}
                placeholder="e.g. 63/22 or 100"
                className="w-full px-2 py-1 bg-white border-2 border-slate-400 rounded focus:border-blue-600 outline-none text-xs font-mono font-bold text-slate-900 mb-1"
              />
              {!isReadOnly && (
                <div className="flex flex-wrap gap-0.5 print:hidden">
                  {QUICK_CAPACITIES.map(cap => {
                    const isSelected = String(performa.capacity || '').trim() === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => {
                          handleHeaderChange('capacity', cap);
                          const firstRowIdx = visibleRowIndices[0] ?? 0;
                          setTimeout(() => {
                            focusRowFirstInput(firstRowIdx);
                          }, 30);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================================
            SECTION 3: CONSOLIDATED MASTER ITEMS TABLE WITH SIZE QUANTITY SUB-FIELDS
        ============================================================================ */}
        <div className="border-2 border-slate-800 rounded-sm mb-4 overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-slate-800 text-slate-900 font-extrabold uppercase tracking-wider text-[11px] text-center">
                  <th className="py-2 px-2 border-r border-slate-700 w-12">SR</th>
                  <th className="py-2 px-2.5 border-r border-slate-700 text-left">Description of Maintenance Work</th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-14">Unit</th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-24">Material &amp; Labour</th>
                  <th className="py-2 px-2 w-[310px] sm:w-[370px]">Quantity / Size Wise Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {visibleRowIndices.map((index) => {
                  const item = items[index];
                  const srDisplay = item.srLabel || String(item.srNo);
                  const hasQty = hasRowAnyQty(item);
                  const anyActive = item.materialYes || item.labourYes || hasQty;
                  const isFocused = focusedRowIdx === index;
                  const hasSizeFields = Boolean(item.sizeFields && item.sizeFields.length > 0);

                  return (
                    <tr
                      key={item.id || index}
                      className={`transition-colors ${
                        isFocused
                          ? 'bg-blue-100/90 ring-2 ring-blue-600 ring-inset'
                          : anyActive
                          ? 'bg-emerald-50/90 hover:bg-emerald-100/80 border-l-4 border-l-emerald-600'
                          : 'bg-white hover:bg-slate-50 opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* SR Number Badge */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-extrabold text-slate-800 border-r border-slate-700 bg-slate-100/70 align-middle">
                        {srDisplay}
                      </td>

                      {/* Description (Clicking toggles Material=Yes & Labour=Yes even when QTY is blank) */}
                      <td
                        onClick={() => !isReadOnly && handleToggleRowBothYesBlankQty(index)}
                        className={`py-1.5 px-2.5 border-r border-slate-700 select-none align-middle ${
                          !isReadOnly ? 'cursor-pointer hover:text-blue-700' : ''
                        } ${anyActive ? 'text-slate-950 font-extrabold' : 'text-slate-700 font-medium'}`}
                        title="Click row description to toggle Material=Yes & Labour=Yes"
                      >
                        <span className="leading-snug">{item.description}</span>
                      </td>

                      {/* Unit (Nos., LS, JOB) */}
                      <td className="py-1.5 px-1.5 border-r border-slate-700 text-center font-mono text-[11px] font-bold text-slate-600 bg-slate-50 align-middle">
                        {item.unit}
                      </td>

                      {/* Compact Material & Labour Status Pills */}
                      <td className="py-1.5 px-1.5 border-r border-slate-700 text-center align-middle">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleToggleSinglePill(index, 'materialYes')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border transition-all cursor-pointer ${
                              item.materialYes
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Material Yes/No"
                          >
                            M:{item.materialYes ? 'Yes' : 'No'}
                          </button>

                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleToggleSinglePill(index, 'labourYes')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border transition-all cursor-pointer ${
                              item.labourYes
                                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Labour Yes/No"
                          >
                            L:{item.labourYes ? 'Yes' : 'No'}
                          </button>
                        </div>
                      </td>

                      {/* QUANTITY COLUMN: Either Multi-Size Fields OR Single QTY + 1-Tap Chips */}
                      <td className="py-1.5 px-2 align-middle">
                        {hasSizeFields ? (
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                            <div
                              className={`grid gap-1.5 flex-1 ${
                                item.sizeFields!.length === 3
                                  ? 'grid-cols-3'
                                  : item.sizeFields!.length === 2
                                  ? 'grid-cols-2'
                                  : 'grid-cols-1'
                              }`}
                            >
                              {item.sizeFields!.map((sizeKey, sIdx) => {
                                const rawVal = item.sizeQtys?.[sizeKey] ?? '';
                                const isFieldFilled = isNonZeroQtyValue(rawVal);
                                return (
                                  <div
                                    key={sizeKey}
                                    className="flex flex-col bg-slate-50 border border-slate-200 rounded p-1"
                                  >
                                    <span
                                      className="text-[9px] font-mono font-extrabold text-slate-700 text-center truncate mb-0.5"
                                      title={sizeKey}
                                    >
                                      {sizeKey}
                                    </span>
                                    <input
                                      ref={(el) => {
                                        sizeInputRefs.current[`${index}-${sIdx}`] = el;
                                        if (sIdx === 0) {
                                          qtyInputRefs.current[index] = el;
                                        }
                                      }}
                                      type="text"
                                      inputMode={srDisplay === '4' ? 'text' : 'decimal'}
                                      disabled={isReadOnly}
                                      value={rawVal === 0 ? '' : rawVal}
                                      onFocus={(e) => {
                                        setFocusedRowIdx(index);
                                        e.target.select();
                                      }}
                                      onBlur={() => setFocusedRowIdx(null)}
                                      onKeyDown={(e) => handleQtyKeyDown(e, index, sIdx)}
                                      onChange={(e) =>
                                        handleItemSizeQtyChange(index, sizeKey, e.target.value)
                                      }
                                      placeholder="0"
                                      className={`w-full text-center px-1 py-0.5 border-2 rounded font-mono font-extrabold text-xs outline-none transition-all ${
                                        isFieldFilled
                                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                          : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:bg-blue-50'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {!isReadOnly && hasQty && (
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => handleClearRowSizeQtys(index)}
                                className="w-6 h-6 rounded text-[11px] font-mono font-extrabold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer flex items-center justify-center shrink-0 print:hidden"
                                title="Clear all size quantities in this row"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1.5">
                            {/* 1-Tap Quick Chips */}
                            {!isReadOnly && (
                              <div className="flex items-center gap-0.5 flex-wrap print:hidden">
                                {QUICK_QTY_CHIPS.map(qNum => {
                                  const isChipSelected = String(item.qty ?? '').trim() === String(qNum);
                                  return (
                                    <button
                                      key={qNum}
                                      type="button"
                                      tabIndex={-1}
                                      onClick={() => handleTapQtyChip(index, qNum)}
                                      className={`w-6 h-6 sm:w-6 sm:h-6 rounded text-[11px] font-mono font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                                        isChipSelected
                                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-105'
                                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {qNum}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => handleTapQtyChip(index, 'plus')}
                                  className="w-6 h-6 rounded text-[11px] font-mono font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer flex items-center justify-center"
                                  title="Increment QTY (+1)"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => handleTapQtyChip(index, 'clear')}
                                  className="w-6 h-6 rounded text-[11px] font-mono font-extrabold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer flex items-center justify-center"
                                  title="Clear QTY & Reset to No"
                                >
                                  ×
                                </button>
                              </div>
                            )}

                            {/* Direct QTY Input */}
                            <input
                              ref={(el) => {
                                qtyInputRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="decimal"
                              disabled={isReadOnly}
                              value={item.qty === 0 ? '' : item.qty}
                              onFocus={(e) => {
                                setFocusedRowIdx(index);
                                e.target.select();
                              }}
                              onBlur={() => setFocusedRowIdx(null)}
                              onKeyDown={(e) => handleQtyKeyDown(e, index)}
                              onChange={(e) => handleItemQtyChange(index, e.target.value)}
                              placeholder="0"
                              className={`w-14 sm:w-16 text-center px-1.5 py-1 border-2 rounded font-mono font-extrabold text-xs outline-none transition-all ${
                                hasQty
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                  : anyActive
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                  : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:bg-blue-50'
                              }`}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>



        {/* Official Print Footer */}
        <div className="grid grid-cols-2 gap-6 pt-4 mt-2 border-t border-slate-400 text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-800">Agency / Contractor Signature:</span>{' '}
            <span className="font-serif italic font-bold text-blue-900">SHIV ELECTRICALS</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-800">Authorized Engineer Signature (DGVCL)</span>
          </div>
        </div>
      </div>

      {/* ============================================================================
          FEATURE 6: "SAVE & NEXT PERFORMA" CONTINUOUS BATCH LOOP BAR
      ============================================================================ */}
      {!isReadOnly && (
        <div className="w-full max-w-[1040px] mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-700 rounded-xl shadow-xl print:hidden mb-16 sm:mb-4">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            {onDelete && isExisting && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete</span>
              </button>
            )}
            <div className="text-xs text-slate-300 font-mono">
              <span className="text-emerald-400 font-bold">{activeItemsCount} active items</span> • Excel Row #{excelRowPosition} • Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[10px] text-amber-300">Ctrl+Enter</kbd> for Instant Save &amp; Next
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                saveStickyDefaultDate(performa.date);
                onSaveAndClose();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-bold shadow transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isExisting ? 'Update Performa' : `Save Row #${excelRowPosition}`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveStickyDefaultDate(performa.date);
                onSaveAndAddAnother();
                setTimeout(() => {
                  locationInputRef.current?.focus();
                }, 60);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-lg text-xs sm:text-sm font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>💾 Save &amp; Next Performa (Ctrl+Enter)</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {!isReadOnly && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-2 shadow-2xl flex items-center justify-between gap-2 sm:hidden print:hidden">
          <div className="flex flex-col min-w-0 pl-1">
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              {activeItemsCount}/{items.length} Active • Row #{excelRowPosition}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {performa.location || 'Enter Location'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="p-2 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs"
              title="Scan Performa Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                saveStickyDefaultDate(performa.date);
                onSaveAndClose();
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                saveStickyDefaultDate(performa.date);
                onSaveAndAddAnother();
              }}
              className="px-3.5 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1"
            >
              <span>Save &amp; Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
