import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Download, 
  Calendar, 
  MapPin, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { InventorySubmission } from '../types/inventory';
import { exportSubmissionsToExcel, exportSubmissionsToCSV } from '../utils/excelExporter';

interface ViewSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: InventorySubmission[];
  onDeleteSubmission: (id: string) => Promise<void>;
  onEditSubmission: (sub: InventorySubmission) => void;
  onResyncSubmission: (sub: InventorySubmission) => Promise<void>;
  onResyncAll: () => Promise<void>;
  isSyncing: boolean;
}

export const ViewSubmissionsModal: React.FC<ViewSubmissionsModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onDeleteSubmission,
  onEditSubmission,
  onResyncSubmission,
  onResyncAll,
  isSyncing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'In house' | 'Maintenance'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Extract unique locations for the filter
  const uniqueLocations = Array.from(new Set(submissions.map(s => s.location)));

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBasic = sub.id.toLowerCase().includes(q) ||
        sub.location.toLowerCase().includes(q) ||
        sub.submittedBy.toLowerCase().includes(q) ||
        (sub.notes && sub.notes.toLowerCase().includes(q));

      const matchItems = sub.items.some(it => 
        it.itemName.toLowerCase().includes(q) ||
        String(it.value).toLowerCase().includes(q) ||
        (it.selectedType && it.selectedType.toLowerCase().includes(q))
      );

      if (!matchBasic && !matchItems) return false;
    }

    // 2. Location filter
    if (selectedLocation !== 'ALL' && sub.location !== selectedLocation) {
      return false;
    }

    // 3. Location Type filter
    if (selectedType !== 'ALL' && sub.locationType !== selectedType) {
      return false;
    }

    // 4. Date filter
    if (dateFilter !== 'ALL') {
      const subDate = new Date(sub.timestamp).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (dateFilter === 'TODAY' && (now - subDate) > oneDay) {
        return false;
      }
      if (dateFilter === 'WEEK' && (now - subDate) > 7 * oneDay) {
        return false;
      }
      if (dateFilter === 'MONTH' && (now - subDate) > 30 * oneDay) {
        return false;
      }
    }

    return true;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredSubmissions.forEach(s => { all[s.id] = true; });
    setExpandedRows(all);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Site Inventory Submissions Log</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                  {filteredSubmissions.length} of {submissions.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed record table with instant search, multi-filter, edit, and Excel sync
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onResyncAll}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700 disabled:opacity-50"
              title="Trigger batch sync with Excel / Google Sheets API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-Sync All</span>
            </button>

            <button
              type="button"
              onClick={() => exportSubmissionsToExcel(filteredSubmissions)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
              title="Download as Excel .xlsx"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .XLSX</span>
            </button>

            <button
              type="button"
              onClick={() => exportSubmissionsToCSV(filteredSubmissions)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
              title="Download as CSV"
            >
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, site, item, engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Locations ({uniqueLocations.length})</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Location Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'ALL' | 'In house' | 'Maintenance')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Types (In house &amp; Maintenance)</option>
              <option value="In house">1st: In house Only</option>
              <option value="Maintenance">2nd: Maintenance Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>

            <button
              onClick={Object.keys(expandedRows).length > 0 ? collapseAll : expandAll}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 whitespace-nowrap transition"
              title="Expand/Collapse all row details"
            >
              {Object.keys(expandedRows).length > 0 ? 'Collapse' : 'Expand'}
            </button>
          </div>

        </div>

        {/* Submissions Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 font-sans">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs italic space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600" />
              <p>No inventory entries found matching the current search &amp; filters.</p>
              <p className="text-[11px] text-slate-600">Try clearing filters or submitting a new inventory record.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isExpanded = !!expandedRows[sub.id];
              const dateFormatted = new Date(sub.timestamp).toLocaleString();

              return (
                <div
                  key={sub.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden transition"
                >
                  {/* Summary Header Row */}
                  <div 
                    onClick={() => toggleRowExpand(sub.id)}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none bg-slate-950 hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <button 
                        type="button"
                        className="text-slate-400 hover:text-white p-0.5 rounded"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {sub.id}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            sub.locationType === 'In house' 
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                              : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400'
                          }`}>
                            {sub.locationType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-300 font-medium">{sub.location}</span>
                          <span>•</span>
                          <span>{sub.submittedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Items summary badge & timestamp */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                        <span><strong>{sub.items.length}</strong> Materials</span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{dateFormatted}</span>
                      </div>

                      {/* Sync Status Badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                        sub.syncStatus === 'Synced' 
                          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' 
                          : sub.syncStatus === 'Offline Queued'
                          ? 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                          : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                      }`}>
                        {sub.syncStatus === 'Synced' && <CheckCircle2 className="w-3 h-3" />}
                        {sub.syncStatus === 'Offline Queued' && <Clock className="w-3 h-3" />}
                        {sub.syncStatus === 'Error' && <AlertCircle className="w-3 h-3" />}
                        <span>{sub.syncStatus}</span>
                      </span>

                      {/* Quick Actions (Edit, Resync, Delete) */}
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onResyncSubmission(sub)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-850 rounded-lg transition"
                          title="Re-sync this entry to Excel"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditSubmission(sub)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-850 rounded-lg transition"
                          title="Edit submission values"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSubmission(sub.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-lg transition cursor-pointer"
                          title="Delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Expanded Item-by-Item Breakdown View */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
                      {sub.notes && (
                        <div className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                          <strong className="text-amber-400">Notes:</strong> {sub.notes}
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/80">
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">Item / Material</th>
                              <th className="py-2 px-3">Field Type</th>
                              <th className="py-2 px-3">Value / Qty Entered</th>
                              <th className="py-2 px-3">Type / Specification Selected</th>
                              <th className="py-2 px-3">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-sans">
                            {sub.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-950/40">
                                <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-white">{item.itemName}</td>
                                <td className="py-2 px-3 text-slate-400 capitalize">{item.fieldType.replace('_', ' ')}</td>
                                <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                                  {item.value !== undefined && item.value !== null && item.value !== '' ? String(item.value) : '-'}
                                </td>
                                <td className="py-2 px-3 text-slate-300">
                                  {item.selectedType || <span className="text-slate-500 italic">None</span>}
                                </td>
                                <td className="py-2 px-3 text-slate-400">{item.unit || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Excel Column Mapping Preview */}
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Auto-synced with columns: <code>Entry_ID | Timestamp | Location | Location_Type | Item_Name | Value_Entered | Item_Type_Selected</code></span>
                        <span className="text-emerald-400 font-medium">✓ Sheet Verified</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Displaying {filteredSubmissions.length} record(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
