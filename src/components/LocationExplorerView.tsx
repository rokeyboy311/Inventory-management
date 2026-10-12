import React, { useState } from 'react';
import { 
  FolderTree, 
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Eye, 
  Zap, 
  Download, 
  Search, 
  Layers, 
  Home, 
  Wrench, 
  ArrowRight,
  Activity,
  HardDrive
} from 'lucide-react';
import { InventorySubmission, InventoryItemDefinition, Location, Transformer, SubDivision, Division } from '../types/inventory';
import { sanitizeFolderName, exportLocationExcelFile, exportSingleLocationFolderZIP } from '../utils/excelExporter';

interface LocationExplorerViewProps {
  submissions: InventorySubmission[];
  availableLocations: string[];
  itemDefinitions: InventoryItemDefinition[];
  onAddLocation: (newLoc: string) => void;
  onDeleteLocationFolder: (loc: string) => void;
  onOpenFileViewer: (loc: string, type: 'In house' | 'Maintenance') => void;
  onQuickEntryForLocation: (loc: string, type: 'In house' | 'Maintenance') => void;
  transformers?: Transformer[];
  locationsList?: Location[];
  divisions?: Division[];
  subdivisions?: SubDivision[];
  onNavigateToReadings?: (locName: string) => void;
}

export const LocationExplorerView: React.FC<LocationExplorerViewProps> = ({
  submissions,
  availableLocations,
  itemDefinitions,
  onAddLocation,
  onDeleteLocationFolder,
  onOpenFileViewer,
  onQuickEntryForLocation,
  transformers = [],
  locationsList = [],
  divisions = [],
  subdivisions = [],
  onNavigateToReadings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  const allLocations = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));

  const filteredLocations = allLocations.filter(loc => 
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocName.trim()) {
      onAddLocation(newLocName.trim());
      setNewLocName('');
      setIsAddOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Hierarchy Explorer: Division → Sub-Division → Locations
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700/40 font-mono">
                Central Registry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              VYARA Division ➔ DOLVAN Sub-Division. Each location manages exactly 2 persistent files: 
              <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.2 rounded font-mono text-xs mx-1">Inventory_Usage.xlsx</code> and 
              <code className="text-purple-400 bg-slate-950 px-1.5 py-0.2 rounded font-mono text-xs mx-1">Volt_Amp_Readings.xlsx</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Site Location</span>
        </button>
      </div>

      {/* Add Location Modal */}
      {isAddOpen && (
        <form onSubmit={handleCreateLocation} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Enter Location name (e.g. KANDHA KONCHAL, PIDADARA PATEL FALIYA)..."
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Create Location Folder
          </button>
          <button
            type="button"
            onClick={() => setIsAddOpen(false)}
            className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">VYARA</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-cyan-400">DOLVAN</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">{filteredLocations.length} Locations</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search location folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Location Folders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map((loc) => {
          const cleanFolder = sanitizeFolderName(loc);
          const locObj = locationsList.find(l => l.name.toLowerCase() === loc.toLowerCase());
          const locTransformers = transformers.filter(t => t.locationId === locObj?.id);

          const inHouseSubmissions = submissions.filter(s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'In house');
          const maintSubmissions = submissions.filter(s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'Maintenance');
          const totalEntries = inHouseSubmissions.length + maintSubmissions.length;

          return (
            <div 
              key={loc}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Folder Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">{loc}</h3>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span>📁 {cleanFolder}/</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove location folder "${loc}" from quick selection? Historical data will be preserved in database.`)) {
                        onDeleteLocationFolder(loc);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Deactivate location"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Transformer details if registered */}
                {locTransformers.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider block">
                      ⚡ Active Transformer:
                    </span>
                    {locTransformers.map(tc => (
                      <div key={tc.id} className="flex items-center justify-between text-slate-300 font-mono">
                        <span>TC #{tc.serialNumber} ({tc.make})</span>
                        <span className="text-cyan-400 font-semibold">{tc.capacity}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* The 2 Location Files */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                    Persistent Target Files:
                  </span>

                  {/* File 1: In House Inventory Usage */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="flex items-center space-x-1.5 text-emerald-400 font-mono truncate font-semibold">
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cleanFolder}_In_House.xlsx</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {inHouseSubmissions.length} submissions • {inHouseSubmissions.reduce((sum, s) => sum + s.items.length, 0)} items
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenFileViewer(loc, 'In house')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="View File Spreadsheet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => exportLocationExcelFile(submissions, loc, 'In house', itemDefinitions)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg transition cursor-pointer"
                        title="Export In House Excel"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* File 2: Maintenance Log */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-mono truncate font-semibold">
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cleanFolder}_Maintenance.xlsx</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {maintSubmissions.length} submissions • {maintSubmissions.reduce((sum, s) => sum + s.items.length, 0)} items
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenFileViewer(loc, 'Maintenance')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="View File Spreadsheet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => exportLocationExcelFile(submissions, loc, 'Maintenance', itemDefinitions)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-lg transition cursor-pointer"
                        title="Export Maintenance Excel"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => exportSingleLocationFolderZIP(submissions, loc, itemDefinitions)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer flex items-center space-x-1"
                  title="Download Folder as .ZIP"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Folder ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickEntryForLocation(loc, 'In house')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer shadow-md flex items-center space-x-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>+ Quick Entry</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
