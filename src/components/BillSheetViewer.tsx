import React, { useState } from 'react';
import { FileText, Printer, Download, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';
import { BillSheetDefinition, BillItem } from '../types/performa';

interface BillSheetViewerProps {
  billData: BillSheetDefinition;
  locationName: string;
  onUpdateBill: (updated: BillSheetDefinition) => void;
}

export function BillSheetViewer({ billData, locationName, onUpdateBill }: BillSheetViewerProps) {
  const [bill, setBill] = useState<BillSheetDefinition>(billData);

  const handleRateChange = (index: number, field: 'rate' | 'labourRate' | 'qty', val: number) => {
    const nextItems = [...bill.items];
    const item = { ...nextItems[index] };
    item[field] = val;
    item.materialAmount = item.qty * item.rate;
    item.labourAmount = item.qty * item.labourRate;
    item.totalAmount = item.materialAmount + item.labourAmount;
    nextItems[index] = item;

    const subTotal = nextItems.reduce((acc, it) => acc + it.totalAmount, 0);
    const taxGst = Math.round(subTotal * 0.18);
    const grandTotal = subTotal + taxGst;

    const updated: BillSheetDefinition = {
      ...bill,
      items: nextItems,
      subTotal,
      taxGst,
      grandTotal
    };

    setBill(updated);
    onUpdateBill(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Sheet 2: Bill
          </span>
          <h2 className="text-lg font-bold text-white mt-1">
            Transformer Maintenance Billing & Estimates ({locationName})
          </h2>
          <p className="text-xs text-slate-400">
            Contractor billing schedule with material, labour rates, GST (18%), and grand totals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Bill</span>
          </button>
        </div>
      </div>

      {/* Bill Document Paper */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200">
        {/* Header */}
        <div className="text-center border-b pb-4 space-y-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            DAKSHIN GUJARAT VIJ COMPANY LIMITED (DGVCL)
          </h3>
          <h1 className="text-xl font-black text-slate-900">
            TRANSFORMER MAINTENANCE BILL / CONTRACTOR CLAIM
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Location: <span className="text-emerald-700 font-bold">{locationName}</span> · Division: VYARA
          </p>
        </div>

        {/* Bill Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b text-xs">
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Bill Number</span>
            <span className="font-mono font-bold text-slate-800">{bill.billNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Date</span>
            <span className="font-bold text-slate-800">{bill.billDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Contractor</span>
            <span className="font-bold text-slate-800 truncate block">{bill.contractorName}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Work Order Ref</span>
            <span className="font-mono font-bold text-slate-800">{bill.workOrderRef}</span>
          </div>
        </div>

        {/* Bill Items Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Description of Item / Work</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Material Rate</th>
                <th className="py-2.5 px-3 text-right">Labour Rate</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bill.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">{item.unit}</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{item.qty}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">₹{item.rate}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">₹{item.labourRate}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                    ₹{item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill Calculations Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-300">
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Certification:</p>
            <p>Certified that the maintenance items billed above were physically installed and verified at {locationName}.</p>
          </div>

          <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sub-Total:</span>
              <span className="font-mono font-bold">₹{bill.subTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%):</span>
              <span className="font-mono font-bold">₹{bill.taxGst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700">₹{bill.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
