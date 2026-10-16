import React, { useState } from 'react';
import { PerformaRecord } from '../types/performa';
import { 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  ArrowLeftRight
} from 'lucide-react';

interface ExcelDataTableProps {
  workbookName: string;
  sheetName: string;
  performas: PerformaRecord[];
  onEditPerforma: (id: string) => void;
  onDeletePerforma: (id: string) => void;
  onAddNewPerforma: () => void;
  onExportExcel: () => void;
}

export const ExcelDataTable: React.FC<ExcelDataTableProps> = ({
  workbookName,
  sheetName,
  performas,
  onEditPerforma,
  onDeletePerforma,
  onAddNewPerforma,
  onExportExcel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('table');

  const filtered = performas.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.transformerMake.toLowerCase().includes(q) ||
      p.transformerSerialNo.toLowerCase().includes(q) ||
      p.date.includes(q)
    );
  });

  const nextSrNo = performas.length + 1;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Excel Sheet: <span className="text-emerald-700">{workbookName}</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Sheet: {sheetName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {performas.length} performa rows saved • Continuous sequential ordering
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <button
            type="button"
            onClick={onAddNewPerforma}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Performa (Sr {nextSrNo})</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .xlsx</span>
          </button>
        </div>
      </div>

      {/* Search, layout toggle and summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records by ID, Location, Serial, Date..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            Total: <strong className="text-slate-800">{performas.length}</strong> • Next:{' '}
            <strong className="text-emerald-700 font-bold">{nextSrNo}</strong>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                viewLayout === 'cards'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                viewLayout === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Mode: Cards View (Touch-optimized) vs Full Table View */}
      {viewLayout === 'cards' ? (
        <div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              No records found. Click "+ Add Performa" to start data entry.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filtered.map((p, index) => {
                const totalActiveItems = p.items.filter(i => Number(i.qty) > 0 || i.materialYes || i.labourYes).length;

                return (
                  <div 
                    key={p.id}
                    className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            #{index + 1}
                          </span>
                          <span className="font-mono font-bold text-sm text-blue-700">
                            {p.id}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {p.date}
                        </span>
                      </div>

                      {/* Location & Details */}
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-start space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-900 line-clamp-1">{p.location || 'Site unassigned'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Make</span>
                            <span className="font-semibold text-slate-800">{p.transformerMake || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Serial</span>
                            <span className="font-semibold text-slate-800">{p.transformerSerialNo || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Capacity</span>
                            <span className="font-semibold text-slate-800">{p.capacity || '0'}</span>
                          </div>
                        </div>

                        {/* Measurements */}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                          <span>V: {p.measurements.voltageRN}/{p.measurements.voltageYN}/{p.measurements.voltageBN}V</span>
                          <span>A: {p.measurements.ampereR}/{p.measurements.ampereY}/{p.measurements.ampereB}A</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        {totalActiveItems} maintenance items
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onEditPerforma(p.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerforma(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Full Data Table View */
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Mobile swipe helper */}
          <div className="flex items-center justify-between text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 border-b border-blue-200 md:hidden">
            <span className="flex items-center gap-1 font-medium">
              <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse text-blue-600" /> 
              Swipe horizontally to see all columns
            </span>
            <span className="font-bold text-slate-600">{filtered.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[780px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">Sr No</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Performa ID</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Date</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Location</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Make</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Serial No</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Capacity</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Voltage (R-Y-B)</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Ampere (R-Y-B-N)</th>
                  <th className="py-2.5 px-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No records yet in this Excel workbook. Click "+ Add Performa" to start data entry.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, index) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200 font-mono bg-slate-50/50">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">
                        {p.id}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-mono">
                        {p.date}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                        {p.location}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {p.transformerMake || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700">
                        {p.transformerSerialNo || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {p.capacity || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {p.measurements.voltageRN}/{p.measurements.voltageYN}/{p.measurements.voltageBN} V
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {p.measurements.ampereR}/{p.measurements.ampereY}/{p.measurements.ampereB}/{p.measurements.ampereN} A
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onEditPerforma(p.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Edit all fields in Performa A4 UI"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePerforma(p.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
