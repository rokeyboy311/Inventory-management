import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Sliders, 
  Table, 
  Check, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Type
} from 'lucide-react';
import { InventoryItemDefinition, FieldType } from '../types/inventory';
import { buildHierarchicalColumnLayout } from '../utils/excelExporter';

interface ItemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemDefinitions: InventoryItemDefinition[];
  onSaveItemDefinitions: (items: InventoryItemDefinition[]) => void;
  onResetToDefaults: () => void;
}

export const ItemSettingsModal: React.FC<ItemSettingsModalProps> = ({
  isOpen,
  onClose,
  itemDefinitions,
  onSaveItemDefinitions,
  onResetToDefaults,
}) => {
  const [itemsDraft, setItemsDraft] = useState<InventoryItemDefinition[]>(itemDefinitions);
  const [newItemName, setNewItemName] = useState('');
  const [newItemFieldType, setNewItemFieldType] = useState<FieldType>('dual');
  const [newItemOptions, setNewItemOptions] = useState('100, 200, 500');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Sync draft when opened
  React.useEffect(() => {
    if (isOpen) {
      setItemsDraft(itemDefinitions);
    }
  }, [isOpen, itemDefinitions]);

  if (!isOpen) return null;

  // Handle option changes for an item
  const handleUpdateItemOptions = (index: number, optionsString: string) => {
    const updated = [...itemsDraft];
    const opts = optionsString.split(',').map(s => s.trim()).filter(Boolean);
    updated[index] = {
      ...updated[index],
      options: opts
    };
    setItemsDraft(updated);
  };

  const handleUpdateItemName = (index: number, name: string) => {
    const updated = [...itemsDraft];
    updated[index] = { ...updated[index], name };
    setItemsDraft(updated);
  };

  const handleUpdateItemUnit = (index: number, unit: string) => {
    const updated = [...itemsDraft];
    updated[index] = { ...updated[index], unit };
    setItemsDraft(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = itemsDraft.filter((_, i) => i !== index);
    setItemsDraft(updated);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const opts = newItemOptions.split(',').map(s => s.trim()).filter(Boolean);
    const newItem: InventoryItemDefinition = {
      id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: newItemName.trim(),
      fieldType: newItemFieldType,
      options: newItemFieldType === 'dual' || newItemFieldType === 'dropdown_only' ? opts : undefined,
      unit: newItemUnit.trim() || undefined,
      isDeletable: true
    };

    setItemsDraft([...itemsDraft, newItem]);
    setNewItemName('');
    setIsAddingNew(false);
  };

  const handleSaveAll = () => {
    onSaveItemDefinitions(itemsDraft);
    onClose();
  };

  // Preview generated 2-tier column layout
  const previewLayout = buildHierarchicalColumnLayout(itemsDraft);

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Excel Item Template &amp; Sub-Options Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure items &amp; merged sub-columns (e.g. Lug ➔ 100, 200, 500). Once saved, this template applies across all location files.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top Live Layout Preview Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Table className="w-4 h-4" />
                <span>Live Excel 2-Tier Merged Header Structure Preview:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {previewLayout.length} Total Columns
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-center border-collapse text-[11px] font-mono">
                <thead>
                  {/* Row 1 Header */}
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-200 font-bold">
                    {previewLayout.map((col, idx) => (
                      <th key={idx} className="p-2 border-r border-slate-800 whitespace-nowrap bg-slate-900/80">
                        {col.headerLevel1}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2 Sub-Header */}
                  <tr className="bg-slate-950 border-b border-slate-800 text-cyan-400 font-semibold">
                    {previewLayout.map((col, idx) => (
                      <th key={idx} className="p-1.5 border-r border-slate-800 whitespace-nowrap text-[10px]">
                        {col.headerLevel2}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-900/30 text-slate-500 italic">
                    <td colSpan={previewLayout.length} className="p-2 text-center text-[10px]">
                      ↓ Data entries are logged row-by-row into the specific sub-columns below ↓
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Items & Sub-Options Manager List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Configure Items &amp; Sub-Options</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Add New Item Form (Inline) */}
            {isAddingNew && (
              <form onSubmit={handleAddNewItem} className="bg-slate-950 border border-emerald-500/50 p-4 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">Add New Item to Global Excel Template</span>
                  <button type="button" onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Item Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Busbar, Terminal..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Type</label>
                    <select
                      value={newItemFieldType}
                      onChange={(e) => setNewItemFieldType(e.target.value as FieldType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    >
                      <option value="dual">Multi-Option (Dual / Sub-Columns)</option>
                      <option value="input_only">Single Input (Single Column)</option>
                      <option value="dropdown_only">Dropdown Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Unit (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. pcs, meters, kW"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                </div>

                {newItemFieldType !== 'input_only' && (
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Sub-Option Columns (Comma Separated, e.g. 100, 200, 500)
                    </label>
                    <input
                      type="text"
                      placeholder="100, 200, 500, Ring, Pin..."
                      value={newItemOptions}
                      onChange={(e) => setNewItemOptions(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                  >
                    Add to Template
                  </button>
                </div>
              </form>
            )}

            {/* List of Defined Items */}
            <div className="space-y-3">
              {itemsDraft.map((item, idx) => {
                const isMulti = item.options && item.options.length > 0;
                return (
                  <div key={item.id || idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-emerald-400 font-bold text-xs">#{idx + 1}</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItemName(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs"
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                          {isMulti ? `${item.options?.length} Sub-columns` : 'Single Column'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Unit"
                          value={item.unit || ''}
                          onChange={(e) => handleUpdateItemUnit(idx, e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px]"
                        />

                        {itemsDraft.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub-options editor */}
                    <div className="pt-1">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Sub-Option Columns (Comma Separated):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100, 200, 500 (leave blank for single column)"
                        value={item.options ? item.options.join(', ') : ''}
                        onChange={(e) => handleUpdateItemOptions(idx, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Example: If set to <code className="text-emerald-400">100, 200, 500</code>, Excel will merge the <code className="text-white">{item.name}</code> header across 3 columns with headers 100, 200, and 500.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Defaults (Lug: 100, 200, 500)</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Apply to All Excel Files</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
