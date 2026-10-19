import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Check, 
  X, 
  Zap, 
  Save, 
  FileSpreadsheet, 
  FolderTree, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { InventoryItemDefinition, Division, SubDivision, Location, Transformer } from '../types/inventory';
import { DynamicInventoryForm } from './DynamicInventoryForm';
import { sanitizeFolderName } from '../utils/excelExporter';
import { getStickyDefaultDate, saveStickyDefaultDate } from '../types/performa';

interface QuickEntryViewProps {
  location: string;
  onLocationChange: (loc: string) => void;
  locationType: 'In house' | 'Maintenance';
  onLocationTypeChange: (type: 'In house' | 'Maintenance') => void;
  submittedBy: string;
  onSubmittedByChange: (name: string) => void;
  availableLocations: string[];
  onAddCustomLocation: (newLoc: string) => void;
  itemDefinitions: InventoryItemDefinition[];
  formValues: Record<string, { value: string | number; selectedType?: string | null; optionValues?: Record<string, string | number> }>;
  onValueChange: (itemId: string, field: 'value' | 'selectedType', val: string | number) => void;
  onOptionValueChange?: (itemId: string, subOption: string, val: string | number) => void;
  onOpenAddCustomItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onResetForm: () => void;
  onQuickFillDemo: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onRestoreDefaults?: () => void;
  onSaveAndSync: () => void;
  saveStatus: 'idle' | 'syncing' | 'saved' | 'error' | 'offline_queued';
  lastSavedMessage: string;
  onOpenTargetFile: (loc: string, type: 'In house' | 'Maintenance') => void;
  divisions?: Division[];
  subdivisions?: SubDivision[];
  locationsList?: Location[];
  transformers?: Transformer[];
  selectedTransformerId?: string;
  onTransformerChange?: (tcId: string) => void;
  entryDate?: string;
  onEntryDateChange?: (date: string) => void;
}

const QUICK_MAKES = ['Aman', 'Voltamp', 'ABB', 'Crompton', 'Bharat Bijlee', 'Kotsons', 'Other'];
const QUICK_CAPACITIES = ['10', '16', '25', '63', '63/22', '100', '200', '315', '500'];

export const QuickEntryView: React.FC<QuickEntryViewProps> = ({
  location,
  onLocationChange,
  locationType,
  availableLocations,
  onAddCustomLocation,
  itemDefinitions,
  formValues,
  onValueChange,
  onOptionValueChange,
  onOpenAddCustomItem,
  onDeleteItem,
  onResetForm,
  onQuickFillDemo,
  notes,
  onNotesChange,
  onRestoreDefaults,
  onSaveAndSync,
  saveStatus,
  lastSavedMessage,
  onOpenTargetFile,
  locationsList = [],
  transformers = [],
  onTransformerChange,
  entryDate = getStickyDefaultDate(),
  onEntryDateChange,
}) => {
  const [tcMake, setTcMake] = useState<string>('Aman');
  const [tcSerial, setTcSerial] = useState<string>('');
  const [tcCapacity, setTcCapacity] = useState<string>('100');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const serialInputRef = useRef<HTMLInputElement>(null);
  const capacityInputRef = useRef<HTMLInputElement>(null);

  // Background default Division & Sub-Division (hidden from entry UI as required)
  const backgroundDivision = 'ANKLESHWAR IND DIVISION';
  const backgroundSubDivision = 'ANKLESHWAR GIDC SDN';

  const cleanFolder = sanitizeFolderName(location || 'DOLVAN');
  const primaryWorkbookName = 'DOLVAN_INVENTERY.xlsx';

  const handleLocationSelect = (selectedLoc: string) => {
    onLocationChange(selectedLoc);
    if (!availableLocations.includes(selectedLoc) && selectedLoc.trim()) {
      onAddCustomLocation(selectedLoc.trim());
    }
    // Auto-Fill Make, Serial, Capacity if matching transformer exists in history
    const matchedLocObj = locationsList.find(
      l => l.name.toLowerCase() === selectedLoc.toLowerCase()
    );
    const matchedTc = transformers.find(
      t => (matchedLocObj && t.locationId === matchedLocObj.id) || t.locationId.toLowerCase() === selectedLoc.toLowerCase()
    );
    if (matchedTc) {
      setTcMake(matchedTc.make || tcMake);
      setTcSerial(matchedTc.serialNumber || tcSerial);
      setTcCapacity(matchedTc.capacity || tcCapacity);
      if (onTransformerChange) onTransformerChange(matchedTc.id);
    }
    setShowLocationDropdown(false);
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = d.toISOString().slice(0, 10);
    saveStickyDefaultDate(iso);
    if (onEntryDateChange) onEntryDateChange(iso);
  };

  const filteredLocations = availableLocations.filter(l =>
    l.toLowerCase().includes((location || '').toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 animate-fadeIn font-terminal">
      {/* Compact Destination Bar */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg">
        <div className="flex items-center space-x-2.5 truncate">
          <FolderTree className="w-4 h-4 text-[#00ffaa] shrink-0" />
          <span className="text-xs text-white font-mono truncate">
            Target Workbook: <strong className="text-[#00ffaa]">{primaryWorkbookName}</strong> ({cleanFolder})
          </span>
          <span className="hidden md:inline text-[10px] text-slate-500 font-mono">
            [{backgroundDivision} • {backgroundSubDivision}]
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenTargetFile(location, locationType)}
          className="px-3 py-1 bg-[#111113] hover:bg-[rgba(226,226,231,0.08)] text-[#e2e2e7] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] text-xs font-semibold uppercase transition cursor-pointer flex items-center space-x-1"
        >
          <span>View Workbook</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#00ffaa]" />
        </button>
      </div>

      {/* STRICT 5-FIELD COMPACT STICKY TOP BAR */}
      <div className="sticky top-2 z-20 bg-[#1c1c1f]/95 backdrop-blur-md border-2 border-[#00ffaa]/40 p-3.5 rounded-xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          
          {/* Field 1: Location of Transformer */}
          <div className="md:col-span-4 relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa] mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>1. Location of Transformer</span>
            </label>
            <input
              type="text"
              value={location}
              onFocus={() => setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 180)}
              onChange={(e) => {
                onLocationChange(e.target.value);
                setShowLocationDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLocationSelect(location);
                  serialInputRef.current?.focus();
                }
              }}
              placeholder="e.g. D1S2-66-B-2 or પ્લોટ નં. 492/4"
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.25)] focus:border-[#00ffaa] px-3 py-1.5 text-xs text-white font-bold rounded outline-none"
            />
            {showLocationDropdown && filteredLocations.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#111113] border border-[#00ffaa]/50 rounded-lg shadow-2xl z-30 max-h-44 overflow-y-auto divide-y divide-slate-800">
                {filteredLocations.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onMouseDown={() => handleLocationSelect(loc)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-white font-medium flex items-center justify-between cursor-pointer"
                  >
                    <span>📍 {loc}</span>
                    <span className="text-[10px] text-[#00ffaa] font-mono">Auto-Fill</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Field 2: Date (Sticky Date Memory + [Yesterday] [Today]) */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#00ffaa] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>2. Date</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(-1)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-mono cursor-pointer"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-1.5 py-0.5 bg-[#00ffaa] text-[#111113] rounded text-[9px] font-mono font-bold cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => {
                saveStickyDefaultDate(e.target.value);
                if (onEntryDateChange) onEntryDateChange(e.target.value);
              }}
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.25)] focus:border-[#00ffaa] px-2.5 py-1.5 text-xs text-white font-mono rounded outline-none"
            />
          </div>

          {/* Field 3: Transformer Make */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa] mb-1">
              3. Transformer Make
            </label>
            <input
              type="text"
              value={tcMake}
              onChange={(e) => setTcMake(e.target.value)}
              placeholder="Aman / Voltamp / ABB..."
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.25)] focus:border-[#00ffaa] px-2.5 py-1 text-xs text-white font-bold rounded outline-none mb-1"
            />
            <div className="flex flex-wrap gap-1">
              {QUICK_MAKES.map(make => (
                <button
                  key={make}
                  type="button"
                  onClick={() => {
                    setTcMake(make === 'Other' ? '' : make);
                    if (make !== 'Other') serialInputRef.current?.focus();
                  }}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border cursor-pointer ${
                    tcMake.toLowerCase() === make.toLowerCase()
                      ? 'bg-[#00ffaa] text-[#111113] border-[#00ffaa]'
                      : 'bg-[#111113] text-slate-300 border-slate-700 hover:border-[#00ffaa]'
                  }`}
                >
                  {make}
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Transformer Serial Number */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa] mb-1 truncate">
              4. Serial No
            </label>
            <input
              ref={serialInputRef}
              type="text"
              value={tcSerial}
              onChange={(e) => setTcSerial(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  capacityInputRef.current?.focus();
                }
              }}
              placeholder="743"
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.25)] focus:border-[#00ffaa] px-2 py-1.5 text-xs text-white font-mono font-bold rounded outline-none"
            />
          </div>

          {/* Field 5: Capacity (KVA) */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#00ffaa] mb-1">
              5. Capacity (KVA)
            </label>
            <input
              ref={capacityInputRef}
              type="text"
              value={tcCapacity}
              onChange={(e) => setTcCapacity(e.target.value)}
              placeholder="63/22 or 100"
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.25)] focus:border-[#00ffaa] px-2 py-1 text-xs text-white font-mono font-bold rounded outline-none mb-1"
            />
            <div className="flex flex-wrap gap-1">
              {QUICK_CAPACITIES.map(cap => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setTcCapacity(cap)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border cursor-pointer ${
                    tcCapacity === cap
                      ? 'bg-[#00ffaa] text-[#111113] border-[#00ffaa]'
                      : 'bg-[#111113] text-slate-300 border-slate-700 hover:border-[#00ffaa]'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Dynamic Materials Table */}
      <DynamicInventoryForm
        itemDefinitions={itemDefinitions}
        formValues={formValues}
        onValueChange={onValueChange}
        onOptionValueChange={onOptionValueChange}
        onOpenAddCustomItem={onOpenAddCustomItem}
        onDeleteItem={onDeleteItem}
        onResetForm={onResetForm}
        onQuickFillDemo={onQuickFillDemo}
        onRestoreDefaults={onRestoreDefaults}
        notes={notes}
        onNotesChange={onNotesChange}
      />

      {/* 3. Bottom Action Bar */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-30 font-terminal rounded-xl">
        <div className="flex items-center space-x-2 text-xs">
          {saveStatus === 'syncing' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#111113] border border-[#00ccff] text-[#00ccff] animate-pulse">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span className="font-semibold">Saving &amp; Updating Central Database...</span>
            </div>
          )}

          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#111113] border border-[#00ffaa] text-[#00ffaa]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span className="font-semibold">{lastSavedMessage || `Saved into ${primaryWorkbookName}!`}</span>
            </div>
          )}

          {saveStatus === 'idle' && (
            <div className="flex items-center space-x-1.5 text-[rgba(226,226,231,0.5)] text-xs font-mono">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span>Target Workbook: <strong className="text-white">{primaryWorkbookName}</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onResetForm}
            className="px-4 py-2.5 bg-transparent hover:bg-[rgba(226,226,231,0.08)] border border-[rgba(226,226,231,0.2)] text-[rgba(226,226,231,0.8)] text-xs uppercase font-semibold transition cursor-pointer"
          >
            Clear Form
          </button>

          <button
            type="button"
            onClick={onSaveAndSync}
            disabled={saveStatus === 'syncing'}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold uppercase transition cursor-pointer disabled:opacity-60"
          >
            <Save className={`w-4 h-4 ${saveStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{saveStatus === 'syncing' ? 'Saving Entry...' : 'Save & Next Performa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
