import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  Box as BoxIcon, 
  Cable as CableIcon, 
  Compass, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Sliders,
  CheckCircle2,
  FileText,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';
import { InventoryItemDefinition } from '../types/inventory';

interface DynamicInventoryFormProps {
  itemDefinitions: InventoryItemDefinition[];
  formValues: Record<string, { 
    value: string | number; 
    selectedType?: string | null;
    optionValues?: Record<string, string | number>;
  }>;
  onValueChange: (itemId: string, field: 'value' | 'selectedType', val: string | number) => void;
  onOptionValueChange?: (itemId: string, subOption: string, val: string | number) => void;
  onOpenAddCustomItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onResetForm: () => void;
  onQuickFillDemo: () => void;
  onRestoreDefaults?: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const DynamicInventoryForm: React.FC<DynamicInventoryFormProps> = ({
  itemDefinitions,
  formValues,
  onValueChange,
  onOptionValueChange,
  onOpenAddCustomItem,
  onDeleteItem,
  onResetForm,
  onQuickFillDemo,
  onRestoreDefaults,
  notes,
  onNotesChange,
}) => {
  // Toggle between multi-column sub-inputs vs single dropdown per item
  const [subOptionMode, setSubOptionMode] = useState<Record<string, 'grid' | 'dropdown'>>({});

  const getItemIcon = (id: string) => {
    switch (id) {
      case 'power':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'earth_compaction':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'lug':
        return <Sliders className="w-4 h-4 text-teal-400" />;
      case 'box':
        return <BoxIcon className="w-4 h-4 text-blue-400" />;
      case 'cable':
        return <CableIcon className="w-4 h-4 text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const toggleItemMode = (itemId: string) => {
    setSubOptionMode(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'dropdown' ? 'grid' : 'dropdown'
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Table Title & Quick Tools Bar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Dynamic Inventory Material Entry Table
            </h2>
            <p className="text-[11px] text-slate-400">
              Tailored input fields per material specifications ({itemDefinitions.length} active rows)
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 text-xs">
          {onRestoreDefaults && (
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition cursor-pointer"
              title="Restore standard 5 default rows (Power, Earth Compaction, Lug: 100/200/500, Box, Cable)"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Reset Rows</span>
            </button>
          )}

          <button
            type="button"
            onClick={onQuickFillDemo}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 font-medium transition cursor-pointer"
            title="Pre-populate realistic site inventory values for rapid testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Quick Fill Demo</span>
          </button>

          <button
            type="button"
            onClick={onResetForm}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition cursor-pointer"
            title="Reset all fields to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Clear Values</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddCustomItem}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-md shadow-emerald-950/50 cursor-pointer"
            title="Add a custom dynamic row (Input Only, Dropdown Only, or Dual with Sub-Options)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Row</span>
          </button>
        </div>
      </div>

      {/* Form Items List Table */}
      <div className="p-4 sm:p-6 space-y-3">
        {itemDefinitions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <p>All rows removed. Click "+ Add Row" or "Reset Rows" above to add items.</p>
            {onRestoreDefaults && (
              <button
                type="button"
                onClick={onRestoreDefaults}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Restore Standard Rows
              </button>
            )}
          </div>
        ) : (
          itemDefinitions.map((itemDef) => {
            const currentEntry = formValues[itemDef.id] || { value: '', selectedType: null, optionValues: {} };
            const isDual = itemDef.fieldType === 'dual';
            const isInputOnly = itemDef.fieldType === 'input_only';
            const isDropdownOnly = itemDef.fieldType === 'dropdown_only';
            const hasSubOptions = itemDef.options && itemDef.options.length > 0;
            const currentMode = subOptionMode[itemDef.id] || (hasSubOptions && itemDef.options!.length <= 4 ? 'grid' : 'dropdown');

            return (
              <div
                key={itemDef.id}
                className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-3 sm:p-4 transition-all duration-150 group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  
                  {/* Column 1: Item Label & Badge */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-start space-x-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 group-hover:border-slate-700 transition">
                        {getItemIcon(itemDef.id)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-xs sm:text-sm">
                            {itemDef.name}
                          </span>
                          {itemDef.id === 'earth_compaction' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-mono">
                              def: 1
                            </span>
                          )}
                          {hasSubOptions && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                              {itemDef.options!.length} options
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {itemDef.fieldType.replace('_', ' ')} {itemDef.unit ? `(${itemDef.unit})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Delete button for Mobile */}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(itemDef.id)}
                      className="lg:hidden p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>

                  {/* Column 2: Input Field(s) tailored to layout design */}
                  <div className="lg:col-span-8">
                    {/* Case 1: Input Only (e.g. Power, Earth Compaction, Box) */}
                    {isInputOnly && (
                      <div className="relative">
                        <input
                          type="text"
                          value={currentEntry.value !== undefined ? currentEntry.value : ''}
                          onChange={(e) => onValueChange(itemDef.id, 'value', e.target.value)}
                          placeholder={itemDef.inputPlaceholder || 'Enter'}
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-medium"
                        />
                        {itemDef.defaultValue !== undefined && String(currentEntry.value) === String(itemDef.defaultValue) && (
                          <div className="absolute right-3 top-2.5 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>[set by def.]</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Case 2: Dropdown Only */}
                    {isDropdownOnly && (
                      <div className="relative">
                        <select
                          value={currentEntry.selectedType || ''}
                          onChange={(e) => onValueChange(itemDef.id, 'selectedType', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-medium"
                        >
                          <option value="">-- {itemDef.dropdownPlaceholder || 'Select type'} --</option>
                          {itemDef.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Case 3: Multi-Option / Dual Field (e.g. Lug -> 100, 200, 500 / Cable) */}
                    {isDual && hasSubOptions && currentMode === 'grid' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Enter quantity per merged Excel sub-column:
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleItemMode(itemDef.id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                            title="Switch to Dropdown Select mode"
                          >
                            <List className="w-3 h-3" />
                            <span>Dropdown mode</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {itemDef.options!.map((opt) => {
                            const optVal = currentEntry.optionValues?.[opt] !== undefined 
                              ? currentEntry.optionValues[opt] 
                              : (currentEntry.selectedType === opt ? currentEntry.value : '');

                            return (
                              <div key={opt} className="relative bg-slate-900 rounded-xl border border-slate-750 focus-within:border-emerald-500 p-1.5 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-cyan-300 px-1 font-mono truncate">
                                  {opt}
                                </span>
                                <input
                                  type="text"
                                  placeholder="Qty / Val"
                                  value={optVal !== undefined ? String(optVal) : ''}
                                  onChange={(e) => {
                                    if (onOptionValueChange) {
                                      onOptionValueChange(itemDef.id, opt, e.target.value);
                                    } else {
                                      onValueChange(itemDef.id, 'selectedType', opt);
                                      onValueChange(itemDef.id, 'value', e.target.value);
                                    }
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono mt-1"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Case 4: Dual Single Input + Dropdown (Standard mode) */}
                    {isDual && (!hasSubOptions || currentMode === 'dropdown') && (
                      <div className="space-y-1">
                        {hasSubOptions && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => toggleItemMode(itemDef.id)}
                              className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                              title="Switch to direct sub-column inputs grid"
                            >
                              <LayoutGrid className="w-3 h-3" />
                              <span>Multi-columns grid</span>
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Sub-field A: Text/Number Input [Enter] */}
                          <div className="relative">
                            <input
                              type="text"
                              value={currentEntry.value !== undefined ? currentEntry.value : ''}
                              onChange={(e) => onValueChange(itemDef.id, 'value', e.target.value)}
                              placeholder={itemDef.inputPlaceholder || 'Enter'}
                              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-medium"
                            />
                            <div className="absolute right-2.5 top-2.5 text-[10px] text-slate-500 font-mono pointer-events-none">
                              Qty / Spec
                            </div>
                          </div>

                          {/* Sub-field B: Dropdown [Select type] */}
                          <div className="relative">
                            <select
                              value={currentEntry.selectedType || ''}
                              onChange={(e) => onValueChange(itemDef.id, 'selectedType', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-inner font-medium"
                            >
                              <option value="">-- {itemDef.dropdownPlaceholder || 'Select type'} --</option>
                              {itemDef.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Delete Action for Row (Desktop) */}
                  <div className="lg:col-span-1 hidden lg:flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(itemDef.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                      title={`Remove row "${itemDef.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}

        {/* Optional Notes & Observations Field */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Site Notes / Work Order Remarks (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Enter any work order details, phase numbers, inspection notes, or testing parameters..."
            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition shadow-inner font-sans resize-none"
          />
        </div>

      </div>
    </div>
  );
};
