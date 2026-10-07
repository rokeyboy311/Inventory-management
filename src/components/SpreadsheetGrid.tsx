import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  FunctionSquare, 
  HelpCircle,
  Copy,
  PlusCircle,
  FilePlus,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { SheetData } from '../types/sync';
import { indexToColumnLetter, getCellAddress, evaluateFormula } from '../utils/excelParser';

interface SpreadsheetGridProps {
  sheets: SheetData[];
  activeSheetIndex: number;
  onSelectSheet: (index: number) => void;
  onAddSheet: (name: string) => void;
  onRenameSheet: (index: number, newName: string) => void;
  onDeleteSheet: (index: number) => void;
  onCellChange: (sheetIndex: number, rowIndex: number, colIndex: number, value: string | number) => void;
  onAddRow: (sheetIndex: number) => void;
  onDeleteRow: (sheetIndex: number, rowIndex: number) => void;
  onAddColumn: (sheetIndex: number, colName: string) => void;
  onDeleteColumn: (sheetIndex: number, colIndex: number) => void;
  onRenameColumn: (sheetIndex: number, colIndex: number, newName: string) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheets,
  activeSheetIndex,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onRenameColumn,
}) => {
  const currentSheet = sheets[activeSheetIndex] || { name: 'Sheet1', columns: ['Col A'], rows: [['']] };

  // Selected cell coordinates
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellInputVal, setCellInputVal] = useState<string>('');
  const [formulaBarVal, setFormulaBarVal] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ colIndex: number; direction: 'asc' | 'desc' } | null>(null);

  // New sheet / Rename state
  const [isAddingSheet, setIsAddingSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [editingSheetIdx, setEditingSheetIdx] = useState<number | null>(null);
  const [sheetNameDraft, setSheetNameDraft] = useState('');

  // Column renaming state
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const [colNameDraft, setColNameDraft] = useState('');

  // Formula helper tooltip
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Sync formula bar value with selected cell
  useEffect(() => {
    if (selectedCell) {
      const rowVal = currentSheet.rows[selectedCell.row]?.[selectedCell.col];
      const rawStr = rowVal !== undefined && rowVal !== null ? String(rowVal) : '';
      setFormulaBarVal(rawStr);
      setCellInputVal(rawStr);
    }
  }, [selectedCell, currentSheet]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
    }
  }, [editingCell]);

  // Save current cell edit
  const commitCellEdit = () => {
    if (selectedCell) {
      let finalVal: string | number = cellInputVal;
      // Auto parse numeric if not formula and valid number
      if (!cellInputVal.startsWith('=') && cellInputVal.trim() !== '' && !isNaN(Number(cellInputVal))) {
        finalVal = Number(cellInputVal);
      }
      onCellChange(activeSheetIndex, selectedCell.row, selectedCell.col, finalVal);
    }
    setEditingCell(null);
  };

  const handleFormulaBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulaBarVal(e.target.value);
    setCellInputVal(e.target.value);
  };

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitCellEdit();
    }
  };

  // Keyboard navigation across grid
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return;
    if (!selectedCell) return;

    const maxRow = currentSheet.rows.length - 1;
    const maxCol = currentSheet.columns.length - 1;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, row: Math.max(0, prev.row - 1) } : null);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, row: Math.min(maxRow, prev.row + 1) } : null);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, col: Math.max(0, prev.col - 1) } : null);
        break;
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, col: Math.min(maxCol, prev.col + 1) } : null);
        break;
      case 'Enter':
        e.preventDefault();
        setEditingCell(selectedCell);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onCellChange(activeSheetIndex, selectedCell.row, selectedCell.col, '');
        break;
      default:
        // Direct typing into selected cell starts editing
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditingCell(selectedCell);
          setCellInputVal(e.key);
          setFormulaBarVal(e.key);
        }
    }
  };

  // Filtered and Sorted Rows
  const getProcessedRows = () => {
    let rowsWithIndex = currentSheet.rows.map((row, originalIndex) => ({ row, originalIndex }));

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rowsWithIndex = rowsWithIndex.filter(({ row }) => 
        row.some(cell => String(cell).toLowerCase().includes(q))
      );
    }

    // Apply Sorting
    if (sortConfig) {
      rowsWithIndex.sort((a, b) => {
        const valA = a.row[sortConfig.colIndex] ?? '';
        const valB = b.row[sortConfig.colIndex] ?? '';

        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (sortConfig.direction === 'asc') {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      });
    }

    return rowsWithIndex;
  };

  const processedRows = getProcessedRows();

  const handleSortColumn = (colIdx: number) => {
    if (sortConfig && sortConfig.colIndex === colIdx) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ colIndex: colIdx, direction: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ colIndex: colIdx, direction: 'asc' });
    }
  };

  return (
    <div 
      className="flex flex-col flex-1 bg-slate-950 text-slate-100 overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={gridContainerRef}
    >
      {/* Formula & Toolbar Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Left: Cell Address + Formula Input */}
        <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
          {/* Cell Address Badge */}
          <div className="w-16 h-8 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-emerald-400 flex items-center justify-center text-xs shadow-inner">
            {selectedCell ? getCellAddress(selectedCell.col, selectedCell.row) : '--'}
          </div>

          <div className="text-slate-500 font-serif italic text-sm">fx</div>

          {/* Formula / Value Input Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={formulaBarVal}
              onChange={handleFormulaBarChange}
              onKeyDown={handleFormulaBarKeyDown}
              onBlur={commitCellEdit}
              placeholder="Enter value or formula: =SUM(D2:D8), =AVERAGE(D2:D8), =D2*1.1"
              className="w-full h-8 bg-slate-950 border border-slate-700 rounded px-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {formulaBarVal.startsWith('=') && (
              <div className="absolute right-2 top-1.5 text-[11px] font-mono text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Result: {evaluateFormula(formulaBarVal, currentSheet)}
              </div>
            )}
          </div>

          {/* Formula Help Toggle */}
          <button
            onClick={() => setShowFormulaHelp(!showFormulaHelp)}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Excel Formula Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Search Filter + Grid Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table rows..."
              className="h-8 pl-8 pr-3 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add Row Button */}
          <button
            onClick={() => onAddRow(activeSheetIndex)}
            className="flex items-center space-x-1 h-8 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Insert new row"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Add Row</span>
          </button>

          {/* Add Column Button */}
          <button
            onClick={() => {
              const defaultColName = `Column ${indexToColumnLetter(currentSheet.columns.length)}`;
              const colName = prompt('Enter new column name:', defaultColName);
              if (colName && colName.trim()) {
                onAddColumn(activeSheetIndex, colName.trim());
              }
            }}
            className="flex items-center space-x-1 h-8 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Insert new column"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Add Col</span>
          </button>
        </div>
      </div>

      {/* Formula Cheat-sheet Dropdown */}
      {showFormulaHelp && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-300 flex flex-wrap gap-4 items-center">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <FunctionSquare className="w-3.5 h-3.5" /> Supported Formulas:
          </span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=SUM(D2:D8)</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=AVERAGE(D2:D8)</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=MAX(D2:D8)</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=MIN(D2:D8)</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=COUNT(A2:A8)</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">=D2 * 1.18</span>
        </div>
      )}

      {/* Interactive Spreadsheet Grid Viewport */}
      <div className="flex-1 overflow-auto bg-slate-950 relative">
        <table className="w-full border-collapse text-left border-spacing-0">
          
          {/* Table Header (Excel Columns A, B, C & Named Headers) */}
          <thead className="sticky top-0 z-20 bg-slate-900 shadow-sm">
            {/* Alpha row: A, B, C... */}
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] font-mono">
              <th className="w-12 px-2 py-1 text-center bg-slate-900 border-r border-slate-800 sticky left-0 z-25">
                #
              </th>
              {currentSheet.columns.map((colName, colIdx) => (
                <th 
                  key={colIdx} 
                  className="px-3 py-1 font-semibold border-r border-slate-800 text-center tracking-wider min-w-[140px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-[10px]">{indexToColumnLetter(colIdx)}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSortColumn(colIdx)}
                        className="text-slate-400 hover:text-emerald-400 p-0.5 rounded"
                        title="Sort Column"
                      >
                        <ArrowUpDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="w-16 px-2 py-1 text-center bg-slate-900">Action</th>
            </tr>

            {/* Custom Column Titles Row */}
            <tr className="border-b border-slate-800 bg-slate-850 text-slate-200 text-xs font-medium">
              <th className="w-12 px-2 py-2 text-center bg-slate-900 border-r border-slate-800 sticky left-0 z-25 text-slate-400 text-[11px]">
                Row 1
              </th>
              {currentSheet.columns.map((colName, colIdx) => (
                <th 
                  key={colIdx} 
                  className="px-3 py-2 border-r border-slate-800 group relative min-w-[140px] hover:bg-slate-800/80 transition"
                >
                  {editingColIdx === colIdx ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={colNameDraft}
                        onChange={(e) => setColNameDraft(e.target.value)}
                        className="bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white w-full font-normal focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (colNameDraft.trim()) {
                            onRenameColumn(activeSheetIndex, colIdx, colNameDraft.trim());
                          }
                          setEditingColIdx(null);
                        }}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingColIdx(null)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span 
                        onDoubleClick={() => {
                          setEditingColIdx(colIdx);
                          setColNameDraft(colName);
                        }}
                        className="truncate cursor-pointer hover:text-emerald-300 font-semibold"
                        title="Double click to rename column"
                      >
                        {colName}
                      </span>
                      <div className="hidden group-hover:flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingColIdx(colIdx);
                            setColNameDraft(colName);
                          }}
                          className="text-slate-400 hover:text-emerald-400 p-0.5"
                          title="Rename column"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        {currentSheet.columns.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete column "${colName}"?`)) {
                                onDeleteColumn(activeSheetIndex, colIdx);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-400 p-0.5"
                            title="Delete column"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="w-16 px-2 py-2 text-center bg-slate-900 text-[11px] text-slate-400">
                Manage
              </th>
            </tr>
          </thead>

          {/* Table Body (Data Rows) */}
          <tbody className="divide-y divide-slate-800/80 font-sans text-xs">
            {processedRows.length === 0 ? (
              <tr>
                <td 
                  colSpan={currentSheet.columns.length + 2} 
                  className="px-6 py-12 text-center text-slate-400 italic"
                >
                  {searchQuery ? 'No matching rows found for query' : 'This sheet has no data rows. Click "Add Row" above.'}
                </td>
              </tr>
            ) : (
              processedRows.map(({ row, originalIndex }) => {
                const excelRowNum = originalIndex + 2; // Excel row numbering
                return (
                  <tr 
                    key={originalIndex} 
                    className="hover:bg-slate-900/60 transition group"
                  >
                    {/* Row Number Column */}
                    <td className="w-12 px-2 py-2 text-center bg-slate-900/95 font-mono text-[11px] text-slate-400 border-r border-slate-800 sticky left-0 z-10 group-hover:text-emerald-400 select-none">
                      {excelRowNum}
                    </td>

                    {/* Data Cells */}
                    {currentSheet.columns.map((_, colIdx) => {
                      const isSelected = selectedCell?.row === originalIndex && selectedCell?.col === colIdx;
                      const isEditing = editingCell?.row === originalIndex && editingCell?.col === colIdx;
                      const rawValue = row[colIdx];
                      
                      // If raw value is a formula (e.g. =SUM), calculate preview
                      const isFormula = typeof rawValue === 'string' && rawValue.startsWith('=');
                      const displayValue = isFormula ? evaluateFormula(rawValue, currentSheet) : rawValue;

                      const isNumber = typeof displayValue === 'number' || (!isNaN(Number(displayValue)) && displayValue !== '' && displayValue !== null && typeof displayValue !== 'boolean');

                      return (
                        <td
                          key={colIdx}
                          onClick={() => {
                            setSelectedCell({ row: originalIndex, col: colIdx });
                            if (isEditing) commitCellEdit();
                          }}
                          onDoubleClick={() => {
                            setSelectedCell({ row: originalIndex, col: colIdx });
                            setEditingCell({ row: originalIndex, col: colIdx });
                            setCellInputVal(rawValue !== undefined && rawValue !== null ? String(rawValue) : '');
                          }}
                          className={`px-3 py-1.5 border-r border-slate-800/80 relative transition cursor-cell min-w-[140px] max-w-[280px] truncate ${
                            isSelected 
                              ? 'bg-emerald-950/40 ring-2 ring-emerald-500 ring-inset z-10 text-white font-medium' 
                              : 'text-slate-200'
                          } ${isNumber ? 'text-right font-mono' : 'text-left'}`}
                        >
                          {isEditing ? (
                            <input
                              ref={cellInputRef}
                              type="text"
                              value={cellInputVal}
                              onChange={(e) => {
                                setCellInputVal(e.target.value);
                                setFormulaBarVal(e.target.value);
                              }}
                              onBlur={commitCellEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitCellEdit();
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="w-full bg-slate-900 border border-emerald-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span 
                              className={`block truncate ${isFormula ? 'text-emerald-300 font-semibold' : ''}`}
                              title={String(rawValue ?? '')}
                            >
                              {displayValue !== null && displayValue !== undefined ? String(displayValue) : ''}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Delete Action */}
                    <td className="w-16 px-2 py-1.5 text-center">
                      <button
                        onClick={() => onDeleteRow(activeSheetIndex, originalIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs Bar (Bottom Navigation) */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between overflow-x-auto select-none">
        
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          {sheets.map((sheet, idx) => {
            const isActive = idx === activeSheetIndex;
            return (
              <div
                key={idx}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap border ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
                onClick={() => onSelectSheet(idx)}
              >
                {editingSheetIdx === idx ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={sheetNameDraft}
                      onChange={(e) => setSheetNameDraft(e.target.value)}
                      className="bg-slate-900 border border-emerald-400 text-white text-xs px-1.5 py-0.5 rounded w-24"
                      autoFocus
                    />
                    <button 
                      onClick={() => {
                        if (sheetNameDraft.trim()) {
                          onRenameSheet(idx, sheetNameDraft.trim());
                        }
                        setEditingSheetIdx(null);
                      }}
                      className="text-white hover:text-emerald-200"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setEditingSheetIdx(null)}
                      className="text-slate-300 hover:text-rose-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingSheetIdx(idx);
                        setSheetNameDraft(sheet.name);
                      }}
                      title="Double click to rename sheet"
                    >
                      {sheet.name}
                    </span>
                    <span className="text-[10px] opacity-75">({sheet.rows.length})</span>
                    {sheets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete sheet "${sheet.name}"?`)) {
                            onDeleteSheet(idx);
                          }
                        }}
                        className="hover:text-rose-200 ml-1 p-0.5 rounded"
                        title="Delete Sheet"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Add Sheet Input or Button */}
          {isAddingSheet ? (
            <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              <input
                type="text"
                placeholder="Sheet name..."
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSheetName.trim()) {
                    onAddSheet(newSheetName.trim());
                    setNewSheetName('');
                    setIsAddingSheet(false);
                  } else if (e.key === 'Escape') {
                    setIsAddingSheet(false);
                  }
                }}
                className="bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white w-28 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  if (newSheetName.trim()) {
                    onAddSheet(newSheetName.trim());
                    setNewSheetName('');
                    setIsAddingSheet(false);
                  }
                }}
                className="text-emerald-400 hover:text-emerald-300 p-0.5"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAddingSheet(false)}
                className="text-slate-400 hover:text-rose-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAddingSheet(true);
                setNewSheetName(`Sheet${sheets.length + 1}`);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer"
              title="Add New Sheet"
            >
              <FilePlus className="w-3 h-3 text-emerald-400" />
              <span>+ Sheet</span>
            </button>
          )}
        </div>

        {/* Right Status */}
        <div className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-2">
          <span>Formula calculation: <strong>Active</strong></span>
          <span>•</span>
          <span>Double-click any cell to edit</span>
        </div>

      </div>
    </div>
  );
};
