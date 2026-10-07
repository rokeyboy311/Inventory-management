import React, { useState } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { InventorySubmission, InventoryItemDefinition } from '../types/inventory';
import { 
  sanitizeFolderName, 
  buildHierarchicalExcelData,
  exportLocationExcelFile, 
  exportLocationCSVFile 
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !location) return null;

  const cleanFolder = sanitizeFolderName(location);
  const fileName = locationType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;
  const isHouse = locationType === 'In house';

  // Build the dynamic 2-Tier Hierarchical Data
  const { 
    headerRow1, 
    headerRow2, 
    dataRows, 
    columnLayout, 
    matchedSubmissions 
  } = buildHierarchicalExcelData(submissions, location, locationType, itemDefinitions);

  // Filter rows based on search
  const filteredDataRows = dataRows.filter((row) => 
    row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group header level 1 columns to render merged colspan in HTML table
  const groupedHeader1: { name: string; colSpan: number }[] = [];
  let colIndex = 0;
  while (colIndex < columnLayout.length) {
    const currentName = columnLayout[colIndex].headerLevel1;
    let span = 1;
    while (colIndex + span < columnLayout.length && columnLayout[colIndex + span].headerLevel1 === currentName) {
      span++;
    }
    groupedHeader1.push({ name: currentName, colSpan: span });
    colIndex += span;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3 truncate">
            <div className={`p-2 rounded-xl border ${
              isHouse 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono truncate">{fileName}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isHouse ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' : 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
                }`}>
                  {locationType}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Location: <strong>{location}</strong> • Folder: <code>{cleanFolder}/</code> • 2-Tier Merged Columns Format
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddEntryForThisFile(location, locationType);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Entry</span>
            </button>

            <button
              type="button"
              onClick={() => exportLocationExcelFile(submissions, location, locationType, itemDefinitions)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
              title="Download Excel .XLSX (With merged option headers)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export .XLSX</span>
            </button>

            <button
              type="button"
              onClick={() => exportLocationCSVFile(submissions, location, locationType, itemDefinitions)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer border border-slate-700"
              title="Download CSV"
            >
              CSV
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

        {/* Stats & Search Toolbar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="font-semibold text-white">{matchedSubmissions.length} Total Submissions</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono font-semibold">{columnLayout.length} Total Header Columns</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Main 2-Tier Merged Spreadsheet Grid Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950">
          {filteredDataRows.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs italic space-y-2">
              <Table className="w-10 h-10 mx-auto text-slate-600" />
              <p>No entries in this Excel file yet.</p>
              <p className="text-[11px]">Click "+ Add Entry" above to log values for this location.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs border border-slate-800">
              {/* Hierarchical Sticky Header */}
              <thead className="sticky top-0 bg-slate-900 z-20 shadow-md">
                
                {/* Level 1 Header: Merged across sub-options */}
                <tr className="border-b border-slate-800 text-slate-200 font-bold">
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-slate-900 text-slate-500 font-mono text-center w-12" rowSpan={2}>
                    #
                  </th>
                  {groupedHeader1.map((grp, gIdx) => (
                    <th 
                      key={gIdx} 
                      colSpan={grp.colSpan}
                      className={`py-2 px-3 border-r border-slate-800 text-center whitespace-nowrap text-xs font-bold ${
                        grp.colSpan > 1 
                          ? 'bg-emerald-950/70 text-emerald-300 border-b-2 border-b-emerald-500/60' 
                          : 'bg-slate-900 text-slate-200'
                      }`}
                    >
                      {grp.name}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-center bg-slate-900 text-slate-400 w-20" rowSpan={2}>
                    Manage
                  </th>
                </tr>

                {/* Level 2 Sub-Header: Individual options (e.g. 100, 200, 500) */}
                <tr className="border-b border-slate-800 bg-slate-950 text-cyan-400 font-mono text-[11px]">
                  {columnLayout.map((col, cIdx) => (
                    <th 
                      key={cIdx} 
                      className="py-1.5 px-3 border-r border-slate-800 whitespace-nowrap text-center font-semibold bg-slate-950/90"
                    >
                      {col.headerLevel2}
                    </th>
                  ))}
                </tr>

              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {filteredDataRows.map((row, rIdx) => {
                  const entryId = String(row[0]);
                  const parentSub = matchedSubmissions.find(s => s.id === entryId);

                  return (
                    <tr key={rIdx} className="hover:bg-slate-900/60 transition group">
                      <td className="py-2 px-3 text-slate-500 font-mono text-center border-r border-slate-800/80 select-none">
                        {rIdx + 1}
                      </td>

                      {row.map((cellVal, cellIdx) => {
                        const colMeta = columnLayout[cellIdx];
                        const isSubOption = !!colMeta?.subOption;
                        const hasVal = cellVal !== '' && cellVal !== undefined && cellVal !== null;

                        return (
                          <td 
                            key={cellIdx} 
                            className={`py-2 px-3 border-r border-slate-800/80 whitespace-nowrap font-mono ${
                              cellIdx === 0 
                                ? 'text-cyan-400 font-semibold' 
                                : cellIdx === 1 
                                ? 'text-slate-400 text-[11px]' 
                                : isSubOption
                                ? hasVal 
                                  ? 'text-emerald-300 font-bold bg-emerald-950/20 text-center' 
                                  : 'text-slate-600 text-center'
                                : 'text-slate-200'
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exact Excel Format: Row 1 = Item Name (Merged), Row 2 = Sub-options (100, 200, 500, etc.), Row 3+ = User Entries.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
