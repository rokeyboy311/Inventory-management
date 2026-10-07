import React, { useState } from 'react';
import { X, Plus, Layers, Type, ListFilter, Sliders } from 'lucide-react';
import { FieldType, InventoryItemDefinition } from '../types/inventory';

interface AddCustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemDef: InventoryItemDefinition) => void;
}

export const AddCustomItemModal: React.FC<AddCustomItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('dual');
  const [defaultValue, setDefaultValue] = useState('');
  const [inputPlaceholder, setInputPlaceholder] = useState('Enter quantity or specs');
  const [dropdownOptionsText, setDropdownOptionsText] = useState('Type A, Type B, Heavy Duty, Standard');
  const [unit, setUnit] = useState('units');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name');
      return;
    }

    const options = dropdownOptionsText
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const newItem: InventoryItemDefinition = {
      id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      fieldType,
      defaultValue: defaultValue.trim() || undefined,
      inputPlaceholder: inputPlaceholder.trim() || 'Enter',
      dropdownPlaceholder: 'Select type',
      options: options.length > 0 ? options : ['Standard', 'Custom', 'Other'],
      unit: unit.trim() || undefined,
      isDeletable: true
    };

    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add Dynamic Custom Item Row</h2>
              <p className="text-xs text-slate-400">Configure custom material row for real-time inventory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Item Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-200">
              Item / Material Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Copper Busbar, MCB Breaker, Conduit Pipe..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              required
              autoFocus
            />
          </div>

          {/* Configuration Option */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">
              Field Type Configuration <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFieldType('input_only')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  fieldType === 'input_only'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold shadow-inner'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Type className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Option A</span>
                <span className="text-[10px] text-slate-400 font-normal">Input Only</span>
              </button>

              <button
                type="button"
                onClick={() => setFieldType('dropdown_only')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  fieldType === 'dropdown_only'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold shadow-inner'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ListFilter className="w-4 h-4 text-teal-400" />
                <span className="text-[11px]">Option B</span>
                <span className="text-[10px] text-slate-400 font-normal">Dropdown Only</span>
              </button>

              <button
                type="button"
                onClick={() => setFieldType('dual')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  fieldType === 'dual'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold shadow-inner'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px]">Option C</span>
                <span className="text-[10px] text-slate-400 font-normal">Dual (Input+Select)</span>
              </button>
            </div>
          </div>

          {/* Default Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">
                Default Pre-filled Value (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1, 0, Default..."
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">
                Unit / Measurement (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. pcs, meters, kW, kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dropdown Options (if applicable) */}
          {(fieldType === 'dropdown_only' || fieldType === 'dual') && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">
                Dropdown Selection Options (Comma Separated)
              </label>
              <textarea
                rows={2}
                value={dropdownOptionsText}
                onChange={(e) => setDropdownOptionsText(e.target.value)}
                placeholder="Option 1, Option 2, Option 3, Heavy Duty..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
              <p className="text-[10px] text-slate-400">
                Separate choices with commas. These will appear in the "Select type" dropdown.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Inventory Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
