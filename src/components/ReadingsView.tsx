import React, { useState } from 'react';
import { 
  Activity, 
  Plus, 
  Search, 
  Download, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle2, 
  Zap, 
  Clock, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { TransformerReading, Location, Transformer } from '../types/inventory';
import * as XLSX from 'xlsx';

interface ReadingsViewProps {
  readings: TransformerReading[];
  locations: Location[];
  transformers: Transformer[];
  onAddReading: (reading: Partial<TransformerReading>) => Promise<void>;
  onExportReadingsExcel: (locationName?: string) => void;
}

export const ReadingsView: React.FC<ReadingsViewProps> = ({
  readings,
  locations,
  transformers,
  onAddReading,
  onExportReadingsExcel,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocFilter, setSelectedLocFilter] = useState<string>('all');

  // Form State for new reading
  const [locId, setLocId] = useState(locations[0]?.id || '');
  const [tcId, setTcId] = useState(transformers[0]?.id || '');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [readingTime, setReadingTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [voltageRN, setVoltageRN] = useState('240');
  const [voltageYN, setVoltageYN] = useState('240');
  const [voltageBN, setVoltageBN] = useState('240');
  const [ampereR, setAmpereR] = useState('');
  const [ampereY, setAmpereY] = useState('');
  const [ampereB, setAmpereB] = useState('');
  const [ampereN, setAmpereN] = useState('');
  const [enteredBy, setEnteredBy] = useState('Rajesh Patel');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const filteredReadings = readings.filter(r => {
    const matchesSearch = 
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transformerSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.enteredBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLoc = selectedLocFilter === 'all' || r.locationId === selectedLocFilter;
    return matchesSearch && matchesLoc;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locId || !readingDate || !ampereR) {
      alert('Please fill location, date, and Ampere readings.');
      return;
    }

    setSubmitting(true);
    try {
      await onAddReading({
        locationId: locId,
        transformerId: tcId || undefined,
        readingDate,
        readingTime,
        voltageRN: Number(voltageRN) || 0,
        voltageYN: Number(voltageYN) || 0,
        voltageBN: Number(voltageBN) || 0,
        ampereR: Number(ampereR) || 0,
        ampereY: Number(ampereY) || 0,
        ampereB: Number(ampereB) || 0,
        ampereN: Number(ampereN) || 0,
        enteredBy,
        remarks
      });

      setSuccessMsg('Volt-Amp reading logged successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setIsAdding(false);
        setAmpereR('');
        setAmpereY('');
        setAmpereB('');
        setAmpereN('');
        setRemarks('');
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportTable = () => {
    const headers = [
      'Sr. no.',
      'Location',
      'Make',
      'TC Serial No.',
      'Capacity',
      'Date',
      'Time',
      'Voltage RN (V)',
      'Voltage YN (V)',
      'Voltage BN (V)',
      'Ampere R (A)',
      'Ampere Y (A)',
      'Ampere B (A)',
      'Ampere N (A)',
      'Entered By',
      'Remarks'
    ];

    const rows = filteredReadings.map((r, i) => [
      i + 1,
      r.locationName,
      r.transformerMake,
      r.transformerSerial,
      r.transformerCapacity,
      r.readingDate,
      r.readingTime || '-',
      r.voltageRN,
      r.voltageYN,
      r.voltageBN,
      r.ampereR,
      r.ampereY,
      r.ampereB,
      r.ampereN,
      r.enteredBy,
      r.remarks || '-'
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Volt_Amp_Readings');
    XLSX.writeFile(wb, 'DOLVAN_Volt_Amp_Readings_Log.xlsx');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn font-terminal">
      
      {/* Banner */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[#111113] border border-[rgba(226,226,231,0.15)] text-[#00ffaa]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-display text-xl uppercase tracking-wide text-white">
                Transformer Volt-Amp Reading Register
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#00ffaa] text-[#00ffaa] bg-[#111113]">
                SHEET 2 REGISTRY
              </span>
            </div>
            <p className="text-xs text-[rgba(226,226,231,0.4)] mt-0.5 font-mono">
              Dedicated operational records for 3-Phase AC Voltage (RN, YN, BN) and Current (R, Y, B, N). Never overwrites past readings.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportTable}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Close Form' : '+ New Reading'}</span>
          </button>
        </div>
      </div>

      {/* Entry Form Modal/Collapsible */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Record New Transformer Electrical Reading</span>
            </div>
            {successMsg && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {successMsg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Location */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Location</label>
              <select
                value={locId}
                onChange={(e) => setLocId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Transformer */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Transformer / TC Point</label>
              <select
                value={tcId}
                onChange={(e) => setTcId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {transformers.map(t => (
                  <option key={t.id} value={t.id}>TC #{t.serialNumber} ({t.make} - {t.capacity})</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Reading Date</label>
                <input
                  type="date"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Time</label>
                <input
                  type="text"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Voltages RN, YN, BN */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-amber-400 font-mono tracking-wide uppercase">
              Phase-to-Neutral AC Voltages (V)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Voltage RN</label>
                <input
                  type="number"
                  step="0.1"
                  value={voltageRN}
                  onChange={(e) => setVoltageRN(e.target.value)}
                  placeholder="240"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Voltage YN</label>
                <input
                  type="number"
                  step="0.1"
                  value={voltageYN}
                  onChange={(e) => setVoltageYN(e.target.value)}
                  placeholder="240"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Voltage BN</label>
                <input
                  type="number"
                  step="0.1"
                  value={voltageBN}
                  onChange={(e) => setVoltageBN(e.target.value)}
                  placeholder="240"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Currents R, Y, B, N */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 font-mono tracking-wide uppercase">
              Phase Currents &amp; Neutral Return (Amperes)
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Ampere R (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampereR}
                  onChange={(e) => setAmpereR(e.target.value)}
                  placeholder="e.g. 40.5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Ampere Y (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampereY}
                  onChange={(e) => setAmpereY(e.target.value)}
                  placeholder="e.g. 35.0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Ampere B (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampereB}
                  onChange={(e) => setAmpereB(e.target.value)}
                  placeholder="e.g. 38.2"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Neutral N (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampereN}
                  onChange={(e) => setAmpereN(e.target.value)}
                  placeholder="e.g. 7.4"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium">Entered By</label>
              <input
                type="text"
                value={enteredBy}
                onChange={(e) => setEnteredBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium">Remarks / Load Analysis</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Normal domestic load, phases balanced"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Volt-Amp Reading'}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white">{filteredReadings.length} Recorded Readings</span>
          <span className="text-slate-600">•</span>
          <select
            value={selectedLocFilter}
            onChange={(e) => setSelectedLocFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none"
          >
            <option value="all">All Locations</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search location, TC, technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Spreadsheet Table strictly matching Sheet 2 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-200 border-b border-slate-800 font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center w-12" rowSpan={2}>#</th>
                <th className="py-2.5 px-3 border-r border-slate-800" rowSpan={2}>Location</th>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center" rowSpan={2}>Make</th>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center" rowSpan={2}>TC Serial</th>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center" rowSpan={2}>Capacity</th>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center" rowSpan={2}>Date / Time</th>
                <th className="py-2 px-3 border-r border-slate-800 text-center bg-amber-950/50 text-amber-300" colSpan={3}>
                  Voltage (V)
                </th>
                <th className="py-2 px-3 border-r border-slate-800 text-center bg-cyan-950/50 text-cyan-300" colSpan={4}>
                  Ampere (A)
                </th>
                <th className="py-2.5 px-3 border-r border-slate-800" rowSpan={2}>Entered By</th>
                <th className="py-2.5 px-3" rowSpan={2}>Remark</th>
              </tr>
              <tr className="bg-slate-950 text-[11px] font-mono border-b border-slate-800">
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-amber-300">RN</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-amber-300">YN</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-amber-300">BN</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-cyan-300">R</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-cyan-300">Y</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-cyan-300">B</th>
                <th className="py-1 px-2.5 border-r border-slate-800 text-center text-cyan-300">N</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-12 text-slate-500 italic">
                    No Volt-Amp readings found. Click "+ New Reading" to enter measurements.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-950/60 transition group font-mono text-xs">
                    <td className="py-2 px-3 text-slate-500 text-center border-r border-slate-800">{idx + 1}</td>
                    <td className="py-2 px-3 text-white font-sans font-medium border-r border-slate-800">{r.locationName}</td>
                    <td className="py-2 px-3 text-slate-400 text-center border-r border-slate-800">{r.transformerMake}</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold text-center border-r border-slate-800">#{r.transformerSerial}</td>
                    <td className="py-2 px-3 text-slate-300 text-center border-r border-slate-800">{r.transformerCapacity}</td>
                    <td className="py-2 px-3 text-slate-400 text-center border-r border-slate-800 text-[11px]">
                      {r.readingDate} <span className="text-slate-500">{r.readingTime}</span>
                    </td>
                    <td className="py-2 px-2.5 text-center text-amber-400 border-r border-slate-800 bg-amber-950/10 font-bold">{r.voltageRN}</td>
                    <td className="py-2 px-2.5 text-center text-amber-400 border-r border-slate-800 bg-amber-950/10 font-bold">{r.voltageYN}</td>
                    <td className="py-2 px-2.5 text-center text-amber-400 border-r border-slate-800 bg-amber-950/10 font-bold">{r.voltageBN}</td>
                    <td className="py-2 px-2.5 text-center text-cyan-300 border-r border-slate-800 bg-cyan-950/10 font-bold">{r.ampereR}</td>
                    <td className="py-2 px-2.5 text-center text-cyan-300 border-r border-slate-800 bg-cyan-950/10 font-bold">{r.ampereY}</td>
                    <td className="py-2 px-2.5 text-center text-cyan-300 border-r border-slate-800 bg-cyan-950/10 font-bold">{r.ampereB}</td>
                    <td className="py-2 px-2.5 text-center text-emerald-400 border-r border-slate-800 bg-emerald-950/10 font-bold">{r.ampereN}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans border-r border-slate-800">{r.enteredBy}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans truncate max-w-xs">{r.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
