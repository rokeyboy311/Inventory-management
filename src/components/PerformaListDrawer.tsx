import React, { useState } from 'react';
import { PerformaRecord } from '../types/performa';
import { 
  X, 
  Search, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  CheckCircle2, 
  Calendar,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PerformaListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  performas: PerformaRecord[];
  activePerformaId: string;
  onSelectPerforma: (id: string) => void;
  onAddNewPerforma: () => void;
  onDeletePerforma: (id: string) => void;
  sheetName: string;
  locationName: string;
}

export const PerformaListDrawer: React.FC<PerformaListDrawerProps> = ({
  isOpen,
  onClose,
  performas,
  activePerformaId,
  onSelectPerforma,
  onAddNewPerforma,
  onDeletePerforma,
  sheetName,
  locationName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPerformas = performas.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.transformerMake.toLowerCase().includes(q) ||
      p.transformerSerialNo.toLowerCase().includes(q) ||
      p.date.includes(q)
    );
  });

  const handleDelete = (id: string) => {
    onDeletePerforma(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">Performa Records</h2>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              <span>{locationName}</span> • <span className="font-semibold text-blue-700">{sheetName}</span> ({performas.length} total)
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button & Search */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <button
            type="button"
            onClick={() => {
              onAddNewPerforma();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Performa</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Serial, Make..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        {/* Performas List in Exact Sequential Order */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredPerformas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No performas found</p>
              <p className="text-xs text-slate-400 mt-1">Click "+ Add New Performa" to create the first record.</p>
            </div>
          ) : (
            filteredPerformas.map((p, index) => {
              const isActive = p.id === activePerformaId;
              const isDeleting = deleteConfirmId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPerforma(p.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-blue-700">
                        {p.id}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Performa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPerforma(p.id);
                          onClose();
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Performa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Make & Serial</span>
                      <span className="font-medium text-slate-800">{p.transformerMake || '—'} / {p.transformerSerialNo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Capacity & Date</span>
                      <span className="font-medium text-slate-800">{p.capacity} • {p.date}</span>
                    </div>
                  </div>

                  {/* Inline delete confirmation */}
                  {isDeleting && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center justify-between animate-fadeIn">
                      <span className="font-semibold">Delete {p.id}?</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center font-mono">
          Records preserved in continuous sequence
        </div>
      </div>
    </div>
  );
};
