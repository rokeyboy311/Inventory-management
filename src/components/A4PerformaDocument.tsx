import React, { useState, useMemo } from 'react';
import { PerformaRecord, MaintenanceItemRow } from '../types/performa';
import { 
  Check, 
  X, 
  Calendar, 
  MapPin, 
  Hash, 
  Zap, 
  AlertCircle, 
  Save, 
  PlusCircle, 
  Trash2, 
  ArrowLeftRight,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  Copy,
  RotateCcw,
  Plus,
  Minus,
  Eye,
  Filter,
  CheckCircle2,
  Gauge,
  FastForward
} from 'lucide-react';
import { findMatchingPerforma, normalizePerformaIdInput, parsePerformaId } from '../utils/idGenerator';

interface A4PerformaDocumentProps {
  performa: PerformaRecord;
  existingPerformas?: PerformaRecord[];
  locationName?: string;
  onChange: (updated: PerformaRecord) => void;
  onSelectExistingPerforma?: (record: PerformaRecord) => void;
  onStartNewWithId?: (newId: string) => void;
  onSaveAndAddAnother: () => void;
  onSaveAndClose: () => void;
  onDelete?: () => void;
  isExisting: boolean;
  duplicateError?: string | null;
  onClearDuplicateError?: () => void;
  viewMode: 'edit' | 'preview' | 'print';
}

const COMMON_MAKES = ['JAYESH', 'GETCO', 'VOLTAMP', 'W&P', 'ABB', 'BHEL', 'CROMPTON', 'NIK-SAN'];
const COMMON_CAPACITIES = ['25', '63', '100', '200', '500'];
const QUICK_QTYS = [1, 2, 3, 6];

export const A4PerformaDocument: React.FC<A4PerformaDocumentProps> = ({
  performa,
  existingPerformas = [],
  locationName = 'Dolvan',
  onChange,
  onSelectExistingPerforma,
  onStartNewWithId,
  onSaveAndAddAnother,
  onSaveAndClose,
  onDelete,
  isExisting,
  duplicateError,
  onClearDuplicateError,
  viewMode
}) => {
  const isReadOnly = viewMode === 'preview' || viewMode === 'print';
  const [itemSearch, setItemSearch] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [idLookupNotice, setIdLookupNotice] = useState<{
    type: 'matched' | 'new';
    message: string;
    targetRow: number;
    matchedId?: string;
  } | null>(null);

  const measurements = performa.measurements || {
    voltageRN: '0',
    voltageYN: '0',
    voltageBN: '0',
    ampereR: '0',
    ampereY: '0',
    ampereB: '0',
    ampereN: '0'
  };
  const items = performa.items || [];

  // Calculate where this Performa ID sits (or will sit) in the Excel Sheet
  const excelRowPosition = useMemo(() => {
    const trimmed = (performa.id || '').trim();
    if (!trimmed) return existingPerformas.length + 1;
    const existingIdx = existingPerformas.findIndex(
      p => p.id.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existingIdx >= 0) return existingIdx + 1;

    const parsedCurrent = parsePerformaId(trimmed);
    if (!parsedCurrent) return existingPerformas.length + 1;

    let insertPos = 1;
    for (const rec of existingPerformas) {
      const p = parsePerformaId(rec.id);
      if (p && p.num < parsedCurrent.num) {
        insertPos++;
      }
    }
    return insertPos;
  }, [performa.id, existingPerformas]);

  // Previous performa for 1-click Copy Header / Items
  const previousPerforma = useMemo(() => {
    if (existingPerformas.length === 0) return null;
    const currentIdx = existingPerformas.findIndex(
      p => p.id.trim().toLowerCase() === (performa.id || '').trim().toLowerCase()
    );
    if (currentIdx > 0) return existingPerformas[currentIdx - 1];
    return existingPerformas[existingPerformas.length - 1];
  }, [existingPerformas, performa.id]);

  // Handle typing or changing Performa ID with automatic lookup!
  const handlePerformaIdInput = (rawVal: string) => {
    if (isReadOnly) return;
    if (onClearDuplicateError) onClearDuplicateError();

    // Update current input immediately so typing feels natural
    onChange({
      ...performa,
      id: rawVal
    });

    const trimmed = rawVal.trim();
    if (!trimmed) {
      setIdLookupNotice(null);
      return;
    }

    // Check if an existing Performa matches this ID (exact or formatted)
    const exactMatch = existingPerformas.find(
      p => p.id.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (exactMatch) {
      const rowNum = existingPerformas.findIndex(p => p.id === exactMatch.id) + 1;
      setIdLookupNotice({
        type: 'matched',
        message: `Performa "${exactMatch.id}" already exists at Excel Row #${rowNum}. Loaded automatically below for editing!`,
        targetRow: rowNum,
        matchedId: exactMatch.id
      });
      if (onSelectExistingPerforma) {
        onSelectExistingPerforma(exactMatch);
      }
      return;
    }

    // Also check if normalized prefix match exists when user types e.g. "DOL-001"
    const normalized = normalizePerformaIdInput(trimmed, existingPerformas, locationName);
    const normalizedMatch = existingPerformas.find(
      p => p.id.trim().toLowerCase() === normalized.toLowerCase()
    );

    if (normalizedMatch && trimmed.length >= 3) {
      const rowNum = existingPerformas.findIndex(p => p.id === normalizedMatch.id) + 1;
      setIdLookupNotice({
        type: 'matched',
        message: `Performa "${normalizedMatch.id}" already exists at Excel Row #${rowNum}. Loaded automatically below for editing!`,
        targetRow: rowNum,
        matchedId: normalizedMatch.id
      });
      if (onSelectExistingPerforma) {
        onSelectExistingPerforma(normalizedMatch);
      }
      return;
    }

    // Otherwise it's a NEW Performa ID -> tell user which exact Excel row it will insert into
    const parsed = parsePerformaId(normalized);
    let targetRow = existingPerformas.length + 1;
    if (parsed) {
      let pos = 1;
      for (const r of existingPerformas) {
        const pr = parsePerformaId(r.id);
        if (pr && pr.num < parsed.num) pos++;
      }
      targetRow = pos;
    }

    setIdLookupNotice({
      type: 'new',
      message: `New Performa ID "${normalized}" — will be inserted directly at Excel Row #${targetRow}`,
      targetRow
    });

    if (onStartNewWithId) {
      onStartNewWithId(rawVal);
    }
  };

  // On blur or Enter on Performa ID field: normalize shorthand number (e.g. "2" -> "DOL-002") and auto-load if existing
  const handlePerformaIdCommit = () => {
    if (isReadOnly) return;
    const trimmed = (performa.id || '').trim();
    if (!trimmed) return;

    const matched = findMatchingPerforma(trimmed, existingPerformas);
    if (matched) {
      const rowNum = existingPerformas.findIndex(p => p.id === matched.id) + 1;
      setIdLookupNotice({
        type: 'matched',
        message: `Performa "${matched.id}" found at Excel Row #${rowNum} — loaded below for instant editing!`,
        targetRow: rowNum,
        matchedId: matched.id
      });
      if (onSelectExistingPerforma) {
        onSelectExistingPerforma(matched);
      }
      return;
    }

    const formatted = normalizePerformaIdInput(trimmed, existingPerformas, locationName);
    if (formatted !== performa.id) {
      onChange({
        ...performa,
        id: formatted
      });
    }
    if (onStartNewWithId) {
      onStartNewWithId(formatted);
    }
  };

  // Update top header fields
  const handleHeaderChange = (field: keyof PerformaRecord, value: any) => {
    if (isReadOnly) return;
    if (field === 'id') {
      handlePerformaIdInput(String(value));
      return;
    }
    onChange({
      ...performa,
      [field]: value
    });
  };

  // Update measurement fields
  const handleMeasurementChange = (field: keyof PerformaRecord['measurements'], value: string) => {
    if (isReadOnly) return;
    onChange({
      ...performa,
      measurements: {
        ...measurements,
        [field]: value
      }
    });
  };

  // Update single item row field (with smart auto-qty when Material or Labour is set to Yes)
  const handleItemFieldChange = (index: number, field: keyof MaintenanceItemRow, value: any) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const current = { ...nextItems[index], [field]: value };

    // Smart Speed Trick: When user sets Material=Yes or Labour=Yes and QTY is 0, auto-set QTY=1!
    if ((field === 'materialYes' || field === 'labourYes') && value === true) {
      if (!Number(current.qty) || Number(current.qty) === 0) {
        current.qty = 1;
      }
    }
    // If both Material and Labour become No, reset QTY to 0 automatically
    if ((field === 'materialYes' || field === 'labourYes') && !current.materialYes && !current.labourYes) {
      current.qty = 0;
    }
    // Smart Speed Trick: When user enters any QTY > 0, automatically mark Both (Material + Labour) = Yes!
    if (field === 'qty') {
      const numQ = Number(value) || 0;
      if (numQ > 0) {
        current.materialYes = true;
        current.labourYes = true;
      } else if (numQ === 0) {
        current.materialYes = false;
        current.labourYes = false;
      }
    }

    nextItems[index] = current;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // 1-Click Checkbox: Toggle BOTH Material = Yes AND Labour = Yes together on a row!
  const handleToggleBothYes = (index: number) => {
    if (isReadOnly) return;
    const nextItems = [...items];
    const item = { ...nextItems[index] };
    const bothCurrentlyYes = item.materialYes && item.labourYes;

    if (bothCurrentlyYes) {
      item.materialYes = false;
      item.labourYes = false;
      item.qty = 0;
    } else {
      item.materialYes = true;
      item.labourYes = true;
      if (!Number(item.qty) || Number(item.qty) === 0) {
        item.qty = 1;
      }
    }

    nextItems[index] = item;
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Bulk Preset: Standard DGVCL Routine Maintenance Preset (1-click fills common items from reference photo)
  const handleApplyRoutinePreset = () => {
    if (isReadOnly) return;
    const nextItems = items.map(it => {
      const desc = it.description.toLowerCase();
      // Routine items commonly checked in Dolvan TC maintenance
      if (
        desc.includes('half stud') ||
        desc.includes('earth connection') ||
        desc.includes('r,y,b and n core') ||
        desc.includes('oil leakage') ||
        desc.includes('measurement of voltage') ||
        desc.includes('kit-ket fuse (100amp)') ||
        desc.includes('general condition') ||
        desc.includes('brass nut 12mm')
      ) {
        return {
          ...it,
          materialYes: !desc.includes('earth connection'),
          labourYes: true,
          qty: Number(it.qty) > 0 ? it.qty : 1
        };
      }
      if (desc.includes('al patta') || desc.includes('250 amp hrc') || desc.includes('sundry items') || desc.includes('brass nut 30mm')) {
        return {
          ...it,
          materialYes: true,
          labourYes: true,
          qty: Number(it.qty) > 0 ? it.qty : 3
        };
      }
      return it;
    });

    onChange({
      ...performa,
      items: nextItems,
      measurements: {
        ...measurements,
        voltageRN: measurements.voltageRN && measurements.voltageRN !== '0' ? measurements.voltageRN : '232',
        voltageYN: measurements.voltageYN && measurements.voltageYN !== '0' ? measurements.voltageYN : '235',
        voltageBN: measurements.voltageBN && measurements.voltageBN !== '0' ? measurements.voltageBN : '231',
        ampereR: measurements.ampereR && measurements.ampereR !== '0' ? measurements.ampereR : '16',
        ampereY: measurements.ampereY && measurements.ampereY !== '0' ? measurements.ampereY : '18',
        ampereB: measurements.ampereB && measurements.ampereB !== '0' ? measurements.ampereB : '15',
        ampereN: measurements.ampereN && measurements.ampereN !== '0' ? measurements.ampereN : '2'
      }
    });
  };

  // Bulk Action: Select All Rows Both Yes / Clear All Rows to No
  const handleBulkAllRows = (makeYes: boolean) => {
    if (isReadOnly) return;
    const nextItems = items.map(it => ({
      ...it,
      materialYes: makeYes,
      labourYes: makeYes,
      qty: makeYes ? (Number(it.qty) > 0 ? it.qty : 1) : 0
    }));
    onChange({
      ...performa,
      items: nextItems
    });
  };

  // Copy from Previous Performa (saves 90% typing when entering consecutive TCs)
  const handleCopyFromPrevious = () => {
    if (isReadOnly || !previousPerforma) return;
    onChange({
      ...performa,
      location: performa.location || previousPerforma.location,
      date: previousPerforma.date || performa.date,
      transformerMake: previousPerforma.transformerMake || performa.transformerMake,
      capacity: previousPerforma.capacity || performa.capacity,
      items: previousPerforma.items.map(it => ({ ...it })),
      measurements: { ...previousPerforma.measurements }
    });
  };

  // Quick Voltage & Ampere Preset
  const handleApplyStandardVoltage = (vRN: string, vYN: string, vBN: string, aR: string, aY: string, aB: string, aN: string) => {
    if (isReadOnly) return;
    onChange({
      ...performa,
      measurements: {
        ...measurements,
        voltageRN: vRN,
        voltageYN: vYN,
        voltageBN: vBN,
        ampereR: aR,
        ampereY: aY,
        ampereB: aB,
        ampereN: aN
      }
    });
  };

  // Keyboard navigation helper: Press Enter in any input to jump to the next input field like Excel!
  const handleEnterKeyNextField = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#printable-a4-document input:not([disabled])'
        )
      );
      const currentIndex = formElements.indexOf(e.currentTarget);
      if (currentIndex >= 0 && currentIndex < formElements.length - 1) {
        const nextEl = formElements[currentIndex + 1];
        nextEl.focus();
        if (nextEl instanceof HTMLInputElement) {
          nextEl.select();
        }
      }
    }
  };

  const activeItemsCount = items.filter(i => i.materialYes || i.labourYes || Number(i.qty) > 0).length;

  return (
    <div className="w-full flex flex-col items-center">
      {/* ⚡ SMART PERFORMA ID JUMP & INSTANT SPEED BAR (Hidden on print) */}
      {!isReadOnly && (
        <div className="w-full max-w-[920px] mb-3.5 bg-slate-800 border border-slate-700 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 print:hidden">
          {/* Top Row: Instant Performa ID Search / Check + Excel Row Placement Indicator */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                <FastForward className="w-4 h-4 text-emerald-400" />
                <span>Fast Entry Mode</span>
              </div>

              {/* Quick Performa ID Input & Auto-Check */}
              <div className="flex items-center bg-slate-900 border-2 border-emerald-500/60 focus-within:border-emerald-400 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-2">Performa ID:</span>
                <input
                  type="text"
                  value={performa.id}
                  onChange={(e) => handlePerformaIdInput(e.target.value)}
                  onBlur={handlePerformaIdCommit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePerformaIdCommit();
                    }
                  }}
                  placeholder="Type ID or No. (e.g. DOL-001 or 2)"
                  className="bg-transparent text-emerald-300 font-mono font-extrabold text-sm outline-none w-36 sm:w-44"
                />
                {isExisting ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                    Editing Row #{excelRowPosition}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                    New → Excel Row #{excelRowPosition}
                  </span>
                )}
              </div>

              {/* Quick Jump Chips for Existing Performas */}
              {existingPerformas.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1 whitespace-nowrap">Saved IDs:</span>
                  {existingPerformas.slice(0, 8).map((rec, idx) => {
                    const isSelected = rec.id.trim().toLowerCase() === (performa.id || '').trim().toLowerCase();
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          if (onSelectExistingPerforma) onSelectExistingPerforma(rec);
                          setIdLookupNotice({
                            type: 'matched',
                            message: `Loaded existing Performa "${rec.id}" (Excel Row #${idx + 1}) for editing.`,
                            targetRow: idx + 1,
                            matchedId: rec.id
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title={`Row #${idx + 1}: ${rec.location || 'No Location'} (TC: ${rec.transformerSerialNo || '-'})`}
                      >
                        {rec.id}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: 1-Click Speed Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleApplyRoutinePreset}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                title="1-Click Fill Standard TC Maintenance Items & Normal Voltage"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ 1-Click Standard TC Fill</span>
              </button>

              {previousPerforma && (
                <button
                  type="button"
                  onClick={handleCopyFromPrevious}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title={`Copy items & readings from ${previousPerforma.id}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {previousPerforma.id}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleBulkAllRows(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Mark ALL 18 items Material=Yes & Labour=Yes"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Yes</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkAllRows(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Reset all items to No & Qty 0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset All</span>
              </button>
            </div>
          </div>

          {/* Live Performa ID Lookup Status Banner */}
          {idLookupNotice && (
            <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
              idLookupNotice.type === 'matched'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                  idLookupNotice.type === 'matched' ? 'text-amber-400' : 'text-emerald-400'
                }`} />
                <span>{idLookupNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setIdLookupNotice(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Row: Instant Search Filter inside Performa Items + Active Filter Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Quick filter items by Sr No or name (e.g. 'bushing', 'cable', 'fuse', '11', 'stud')..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-500"
              />
              {itemSearch && (
                <button
                  type="button"
                  onClick={() => setItemSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showOnlyActive
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{showOnlyActive ? `Showing Filled Only (${activeItemsCount})` : `Active Items: ${activeItemsCount}/${items.length}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate ID Warning Notification */}
      {duplicateError && (
        <div className="w-full max-w-[920px] mb-4 bg-amber-50 border-2 border-amber-500 rounded-xl p-4 shadow-md flex items-center justify-between text-amber-900">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-base">Performa ID Notice</div>
              <div className="text-sm text-amber-800">{duplicateError}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearDuplicateError}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* A4 Document Container */}
      <div 
        id="printable-a4-document"
        className="w-full max-w-[920px] bg-white text-slate-900 border sm:border-2 border-slate-700 shadow-md sm:shadow-2xl rounded-xl sm:rounded-sm p-3 sm:p-6 md:p-7 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full transition-all"
      >
        {/* Document Header Title */}
        <div className="text-center pb-3 border-b-2 border-slate-800 mb-3">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight font-serif uppercase text-slate-900 leading-tight">
            Transformer Maintenance / Repair Performa
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 text-[11px] sm:text-xs text-slate-600 uppercase tracking-wider font-mono">
            <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
              Performa ID: <strong className="font-bold">{performa.id}</strong>
            </span>
            <span>•</span>
            <span className="bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded border border-indigo-200 font-bold">
              Excel Row #{excelRowPosition}
            </span>
            <span>•</span>
            <span className={`px-2.5 py-0.5 rounded border font-bold ${
              isExisting ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              {isExisting ? 'Editing Saved Record' : 'New Entry (Auto-Places in Excel)'}
            </span>
          </div>
        </div>

        {/* Top Info Grid with 1-Click Quick Fill Chips */}
        <div className="border border-slate-700 rounded-sm mb-4 text-xs sm:text-sm bg-slate-50/50">
          {/* Row 1: Location & Date */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-700">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Location of Transformer
            </div>
            <div className="md:col-span-4 p-1.5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.location}
                onChange={(e) => handleHeaderChange('location', e.target.value)}
                onKeyDown={handleEnterKeyNextField}
                placeholder="Enter Transformer Site Location (e.g. JAY GANESH PLOT)"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-900 font-bold"
              />
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-700">
              <span>DATE</span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleHeaderChange('date', new Date().toISOString().slice(0, 10))}
                  className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold print:hidden cursor-pointer"
                  title="Set Today's Date"
                >
                  Today
                </button>
              )}
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.date}
                onChange={(e) => handleHeaderChange('date', e.target.value)}
                onKeyDown={handleEnterKeyNextField}
                placeholder="DD-MM-YY or YYYY-MM-DD"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 2: Transformer Make (with 1-click chips) & Serial No */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-700">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Transformer Make
            </div>
            <div className="md:col-span-4 p-1.5 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.transformerMake}
                onChange={(e) => handleHeaderChange('transformerMake', e.target.value)}
                onKeyDown={handleEnterKeyNextField}
                placeholder="e.g. JAYESH / GETCO / W&P"
                className="w-full px-2 py-1 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-900 font-bold"
              />
              {!isReadOnly && (
                <div className="flex flex-wrap gap-1 print:hidden">
                  {COMMON_MAKES.map(make => (
                    <button
                      key={make}
                      type="button"
                      onClick={() => handleHeaderChange('transformerMake', make)}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        (performa.transformerMake || '').toUpperCase() === make
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {make}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              TC Serial No.
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.transformerSerialNo}
                onChange={(e) => handleHeaderChange('transformerSerialNo', e.target.value)}
                onKeyDown={handleEnterKeyNextField}
                placeholder="e.g. 52 or IT 1434"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 3: Capacity (with 1-click KVA pills) & Performa ID (auto-checking) */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              CAPACITY (KVA)
            </div>
            <div className="md:col-span-4 p-1.5 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.capacity}
                onChange={(e) => handleHeaderChange('capacity', e.target.value)}
                onKeyDown={handleEnterKeyNextField}
                placeholder="e.g. 100 or 200"
                className="w-full px-2 py-1 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-900 font-bold"
              />
              {!isReadOnly && (
                <div className="flex flex-wrap gap-1 print:hidden">
                  {COMMON_CAPACITIES.map(cap => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => handleHeaderChange('capacity', cap)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        String(performa.capacity || '').trim() === cap
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {cap} KVA
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700">
              <span>Performa ID</span>
              <span className="text-[9px] text-emerald-700 font-normal print:hidden">Auto-loads if exists</span>
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.id}
                onChange={(e) => handlePerformaIdInput(e.target.value)}
                onBlur={handlePerformaIdCommit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePerformaIdCommit();
                  }
                }}
                placeholder="e.g. DOL-001"
                className={`w-full px-2 py-1.5 bg-transparent border-2 rounded font-mono font-extrabold text-blue-700 outline-none ${
                  duplicateError ? 'border-red-500 bg-red-50' : 'border-blue-400 focus:border-blue-600 focus:bg-blue-50/30'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Items Table (Rows 1 to 18) */}
        <div className="border border-slate-700 rounded-sm mb-4 overflow-hidden">
          {/* Speed Hint Banner */}
          {!isReadOnly && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900 bg-emerald-50 px-3 py-1.5 border-b border-emerald-200 print:hidden">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  <strong>Fast Tip:</strong> Enter any <strong>QTY</strong> (or click <strong>1 / 2 / 3 / 6</strong>) to automatically mark both <strong>Material = Yes &amp; Labour = Yes</strong>!
                </span>
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {activeItemsCount} of {items.length} rows active
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px] sm:text-xs min-w-[560px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-700 text-slate-800 font-bold uppercase tracking-wider text-center">
                  <th className="py-2 px-1.5 border-r border-slate-700 w-10">Sr</th>
                  <th className="py-2 px-2.5 border-r border-slate-700 text-left">Description</th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-14">Unit</th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-24">Material</th>
                  <th className="py-2 px-1.5 border-r border-slate-700 w-24">Labour</th>
                  <th className="py-2 px-1.5 w-32">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {items.map((item, index) => {
                  // Apply search and active filters if set
                  if (itemSearch.trim()) {
                    const q = itemSearch.toLowerCase();
                    const matchDesc = item.description.toLowerCase().includes(q);
                    const matchSr = String(item.srNo).includes(q);
                    if (!matchDesc && !matchSr) return null;
                  }
                  if (showOnlyActive) {
                    const isRowActive = item.materialYes || item.labourYes || Number(item.qty) > 0;
                    if (!isRowActive) return null;
                  }

                  const isFiltering = !!itemSearch.trim() || showOnlyActive;
                  const prevItem = index > 0 ? items[index - 1] : null;
                  const isFirstOfGroup = isFiltering || !prevItem || prevItem.srNo !== item.srNo;
                  const groupCount = isFiltering ? 1 : items.filter(i => i.srNo === item.srNo).length;
                  const anyActive = item.materialYes || item.labourYes || Number(item.qty) > 0;

                  return (
                    <tr 
                      key={item.id || index}
                      className={`transition-colors ${
                        anyActive ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'hover:bg-blue-50/30'
                      }`}
                    >
                      {/* Sr No */}
                      {isFirstOfGroup ? (
                        <td 
                          rowSpan={groupCount}
                          className="py-1.5 px-1.5 text-center font-bold text-slate-800 border-r border-slate-700 bg-slate-50 align-middle"
                        >
                          {item.srNo}
                        </td>
                      ) : null}

                      {/* Description */}
                      <td 
                        onClick={() => !isReadOnly && handleToggleBothYes(index)}
                        className={`py-1.5 px-2.5 border-r border-slate-700 font-medium select-none ${
                          !isReadOnly ? 'cursor-pointer hover:text-blue-700' : ''
                        } ${anyActive ? 'text-slate-950 font-bold' : 'text-slate-800'}`}
                        title={!isReadOnly ? 'Click description to toggle Material & Labour = Yes' : ''}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>{item.description}</span>
                          {anyActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 print:hidden" />
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-1 px-1.5 border-r border-slate-700 text-center font-mono text-slate-600 bg-slate-50/50">
                        {item.unit}
                      </td>

                      {/* Material Yes/No */}
                      <td className="py-1 px-1.5 border-r border-slate-700 text-center">
                        <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 shadow-2xs">
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleItemFieldChange(index, 'materialYes', true)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                              item.materialYes
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleItemFieldChange(index, 'materialYes', false)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                              !item.materialYes
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </td>

                      {/* Labour Yes/No */}
                      <td className="py-1 px-1.5 border-r border-slate-700 text-center">
                        <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 shadow-2xs">
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleItemFieldChange(index, 'labourYes', true)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                              item.labourYes
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleItemFieldChange(index, 'labourYes', false)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                              !item.labourYes
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </td>

                      {/* QTY with 1-Click Quick Stepper & Preset Numbers */}
                      <td className="py-1 px-1.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center w-full gap-0.5">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleItemFieldChange(index, 'qty', Math.max(0, (Number(item.qty) || 0) - 1))}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-xs print:hidden cursor-pointer"
                              >
                                -
                              </button>
                            )}
                            <input
                              type="number"
                              disabled={isReadOnly}
                              value={item.qty}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={handleEnterKeyNextField}
                              onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value === '' ? 0 : e.target.value)}
                              className={`w-full text-center px-1 py-0.5 border rounded font-mono font-bold outline-none ${
                                Number(item.qty) > 0
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                                  : 'border-slate-300 text-slate-800 focus:border-blue-600 focus:bg-blue-50'
                              }`}
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleItemFieldChange(index, 'qty', (Number(item.qty) || 0) + 1)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-xs print:hidden cursor-pointer"
                              >
                                +
                              </button>
                            )}
                          </div>
                          {/* Quick 1, 2, 3, 6 tap pills */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-0.5 print:hidden">
                              {QUICK_QTYS.map(qNum => (
                                <button
                                  key={qNum}
                                  type="button"
                                  onClick={() => handleItemFieldChange(index, 'qty', qNum)}
                                  className={`px-1.5 py-0 text-[9px] font-mono font-bold rounded border cursor-pointer ${
                                    Number(item.qty) === qNum
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                                  }`}
                                >
                                  {qNum}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rows 19 & 20: Voltage and Ampere Measurements Grid with 1-Click Standard Presets */}
        <div className="border border-slate-700 rounded-sm mb-6 text-xs sm:text-sm overflow-hidden">
          {!isReadOnly && (
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Voltage & Load Presets (1-Click Fill):</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyStandardVoltage('230', '235', '232', '15', '18', '14', '0')}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                >
                  Standard 230V / 15A
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStandardVoltage('238', '240', '236', '28', '32', '26', '4')}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                >
                  Medium Load 240V / 30A
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStandardVoltage('225', '228', '224', '45', '48', '42', '6')}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer"
                >
                  Heavy Load 225V / 45A
                </button>
              </div>
            </div>
          )}

          {/* Row 19: Voltage */}
          <div className="flex flex-col sm:grid sm:grid-cols-12 border-b border-slate-700 bg-white items-stretch sm:items-center">
            <div className="flex items-center sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-700 bg-slate-100 font-semibold text-slate-800">
              <span className="w-8 sm:w-10 py-2 px-1 font-bold text-center border-r border-slate-700 bg-slate-200/80">19</span>
              <span className="px-2.5 py-1.5 font-bold">Voltage (Volts)</span>
            </div>
            <div className="sm:col-span-8 grid grid-cols-3 divide-x divide-slate-700 text-center">
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">R-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.voltageRN}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('voltageRN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Y-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.voltageYN}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('voltageYN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">B-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.voltageBN}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('voltageBN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 20: Ampere */}
          <div className="flex flex-col sm:grid sm:grid-cols-12 bg-white items-stretch sm:items-center">
            <div className="flex items-center sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-700 bg-slate-100 font-semibold text-slate-800">
              <span className="w-8 sm:w-10 py-2 px-1 font-bold text-center border-r border-slate-700 bg-slate-200/80">20</span>
              <span className="px-2.5 py-1.5 font-bold">Ampere (Amps)</span>
            </div>
            <div className="sm:col-span-8 grid grid-cols-4 divide-x divide-slate-700 text-center">
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">R</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.ampereR}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('ampereR', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Y</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.ampereY}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('ampereY', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">B</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.ampereB}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('ampereB', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={measurements.ampereN}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNextField}
                  onChange={(e) => handleMeasurementChange('ampereN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performa Footer / Signature Section for Official Printouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 mt-4 border-t border-slate-400 text-xs text-slate-600">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-slate-800">Field Engineer / Technician Signature:</span>
              <span className="font-serif italic font-bold text-blue-900 text-sm">Dk</span>
            </div>
            <div className="border-b border-dashed border-slate-400 h-6"></div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-semibold text-slate-800 mb-1">Authorized Discom Officer Signature</div>
            <div className="border-b border-dashed border-slate-400 h-6"></div>
          </div>
        </div>
      </div>

      {/* Action Controls directly below the A4 sheet (Hidden during print) */}
      {!isReadOnly && (
        <div className="w-full max-w-[920px] mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-lg print:hidden mb-16 sm:mb-0">
          <div className="flex items-center justify-between sm:justify-start space-x-3">
            {onDelete && isExisting && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Performa</span>
              </button>
            )}
            <span className="text-xs text-slate-600 font-mono">
              {isExisting
                ? `Updating ${performa.id} at Excel Row #${excelRowPosition}`
                : `Will insert ${performa.id} at Excel Row #${excelRowPosition}`}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onSaveAndClose}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-all hover:shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isExisting ? 'Update Performa' : `Save to Row #${excelRowPosition}`}</span>
            </button>

            <button
              type="button"
              onClick={onSaveAndAddAnother}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save & Next Performa</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar for field technicians (Hidden on desktop & print) */}
      {!isReadOnly && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-300 p-2.5 shadow-2xl flex items-center justify-between gap-2 sm:hidden print:hidden">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[10px] text-slate-500 font-mono">
              {isExisting ? `Edit Row #${excelRowPosition}` : `New Row #${excelRowPosition}`}
            </span>
            <span className="text-xs font-bold font-mono text-blue-700 truncate">{performa.id}</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {onDelete && isExisting && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}

            <button
              type="button"
              onClick={onSaveAndClose}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isExisting ? 'Update' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={onSaveAndAddAnother}
              className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Save & Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
