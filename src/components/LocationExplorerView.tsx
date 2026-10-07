import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Plus, 
  Table, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FolderArchive,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  FileArchive
} from 'lucide-react';
import { InventorySubmission, InventoryItemDefinition } from '../types/inventory';
import { 
  sanitizeFolderName, 
  exportLocationExcelFile, 
  exportLocationCSVFile, 
  exportSingleLocationFolderZIP,
  exportAllLocationFoldersZIP 
} from '../utils/excelExporter';

interface LocationExplorerViewProps {
  submissions: InventorySubmission[];
  availableLocations: string[];
  itemDefinitions: InventoryItemDefinition[];
  onAddLocation: (loc: string) => void;
  onDeleteLocationFolder: (loc: string) => void;
  onOpenFileViewer: (location: string, type: 'In house' | 'Maintenance') => void;
  onQuickEntryForLocation: (location: string, type: 'In house' | 'Maintenance') => void;
}

export const LocationExplorerView: React.FC<LocationExplorerViewProps> = ({
  submissions,
  availableLocations,
  itemDefinitions,
  onAddLocation,
  onDeleteLocationFolder,
  onOpenFileViewer,
  onQuickEntryForLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const allLocations = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));

  const filteredLocations = allLocations.filter(loc => 
    loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sanitizeFolderName(loc).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      onAddLocation(newLocationName.trim());
      setNewLocationName('');
      setIsAddingLocation(false);
    }
  };

  const toggleCollapse = (loc: string) => {
    setCollapsedFolders(prev => ({ ...prev, [loc]: !prev[loc] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
              Location File Manager
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Site Location Folders &amp; Dedicated Excel Files
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Each location contains exactly two dedicated Excel files (In House &amp; Maintenance) without duplicate location headers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search location folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => exportAllLocationFoldersZIP(submissions, availableLocations, itemDefinitions)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            title="Download All Site Location Folders in a single ZIP"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download All (.ZIP)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingLocation(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40 cursor-pointer whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ New Folder</span>
          </button>
        </div>
      </div>

      {/* New Folder Modal / Input Popover */}
      {isAddingLocation && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl animate-fadeIn">
          <form onSubmit={handleCreateFolder} className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <FolderPlus className="w-4 h-4" />
              <span>Create New Site Location Folder</span>
            </div>
            <p className="text-xs text-slate-400">
              This will create a new folder and automatically generate the two dedicated files: <code>[Location]_In_House.xlsx</code> and <code>[Location]_Maintenance.xlsx</code>.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. Substation 5 - Industrial Park, Warehouse West..."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                autoFocus
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer"
              >
                Create Folder
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Location Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLocations.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs space-y-2">
            <Folder className="w-12 h-12 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No Location folders found matching "{searchQuery}"</p>
            <p>Click "+ New Folder" above to create a new site location.</p>
          </div>
        ) : (
          filteredLocations.map((loc) => {
            const cleanFolder = sanitizeFolderName(loc);
            const isCollapsed = !!collapsedFolders[loc];

            // In House file stats
            const inHouseSubmissions = submissions.filter(
              s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'In house'
            );
            const inHouseItemsCount = inHouseSubmissions.reduce((acc, s) => acc + s.items.length, 0);

            // Maintenance file stats
            const maintSubmissions = submissions.filter(
              s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'Maintenance'
            );
            const maintItemsCount = maintSubmissions.reduce((acc, s) => acc + s.items.length, 0);

            const totalEntries = inHouseSubmissions.length + maintSubmissions.length;

            return (
              <div
                key={loc}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl shadow-xl overflow-hidden transition-all duration-200"
              >
                {/* Folder Header */}
                <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
                  <div 
                    onClick={() => toggleCollapse(loc)}
                    className="flex items-center space-x-3 cursor-pointer select-none truncate"
                  >
                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-400 border border-teal-500/30">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white truncate">{loc}</h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        📁 {cleanFolder}/
                      </span>
                    </div>
                  </div>

                  {/* Folder Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => exportSingleLocationFolderZIP(submissions, loc, itemDefinitions)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-850 transition cursor-pointer"
                      title="Download Folder as .ZIP (Contains both Excel files)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCollapse(loc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Folder Contents (The 2 Dedicated Excel Files) */}
                {!isCollapsed && (
                  <div className="p-4 space-y-3 bg-slate-900/60">
                    
                    {/* File 1: In House File */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate flex items-center space-x-1.5">
                              <span>{cleanFolder}_In_House.xlsx</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                1st: In house
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {inHouseSubmissions.length} Submissions • {inHouseItemsCount} Material Rows
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium">
                          Active
                        </span>
                      </div>

                      {/* File Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenFileViewer(loc, 'In house')}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white rounded-lg font-medium border border-slate-800 transition cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Table className="w-3 h-3 text-emerald-400" />
                          <span>View Sheet</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onQuickEntryForLocation(loc, 'In house')}
                          className="py-1.5 px-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded-lg font-medium border border-emerald-800/40 transition cursor-pointer flex items-center space-x-1"
                          title="Add new entry into this file"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Entry</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportLocationExcelFile(submissions, loc, 'In house', itemDefinitions)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-800 transition cursor-pointer"
                          title="Download .XLSX"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => exportLocationCSVFile(submissions, loc, 'In house', itemDefinitions)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 text-[10px] transition cursor-pointer font-mono"
                          title="Download .CSV"
                        >
                          CSV
                        </button>
                      </div>
                    </div>

                    {/* File 2: Maintenance File */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 transition space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate flex items-center space-x-1.5">
                              <span>{cleanFolder}_Maintenance.xlsx</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                2nd: Maintenance
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {maintSubmissions.length} Submissions • {maintItemsCount} Material Rows
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-medium">
                          Active
                        </span>
                      </div>

                      {/* File Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenFileViewer(loc, 'Maintenance')}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white rounded-lg font-medium border border-slate-800 transition cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Table className="w-3 h-3 text-cyan-400" />
                          <span>View Sheet</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onQuickEntryForLocation(loc, 'Maintenance')}
                          className="py-1.5 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 rounded-lg font-medium border border-cyan-800/40 transition cursor-pointer flex items-center space-x-1"
                          title="Add new entry into this file"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Entry</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportLocationExcelFile(submissions, loc, 'Maintenance', itemDefinitions)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-800 transition cursor-pointer"
                          title="Download .XLSX"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => exportLocationCSVFile(submissions, loc, 'Maintenance', itemDefinitions)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 text-[10px] transition cursor-pointer font-mono"
                          title="Download .CSV"
                        >
                          CSV
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Folder Footer Bar */}
                <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Total logged: <strong>{totalEntries}</strong> entries</span>
                  {allLocations.length > 1 && (
                    <div>
                      {folderToDelete === loc ? (
                        <div className="flex items-center space-x-1.5 bg-rose-950/80 border border-rose-500/50 px-2 py-1 rounded-lg">
                          <span className="text-rose-300 text-[10px] font-semibold">Delete folder?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLocationFolder(loc);
                              setFolderToDelete(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setFolderToDelete(null)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px] rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFolderToDelete(loc)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-slate-900 px-2 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer"
                          title="Delete this Location Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Delete Folder</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
