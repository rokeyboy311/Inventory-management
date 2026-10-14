import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Home, 
  Wrench, 
  User, 
  Plus, 
  Check, 
  X, 
  Zap, 
  RotateCcw, 
  Sparkles, 
  Save, 
  FileSpreadsheet, 
  FolderTree, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Activity,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { InventoryItemDefinition, Division, SubDivision, Location, Transformer } from '../types/inventory';
import { DynamicInventoryForm } from './DynamicInventoryForm';
import { sanitizeFolderName } from '../utils/excelExporter';

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
  // Hierarchy & Transformer props
  divisions?: Division[];
  subdivisions?: SubDivision[];
  locationsList?: Location[];
  transformers?: Transformer[];
  selectedTransformerId?: string;
  onTransformerChange?: (tcId: string) => void;
  entryDate?: string;
  onEntryDateChange?: (date: string) => void;
}

export const QuickEntryView: React.FC<QuickEntryViewProps> = ({
  location,
  onLocationChange,
  locationType,
  onLocationTypeChange,
  submittedBy,
  onSubmittedByChange,
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
  divisions = [],
  subdivisions = [],
  locationsList = [],
  transformers = [],
  selectedTransformerId,
  onTransformerChange,
  entryDate = new Date().toISOString().slice(0, 10),
  onEntryDateChange,
}) => {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  // Selected Division & SubDivision IDs with cascading reset
  const activeDivisions = divisions.length > 0 ? divisions : [{ id: 'div-vyara', name: 'VYARA', code: 'VYR', status: 'active' as const, createdAt: '', updatedAt: '' }];
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(activeDivisions[0]?.id || 'div-vyara');

  const filteredSubdivisions = subdivisions.filter(s => s.divisionId === selectedDivisionId || !s.divisionId);
  const activeSubdivisions = filteredSubdivisions.length > 0 
    ? filteredSubdivisions 
    : [{ id: 'sub-dolvan', divisionId: selectedDivisionId, name: 'DOLVAN', code: 'DLV', status: 'active' as const, createdAt: '', updatedAt: '' }];
  
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string>(activeSubdivisions[0]?.id || 'sub-dolvan');

  const currentDiv = activeDivisions.find(d => d.id === selectedDivisionId) || activeDivisions[0];
  const currentSub = activeSubdivisions.find(s => s.id === selectedSubdivisionId) || activeSubdivisions[0];

  const handleDivisionChange = (divId: string) => {
    setSelectedDivisionId(divId);
    const nextSubs = subdivisions.filter(s => s.divisionId === divId);
    if (nextSubs.length > 0) {
      setSelectedSubdivisionId(nextSubs[0].id);
    }
  };

  const handleSaveLocation = () => {
    if (newLocationInput.trim()) {
      onAddCustomLocation(newLocationInput.trim());
      onLocationChange(newLocationInput.trim());
      setNewLocationInput('');
      setIsAddingLocation(false);
    }
  };

  const cleanFolder = sanitizeFolderName(location);
  const cleanSubName = sanitizeFolderName(currentSub.name);
  const primaryWorkbookName = `${cleanSubName}.xlsx`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn font-terminal">
      
      {/* Target File Destination Banner: Canonical Sub-Division Workbook */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 truncate">
          <div className="p-2.5 bg-[#111113] border border-[rgba(226,226,231,0.15)] text-[#00ffaa]">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-[rgba(226,226,231,0.4)] uppercase tracking-[0.2em] font-mono">
              Central Hierarchy: {currentDiv.name} ➔ {currentSub.name} ➔ {cleanFolder}
            </span>
            <div className="flex items-center space-x-2 mt-0.5 truncate">
              <span className="text-white font-mono text-xs sm:text-sm font-bold truncate">
                📁 {currentSub.name}/
              </span>
              <span className="text-[rgba(226,226,231,0.4)] font-bold">➔</span>
              <span className="text-[#00ffaa] font-mono text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#00ffaa] shrink-0" />
                {primaryWorkbookName}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                (Location: {cleanFolder} • {locationType})
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenTargetFile(location, locationType)}
          className="px-3.5 py-1.5 bg-[#111113] hover:bg-[rgba(226,226,231,0.08)] text-[#e2e2e7] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] text-xs font-semibold uppercase transition cursor-pointer flex items-center space-x-1.5 font-terminal"
        >
          <span>View Workbook</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#00ffaa]" />
        </button>
      </div>

      {/* 1. Header Control Section: Cascading Division, Sub-Division, Date, Location, Type */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-5 space-y-4">
        
        {/* Row A: Division & Sub-Division Cascading Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(226,226,231,0.08)] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Division Dropdown */}
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#00ffaa]" />
              <span className="text-[rgba(226,226,231,0.4)] uppercase text-[10px] tracking-wider font-mono">Division:</span>
              <select
                value={selectedDivisionId}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="bg-[#111113] border border-[rgba(226,226,231,0.2)] px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#00ffaa]"
              >
                {activeDivisions.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[rgba(226,226,231,0.3)]">➔</span>

            {/* Sub-Division Dropdown (Filtered to Selected Division) */}
            <div className="flex items-center space-x-2">
              <span className="text-[rgba(226,226,231,0.4)] uppercase text-[10px] tracking-wider font-mono">Sub-Division:</span>
              <select
                value={selectedSubdivisionId}
                onChange={(e) => setSelectedSubdivisionId(e.target.value)}
                className="bg-[#111113] border border-[rgba(226,226,231,0.2)] px-2.5 py-1 text-[#00ccff] font-mono text-xs focus:outline-none focus:border-[#00ffaa]"
              >
                {activeSubdivisions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#00ffaa]" />
            <span className="text-[rgba(226,226,231,0.5)] font-medium text-xs font-mono">Work Date:</span>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => onEntryDateChange && onEntryDateChange(e.target.value)}
              className="bg-[#111113] border border-[rgba(226,226,231,0.2)] px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#00ffaa]"
            />
          </div>
        </div>

        {/* Row B: Location, TC, Location Type, Engineer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          
          {/* Location Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[rgba(226,226,231,0.7)] flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-[#00ffaa]" />
                <span>Site Location</span>
                <span className="text-[#00ffaa]">*</span>
              </label>
              {!isAddingLocation && (
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(true)}
                  className="text-[10px] text-[#00ffaa] hover:underline flex items-center space-x-1 font-mono uppercase cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New</span>
                </button>
              )}
            </div>

            {isAddingLocation ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="New location name inside DOLVAN folder..."
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                  className="w-full bg-[#111113] border border-[#00ffaa] px-3 py-2 text-xs text-white uppercase focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveLocation}
                  className="p-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] transition cursor-pointer"
                  title="Save location to DOLVAN folder"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(false)}
                  className="p-2 bg-[#111113] text-[rgba(226,226,231,0.5)] hover:text-white border border-[rgba(226,226,231,0.2)] transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <select
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#00ffaa]"
              >
                <optgroup label="📁 DOLVAN Sub-Division Folder">
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          {/* Transformer Point Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[rgba(226,226,231,0.7)] flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
              <Zap className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span>Transformer Point</span>
            </label>
            <select
              value={selectedTransformerId || ''}
              onChange={(e) => onTransformerChange && onTransformerChange(e.target.value)}
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#00ffaa]"
            >
              <option value="">-- General TC Point --</option>
              {transformers.map(t => (
                <option key={t.id} value={t.id}>
                  TC #{t.serialNumber} ({t.make} • {t.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Location Type Selection */}
          {/* Location Type - Permanently Maintenance */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[rgba(226,226,231,0.7)] flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
              <Layers className="w-3.5 h-3.5 text-[#00ccff]" />
              <span>Location Type</span>
              <span className="text-[#00ccff]">*</span>
            </label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-[#111113] border border-[#00ccff]/50 rounded-xl text-xs font-semibold text-[#00ccff] font-terminal">
              <Wrench className="w-3.5 h-3.5 text-[#00ccff]" />
              <span className="uppercase tracking-wide font-bold">TC Maintenance</span>
            </div>
          </div>

          {/* Submitted By */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[rgba(226,226,231,0.7)] flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
              <User className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span>Entered By</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rajesh Patel"
              value={submittedBy}
              onChange={(e) => onSubmittedByChange(e.target.value)}
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] hover:border-[#00ffaa] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffaa]"
            />
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
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-30 font-terminal">
        
        {/* Status Message */}
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
              <span className="font-semibold">{lastSavedMessage || `Saved into ${currentSub.name}/${primaryWorkbookName}!`}</span>
            </div>
          )}

          {saveStatus === 'offline_queued' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#111113] border border-amber-500 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">Saved locally. Cloud sync pending.</span>
            </div>
          )}

          {saveStatus === 'idle' && (
            <div className="flex items-center space-x-1.5 text-[rgba(226,226,231,0.5)] text-xs font-mono">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span>Target Workbook: <strong className="text-white">{currentSub.name}/{primaryWorkbookName}</strong></span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onResetForm}
            className="px-4 py-2.5 bg-transparent hover:bg-[rgba(226,226,231,0.08)] border border-[rgba(226,226,231,0.2)] text-[rgba(226,226,231,0.8)] text-xs uppercase font-semibold transition cursor-pointer font-terminal"
          >
            Clear Form
          </button>

          <button
            type="button"
            onClick={onSaveAndSync}
            disabled={saveStatus === 'syncing'}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold uppercase transition cursor-pointer disabled:opacity-60 font-terminal"
          >
            <Save className={`w-4 h-4 ${saveStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{saveStatus === 'syncing' ? 'Saving Entry...' : `Save Daily Work Entry`}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
