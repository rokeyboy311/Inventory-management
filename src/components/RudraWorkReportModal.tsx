import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Zap, 
  ShieldCheck, 
  Edit3,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InventorySubmission, TransformerReportMeta, RUDRA_ELECTRICAL_18_ITEMS, InventoryItemValue } from '../types/inventory';
import * as XLSX from 'xlsx';

interface RudraWorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: InventorySubmission | null;
  onEdit?: (submission: InventorySubmission) => void;
  onSaveUpdatedSubmission?: (submission: InventorySubmission) => Promise<void>;
}

export const RudraWorkReportModal: React.FC<RudraWorkReportModalProps> = ({
  isOpen,
  onClose,
  submission,
  onEdit,
  onSaveUpdatedSubmission,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Editable sample details state
  const [meta, setMeta] = useState<TransformerReportMeta>({});
  const [itemsMap, setItemsMap] = useState<Map<string, InventoryItemValue>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sync state when submission opens
  useEffect(() => {
    if (submission) {
      const initialMeta: TransformerReportMeta = {
        companyName: submission.reportMeta?.companyName || 'RUDRA ELECTRICAL',
        reportTitle: submission.reportMeta?.reportTitle || 'Work Report of Transformer Maintenance Work',
        workName: submission.reportMeta?.workName || 'Transformer Maintenance & Overhauling Work',
        division: submission.reportMeta?.division || 'O&M Division / Sub-Division',
        workOrderNo: submission.reportMeta?.workOrderNo || 'W.O./TRANS/2026/089',
        workOrderDate: submission.reportMeta?.workOrderDate || new Date(submission.timestamp).toLocaleDateString(),
        reportNo: submission.reportMeta?.reportNo || submission.id,
        reportDate: submission.reportMeta?.reportDate || new Date(submission.timestamp).toLocaleDateString(),
        transformerRating: submission.reportMeta?.transformerRating || '100 KVA',
        transformerMake: submission.reportMeta?.transformerMake || 'Voltamp Transformers',
        transformerSerialNo: submission.reportMeta?.transformerSerialNo || 'TR-78420-GUJ',
        voltageRatio: submission.reportMeta?.voltageRatio || '11 / 0.433 kV',
        contractorRep: submission.reportMeta?.contractorRep || submission.submittedBy || 'Authorized Contractor Representative',
        discomRep: submission.reportMeta?.discomRep || 'DISCOM / PGVCL Engineer (DE / JE)'
      };
      setMeta(initialMeta);
      setItemsMap(new Map(submission.items.map(it => [it.itemId, { ...it }])));
      setSaveSuccessMsg('');
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const handleMetaFieldChange = (field: keyof TransformerReportMeta, val: string) => {
    setMeta(prev => ({ ...prev, [field]: val }));
  };

  const handleItemQtyChange = (itemId: string, val: string | number) => {
    setItemsMap(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing) {
        next.set(itemId, { ...existing, value: val });
      } else {
        const itemDef = RUDRA_ELECTRICAL_18_ITEMS.find(i => i.id === itemId);
        if (itemDef) {
          next.set(itemId, {
            itemId: itemDef.id,
            itemName: itemDef.name,
            fieldType: itemDef.fieldType,
            value: val,
            selectedType: itemDef.options?.[0] || null,
            unit: itemDef.unit
          });
        }
      }
      return next;
    });
  };

  const handleItemOptionChange = (itemId: string, selectedType: string) => {
    setItemsMap(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing) {
        next.set(itemId, { ...existing, selectedType });
      }
      return next;
    });
  };

  const handleSaveToRecord = async () => {
    if (!onSaveUpdatedSubmission || !submission) return;
    setIsSaving(true);
    try {
      const updatedSubmission: InventorySubmission = {
        ...submission,
        reportMeta: meta,
        items: Array.from(itemsMap.values())
      };
      await onSaveUpdatedSubmission(updatedSubmission);
      setIsSaving(false);
      setSaveSuccessMsg('File and record updated successfully! ✓');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      setIsEditing(false);
    } catch {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const reportHeaders = [
      [meta.companyName || 'RUDRA ELECTRICAL'],
      [meta.reportTitle || 'Work Report of Transformer Maintenance Work'],
      [''],
      ['Work Name:', meta.workName || '', '', 'Division:', meta.division || ''],
      ['W.O. No:', meta.workOrderNo || '', '', 'W.O. Date:', meta.workOrderDate || ''],
      ['Performa / Report No:', meta.reportNo || '', '', 'Report Date:', meta.reportDate || ''],
      ['Transformer Capacity:', meta.transformerRating || '', '', 'Make:', meta.transformerMake || ''],
      ['Serial No:', meta.transformerSerialNo || '', '', 'Voltage Ratio:', meta.voltageRatio || ''],
      ['Site Location:', submission.location, '', 'Location Type:', submission.locationType],
      [''],
      ['Sr. No.', 'Description of Work / Material', 'Category', 'Unit', 'Qty / Value', 'Specification / Option Selected', 'Remarks']
    ];

    const itemRows = RUDRA_ELECTRICAL_18_ITEMS.map((itemDef, idx) => {
      const val = itemsMap.get(itemDef.id);
      return [
        idx + 1,
        itemDef.name,
        itemDef.category || '',
        itemDef.unit || '',
        val ? val.value : (itemDef.defaultValue || '-'),
        val ? (val.selectedType || '-') : '-',
        submission.notes || 'Inspected & OK'
      ];
    });

    const footerRows = [
      [''],
      ['Contractor Representative (Rudra Electrical):', meta.contractorRep || '', '', 'DISCOM Engineer Representative:', meta.discomRep || ''],
      ['Signature & Stamp:', '__________________________', '', 'Signature & Stamp:', '__________________________']
    ];

    const allAoa = [...reportHeaders, ...itemRows, ...footerRows];
    const ws = XLSX.utils.aoa_to_sheet(allAoa);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Title 2
    ];

    ws['!cols'] = [
      { wch: 8 },
      { wch: 44 },
      { wch: 22 },
      { wch: 10 },
      { wch: 16 },
      { wch: 38 },
      { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Work_Report');
    XLSX.writeFile(wb, `Rudra_Transformer_Report_${submission.id}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Top Header Controls (Hidden during print) */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>RUDRA ELECTRICAL • Work Report Firmo</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  18 Items Reference PDF Firmo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Location: <strong className="text-slate-200">{submission.location}</strong> ({submission.locationType}) • Entry ID: {submission.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isEditing 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Edit transformer specifications and report fields"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditing ? 'Close Edit Panel' : '✏️ Edit Report Details'}</span>
            </button>

            {onSaveUpdatedSubmission && (
              <button
                type="button"
                onClick={handleSaveToRecord}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                title="Save updated details into this file record"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save to File'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              title="Print official work report with exact letterhead and signatures"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
              title="Download Excel sheet with 18 items"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 flex items-center space-x-2 text-xs text-emerald-300 font-semibold print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Editable Sample Details Panel (Shows when isEditing is true) */}
        {isEditing && (
          <div className="bg-slate-950 border-b border-amber-500/30 p-5 space-y-4 print:hidden animate-fadeIn text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <FileText className="w-4 h-4" />
                <span>Sample Details Editor (Specifications & Work Info)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Changes made here will immediately update on the work report below
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Company / Firm Name:</label>
                <input
                  type="text"
                  value={meta.companyName || ''}
                  onChange={(e) => handleMetaFieldChange('companyName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Work Description:</label>
                <input
                  type="text"
                  value={meta.workName || ''}
                  onChange={(e) => handleMetaFieldChange('workName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Division / Sub-Division:</label>
                <input
                  type="text"
                  value={meta.division || ''}
                  onChange={(e) => handleMetaFieldChange('division', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">W.O. Number:</label>
                <input
                  type="text"
                  value={meta.workOrderNo || ''}
                  onChange={(e) => handleMetaFieldChange('workOrderNo', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">W.O. Date:</label>
                <input
                  type="text"
                  value={meta.workOrderDate || ''}
                  onChange={(e) => handleMetaFieldChange('workOrderDate', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transformer Capacity (KVA):</label>
                <select
                  value={meta.transformerRating || '100 KVA'}
                  onChange={(e) => handleMetaFieldChange('transformerRating', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold cursor-pointer"
                >
                  <option value="10 KVA">10 KVA</option>
                  <option value="16 KVA">16 KVA</option>
                  <option value="25 KVA">25 KVA</option>
                  <option value="63 KVA">63 KVA</option>
                  <option value="100 KVA">100 KVA</option>
                  <option value="160 KVA">160 KVA</option>
                  <option value="200 KVA">200 KVA</option>
                  <option value="250 KVA">250 KVA</option>
                  <option value="315 KVA">315 KVA</option>
                  <option value="500 KVA">500 KVA</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Make / Manufacturer:</label>
                <input
                  type="text"
                  value={meta.transformerMake || ''}
                  onChange={(e) => handleMetaFieldChange('transformerMake', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Serial Number (Sr. No.):</label>
                <input
                  type="text"
                  value={meta.transformerSerialNo || ''}
                  onChange={(e) => handleMetaFieldChange('transformerSerialNo', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Voltage Ratio:</label>
                <input
                  type="text"
                  value={meta.voltageRatio || '11 / 0.433 kV'}
                  onChange={(e) => handleMetaFieldChange('voltageRatio', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Performa / Report No:</label>
                <input
                  type="text"
                  value={meta.reportNo || ''}
                  onChange={(e) => handleMetaFieldChange('reportNo', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Contractor Representative:</label>
                <input
                  type="text"
                  value={meta.contractorRep || ''}
                  onChange={(e) => handleMetaFieldChange('contractorRep', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">DISCOM Engineer Representative:</label>
                <input
                  type="text"
                  value={meta.discomRep || ''}
                  onChange={(e) => handleMetaFieldChange('discomRep', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Official Document Body */}
        <div 
          ref={printRef}
          className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 font-sans print:p-2 print:overflow-visible print:bg-white"
        >
          {/* Document Header Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-slate-900">
              {meta.companyName || 'RUDRA ELECTRICAL'}
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-slate-700 tracking-wide mt-1 uppercase">
              {meta.reportTitle || 'Work Report of Transformer Maintenance Work'}
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              (ELECTRICAL CONTRACTORS, TRANSFORMER REPAIRS &amp; MAINTENANCE ENGINEERS)
            </p>
          </div>

          {/* Work Report Metadata Details Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-50">
              
              {/* Left Column */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Work Name:</span>
                  <span className="font-semibold text-slate-900">{meta.workName || 'Transformer Maintenance Work'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Division / Sub-Division:</span>
                  <span className="font-semibold text-slate-900">{meta.division || 'O&M Division'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">W.O. Number:</span>
                  <span className="font-mono font-bold text-slate-900">{meta.workOrderNo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">W.O. Date:</span>
                  <span className="font-semibold text-slate-900">{meta.workOrderDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Site Location:</span>
                  <span className="font-semibold text-slate-900">{submission.location}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Performa / Report No:</span>
                  <span className="font-mono font-bold text-slate-900">{meta.reportNo || submission.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Report Date:</span>
                  <span className="font-semibold text-slate-900">{meta.reportDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Transformer Capacity:</span>
                  <span className="font-bold text-emerald-800">{meta.transformerRating || '100 KVA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Make &amp; Serial No:</span>
                  <span className="font-semibold text-slate-900">{meta.transformerMake || '-'} (Sr: {meta.transformerSerialNo || '-'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Voltage Ratio / Type:</span>
                  <span className="font-semibold text-slate-900">{meta.voltageRatio || '11 / 0.433 kV'} • {submission.locationType}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 18 Specific Items Performa Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3 border-r border-slate-400 w-12 text-center">Sr</th>
                  <th className="py-2.5 px-3 border-r border-slate-400">Description of Work / Material</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-28">Category</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-16 text-center">Unit</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-24 text-center">Qty Used</th>
                  <th className="py-2.5 px-3 border-r border-slate-400">Specification / Selected Option</th>
                  <th className="py-2.5 px-3 w-36">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {RUDRA_ELECTRICAL_18_ITEMS.map((itemDef, idx) => {
                  const val = itemsMap.get(itemDef.id);
                  const isFilled = val && (val.value !== '' || val.selectedType);
                  const displayValue = val && val.value !== '' ? val.value : (itemDef.defaultValue || '-');
                  const displayOption = val?.selectedType || (val?.optionValues ? Object.entries(val.optionValues).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') : '-');

                  return (
                    <tr key={itemDef.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900">
                        {itemDef.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-600 text-[11px]">
                        {itemDef.category || 'General'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-medium text-slate-700">
                        {itemDef.unit || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-900 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={val?.value !== undefined ? String(val.value) : ''}
                            onChange={(e) => handleItemQtyChange(itemDef.id, e.target.value)}
                            placeholder="Qty"
                            className="w-16 bg-slate-100 border border-slate-400 rounded px-1.5 py-0.5 text-center font-bold text-xs"
                          />
                        ) : (
                          displayValue
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-800">
                        {isEditing && itemDef.options && itemDef.options.length > 0 ? (
                          <select
                            value={val?.selectedType || itemDef.options[0]}
                            onChange={(e) => handleItemOptionChange(itemDef.id, e.target.value)}
                            className="bg-slate-100 border border-slate-400 rounded px-1.5 py-0.5 text-xs max-w-[200px]"
                          >
                            {itemDef.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${isFilled ? 'bg-slate-100 font-medium' : 'text-slate-400'}`}>
                            {displayOption}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {submission.notes ? submission.notes.slice(0, 40) : 'Inspected & OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* General Notes & Observations */}
          {submission.notes && (
            <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 text-xs">
              <span className="font-bold text-slate-800">Site Observations &amp; Remarks: </span>
              <span className="text-slate-700">{submission.notes}</span>
            </div>
          )}

          {/* Official Signatures & Verification Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
            <div className="border-t-2 border-slate-800 pt-2 text-center space-y-1">
              <p className="font-bold uppercase text-slate-900">
                For, {meta.companyName || 'RUDRA ELECTRICAL'}
              </p>
              <p className="text-slate-600 font-medium">
                {meta.contractorRep || 'Authorized Contractor Representative'}
              </p>
              <p className="text-[10px] text-slate-500 italic mt-3">
                Authorized Signatory &amp; Contractor Stamp
              </p>
            </div>

            <div className="border-t-2 border-slate-800 pt-2 text-center space-y-1">
              <p className="font-bold uppercase text-slate-900">
                DISCOM / PGVCL / UGVCL Representative
              </p>
              <p className="text-slate-600 font-medium">
                {meta.discomRep || 'Deputy Engineer / Junior Engineer'}
              </p>
              <p className="text-[10px] text-slate-500 italic mt-3">
                Deputy Engineer / Junior Engineer (Signature &amp; Stamp)
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Format matches reference PDF "Work Report of Transformer Maintenance Work"</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};
