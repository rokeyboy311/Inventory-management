import React from 'react';
import { PerformaRecord, MaintenanceItemRow } from '../types/performa';
import { Check, X, Calendar, MapPin, Hash, Zap, AlertCircle, Save, PlusCircle, Trash2, ArrowLeft, ArrowLeftRight } from 'lucide-react';

interface A4PerformaDocumentProps {
  performa: PerformaRecord;
  onChange: (updated: PerformaRecord) => void;
  onSaveAndAddAnother: () => void;
  onSaveAndClose: () => void;
  onDelete?: () => void;
  isExisting: boolean;
  duplicateError?: string | null;
  onClearDuplicateError?: () => void;
  viewMode: 'edit' | 'preview' | 'print';
}

export const A4PerformaDocument: React.FC<A4PerformaDocumentProps> = ({
  performa,
  onChange,
  onSaveAndAddAnother,
  onSaveAndClose,
  onDelete,
  isExisting,
  duplicateError,
  onClearDuplicateError,
  viewMode
}) => {
  const isReadOnly = viewMode === 'preview' || viewMode === 'print';

  // Update top header fields
  const handleHeaderChange = (field: keyof PerformaRecord, value: any) => {
    if (isReadOnly) return;
    if (field === 'id' && onClearDuplicateError) {
      onClearDuplicateError();
    }
    onChange({
      ...performa,
      [field]: value
    });
  };

  // Update measurement fields
  const handleMeasurementChange = (field: keyof PerformaRecord['measurements'], value: string) => {
    if (isReadOnly) return;
    onChange({
      ...performa,
      measurements: {
        ...performa.measurements,
        [field]: value
      }
    });
  };

  // Update item row fields
  const handleItemFieldChange = (index: number, field: keyof MaintenanceItemRow, value: any) => {
    if (isReadOnly) return;
    const nextItems = [...performa.items];
    nextItems[index] = {
      ...nextItems[index],
      [field]: value
    };
    onChange({
      ...performa,
      items: nextItems
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Duplicate ID Warning Notification */}
      {duplicateError && (
        <div className="w-full max-w-[850px] mb-4 bg-amber-50 border-2 border-amber-500 rounded-xl p-4 shadow-md flex items-center justify-between text-amber-900 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-base">Performa ID already exists</div>
              <div className="text-sm text-amber-800">
                A record with ID <span className="font-mono font-bold bg-amber-200 px-1.5 py-0.5 rounded">{performa.id}</span> already exists in this sheet. Please change the ID or cancel.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearDuplicateError}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
          >
            Change ID
          </button>
        </div>
      )}

      {/* A4 Document Container */}
      <div 
        id="printable-a4-document"
        className="w-full max-w-[850px] bg-white text-slate-900 border sm:border-2 border-slate-700 shadow-md sm:shadow-2xl rounded-xl sm:rounded-sm p-3.5 sm:p-6 md:p-8 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full transition-all"
      >
        {/* Document Header Title */}
        <div className="text-center pb-3 sm:pb-4 border-b-2 border-slate-800 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-serif uppercase text-slate-900 leading-tight">
            Transformer Maintenance / Repair Performa
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2 text-[11px] sm:text-xs text-slate-600 uppercase tracking-wider font-mono">
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              Performa ID: <strong className="font-bold">{performa.id}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Standard Format A4</span>
            <span className="hidden sm:inline">•</span>
            <span className={`px-2 py-0.5 rounded border font-semibold ${
              isExisting ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isExisting ? 'Existing Record' : 'New Performa'}
            </span>
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="border border-slate-700 rounded-sm mb-4 text-xs sm:text-sm bg-slate-50/50">
          {/* Row 1: Location & Date */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-700">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Location of Transformer
            </div>
            <div className="md:col-span-4 p-1.5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.location}
                onChange={(e) => handleHeaderChange('location', e.target.value)}
                placeholder="Enter Transformer Site Location (Substation / DP / Feeder)"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-800 font-medium"
              />
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-700">
              <span>DATE</span>
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="date"
                disabled={isReadOnly}
                value={performa.date}
                onChange={(e) => handleHeaderChange('date', e.target.value)}
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Transformer Make & Serial No */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-700">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Transformer Make
            </div>
            <div className="md:col-span-4 p-1.5 flex items-center border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.transformerMake}
                onChange={(e) => handleHeaderChange('transformerMake', e.target.value)}
                placeholder="e.g. W&P / NIK-SAN / ABB"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-800 font-medium"
              />
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Transformer serial no.
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.transformerSerialNo}
                onChange={(e) => handleHeaderChange('transformerSerialNo', e.target.value)}
                placeholder="e.g. IT 1434"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-800 font-mono font-medium"
              />
            </div>
          </div>

          {/* Row 3: Capacity & Performa ID */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-3 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              CAPACITY
            </div>
            <div className="md:col-span-4 p-1.5 flex items-center border-b md:border-b-0 md:border-r border-slate-700 bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.capacity}
                onChange={(e) => handleHeaderChange('capacity', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 bg-transparent border border-slate-300 rounded focus:border-blue-600 focus:bg-blue-50/30 outline-none text-slate-800 font-medium"
              />
            </div>
            <div className="md:col-span-2 p-2 font-semibold bg-slate-100 flex items-center border-b md:border-b-0 md:border-r border-slate-700">
              Performa ID
            </div>
            <div className="md:col-span-3 p-1.5 flex items-center bg-white">
              <input
                type="text"
                disabled={isReadOnly}
                value={performa.id}
                onChange={(e) => handleHeaderChange('id', e.target.value)}
                placeholder="e.g. AHM-001"
                className={`w-full px-2 py-1.5 bg-transparent border rounded font-mono font-bold text-blue-700 outline-none ${
                  duplicateError ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-600 focus:bg-blue-50/30'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Items Table (Rows 1 to 18) */}
        <div className="border border-slate-700 rounded-sm mb-4 overflow-hidden">
          {/* Mobile swipe helper */}
          <div className="flex items-center justify-between text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 border-b border-blue-200 md:hidden">
            <span className="flex items-center gap-1 font-medium">
              <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse text-blue-600" /> 
              Swipe horizontally to view all columns
            </span>
            <span className="font-bold text-slate-600">{performa.items.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px] sm:text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-700 text-slate-800 font-bold uppercase tracking-wider text-center">
                  <th className="py-2 px-1.5 border-r border-slate-700 w-10">Sr No</th>
                  <th className="py-2 px-3 border-r border-slate-700 text-left">Description</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-14">Unit</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-28">Material Yes/No</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-28">Labour Yes/No</th>
                  <th className="py-2 px-2 border-r border-slate-700 w-14">QTY</th>
                  <th className="py-2 px-2 w-28">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
              {performa.items.map((item, index) => {
                const prevItem = index > 0 ? performa.items[index - 1] : null;
                const isFirstOfGroup = !prevItem || prevItem.srNo !== item.srNo;
                const groupCount = performa.items.filter(i => i.srNo === item.srNo).length;

                return (
                  <tr 
                    key={item.id || index}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    {/* Sr No (Grouped vertically) */}
                    {isFirstOfGroup ? (
                      <td 
                        rowSpan={groupCount}
                        className="py-1 px-1.5 text-center font-bold text-slate-800 border-r border-slate-700 bg-slate-50 align-middle"
                      >
                        {item.srNo}
                      </td>
                    ) : null}

                    {/* Description */}
                    <td className="py-1.5 px-3 border-r border-slate-700 text-slate-800 font-medium">
                      {item.description}
                    </td>

                    {/* Unit */}
                    <td className="py-1 px-2 border-r border-slate-700 text-center font-mono text-slate-600 bg-slate-50/50">
                      {item.unit}
                    </td>

                    {/* Material Yes/No */}
                    <td className="py-1 px-2 border-r border-slate-700 text-center">
                      <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 shadow-2xs">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleItemFieldChange(index, 'materialYes', true)}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                            item.materialYes
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                          title="Select Material Yes"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleItemFieldChange(index, 'materialYes', false)}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                            !item.materialYes
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                          title="Select Material No (Default)"
                        >
                          No
                        </button>
                      </div>
                    </td>

                    {/* Labour Yes/No */}
                    <td className="py-1 px-2 border-r border-slate-700 text-center">
                      <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 shadow-2xs">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleItemFieldChange(index, 'labourYes', true)}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                            item.labourYes
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                          title="Select Labour Yes"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleItemFieldChange(index, 'labourYes', false)}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                            !item.labourYes
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                          title="Select Labour No (Default)"
                        >
                          No
                        </button>
                      </div>
                    </td>

                    {/* QTY */}
                    <td className="py-1 px-1.5 border-r border-slate-700 text-center">
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={item.qty}
                        onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value === '' ? 0 : e.target.value)}
                        className="w-full text-center px-1 py-0.5 border border-slate-300 rounded font-mono text-slate-800 font-bold focus:border-blue-600 focus:bg-blue-50 outline-none"
                      />
                    </td>

                    {/* Remarks */}
                    <td className="py-1 px-1.5">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.remarks}
                        onChange={(e) => handleItemFieldChange(index, 'remarks', e.target.value)}
                        placeholder="Remarks"
                        className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-slate-700 placeholder-slate-400 text-xs focus:border-blue-600 focus:bg-blue-50 outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        {/* Rows 19 & 20: Voltage and Ampere Measurements Grid */}
        <div className="border border-slate-700 rounded-sm mb-6 text-xs sm:text-sm overflow-hidden">
          {/* Row 19: Voltage */}
          <div className="flex flex-col sm:grid sm:grid-cols-12 border-b border-slate-700 bg-white items-stretch sm:items-center">
            <div className="flex items-center sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-700 bg-slate-100 font-semibold text-slate-800">
              <span className="w-8 sm:w-10 py-2 px-1 font-bold text-center border-r border-slate-700 bg-slate-200/80">19</span>
              <span className="px-2.5 py-1.5 font-bold">Voltage (Volts)</span>
            </div>
            <div className="sm:col-span-8 grid grid-cols-3 divide-x divide-slate-700 text-center">
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">R-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.voltageRN}
                  onChange={(e) => handleMeasurementChange('voltageRN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Y-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.voltageYN}
                  onChange={(e) => handleMeasurementChange('voltageYN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">B-N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.voltageBN}
                  onChange={(e) => handleMeasurementChange('voltageBN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 20: Ampere */}
          <div className="flex flex-col sm:grid sm:grid-cols-12 bg-white items-stretch sm:items-center">
            <div className="flex items-center sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-700 bg-slate-100 font-semibold text-slate-800">
              <span className="w-8 sm:w-10 py-2 px-1 font-bold text-center border-r border-slate-700 bg-slate-200/80">20</span>
              <span className="px-2.5 py-1.5 font-bold">Ampere (Amps)</span>
            </div>
            <div className="sm:col-span-8 grid grid-cols-4 divide-x divide-slate-700 text-center">
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">R</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.ampereR}
                  onChange={(e) => handleMeasurementChange('ampereR', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Y</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.ampereY}
                  onChange={(e) => handleMeasurementChange('ampereY', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">B</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.ampereB}
                  onChange={(e) => handleMeasurementChange('ampereB', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
              <div className="p-1.5 sm:p-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">N</span>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={performa.measurements.ampereN}
                  onChange={(e) => handleMeasurementChange('ampereN', e.target.value)}
                  placeholder="0"
                  className="w-full text-center px-1 py-1 sm:py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-blue-600 focus:bg-blue-50 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performa Footer / Signature Section for Official Printouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 mt-4 border-t border-slate-400 text-xs text-slate-600">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-slate-800">Field Engineer / Technician Signature:</span>
              <span className="font-serif italic font-bold text-blue-900 text-sm">Dk</span>
            </div>
            <div className="border-b border-dashed border-slate-400 h-6"></div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-semibold text-slate-800 mb-1">Authorized Discom Officer Signature</div>
            <div className="border-b border-dashed border-slate-400 h-6"></div>
          </div>
        </div>
      </div>

      {/* Action Controls directly below the A4 sheet (Hidden during print) */}
      {!isReadOnly && (
        <div className="w-full max-w-[850px] mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-lg print:hidden mb-16 sm:mb-0">
          <div className="flex items-center justify-between sm:justify-start space-x-3">
            {onDelete && isExisting && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Performa</span>
              </button>
            )}
            <span className="text-xs text-slate-500 font-mono">
              Auto-saves continuous sequence
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onSaveAndClose}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-all hover:shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Close</span>
            </button>

            <button
              type="button"
              onClick={onSaveAndAddAnother}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save & Add Another</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar for field technicians (Hidden on desktop & print) */}
      {!isReadOnly && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-300 p-2.5 shadow-2xl flex items-center justify-between gap-2 sm:hidden print:hidden">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[10px] text-slate-500 font-mono">Performa ID</span>
            <span className="text-xs font-bold font-mono text-blue-700 truncate">{performa.id}</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {onDelete && isExisting && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}

            <button
              type="button"
              onClick={onSaveAndClose}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={onSaveAndAddAnother}
              className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Save & Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
