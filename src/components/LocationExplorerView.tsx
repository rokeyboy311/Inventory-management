import React, { useState } from 'react';
import { 
  FolderTree, 
  Folder,
  FolderOpen,
  FolderPlus,
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Eye, 
  Zap, 
  Download, 
  Search, 
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Edit2,
  X,
  FileText,
  BarChart3,
  Archive,
  RefreshCw
} from 'lucide-react';
import { InventorySubmission, InventoryItemDefinition, Location, Transformer, SubDivision, Division } from '../types/inventory';
import { 
  sanitizeFolderName, 
  exportLocationExcelFile, 
  exportSingleLocationFolderZIP,
  exportSubdivisionPrimaryExcelFile 
} from '../utils/excelExporter';

interface LocationExplorerViewProps {
  submissions: InventorySubmission[];
  availableLocations: string[];
  itemDefinitions: InventoryItemDefinition[];
  onAddLocation: (newLoc: string, subdivisionId?: string) => void;
  onDeleteLocationFolder: (loc: string) => void;
  onOpenFileViewer: (loc: string, type: 'In house' | 'Maintenance') => void;
  onQuickEntryForLocation: (loc: string, type: 'In house' | 'Maintenance') => void;
  transformers?: Transformer[];
  locationsList?: Location[];
  divisions?: Division[];
  subdivisions?: SubDivision[];
  onNavigateToReadings?: (locName: string) => void;
  onOpenSubdivisionWorkbook?: (subId: string, subName: string) => void;
  onCreateDivision?: (name: string, code: string) => Promise<void>;
  onRenameDivision?: (divId: string, newName: string, newCode?: string) => Promise<void>;
  onCreateSubdivision?: (divisionId: string, name: string, code: string) => Promise<void>;
  onRenameSubdivision?: (subId: string, newName: string, newCode?: string) => Promise<void>;
  onDeleteSubdivision?: (subId: string) => Promise<void>;
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
  onOpenSubdivisionWorkbook,
  onCreateDivision,
  onRenameDivision,
  onCreateSubdivision,
  onRenameSubdivision,
  onDeleteSubdivision,
}) => {
  // Folder open/closed state: keyed by division ID and subdivision ID
  const [openDivisions, setOpenDivisions] = useState<Record<string, boolean>>({
    'div-vyara': true // Open default division so sub-division folders are visible
  });

  const [openSubdivisions, setOpenSubdivisions] = useState<Record<string, boolean>>({
    'sub-dolvan': false // Closed by default until user opens it
  });

  // Active breadcrumb drill-down level
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [addingToSubId, setAddingToSubId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dialog Modals State
  const [isCreateDivOpen, setIsCreateDivOpen] = useState(false);
  const [newDivName, setNewDivName] = useState('');
  const [newDivCode, setNewDivCode] = useState('');

  const [isCreateSubOpen, setIsCreateSubOpen] = useState(false);
  const [targetDivForSub, setTargetDivForSub] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [editDivName, setEditDivName] = useState('');
  const [editDivCode, setEditDivCode] = useState('');

  const [editingSubdivision, setEditingSubdivision] = useState<SubDivision | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');

  // Fallback division & subdivision if empty
  const activeDivisions: Division[] = divisions.length > 0 
    ? divisions 
    : [{ id: 'div-vyara', name: 'VYARA', code: 'VYR', status: 'active', createdAt: '', updatedAt: '' }];

  const activeSubdivisions: SubDivision[] = subdivisions.length > 0
    ? subdivisions
    : [{ id: 'sub-dolvan', divisionId: 'div-vyara', name: 'DOLVAN', code: 'DLV', status: 'active', createdAt: '', updatedAt: '' }];

  const allLocations = Array.from(new Set([...availableLocations, ...submissions.map(s => s.location)]));

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const toggleDivisionFolder = (divId: string) => {
    setOpenDivisions(prev => ({
      ...prev,
      [divId]: !prev[divId]
    }));
  };

  const toggleSubdivisionFolder = (subId: string) => {
    setOpenSubdivisions(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const handleOpenAllFolders = () => {
    const nextDivs: Record<string, boolean> = {};
    activeDivisions.forEach(d => { nextDivs[d.id] = true; });
    setOpenDivisions(nextDivs);

    const nextSubs: Record<string, boolean> = {};
    activeSubdivisions.forEach(s => { nextSubs[s.id] = true; });
    setOpenSubdivisions(nextSubs);
  };

  const handleCloseAllFolders = () => {
    const nextDivs: Record<string, boolean> = {};
    activeDivisions.forEach(d => { nextDivs[d.id] = true; });
    setOpenDivisions(nextDivs);

    const nextSubs: Record<string, boolean> = {};
    activeSubdivisions.forEach(s => { nextSubs[s.id] = false; });
    setOpenSubdivisions(nextSubs);
  };

  const handleCreateDivisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivName.trim()) return;
    const name = newDivName.trim().toUpperCase();
    const code = (newDivCode.trim() || name.slice(0, 3)).toUpperCase();

    if (onCreateDivision) {
      await onCreateDivision(name, code);
      showNotification(`✓ Division Folder "${name}" created successfully!`);
    } else {
      showNotification(`✓ Division Folder "${name}" added.`);
    }
    setNewDivName('');
    setNewDivCode('');
    setIsCreateDivOpen(false);
  };

  const handleCreateSubdivisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const parentId = targetDivForSub || activeDivisions[0]?.id || 'div-vyara';
    const name = newSubName.trim().toUpperCase();
    const code = (newSubCode.trim() || name.slice(0, 3)).toUpperCase();

    if (onCreateSubdivision) {
      await onCreateSubdivision(parentId, name, code);
      showNotification(`✓ Sub-Division Folder "${name}" with canonical "${name}.xlsx" created successfully!`);
    } else {
      showNotification(`✓ Sub-Division Folder "${name}" added.`);
    }
    // Auto open parent division
    setOpenDivisions(prev => ({ ...prev, [parentId]: true }));
    setNewSubName('');
    setNewSubCode('');
    setIsCreateSubOpen(false);
  };

  const handleRenameDivisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivision || !editDivName.trim()) return;
    if (onRenameDivision) {
      await onRenameDivision(editingDivision.id, editDivName.trim().toUpperCase(), editDivCode.trim().toUpperCase());
      showNotification(`✓ Division renamed to "${editDivName.trim().toUpperCase()}".`);
    }
    setEditingDivision(null);
  };

  const handleRenameSubdivisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubdivision || !editSubName.trim()) return;
    if (onRenameSubdivision) {
      await onRenameSubdivision(editingSubdivision.id, editSubName.trim().toUpperCase(), editSubCode.trim().toUpperCase());
      showNotification(`✓ Sub-Division renamed to "${editSubName.trim().toUpperCase()}" (Primary workbook updated to ${editSubName.trim().toUpperCase()}.xlsx).`);
    }
    setEditingSubdivision(null);
  };

  const handleDeleteSubdivisionClick = async (sub: SubDivision) => {
    const linkedLocs = allLocations.filter(loc => {
      const locObj = locationsList.find(l => l.name.toLowerCase() === loc.toLowerCase());
      return locObj ? locObj.subdivisionId === sub.id : (sub.id === 'sub-dolvan');
    });

    const linkedEntries = submissions.filter(s => s.subdivisionId === sub.id);

    if (linkedLocs.length > 0 || linkedEntries.length > 0) {
      showNotification(
        `Protection Rule: Cannot delete Sub-Division "${sub.name}". It contains ${linkedLocs.length} locations and ${linkedEntries.length} historical work entries. Please reassign or archive locations first.`,
        'error'
      );
      return;
    }

    if (confirm(`Are you sure you want to delete empty Sub-Division "${sub.name}"?`)) {
      if (onDeleteSubdivision) {
        await onDeleteSubdivision(sub.id);
        showNotification(`✓ Sub-Division "${sub.name}" safely deleted.`);
      }
    }
  };

  const handleCreateLocation = (subId: string, subName: string) => {
    if (newLocName.trim()) {
      const trimmed = newLocName.trim().toUpperCase();
      onAddLocation(trimmed, subId);
      
      // Auto-open this folder so the newly created location is visible immediately
      setOpenSubdivisions(prev => ({
        ...prev,
        [subId]: true
      }));

      showNotification(`✓ Location "${trimmed}" successfully created inside folder "${subName}"!`);
      setNewLocName('');
      setAddingToSubId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn font-terminal">
      
      {/* Top Header & Actions Section */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[#111113] border border-[rgba(226,226,231,0.15)] text-[#00ffaa]">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="font-display text-xl uppercase tracking-wide text-white">
                Folder Hierarchy &amp; Location Registry
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#00ffaa] text-[#00ffaa] bg-[#111113]">
                CENTRAL STORAGE
              </span>
            </div>
            {/* Interactive Breadcrumbs */}
            <div className="flex items-center space-x-1.5 text-xs text-[rgba(226,226,231,0.5)] mt-1 font-mono">
              <button 
                type="button" 
                onClick={() => { setSelectedDivId(null); setSelectedSubId(null); }}
                className="hover:text-[#00ffaa] transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <span>🏠 Root</span>
              </button>
              <span>➔</span>
              <span className="text-[#00ffaa] font-semibold">
                {selectedDivId ? (activeDivisions.find(d => d.id === selectedDivId)?.name || 'Division') : 'All Divisions'}
              </span>
              {selectedSubId && (
                <>
                  <span>➔</span>
                  <span className="text-[#00ccff] font-semibold">
                    📂 {activeSubdivisions.find(s => s.id === selectedSubId)?.name || 'Sub-Division'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Create Division, Create Sub-Division, Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateDivOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#111113] hover:bg-[rgba(226,226,231,0.08)] text-[#00ffaa] border border-[#00ffaa]/40 hover:border-[#00ffaa] text-xs font-bold uppercase transition cursor-pointer shadow-md"
            title="Create a new Division folder"
          >
            <FolderPlus className="w-4 h-4 text-[#00ffaa]" />
            <span>+ New Division Folder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetDivForSub(activeDivisions[0]?.id || 'div-vyara');
              setIsCreateSubOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold uppercase transition cursor-pointer shadow-md"
            title="Create a new Sub-Division folder with its canonical Excel file"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Sub-Division Folder</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAllFolders}
            className="flex items-center space-x-1 px-3 py-2 bg-[#161618] hover:bg-[#222226] text-[rgba(226,226,231,0.8)] border border-[rgba(226,226,231,0.2)] text-xs font-semibold transition cursor-pointer"
            title="Open all folders"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Open All</span>
          </button>

          <button
            type="button"
            onClick={handleCloseAllFolders}
            className="flex items-center space-x-1 px-3 py-2 bg-[#161618] hover:bg-[#222226] text-[rgba(226,226,231,0.8)] border border-[rgba(226,226,231,0.2)] text-xs font-semibold transition cursor-pointer"
            title="Close all folders"
          >
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Close All</span>
          </button>
        </div>
      </div>

      {/* Global Search across folders */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[rgba(226,226,231,0.7)] font-mono">
          <span className="text-[#00ffaa] font-bold">{activeDivisions.length}</span> Divisions • 
          <span className="text-[#00ccff] font-bold ml-1">{activeSubdivisions.length}</span> Sub-Divisions • 
          <span className="text-white font-bold ml-1">{allLocations.length}</span> Site Locations
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[rgba(226,226,231,0.4)]" />
          <input
            type="text"
            placeholder="Search folders or site locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffaa]"
          />
        </div>
      </div>

      {/* Notice Alert if present */}
      {alertMessage && (
        <div className={`p-4 border rounded-xl flex items-center justify-between gap-3 text-xs animate-fadeIn ${
          alertMessage.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-[#00ffaa]' 
            : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00ffaa] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{alertMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* LEVEL 1: DIVISION FOLDERS */}
      <div className="space-y-6">
        {activeDivisions.map(div => {
          const isDivOpen = openDivisions[div.id] ?? true;
          const divSubdivisions = activeSubdivisions.filter(s => s.divisionId === div.id || !s.divisionId);

          return (
            <div 
              key={div.id} 
              className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] rounded-2xl overflow-hidden shadow-xl"
            >
              
              {/* Division Folder Header Bar */}
              <div 
                onClick={() => toggleDivisionFolder(div.id)}
                className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none transition border-b border-[rgba(226,226,231,0.08)] ${
                  isDivOpen ? 'bg-[#161618]' : 'bg-[#1c1c1f] hover:bg-[#202024]'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-[#111113] border border-[#00ffaa]/30 rounded-xl text-[#00ffaa]">
                    <Building2 className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00ffaa] bg-[#111113] px-2 py-0.5 border border-[#00ffaa]/30 font-bold">
                        PRIMARY DIVISION
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-wide font-display">
                        📁 {div.name} DIVISION ({div.code})
                      </h3>
                    </div>
                    <p className="text-xs text-[rgba(226,226,231,0.4)] mt-1 font-mono">
                      Contains {divSubdivisions.length} Sub-Division Folder(s) • Click to {isDivOpen ? 'collapse' : 'expand'}
                    </p>
                  </div>
                </div>

                {/* Division Action Controls */}
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDivForSub(div.id);
                      setIsCreateSubOpen(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#111113] hover:bg-[rgba(226,226,231,0.08)] text-[#00ffaa] border border-[#00ffaa]/40 text-xs font-bold transition cursor-pointer"
                    title={`Create Sub-Division folder inside ${div.name}`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Sub-Division</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingDivision(div);
                      setEditDivName(div.name);
                      setEditDivCode(div.code);
                    }}
                    className="p-2 text-[rgba(226,226,231,0.6)] hover:text-white bg-[#111113] border border-[rgba(226,226,231,0.15)] rounded-lg transition cursor-pointer"
                    title="Rename Division"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDivisionFolder(div.id)}
                    className="p-2 text-[rgba(226,226,231,0.6)] hover:text-white bg-[#111113] border border-[rgba(226,226,231,0.15)] rounded-lg transition cursor-pointer"
                  >
                    {isDivOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* LEVEL 2: SUB-DIVISION FOLDERS INSIDE THIS DIVISION */}
              {isDivOpen && (
                <div className="p-4 sm:p-6 space-y-5 bg-[#141416]/50">
                  {divSubdivisions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[rgba(226,226,231,0.15)] rounded-xl space-y-3">
                      <Folder className="w-10 h-10 mx-auto text-[rgba(226,226,231,0.3)]" />
                      <p className="text-xs text-[rgba(226,226,231,0.5)]">No Sub-Division folders inside {div.name} yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetDivForSub(div.id);
                          setIsCreateSubOpen(true);
                        }}
                        className="px-4 py-2 bg-[#00ffaa] text-[#111113] text-xs font-bold rounded-lg cursor-pointer"
                      >
                        + Create First Sub-Division Folder
                      </button>
                    </div>
                  ) : (
                    divSubdivisions.map(sub => {
                      const isFolderOpen = Boolean(openSubdivisions[sub.id]);

                      // Locations associated with this sub-division
                      const subLocations = allLocations.filter(loc => {
                        const locObj = locationsList.find(l => l.name.toLowerCase() === loc.toLowerCase());
                        if (locObj && locObj.subdivisionId) {
                          return locObj.subdivisionId === sub.id;
                        }
                        return sub.id === 'sub-dolvan' || sub.name === 'DOLVAN';
                      });

                      const filteredSubLocations = subLocations.filter(loc =>
                        loc.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      return (
                        <div 
                          key={sub.id} 
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isFolderOpen 
                              ? 'bg-[#1c1c1f] border-[#00ffaa]/50 shadow-2xl ring-1 ring-[#00ffaa]/30' 
                              : 'bg-[#161618] hover:bg-[#1c1c1f] border-[rgba(226,226,231,0.12)]'
                          }`}
                        >
                          
                          {/* Folder Header Bar (Clickable to Toggle Open/Close) */}
                          <div 
                            onClick={() => toggleSubdivisionFolder(sub.id)}
                            className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none transition ${
                              isFolderOpen ? 'bg-[#111113] border-b border-[rgba(226,226,231,0.12)]' : 'bg-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className={`p-3 rounded-xl transition ${
                                isFolderOpen 
                                  ? 'bg-[#00ffaa]/15 border border-[#00ffaa]/30 text-[#00ffaa]' 
                                  : 'bg-[#111113] border border-[rgba(226,226,231,0.15)] text-amber-400'
                              }`}>
                                {isFolderOpen ? (
                                  <FolderOpen className="w-6 h-6 text-[#00ffaa]" />
                                ) : (
                                  <Folder className="w-6 h-6 text-amber-400" />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center space-x-2.5">
                                  <h3 className="font-bold text-white text-base tracking-tight font-display flex items-center gap-1.5">
                                    <span>📁 {sub.name} Sub-Division Folder</span>
                                  </h3>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                    isFolderOpen
                                      ? 'bg-emerald-950 text-[#00ffaa] border-emerald-700/50'
                                      : 'bg-[#111113] text-[rgba(226,226,231,0.5)] border-[rgba(226,226,231,0.15)]'
                                  }`}>
                                    {isFolderOpen ? '📂 OPEN' : '📁 CLOSED'}
                                  </span>
                                </div>

                                <p className="text-xs text-[rgba(226,226,231,0.5)] mt-1 flex flex-wrap items-center gap-2 font-mono">
                                  <span>{subLocations.length} Site Locations</span>
                                  <span>•</span>
                                  <span className="text-[#00ccff]">Canonical File: {sub.name}.xlsx</span>
                                  <span>•</span>
                                  <span className="text-[rgba(226,226,231,0.4)]">
                                    {isFolderOpen 
                                      ? 'Showing folder contents & locations' 
                                      : 'Click to open folder'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Right Action Button & Arrow Indicator */}
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubdivision(sub);
                                  setEditSubName(sub.name);
                                  setEditSubCode(sub.code);
                                }}
                                className="p-2 text-[rgba(226,226,231,0.6)] hover:text-white bg-[#111113] border border-[rgba(226,226,231,0.15)] rounded-lg transition cursor-pointer"
                                title="Rename Sub-Division"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSubdivisionClick(sub)}
                                className="p-2 text-[rgba(226,226,231,0.5)] hover:text-rose-400 bg-[#111113] border border-[rgba(226,226,231,0.15)] rounded-lg transition cursor-pointer"
                                title="Safely delete sub-division (protected against data loss)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleSubdivisionFolder(sub.id)}
                                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                                  isFolderOpen
                                    ? 'bg-[#111113] hover:bg-[#161618] text-[#e2e2e7] border border-[rgba(226,226,231,0.2)]'
                                    : 'bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113]'
                                }`}
                              >
                                {isFolderOpen ? (
                                  <>
                                    <Folder className="w-3.5 h-3.5" />
                                    <span>Close Folder</span>
                                  </>
                                ) : (
                                  <>
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>Open Folder ({subLocations.length})</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* LEVEL 3: FOLDER CONTENTS (ONLY RENDERED AFTER FOLDER IS OPENED) */}
                          {isFolderOpen ? (
                            <div className="p-5 space-y-6 animate-fadeIn bg-[#111113]">
                              
                              {/* 🌟 CANONICAL SINGLE PRIMARY EXCEL WORKBOOK CARD */}
                              <div className="bg-gradient-to-r from-emerald-950/80 via-[#1c1c1f] to-teal-950/80 border-2 border-[#00ffaa]/50 rounded-2xl p-5 shadow-2xl space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center space-x-3.5">
                                    <div className="p-3 bg-[#00ffaa]/20 border border-[#00ffaa]/40 rounded-xl text-[#00ffaa] shadow-md">
                                      <FileSpreadsheet className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00ffaa]/20 text-[#00ffaa] border border-[#00ffaa]/40 uppercase">
                                          CANONICAL PRIMARY WORKBOOK
                                        </span>
                                        <span className="text-xs text-[rgba(226,226,231,0.4)] font-mono">
                                          All Field Logs Auto-Synchronize Here
                                        </span>
                                      </div>
                                      <h4 className="text-xl font-bold text-white font-mono tracking-tight mt-0.5">
                                        📊 {sub.name}.xlsx
                                      </h4>
                                      <p className="text-xs text-[rgba(226,226,231,0.7)] mt-0.5 font-sans">
                                        Single canonical primary workbook for <strong>{sub.name} Sub-Division</strong>. All entries update this file without creating duplicate workbooks.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Buttons for Single Canonical Workbook */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onOpenSubdivisionWorkbook) {
                                          onOpenSubdivisionWorkbook(sub.id, sub.name);
                                        } else {
                                          onOpenFileViewer(subLocations[0] || 'KANDHA KONCHAL', 'Maintenance');
                                        }
                                      }}
                                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#161618] hover:bg-[#222226] text-white text-xs font-bold transition cursor-pointer border border-[rgba(226,226,231,0.2)] shadow-md"
                                      title="Open Detailed Item-Usage & Spreadsheet View"
                                    >
                                      <Eye className="w-4 h-4 text-[#00ffaa]" />
                                      <span>View Spreadsheet / Item Usage</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => exportSubdivisionPrimaryExcelFile(sub.name, submissions, itemDefinitions)}
                                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold transition cursor-pointer shadow-lg"
                                      title={`Download canonical ${sub.name}.xlsx`}
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Export {sub.name}.xlsx</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Quick Summary Pill Bar inside Workbook Card */}
                                <div className="pt-2 border-t border-[#00ffaa]/20 flex flex-wrap items-center justify-between text-xs text-[rgba(226,226,231,0.6)] gap-2 font-mono">
                                  <div className="flex items-center space-x-4">
                                    <span className="flex items-center space-x-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#00ffaa]"></span>
                                      <span>{subLocations.length} Site Locations</span>
                                    </span>
                                    <span className="flex items-center space-x-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#00ccff]"></span>
                                      <span>{submissions.length} Total Submissions</span>
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#00ffaa]">
                                    ✓ Auto-sync active • Safe thread-locked storage
                                  </span>
                                </div>
                              </div>

                              {/* Sub-Folder Toolbar: Search + Add Location inside this folder */}
                              <div className="bg-[#161618] border border-[rgba(226,226,231,0.12)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center space-x-2 text-[rgba(226,226,231,0.7)]">
                                  <span className="font-semibold text-amber-400 font-mono">📂 Inside {sub.name}/:</span>
                                  <span className="text-[rgba(226,226,231,0.5)] font-mono">
                                    {filteredSubLocations.length} of {subLocations.length} locations visible
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Add Location Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingToSubId(addingToSubId === sub.id ? null : sub.id);
                                      setNewLocName('');
                                    }}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold transition shadow-md cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add Location to {sub.name}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Inline Form: Add New Location to this opened folder */}
                              {addingToSubId === sub.id && (
                                <div className="p-4 bg-[#1c1c1f] border border-[#00ffaa]/50 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
                                  <div className="flex items-center space-x-2 text-[#00ffaa] text-xs font-bold">
                                    <Plus className="w-4 h-4" />
                                    <span>Create New Site Location inside Folder "{sub.name}"</span>
                                  </div>

                                  <form 
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleCreateLocation(sub.id, sub.name);
                                    }}
                                    className="flex flex-wrap items-center gap-3"
                                  >
                                    <input
                                      type="text"
                                      placeholder="e.g. KANDHA KONCHAL, ABRAR, etc."
                                      value={newLocName}
                                      onChange={(e) => setNewLocName(e.target.value)}
                                      className="flex-1 min-w-[240px] bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffaa] font-mono"
                                      autoFocus
                                    />
                                    <button
                                      type="submit"
                                      className="px-4 py-2 rounded-xl bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] text-xs font-bold transition cursor-pointer"
                                    >
                                      Create Location
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAddingToSubId(null)}
                                      className="px-3 py-2 rounded-xl bg-[#161618] text-[rgba(226,226,231,0.5)] hover:text-white text-xs transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                </div>
                              )}

                              {/* Site Locations Grid Inside This Sub-Division */}
                              {filteredSubLocations.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-[rgba(226,226,231,0.15)] rounded-2xl space-y-3">
                                  <MapPin className="w-8 h-8 mx-auto text-[rgba(226,226,231,0.2)]" />
                                  <p className="text-xs text-[rgba(226,226,231,0.5)]">No site locations inside {sub.name} match your search.</p>
                                  <button
                                    type="button"
                                    onClick={() => setAddingToSubId(sub.id)}
                                    className="px-3.5 py-1.5 bg-[#00ffaa] text-[#111113] text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    + Add Site Location
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {filteredSubLocations.map(loc => {
                                    const cleanFolder = sanitizeFolderName(loc);
                                    const locObj = locationsList.find(l => l.name.toLowerCase() === loc.toLowerCase());
                                    const locTransformers = transformers.filter(t => locObj ? t.locationId === locObj.id : false);
                                    const inHouseSubmissions = submissions.filter(
                                      s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'In house'
                                    );
                                    const maintSubmissions = submissions.filter(
                                      s => s.location.toLowerCase() === loc.toLowerCase() && s.locationType === 'Maintenance'
                                    );

                                    return (
                                      <div 
                                        key={loc}
                                        className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] hover:border-[#00ffaa]/40 rounded-2xl p-4 sm:p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
                                      >
                                        <div>
                                          {/* Location Card Header */}
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-2.5">
                                              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[#00ffaa]">
                                                <MapPin className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <h4 className="font-bold text-white text-sm tracking-tight">{loc}</h4>
                                                <div className="text-[10px] text-[rgba(226,226,231,0.4)] font-mono flex items-center gap-1 mt-0.5">
                                                  <span>📁 {sub.name}/{cleanFolder}/</span>
                                                </div>
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (confirm(`Remove location folder "${loc}" from folder ${sub.name}? Historical entries remain safe in database.`)) {
                                                  onDeleteLocationFolder(loc);
                                                }
                                              }}
                                              className="p-1.5 text-[rgba(226,226,231,0.4)] hover:text-rose-400 hover:bg-[#111113] rounded-lg transition cursor-pointer"
                                              title="Remove location"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Transformer details if registered */}
                                          {locTransformers.length > 0 && (
                                            <div className="mt-3 p-2.5 rounded-xl bg-[#111113] border border-[rgba(226,226,231,0.1)] text-[11px] space-y-1">
                                              <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider block">
                                                ⚡ Transformer Linked:
                                              </span>
                                              {locTransformers.map(tc => (
                                                <div key={tc.id} className="flex items-center justify-between text-slate-300 font-mono">
                                                  <span>TC #{tc.serialNumber} ({tc.make})</span>
                                                  <span className="text-cyan-400 font-semibold">{tc.capacity}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Individual Location File */}
                                          <div className="mt-4 space-y-2">
                                            <span className="text-[10px] font-bold text-[rgba(226,226,231,0.4)] uppercase tracking-wider font-mono block">
                                              Site Maintenance File:
                                            </span>

                                            {/* Primary Maintenance Workbook */}
                                            <div className="p-3 rounded-xl bg-[#111113] border border-[rgba(226,226,231,0.12)] hover:border-[#00ccff]/40 flex items-center justify-between text-xs transition">
                                              <div className="truncate mr-2">
                                                <div className="flex items-center space-x-1.5 text-[#00ccff] font-mono truncate font-semibold">
                                                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-[#00ccff]" />
                                                  <span className="truncate">{cleanFolder}_Maintenance.xlsx</span>
                                                </div>
                                                <span className="text-[10px] text-[rgba(226,226,231,0.5)] font-mono">
                                                  {maintSubmissions.length} maintenance records • {maintSubmissions.reduce((sum, s) => sum + s.items.length, 0)} items recorded
                                                </span>
                                              </div>

                                              <div className="flex items-center space-x-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => onOpenFileViewer(loc, 'Maintenance')}
                                                  className="p-2 bg-[#161618] hover:bg-[#222226] text-[rgba(226,226,231,0.8)] hover:text-white rounded-lg transition cursor-pointer"
                                                  title="View File Spreadsheet"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => exportLocationExcelFile(submissions, loc, 'Maintenance', itemDefinitions)}
                                                  className="p-2 bg-[#161618] hover:bg-[#222226] text-[#00ccff] rounded-lg transition cursor-pointer"
                                                  title="Export Maintenance Excel"
                                                >
                                                  <Download className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Bottom Card Actions */}
                                        <div className="pt-3 border-t border-[rgba(226,226,231,0.1)] flex items-center justify-between gap-2 text-xs">
                                          <button
                                            type="button"
                                            onClick={() => exportSingleLocationFolderZIP(submissions, loc, itemDefinitions)}
                                            className="px-2.5 py-1.5 rounded-xl bg-[#111113] hover:bg-[#161618] text-[rgba(226,226,231,0.7)] border border-[rgba(226,226,231,0.15)] transition cursor-pointer flex items-center space-x-1"
                                            title="Download Folder as .ZIP"
                                          >
                                            <Download className="w-3.5 h-3.5 text-[#00ffaa]" />
                                            <span>Folder ZIP</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => onQuickEntryForLocation(loc, 'Maintenance')}
                                            className="px-3 py-1.5 rounded-xl bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-bold transition cursor-pointer shadow-md flex items-center space-x-1"
                                          >
                                            <Zap className="w-3.5 h-3.5" />
                                            <span>+ Quick Entry</span>
                                          </button>
                                        </div>

                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          ) : (
                            /* FOLDER IS CLOSED: Clear indicator */
                            <div 
                              onClick={() => toggleSubdivisionFolder(sub.id)}
                              className="px-5 py-4 bg-[#111113] border-t border-[rgba(226,226,231,0.08)] flex items-center justify-between text-xs text-[rgba(226,226,231,0.6)] cursor-pointer hover:bg-[#141416] transition"
                            >
                              <div className="flex items-center space-x-2">
                                <Info className="w-3.5 h-3.5 text-amber-400" />
                                <span>Locations are stored inside this folder. Click <strong>"Open Folder"</strong> to view.</span>
                              </div>
                              <span className="text-[#00ffaa] font-semibold hover:underline flex items-center gap-1 font-mono">
                                Open {sub.name} Folder ➔
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* MODAL: Create New Division Folder */}
      {isCreateDivOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-terminal">
          <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.2)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(226,226,231,0.12)] pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base font-display uppercase">
                <FolderPlus className="w-5 h-5 text-[#00ffaa]" />
                <span>Create New Division Folder</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateDivOpen(false)}
                className="text-[rgba(226,226,231,0.5)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDivisionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">
                  Division Name (e.g. VYARA, SURAT, NAVSARI):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SURAT"
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">
                  Division Code (Short identifier):
                </label>
                <input
                  type="text"
                  placeholder="e.g. SRT"
                  value={newDivCode}
                  onChange={(e) => setNewDivCode(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(226,226,231,0.12)]">
                <button
                  type="button"
                  onClick={() => setIsCreateDivOpen(false)}
                  className="px-4 py-2 bg-[#161618] text-[rgba(226,226,231,0.6)] hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-bold rounded-lg transition"
                >
                  Create Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Sub-Division Folder */}
      {isCreateSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-terminal">
          <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.2)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(226,226,231,0.12)] pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base font-display uppercase">
                <FolderPlus className="w-5 h-5 text-[#00ccff]" />
                <span>Create New Sub-Division Folder</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateSubOpen(false)}
                className="text-[rgba(226,226,231,0.5)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubdivisionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">
                  Parent Division Folder:
                </label>
                <select
                  value={targetDivForSub}
                  onChange={(e) => setTargetDivForSub(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                >
                  {activeDivisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">
                  Sub-Division Name (e.g. DOLVAN, SONGADH, UCHCHHAL):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SONGADH"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                  autoFocus
                />
                <p className="text-[10px] text-[rgba(226,226,231,0.4)]">
                  Creates canonical file: <code>{newSubName.trim().toUpperCase() || 'SUBDIVISION'}.xlsx</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">
                  Sub-Division Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. SNG"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(226,226,231,0.12)]">
                <button
                  type="button"
                  onClick={() => setIsCreateSubOpen(false)}
                  className="px-4 py-2 bg-[#161618] text-[rgba(226,226,231,0.6)] hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-bold rounded-lg transition"
                >
                  Create Sub-Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rename Division */}
      {editingDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-terminal">
          <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.2)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(226,226,231,0.12)] pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base font-display uppercase">
                <Edit2 className="w-5 h-5 text-[#00ffaa]" />
                <span>Rename Division Folder</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingDivision(null)}
                className="text-[rgba(226,226,231,0.5)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameDivisionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">Division Name:</label>
                <input
                  type="text"
                  required
                  value={editDivName}
                  onChange={(e) => setEditDivName(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">Division Code:</label>
                <input
                  type="text"
                  value={editDivCode}
                  onChange={(e) => setEditDivCode(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(226,226,231,0.12)]">
                <button
                  type="button"
                  onClick={() => setEditingDivision(null)}
                  className="px-4 py-2 bg-[#161618] text-[rgba(226,226,231,0.6)] hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-bold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rename Sub-Division */}
      {editingSubdivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-terminal">
          <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.2)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(226,226,231,0.12)] pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base font-display uppercase">
                <Edit2 className="w-5 h-5 text-[#00ccff]" />
                <span>Rename Sub-Division Folder</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingSubdivision(null)}
                className="text-[rgba(226,226,231,0.5)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameSubdivisionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">Sub-Division Name:</label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                  autoFocus
                />
                <p className="text-[10px] text-[rgba(226,226,231,0.4)]">
                  Canonical Excel workbook will automatically be updated to: <code>{editSubName.trim().toUpperCase() || 'SUBDIVISION'}.xlsx</code>
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[rgba(226,226,231,0.6)] uppercase tracking-wider text-[10px] font-mono">Sub-Division Code:</label>
                <input
                  type="text"
                  value={editSubCode}
                  onChange={(e) => setEditSubCode(e.target.value)}
                  className="w-full bg-[#111113] border border-[rgba(226,226,231,0.2)] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00ffaa]"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[rgba(226,226,231,0.12)]">
                <button
                  type="button"
                  onClick={() => setEditingSubdivision(null)}
                  className="px-4 py-2 bg-[#161618] text-[rgba(226,226,231,0.6)] hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ffaa] hover:bg-[#00dd95] text-[#111113] font-bold rounded-lg transition"
                >
                  Update Sub-Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
