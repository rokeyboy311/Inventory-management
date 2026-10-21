import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Check, 
  Search, 
  Sliders, 
  AlertCircle,
  Tag,
  DollarSign,
  MapPin,
  Copy
} from 'lucide-react';
import { 
  ItemMasterTemplate, 
  getMasterItemsList, 
  addMasterItem, 
  updateMasterItem, 
  deleteMasterItem, 
  resetMasterItemsToDefault,
  copyMasterItemsFromLocation
} from '../utils/itemsMaster';
import { LocationWorkbook } from '../types/performa';

interface ItemsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbooks?: LocationWorkbook[];
  activeLocationId?: string;
  onItemsUpdated?: (locationId?: string) => void;
}

export function ItemsSettingsModal({
  isOpen,
  onClose,
  workbooks = [],
  activeLocationId,
  onItemsUpdated
}: ItemsSettingsModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(activeLocationId || 'global');
  const [items, setItems] = useState<ItemMasterTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Edit form state
  const [editSrLabel, setEditSrLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUnit, setEditUnit] = useState('Nos.');
  const [editSizeFields, setEditSizeFields] = useState('');
  const [editRate, setEditRate] = useState<number>(100);
  const [editLabourRate, setEditLabourRate] = useState<number>(50);

  // Add new item state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSrLabel, setNewSrLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUnit, setNewUnit] = useState('Nos.');
  const [newSizeFields, setNewSizeFields] = useState('');
  const [newRate, setNewRate] = useState<number>(120);
  const [newLabourRate, setNewLabourRate] = useState<number>(50);

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = (locId: string = selectedLocationId) => {
    const list = getMasterItemsList(locId);
    setItems(list);
  };

  useEffect(() => {
    if (isOpen) {
      const initialLoc = activeLocationId || (workbooks && workbooks.length > 0 ? workbooks[0].locationId : 'global');
      setSelectedLocationId(initialLoc);
      loadData(initialLoc);
      setIsAddingNew(false);
      setEditingItemId(null);
    }
  }, [isOpen, activeLocationId]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen) return null;

  const currentLocationName = selectedLocationId === 'global'
    ? 'Standard Master (Default for All Locations)'
    : (workbooks.find(w => w.locationId === selectedLocationId)?.locationName || 'Selected Location');

  const handleLocationChange = (newLocId: string) => {
    setSelectedLocationId(newLocId);
    loadData(newLocId);
    setEditingItemId(null);
    setIsAddingNew(false);
  };

  const filteredItems = items.filter(it => 
    (it.description || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (it.srLabel || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (it.unit || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleStartEdit = (it: ItemMasterTemplate) => {
    setEditingItemId(it.id);
    setEditSrLabel(it.srLabel || '');
    setEditDescription(it.description);
    setEditUnit(it.unit);
    setEditSizeFields(it.sizeFields ? it.sizeFields.join(', ') : '');
    setEditRate(it.defaultRate ?? 100);
    setEditLabourRate(it.defaultLabourRate ?? 50);
  };

  const handleSaveEdit = (id: string) => {
    if (!editDescription.trim()) {
      alert('Description cannot be empty');
      return;
    }
    const sizes = editSizeFields
      ? editSizeFields.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const updated = updateMasterItem(id, {
      srLabel: editSrLabel.trim() || undefined,
      description: editDescription.trim(),
      unit: editUnit.trim() || 'Nos.',
      sizeFields: sizes && sizes.length > 0 ? sizes : undefined,
      defaultRate: editRate,
      defaultLabourRate: editLabourRate
    }, selectedLocationId);

    setItems(updated);
    setEditingItemId(null);
    showToast(`Item updated for ${currentLocationName}`);
    onItemsUpdated?.(selectedLocationId);
  };

  const handleDelete = (it: ItemMasterTemplate) => {
    if (window.confirm(`Are you sure you want to remove item "${it.srLabel}: ${it.description}" from ${currentLocationName}?`)) {
      const updated = deleteMasterItem(it.id, selectedLocationId);
      setItems(updated);
      showToast(`Item removed from ${currentLocationName}`);
      onItemsUpdated?.(selectedLocationId);
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) {
      alert('Please enter an item description');
      return;
    }

    const sizes = newSizeFields
      ? newSizeFields.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const updated = addMasterItem({
      srNo: items.length + 1,
      srLabel: newSrLabel.trim() || String(items.length + 1),
      description: newDescription.trim(),
      unit: newUnit.trim() || 'Nos.',
      sizeFields: sizes && sizes.length > 0 ? sizes : undefined,
      defaultRate: Number(newRate) || 0,
      defaultLabourRate: Number(newLabourRate) || 0
    }, selectedLocationId);

    setItems(updated);
    setIsAddingNew(false);
    setNewSrLabel('');
    setNewDescription('');
    setNewSizeFields('');
    showToast(`New item added to ${currentLocationName}!`);
    onItemsUpdated?.(selectedLocationId);
  };

  const handleResetDefaults = () => {
    if (window.confirm(`Reset all items for "${currentLocationName}" back to standard DISCOM 23-item template?`)) {
      const defaults = resetMasterItemsToDefault(selectedLocationId);
      setItems(defaults);
      showToast(`Items for ${currentLocationName} reset to default template`);
      onItemsUpdated?.(selectedLocationId);
    }
  };

  const handleCopyFromLocation = (sourceLocId: string) => {
    const sourceName = sourceLocId === 'global' ? 'Standard Master' : (workbooks.find(w => w.locationId === sourceLocId)?.locationName || 'Source Location');
    if (window.confirm(`Copy all items and rates from "${sourceName}" into "${currentLocationName}"?`)) {
      const copied = copyMasterItemsFromLocation(sourceLocId, selectedLocationId);
      setItems(copied);
      showToast(`Copied ${copied.length} items from ${sourceName} into ${currentLocationName}!`);
      onItemsUpdated?.(selectedLocationId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Location-wise Performa Items Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure unique maintenance items &amp; rates separately for each location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset this location to DISCOM standard 23 items"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location Selection Bar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Configure Location:
            </span>
            <select
              value={selectedLocationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {workbooks && workbooks.length > 0 && (
                <optgroup label="Locations">
                  {workbooks.map(w => (
                    <option key={w.locationId} value={w.locationId}>
                      📍 {w.locationName} ({w.workbookName})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Default Template">
                <option value="global">🌐 Standard Master (Default for All Locations)</option>
              </optgroup>
            </select>

            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentLocationName} ({items.length} items)
            </span>
          </div>

          {/* Copy from another location */}
          {workbooks && workbooks.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Copy Settings:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleCopyFromLocation(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="" disabled>📋 Copy Items From...</option>
                {workbooks.filter(w => w.locationId !== selectedLocationId).map(w => (
                  <option key={w.locationId} value={w.locationId}>
                    Copy from {w.locationName}
                  </option>
                ))}
                {selectedLocationId !== 'global' && (
                  <option value="global">Copy from Standard Master</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Toast Banner */}
        {notification && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Toolbar: Search & Add button */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SR No, description or unit..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Close Add Form' : '+ Add New Item'}</span>
          </button>
        </div>

        {/* Add New Item Collapsible Form */}
        {isAddingNew && (
          <form onSubmit={handleAddNew} className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Performa Default Item</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">SR Label</label>
                <input
                  type="text"
                  placeholder="e.g. 19"
                  value={newSrLabel}
                  onChange={(e) => setNewSrLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Providing and fixing earthing pipe"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit</label>
                <input
                  type="text"
                  placeholder="Nos., Mtr, Sets"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Sizes (comma-sep)</label>
                <input
                  type="text"
                  placeholder="e.g. 100Amp, 200Amp"
                  value={newSizeFields}
                  onChange={(e) => setNewSizeFields(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500 text-[11px]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Material Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Labour Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newLabourRate}
                  onChange={(e) => setNewLabourRate(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-6 flex items-end justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save New Item</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Items List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No items found matching your filter</p>
            </div>
          ) : (
            filteredItems.map((it) => {
              const isEditing = editingItemId === it.id;

              if (isEditing) {
                return (
                  <div key={it.id} className="p-3.5 bg-slate-950 border-2 border-emerald-500 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">SR Label</label>
                        <input
                          type="text"
                          value={editSrLabel}
                          onChange={(e) => setEditSrLabel(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit</label>
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Mat Rate (₹)</label>
                        <input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Labour Rate (₹)</label>
                        <input
                          type="number"
                          value={editLabourRate}
                          onChange={(e) => setEditLabourRate(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Size Variants (comma-sep)</label>
                        <input
                          type="text"
                          placeholder="e.g. 12MM, 20MM, 30MM"
                          value={editSizeFields}
                          onChange={(e) => setEditSizeFields(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-end justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(it.id)}
                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={it.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {it.srLabel}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          {it.description}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {it.unit}
                        </span>
                        {it.defaultRate !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{it.defaultRate} mat / ₹{it.defaultLabourRate ?? 0} lab
                          </span>
                        )}
                      </div>

                      {it.sizeFields && it.sizeFields.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Sizes:</span>
                          {it.sizeFields.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(it)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit this item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(it)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete this item from defaults"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Total Default Items: {items.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
