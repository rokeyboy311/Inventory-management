import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  FileText, 
  Printer, 
  Download, 
  Building2, 
  CheckCircle2, 
  Calculator,
  Search
} from 'lucide-react';
import { BillRecord, BillItem } from '../types/inventory';
import * as XLSX from 'xlsx';

interface BillingViewProps {
  bills: BillRecord[];
  onAddBill: (bill: Partial<BillRecord>) => Promise<void>;
}

export const BillingView: React.FC<BillingViewProps> = ({
  bills,
  onAddBill,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(bills[0] || null);

  // New Bill Form State
  const [billNumber, setBillNumber] = useState(`BILL/DLV/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [contractorName, setContractorName] = useState('M/s Patel Electrical Works & Services');
  const [contractorGstin, setContractorGstin] = useState('24AAACP1234F1Z8');
  const [remarks, setRemarks] = useState('Monthly Dolvan Maintenance Work');
  const [items, setItems] = useState<{ description: string; quantity: number; unit: string; unitRate: number }[]>([
    { description: 'Replacement of Bushing goti (HT & LT)', quantity: 8, unit: 'Nos.', unitRate: 450 },
    { description: 'Providing LT side AL. Patta 100 KVA', quantity: 4, unit: 'Nos.', unitRate: 850 },
    { description: 'Check and Tight Earth Connection', quantity: 2, unit: 'Job', unitRate: 350 },
    { description: 'Replacement of LT damaged cable 70 sq mm', quantity: 30, unit: 'Meter', unitRate: 120 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'Nos.', unitRate: 100 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitRate)), 0);
  const cgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
  const sgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
  const totalGst = cgstAmount + sgstAmount;
  const netAmount = Math.round(subtotal + totalGst);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber || !contractorName || items.length === 0) return;

    await onAddBill({
      billNumber,
      date: billDate,
      contractorName,
      contractorGstin,
      items: items.map((it, i) => ({
        id: `bi-${i + 1}`,
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitRate: Number(it.unitRate),
        amount: Number(it.quantity) * Number(it.unitRate)
      })),
      remarks,
      cgstRate: 9,
      sgstRate: 9
    });

    setIsAdding(false);
  };

  const exportBillExcel = (bill: BillRecord) => {
    const headers = ['Sr No', 'Work / Item Description', 'Quantity', 'Unit', 'Rate (₹)', 'Amount (₹)'];
    const rows = bill.items.map((it, i) => [
      i + 1,
      it.description,
      it.quantity,
      it.unit,
      it.unitRate,
      it.amount
    ]);

    rows.push(['', '', '', '', 'Subtotal:', bill.subtotal]);
    rows.push(['', '', '', '', `CGST (${bill.cgstRate}%):`, bill.cgstAmount]);
    rows.push(['', '', '', '', `SGST (${bill.sgstRate}%):`, bill.sgstAmount]);
    rows.push(['', '', '', '', 'Total GST:', bill.totalGst]);
    rows.push(['', '', '', '', 'Net Payable Amount:', bill.netAmount]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Maintenance_Bill');
    XLSX.writeFile(wb, `${bill.billNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn font-terminal">
      
      {/* Banner */}
      <div className="bg-[#1c1c1f] border border-[rgba(226,226,231,0.12)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[#111113] border border-[rgba(226,226,231,0.15)] text-[#00ffaa]">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-display text-xl uppercase tracking-wide text-white">
                Contractor Maintenance Bill Form &amp; GST Calculation
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[#00ffaa] text-[#00ffaa] bg-[#111113]">
                BILL &amp; GST REGISTRY
              </span>
            </div>
            <p className="text-xs text-[rgba(226,226,231,0.4)] mt-0.5 font-mono">
              Reference billing module for contractor maintenance items, Schedule Rates, CGST (9%), SGST (9%), and total bill certification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : '+ Create Work Bill'}</span>
        </button>
      </div>

      {/* Bill Creation Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Generate Contractor Maintenance Bill</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium">Bill Number</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono mt-1"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium">Bill Date</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium">Contractor / Agency</label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium">Contractor GSTIN</label>
              <input
                type="text"
                value={contractorGstin}
                onChange={(e) => setContractorGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono mt-1"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Work &amp; Material Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center text-xs">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Item description..."
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Rate ₹"
                      value={it.unitRate}
                      onChange={(e) => handleItemChange(idx, 'unitRate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                      required
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Subtotal:</span>
              <div className="text-base font-bold text-white font-mono">₹{subtotal.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-slate-400">CGST (9%) + SGST (9%):</span>
              <div className="text-base font-bold text-amber-400 font-mono">₹{totalGst.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-slate-400">Net Bill Amount:</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">₹{netAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold cursor-pointer transition shadow-lg shadow-amber-950/40"
              >
                Save &amp; Finalize Bill
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bills Directory & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Bills List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white">Maintenance Bills ({bills.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">DOLVAN SUB-DIV</span>
          </div>

          <div className="space-y-2">
            {bills.map(b => (
              <div
                key={b.id}
                onClick={() => setSelectedBill(b)}
                className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                  selectedBill?.id === b.id
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{b.billNumber}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-semibold">
                    {b.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">{b.contractorName}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                  <span className="text-slate-500 font-mono text-[10px]">{b.date}</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{b.netAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bill Details Document Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {selectedBill ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedBill.billNumber}</h3>
                  <p className="text-xs text-slate-400">Date: {selectedBill.date} • Division: VYARA / DOLVAN</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => exportBillExcel(selectedBill)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Print Bill Form"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contractor Information */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contractor / Agency:</span>
                  <span className="text-white font-bold">{selectedBill.contractorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">GSTIN:</span>
                  <span className="text-amber-400 font-mono font-semibold">{selectedBill.contractorGstin || 'Unregistered'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                  {selectedBill.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{it.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-300">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{it.unit}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">₹{it.unitRate.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">₹{it.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* GST Calculation Breakup */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 ml-auto max-w-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold">₹{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CGST @ {selectedBill.cgstRate}%:</span>
                  <span className="font-mono">₹{selectedBill.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SGST @ {selectedBill.sgstRate}%:</span>
                  <span className="font-mono">₹{selectedBill.sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-semibold pt-1 border-t border-slate-800">
                  <span>Total GST:</span>
                  <span className="font-mono">₹{selectedBill.totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-bold pt-1.5 border-t border-slate-700">
                  <span>Net Certified Bill:</span>
                  <span className="font-mono">₹{selectedBill.netAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs italic">
              Select a bill from the left or click "+ Create Work Bill".
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
