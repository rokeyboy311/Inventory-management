import React from 'react';
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
  AlertCircle
} from 'lucide-react';
import { InventoryItemDefinition } from '../types/inventory';
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
}) => {
  const [isAddingLocation, setIsAddingLocation] = React.useState(false);
  const [newLocationInput, setNewLocationInput] = React.useState('');

  const handleSaveLocation = () => {
    if (newLocationInput.trim()) {
      onAddCustomLocation(newLocationInput.trim());
      onLocationChange(newLocationInput.trim());
      setNewLocationInput('');
      setIsAddingLocation(false);
    }
  };

  const cleanFolder = sanitizeFolderName(location);
  const targetFileName = locationType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Target File Destination Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 truncate">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Target Location Folder &amp; Dedicated Excel File
            </span>
            <div className="flex items-center space-x-2 mt-0.5 truncate">
              <span className="text-white font-mono text-xs sm:text-sm font-bold truncate">
                📁 {cleanFolder}/
              </span>
              <span className="text-slate-500 font-bold">➔</span>
              <span className="text-emerald-400 font-mono text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                {targetFileName}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenTargetFile(location, locationType)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
        >
          <span>View Folder in Location Tab</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* 1. Header Control Section (Location, Type, Submitted By) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Location Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Site Location (Folder)</span>
                <span className="text-rose-400">*</span>
              </label>
              {!isAddingLocation && (
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Folder</span>
                </button>
              )}
            </div>

            {isAddingLocation ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="New site location name..."
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                  className="w-full bg-slate-950 border border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveLocation}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(false)}
                  className="p-2 bg-slate-800 text-slate-400 rounded-xl transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <select
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    📁 {loc}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Location Type Selection (Exactly 2 categories) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Location Type (Target File)</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLocationTypeChange('In house')}
                className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  locationType === 'In house'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>1st: In house</span>
              </button>

              <button
                type="button"
                onClick={() => onLocationTypeChange('Maintenance')}
                className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  locationType === 'Maintenance'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>2nd: Maintenance</span>
              </button>
            </div>
          </div>

          {/* Submitted By */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Submitted By (Engineer / Tech)</span>
            </label>
            <input
              type="text"
              placeholder="Enter Engineer Name..."
              value={submittedBy}
              onChange={(e) => onSubmittedByChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Message */}
        <div className="flex items-center space-x-2 text-xs">
          {saveStatus === 'syncing' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 animate-pulse">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span className="font-semibold">Updating {targetFileName}...</span>
            </div>
          )}

          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{lastSavedMessage || `Saved into ${targetFileName}!`}</span>
            </div>
          )}

          {saveStatus === 'offline_queued' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">Offline: Queued for {targetFileName}</span>
            </div>
          )}

          {saveStatus === 'idle' && (
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target: <strong>{cleanFolder}/{targetFileName}</strong></span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onResetForm}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Clear Form
          </button>

          <button
            type="button"
            onClick={onSaveAndSync}
            disabled={saveStatus === 'syncing'}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-60"
          >
            <Save className={`w-4 h-4 ${saveStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{saveStatus === 'syncing' ? 'Updating File...' : `Save into ${targetFileName}`}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
