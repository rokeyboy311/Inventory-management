import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Table,
  Layers,
  LayoutGrid,
  FileText,
  Filter,
  BarChart3,
  Box,
  Calendar,
  MapPin
} from 'lucide-react';
import { InventorySubmission, InventoryItemDefinition } from '../types/inventory';
import { 
  sanitizeFolderName, 
  buildHierarchicalExcelData,
  buildSubdivisionExcelData,
  exportLocationExcelFile, 
  exportLocationCSVFile,
  exportSubdivisionPrimaryExcelFile
} from '../utils/excelExporter';

interface LocationFileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  locationType: 'In house' | 'Maintenance';
  submissions: InventorySubmission[];
  itemDefinitions: InventoryItemDefinition[];
  onDeleteSubmission: (id: string) => Promise<void>;
  onEditSubmission: (sub: InventorySubmission) => void;
  onAddEntryForThisFile: (location: string, type: 'In house' | 'Maintenance') => void;
  onViewRudraReport?: (sub: InventorySubmission) => void;
  subDivisionName?: string;
  isSubdivisionWorkbookView?: boolean;
}

export const LocationFileViewerModal: React.FC<LocationFileViewerModalProps> = ({
  isOpen,
  onClose,
  location,
  locationType,
  submissions,
  itemDefinitions,
  onDeleteSubmission,
  onEditSubmission,
  onAddEntryForThisFile,
  onViewRudraReport,
  subDivisionName,
  isSubdivisionWorkbookView = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'grid' | 'summary'>('grid');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');

  const cleanFolder = sanitizeFolderName(location);
  const cleanSubName = sanitizeFolderName(subDivisionName || 'DOLVAN');
  const fileName = isSubdivisionWorkbookView 
    ? `${cleanSubName}.xlsx` 
    : `${cleanFolder}_Maintenance.xlsx`;
  const isHouse = false;

  // Build the dynamic 2-Tier Hierarchical Data
  const sheetData = useMemo(() => {
    if (isSubdivisionWorkbookView) {
      return buildSubdivisionExcelData(cleanSubName, submissions, itemDefinitions);
    }
    return buildHierarchicalExcelData(submissions, location, locationType, itemDefinitions);
  }, [isSubdivisionWorkbookView, cleanSubName, submissions, itemDefinitions, location, locationType]);

  const { headerRow1, headerRow2, dataRows, columnLayout, matchedSubmissions } = sheetData;

  // Unique site locations within matched submissions for filtering
  const availableSubLocations = useMemo(() => {
    return Array.from(new Set(matchedSubmissions.map(s => s.location))).filter(Boolean);
  }, [matchedSubmissions]);

  // Filter rows based on search and selected site location filter
  const filteredDataRows = useMemo(() => {
    return dataRows.filter((row, idx) => {
      const parentSub = matchedSubmissions[idx];
      if (selectedLocationFilter !== 'all' && parentSub && parentSub.location !== selectedLocationFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      return row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [dataRows, matchedSubmissions, selectedLocationFilter, searchQuery]);

  // Group header level 1 columns to render merged colspan in HTML table
  const groupedHeader1 = useMemo(() => {
    const list: { name: string; colSpan: number }[] = [];
    let colIndex = 0;
    while (colIndex < columnLayout.length) {
      const currentName = columnLayout[colIndex].headerLevel1;
      let span = 1;
      while (colIndex + span < columnLayout.length && columnLayout[colIndex + span].headerLevel1 === currentName) {
        span++;
      }
      list.push({ name: currentName, colSpan: span });
      colIndex += span;
    }
    return list;
  }, [columnLayout]);

  // Calculate Item Usage Summary Breakdown for the Sub-Division
  const itemUsageSummary = useMemo(() => {
    const relevantSubs = selectedLocationFilter === 'all'
      ? matchedSubmissions
      : matchedSubmissions.filter(s => s.location === selectedLocationFilter);

    return itemDefinitions.map(item => {
      let totalQty = 0;
      let entryCount = 0;
      const optionBreakdown: Record<string, number> = {};
      const locationsUsing = new Set<string>();

      relevantSubs.forEach(sub => {
        const itemEntry = sub.items.find(i => i.itemId === item.id || i.itemName.toLowerCase() === item.name.toLowerCase());
        if (itemEntry) {
          const val = Number(itemEntry.value) || 0;
          if (val > 0) {
            totalQty += val;
            entryCount++;
            locationsUsing.add(sub.location);

            if (itemEntry.selectedType) {
              optionBreakdown[itemEntry.selectedType] = (optionBreakdown[itemEntry.selectedType] || 0) + val;
            }
          }

          if (itemEntry.optionValues) {
            Object.entries(itemEntry.optionValues).forEach(([opt, optVal]) => {
              const numVal = Number(optVal) || 0;
              if (numVal > 0) {
                optionBreakdown[opt] = (optionBreakdown[opt] || 0) + numVal;
              }
            });
          }
        }
      });

      return {
        item,
        totalQty,
        entryCount,
        locationsCount: locationsUsing.size,
        optionBreakdown
      };
    });
  }, [itemDefinitions, matchedSubmissions, selectedLocationFilter]);

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn font-terminal">
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.2)] rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[rgba(226,226,231,0.12)] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center space-x-3.5 truncate">
            <div className={`p-2.5 rounded-xl border ${
              isSubdivisionWorkbookView
                ? 'bg-emerald-500/10 border-emerald-500/30 text-[#00ffaa]'
                : isHouse 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-[#00ffaa]' 
                : 'bg-cyan-500/10 border-cyan-500/20 text-[#00ccff]'
            }`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono truncate">{fileName}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isSubdivisionWorkbookView
                    ? 'bg-emerald-950 text-[#00ffaa] border-emerald-700/60 font-mono'
                    : isHouse ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' : 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
                }`}>
                  {isSubdivisionWorkbookView ? 'CANONICAL PRIMARY WORKBOOK' : locationType}
                </span>
              </div>
              <p className="text-xs text-[rgba(226,226,231,0.5)] truncate mt-0.5">
                {isSubdivisionWorkbookView ? (
                  <>Sub-Division: <strong className="text-white">{cleanSubName}</strong> • Folder: <code>{cleanSubName}/</code> • All work logs synchronize here without duplicates</>
                ) : (
                  <>Location: <strong className="text-white">{location}</strong> • Folder: <code>{cleanFolder}/</code> • 2-Tier Merged Columns Format</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#161618] border border-[rgba(226,226,231,0.15)] rounded-xl p-0.5 mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'grid' 
                    ? 'bg-[#00ffaa] text-[#111113] font-bold shadow' 
                    : 'text-[rgba(226,226,231,0.7)] hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Spreadsheet Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'summary' 
                    ? 'bg-[#00ffaa] text-[#111113] font-bold shadow' 
                    : 'text-[rgba(226,226,231,0.7)] hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Item-Usage Summary</span>
              </button>
            </div>

            {onViewRudraReport && !isSubdivisionWorkbookView && (
              <button
                type="button"
                onClick={() => {
                  if (matchedSubmissions.length > 0) {
                    onViewRudraReport(matchedSubmissions[0]);
                  } else {
                    onClose();
                    onAddEntryForThisFile(location, locationType);
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer shadow-md"
                title="Generate Work Report PDF Firmo for this file"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>📄 Generate Firmo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onAddEntryForThisFile(location, locationType);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold transition cursor-pointer shadow-md"
              title="Add a new entry or update records in this file"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Entry</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSubdivisionWorkbookView) {
                  exportSubdivisionPrimaryExcelFile(subDivisionName || 'DOLVAN', submissions, itemDefinitions);
                } else {
                  exportLocationExcelFile(submissions, location, locationType, itemDefinitions);
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#161618] hover:bg-[rgba(226,226,231,0.1)] text-[#e2e2e7] text-xs font-semibold transition cursor-pointer border border-[rgba(226,226,231,0.2)]"
              title="Download Excel .XLSX (With merged option headers)"
            >
              <Download className="w-3.5 h-3.5 text-[#00ffaa]" />
              <span>Export .XLSX</span>
            </button>

            <button
              type="button"
              onClick={() => exportLocationCSVFile(submissions, location, locationType, itemDefinitions)}
              className="px-2.5 py-1.5 rounded-xl bg-[#161618] hover:bg-[rgba(226,226,231,0.1)] text-slate-300 text-xs font-mono transition cursor-pointer border border-[rgba(226,226,231,0.2)]"
              title="Download CSV"
            >
              CSV
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[rgba(226,226,231,0.5)] hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats & Search Toolbar */}
        <div className="px-6 py-3 bg-[#161618] border-b border-[rgba(226,226,231,0.12)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-[rgba(226,226,231,0.7)] font-mono">
            <span className="font-semibold text-white">
              {filteredDataRows.length} of {matchedSubmissions.length} Entries Logged
            </span>
            <span className="text-[rgba(226,226,231,0.3)]">•</span>
            <span className="text-[#00ffaa] font-semibold">
              {columnLayout.length} Header Columns
            </span>

            {/* Location Filter Dropdown (When viewing Sub-Division) */}
            {isSubdivisionWorkbookView && availableSubLocations.length > 0 && (
              <div className="flex items-center space-x-1.5 ml-2">
                <Filter className="w-3.5 h-3.5 text-[#00ccff]" />
                <span className="text-[rgba(226,226,231,0.4)] uppercase text-[10px]">Filter Site:</span>
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="bg-[#111113] border border-[rgba(226,226,231,0.2)] px-2 py-0.5 rounded text-white font-mono text-xs focus:outline-none focus:border-[#00ffaa]"
                >
                  <option value="all">All Site Locations ({availableSubLocations.length})</option>
                  {availableSubLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[rgba(226,226,231,0.4)]" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ffaa]"
            />
          </div>
        </div>

        {/* View Content: Tab 1: Spreadsheet Grid or Tab 2: Item-Usage Summary */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#111113]">
          {activeTab === 'grid' ? (
            filteredDataRows.length === 0 ? (
              <div className="text-center py-20 text-[rgba(226,226,231,0.4)] text-xs italic space-y-2">
                <Table className="w-10 h-10 mx-auto text-[rgba(226,226,231,0.2)]" />
                <p>No entries found matching this view.</p>
                <p className="text-[11px]">Click "+ Add Entry" above to log values into this primary workbook.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs border border-[rgba(226,226,231,0.12)]">
                {/* Hierarchical Sticky Header */}
                <thead className="sticky top-0 bg-[#1c1c1f] z-20 shadow-md">
                  
                  {/* Level 1 Header: Merged across sub-options */}
                  <tr className="border-b border-[rgba(226,226,231,0.12)] text-[#e2e2e7] font-bold">
                    <th className="py-2.5 px-3 border-r border-[rgba(226,226,231,0.12)] bg-[#1c1c1f] text-[rgba(226,226,231,0.5)] font-mono text-center w-12" rowSpan={2}>
                      #
                    </th>
                    {groupedHeader1.map((grp, gIdx) => (
                      <th 
                        key={gIdx} 
                        colSpan={grp.colSpan}
                        className={`py-2 px-3 border-r border-[rgba(226,226,231,0.12)] text-center whitespace-nowrap text-xs font-bold ${
                          grp.colSpan > 1 
                            ? 'bg-emerald-950/70 text-[#00ffaa] border-b-2 border-b-emerald-500/60' 
                            : 'bg-[#1c1c1f] text-[#e2e2e7]'
                        }`}
                      >
                        {grp.name}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center bg-[#1c1c1f] text-[rgba(226,226,231,0.5)] w-20" rowSpan={2}>
                      Manage
                    </th>
                  </tr>

                  {/* Level 2 Sub-Header: Individual options (e.g. 100, 200, 500) */}
                  <tr className="border-b border-[rgba(226,226,231,0.12)] bg-[#161618] text-[#00ccff] font-mono text-[11px]">
                    {columnLayout.map((col, cIdx) => (
                      <th 
                        key={cIdx} 
                        className="py-1.5 px-3 border-r border-[rgba(226,226,231,0.12)] whitespace-nowrap text-center font-semibold bg-[#161618]"
                      >
                        {col.headerLevel2}
                      </th>
                    ))}
                  </tr>

                </thead>

                {/* Data Rows */}
                <tbody className="divide-y divide-[rgba(226,226,231,0.08)] font-sans">
                  {filteredDataRows.map((row, rIdx) => {
                    const parentSub = matchedSubmissions[rIdx];

                    return (
                      <tr key={rIdx} className="hover:bg-[rgba(226,226,231,0.04)] transition group">
                        <td className="py-2 px-3 text-[rgba(226,226,231,0.4)] font-mono text-center border-r border-[rgba(226,226,231,0.08)] select-none">
                          {rIdx + 1}
                        </td>

                        {row.map((cellVal, cellIdx) => {
                          const colMeta = columnLayout[cellIdx];
                          const isSubOption = !!colMeta?.subOption;
                          const hasVal = cellVal !== '' && cellVal !== undefined && cellVal !== null;

                          return (
                            <td 
                              key={cellIdx} 
                              className={`py-2 px-3 border-r border-[rgba(226,226,231,0.08)] whitespace-nowrap font-mono ${
                                cellIdx === 0 
                                  ? 'text-[#00ccff] font-semibold' 
                                  : cellIdx === 1 
                                  ? 'text-white font-medium' 
                                  : isSubOption
                                  ? hasVal 
                                    ? 'text-[#00ffaa] font-bold bg-emerald-950/20 text-center' 
                                    : 'text-[rgba(226,226,231,0.3)] text-center'
                                  : 'text-[#e2e2e7]'
                              }`}
                            >
                              {hasVal ? String(cellVal) : (isSubOption ? '-' : '')}
                            </td>
                          );
                        })}

                        {/* Row Action Controls */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {parentSub && (
                            <div className="flex items-center justify-center space-x-1">
                              {onViewRudraReport && (
                                <button
                                  type="button"
                                  onClick={() => onViewRudraReport(parentSub)}
                                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="View / Print Official Rudra Transformer Work Report (PDF Format)"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onEditSubmission(parentSub)}
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="Edit Entry"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSubmission(parentSub.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="Delete Entry from this File"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* Tab 2: Detailed Item-Usage & Stock Consumption Breakdown */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#00ffaa]" />
                    <span>Item Consumption &amp; Material Usage Ledger</span>
                  </h3>
                  <p className="text-[rgba(226,226,231,0.5)] mt-0.5">
                    Aggregated consumption for Sub-Division <strong>{cleanSubName}</strong> across {matchedSubmissions.length} work submissions.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-[rgba(226,226,231,0.4)] uppercase">Total Material Classes:</span>
                  <div className="text-sm font-bold text-[#00ffaa]">{itemDefinitions.length} Items Defined</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemUsageSummary.map(({ item, totalQty, entryCount, locationsCount, optionBreakdown }) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] rounded-xl space-y-3 hover:border-[#00ffaa]/40 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[rgba(226,226,231,0.4)]">
                          {item.fieldType === 'dual' ? 'Dual (Input + Spec)' : item.fieldType === 'input_only' ? 'Direct Input' : 'Select'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">{item.name}</h4>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xl font-bold text-[#00ffaa]">
                          {totalQty} <span className="text-xs text-[rgba(226,226,231,0.5)]">{item.unit || 'Nos.'}</span>
                        </div>
                        <span className="text-[10px] text-[rgba(226,226,231,0.4)]">Total Used</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[rgba(226,226,231,0.08)] flex items-center justify-between text-xs text-[rgba(226,226,231,0.6)] font-mono">
                      <span>{entryCount} Logged Entries</span>
                      <span>{locationsCount} Site Locations</span>
                    </div>

                    {/* Breakdown by Specification/Option */}
                    {Object.keys(optionBreakdown).length > 0 && (
                      <div className="pt-2 border-t border-[rgba(226,226,231,0.08)] space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[rgba(226,226,231,0.4)] block">
                          Specification Breakdown:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(optionBreakdown).map(([opt, qty]) => (
                            <span 
                              key={opt}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111113] border border-[rgba(226,226,231,0.15)] text-[#00ccff]"
                            >
                              {opt}: <strong className="text-white">{qty}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[rgba(226,226,231,0.12)] bg-[#111113] flex flex-wrap items-center justify-between gap-3 text-xs text-[rgba(226,226,231,0.6)]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#00ffaa]" />
            <span>
              Canonical Workbook: <code>{fileName}</code> • Auto-synchronized across all site locations.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#161618] hover:bg-[#222226] text-white border border-[rgba(226,226,231,0.2)] rounded-lg transition cursor-pointer font-bold"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
};
