import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  History, 
  TrendingDown, 
  TrendingUp,
  Tag
} from 'lucide-react';
import { Material, StockTransaction } from '../types/inventory';

interface MaterialsStockViewProps {
  materials: Material[];
  recentTransactions: StockTransaction[];
  onAddStockTransaction: (data: {
    materialId: string;
    variantName?: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
    quantity: number;
    notes?: string;
    enteredBy?: string;
  }) => Promise<void>;
  onAddNewMaterial: (material: Partial<Material>) => Promise<void>;
}

export const MaterialsStockView: React.FC<MaterialsStockViewProps> = ({
  materials,
  recentTransactions,
  onAddStockTransaction,
  onAddNewMaterial,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

  // Adjustment modal state
  const [selectedMatId, setSelectedMatId] = useState(materials[0]?.id || '');
  const [txType, setTxType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'>('IN');
  const [txQty, setTxQty] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txUser, setTxUser] = useState('Store Keeper');

  // New Material modal state
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('TC Maintenance');
  const [newMatUnit, setNewMatUnit] = useState('Nos.');
  const [newMatStock, setNewMatStock] = useState('100');
  const [newMatVariants, setNewMatVariants] = useState('');

  const categories = Array.from(new Set(materials.map(m => m.category)));

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.variants.some(v => v.variantName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || !txQty) return;

    await onAddStockTransaction({
      materialId: selectedMatId,
      type: txType,
      quantity: Number(txQty),
      notes: txNotes,
      enteredBy: txUser
    });

    setIsAdjustModalOpen(false);
    setTxQty('');
    setTxNotes('');
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName || !newMatUnit) return;

    const variantList = newMatVariants
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => ({ variantName: v }));

    await onAddNewMaterial({
      name: newMatName,
      category: newMatCategory,
      unit: newMatUnit,
      openingStock: Number(newMatStock) || 0,
      variants: variantList as any
    });

    setIsAddMaterialModalOpen(false);
    setNewMatName('');
    setNewMatVariants('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Central Material Master &amp; Stock Ledger
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/40 font-mono">
                Real-Time Balance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Stock = Opening Stock + IN (Receipts) + RETURN - OUT (Daily Site Work) + ADJUSTMENT.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stock In / Out</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMaterialModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Material</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white">{filteredMaterials.length} Tracked Materials</span>
          <span className="text-slate-600">•</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search material or variant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Materials Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-200 border-b border-slate-800 font-bold sticky top-0">
              <tr>
                <th className="py-3 px-3 text-center border-r border-slate-800 w-12">#</th>
                <th className="py-3 px-4 border-r border-slate-800">Material Name &amp; Description</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">Category</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">Unit</th>
                <th className="py-3 px-4 border-r border-slate-800">Specifications / Variants</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">Opening Stock</th>
                <th className="py-3 px-4 border-r border-slate-800 text-center bg-emerald-950/40 text-emerald-300">
                  Current Balance
                </th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filteredMaterials.map((mat, idx) => {
                const isLowStock = mat.currentStock < 10;
                return (
                  <tr key={mat.id} className="hover:bg-slate-950/60 transition group text-xs">
                    <td className="py-3 px-3 text-slate-500 font-mono text-center border-r border-slate-800">{idx + 1}</td>
                    <td className="py-3 px-4 border-r border-slate-800">
                      <div className="font-bold text-white text-sm">{mat.name}</div>
                      {mat.referenceField && (
                        <div className="text-[10px] text-slate-500 font-mono">Ref: {mat.referenceField}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                        {mat.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono border-r border-slate-800 font-bold">{mat.unit}</td>
                    <td className="py-3 px-4 border-r border-slate-800">
                      <div className="flex flex-wrap gap-1">
                        {mat.variants.length > 0 ? (
                          mat.variants.map(v => (
                            <span key={v.id} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[10px] font-mono">
                              {v.variantName}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono border-r border-slate-800">
                      {mat.openingStock}
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-800 bg-emerald-950/20">
                      <div className="flex items-center justify-center space-x-1 font-mono text-sm font-bold">
                        <span className={isLowStock ? 'text-amber-400' : 'text-emerald-400'}>
                          {mat.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">{mat.unit}</span>
                      </div>
                      {isLowStock && (
                        <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider block">Low Stock</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatId(mat.id);
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Transactions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Recent Stock Movement Ledger (Audit Traceable)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 20 Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Material</th>
                <th className="py-2 px-3 text-center">Type</th>
                <th className="py-2 px-3 text-center">Quantity</th>
                <th className="py-2 px-3">Reference / Location</th>
                <th className="py-2 px-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-950/40">
                  <td className="py-2 px-3 text-slate-400">{tx.date}</td>
                  <td className="py-2 px-3 text-white font-sans font-medium">
                    {tx.materialName} {tx.variantName ? `(${tx.variantName})` : ''}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'IN' || tx.type === 'RETURN'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : tx.type === 'OUT'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-white">
                    {tx.type === 'OUT' ? `-${tx.quantity}` : `+${tx.quantity}`} {tx.unit}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-sans truncate max-w-xs">
                    {tx.notes || tx.referenceType}
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{tx.enteredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleAdjustSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Record Stock Movement</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Select Material</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 mt-1"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Current: {m.currentStock} {m.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Transaction Type</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {(['IN', 'OUT', 'ADJUSTMENT', 'RETURN'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxType(t)}
                      className={`py-2 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                        txType === t 
                          ? 'bg-emerald-600 text-white border-emerald-500' 
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Quantity</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter numeric quantity"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Remarks / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. PO Receipt, Physical Stock Count"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Apply Movement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Material Modal */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMaterial} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Add New Material to Master</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Material Name</label>
                <input
                  type="text"
                  placeholder="e.g. Transformer Oil, Horn Gap Fuse"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium">Category</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value="TC Maintenance">TC Maintenance</option>
                    <option value="Cabling">Cabling</option>
                    <option value="Earthing">Earthing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Standard Unit</label>
                  <input
                    type="text"
                    placeholder="Nos., Meter, Litres, Kg"
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Opening Stock</label>
                <input
                  type="number"
                  placeholder="Initial balance"
                  value={newMatStock}
                  onChange={(e) => setNewMatStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Variants (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 70 sq mm, 150 sq mm, 100 KVA"
                  value={newMatVariants}
                  onChange={(e) => setNewMatVariants(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Add Material
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
