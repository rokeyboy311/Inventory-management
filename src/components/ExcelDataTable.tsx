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
  Filter
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
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-slate-900 text-base">
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

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onAddNewPerforma}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Performa (Sr No. {nextSrNo})</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .xlsx</span>
          </button>
        </div>
      </div>

      {/* Search and summary */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records by ID, Serial, Date..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Last Sr No: <strong className="text-slate-800">{performas.length}</strong> • Next starts at:{' '}
          <strong className="text-emerald-700 font-bold">{nextSrNo}</strong>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full border-collapse text-left text-xs">
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
              filtered.map((p, index) => {
                const totalActiveItems = p.items.filter(i => Number(i.qty) > 0 || i.materialYes || i.labourYes).length;

                return (
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
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                          title="Edit all fields in Performa A4 UI"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerforma(p.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
