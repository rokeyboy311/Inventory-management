import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  RotateCcw, 
  DollarSign, 
  Building2, 
  Calendar, 
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { BillSheetDefinition, BillItem, PerformaRecord } from '../types/performa';
import { createDefaultBillSheet } from '../utils/dolvanTemplate';
import { syncBillFromInventory } from '../utils/billSync';

interface BillSheetViewerProps {
  billData: BillSheetDefinition;
  locationName: string;
  performas?: PerformaRecord[];
  onUpdateBill: (updated: BillSheetDefinition) => void;
  onSwitchToInventory?: () => void;
}

export function BillSheetViewer({ billData, locationName, performas = [], onUpdateBill, onSwitchToInventory }: BillSheetViewerProps) {
  const [bill, setBill] = useState<BillSheetDefinition>(billData);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    setBill(billData);
  }, [billData]);

  // Recalculate bill totals
  const recalculate = (items: BillItem[]): { subTotal: number; taxGst: number; grandTotal: number } => {
    const subTotal = items.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
    const taxGst = Math.round(subTotal * 0.18);
    const grandTotal = subTotal + taxGst;
    return { subTotal, taxGst, grandTotal };
  };

  const handleItemChange = (index: number, field: keyof BillItem, val: any) => {
    const nextItems = [...bill.items];
    const item = { ...nextItems[index] };

    if (field === 'qty' || field === 'rate' || field === 'labourRate') {
      const numVal = Math.max(0, Number(val) || 0);
      (item as any)[field] = numVal;
      item.materialAmount = item.qty * item.rate;
      item.labourAmount = item.qty * item.labourRate;
      item.totalAmount = item.materialAmount + item.labourAmount;
    } else {
      (item as any)[field] = val;
    }

    nextItems[index] = item;
    const totals = recalculate(nextItems);

    const updated: BillSheetDefinition = {
      ...bill,
      items: nextItems,
      ...totals
    };

    setBill(updated);
    onUpdateBill(updated);
  };

  const handleMetadataChange = (field: 'billNumber' | 'billDate' | 'contractorName' | 'workOrderRef', val: string) => {
    const updated: BillSheetDefinition = {
      ...bill,
      [field]: val
    };
    setBill(updated);
    onUpdateBill(updated);
  };

  const handleAddItem = () => {
    const newItem: BillItem = {
      id: `bill-item-${Date.now()}`,
      srNo: bill.items.length + 1,
      description: 'New maintenance material or service item',
      unit: 'NOS',
      qty: 1,
      rate: 100,
      labourRate: 50,
      materialAmount: 100,
      labourAmount: 50,
      totalAmount: 150,
      remarks: ''
    };

    const nextItems = [...bill.items, newItem];
    const totals = recalculate(nextItems);

    const updated: BillSheetDefinition = {
      ...bill,
      items: nextItems,
      ...totals
    };

    setBill(updated);
    onUpdateBill(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (bill.items.length <= 1) {
      alert('The bill must retain at least one line item.');
      return;
    }
    const nextItems = bill.items.filter((_, idx) => idx !== index);
    const totals = recalculate(nextItems);

    const updated: BillSheetDefinition = {
      ...bill,
      items: nextItems,
      ...totals
    };

    setBill(updated);
    onUpdateBill(updated);
  };

  const handleSyncFromInventory = () => {
    const synced = syncBillFromInventory(performas, locationName, bill);
    setBill(synced);
    onUpdateBill(synced);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all bill items and rates to default DGVCL standard template?')) {
      const standard = createDefaultBillSheet(locationName);
      setBill(standard);
      onUpdateBill(standard);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Sheet 2: Bill
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            Transformer Maintenance Billing & Estimates ({locationName})
          </h2>
          <p className="text-xs text-slate-400">
            Live editable contractor billing schedule. Automatically calculated from Inventory Sheet materials.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSwitchToInventory && (
            <button
              type="button"
              onClick={onSwitchToInventory}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Return to Sheet 1: inventory to enter maintenance records"
            >
              <span>← Enter Records (Sheet 1)</span>
            </button>
          )}

          {performas.length > 0 && (
            <button
              type="button"
              onClick={handleSyncFromInventory}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Aggregate and refresh materials directly from inventory performas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync from Inventory</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Item</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to DGVCL standard rates"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Bill</span>
          </button>
        </div>
      </div>

      {/* Sync Status Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            <strong>Dual-Sheet Live Workflow:</strong> Materials consumed in <strong className="text-emerald-400">{locationName}</strong> Inventory ({performas.length} Performa{performas.length === 1 ? '' : 's'}) are automatically aggregated in this Bill Sheet.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showSavedToast && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Synced!
            </span>
          )}
          <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
            {bill.items.length} Bill Items • ₹{bill.grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bill Document Paper */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-200 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="text-center border-b pb-4 space-y-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            DAKSHIN GUJARAT VIJ COMPANY LIMITED (DGVCL)
          </h3>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">
            TRANSFORMER MAINTENANCE BILL / CONTRACTOR CLAIM
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Location: <span className="text-emerald-700 font-bold">{locationName}</span> · Division: VYARA
          </p>
        </div>

        {/* Bill Metadata Grid (Editable) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b text-xs">
          <div>
            <label className="text-slate-400 block uppercase font-bold text-[10px] mb-1">Bill Number</label>
            <input
              type="text"
              value={bill.billNumber}
              onChange={(e) => handleMetadataChange('billNumber', e.target.value)}
              className="w-full font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block uppercase font-bold text-[10px] mb-1">Date</label>
            <input
              type="text"
              value={bill.billDate}
              onChange={(e) => handleMetadataChange('billDate', e.target.value)}
              className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block uppercase font-bold text-[10px] mb-1">Contractor Name</label>
            <input
              type="text"
              value={bill.contractorName}
              onChange={(e) => handleMetadataChange('contractorName', e.target.value)}
              className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block uppercase font-bold text-[10px] mb-1">Work Order Ref</label>
            <input
              type="text"
              value={bill.workOrderRef}
              onChange={(e) => handleMetadataChange('workOrderRef', e.target.value)}
              className="w-full font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {/* Bill Items Table */}
        <div className="overflow-x-auto my-5">
          <table className="w-full text-left border-collapse text-xs min-w-[680px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Description of Item / Work</th>
                <th className="py-2.5 px-2 text-center w-20">Unit</th>
                <th className="py-2.5 px-2 text-center w-20">Qty</th>
                <th className="py-2.5 px-2 text-right w-24">Material (₹)</th>
                <th className="py-2.5 px-2 text-right w-24">Labour (₹)</th>
                <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                <th className="py-2.5 px-2 text-center w-12 print:hidden">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bill.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-2.5 text-center font-bold text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1.5 py-1 text-xs text-slate-800 font-medium outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-16 text-center font-mono bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1 py-1 text-xs text-slate-600 outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded px-1 py-1 text-xs text-slate-900 outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-20 text-right font-mono bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded px-1 py-1 text-xs text-slate-700 outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      value={item.labourRate}
                      onChange={(e) => handleItemChange(idx, 'labourRate', e.target.value)}
                      className="w-20 text-right font-mono bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded px-1 py-1 text-xs text-slate-700 outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                    ₹{item.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill Calculations Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-300">
          <div className="text-xs text-slate-500 space-y-1.5 max-w-md">
            <p className="font-semibold text-slate-700">Certification & Verification:</p>
            <p>
              Certified that the maintenance items billed above were physically installed and verified at{' '}
              <strong className="text-slate-700">{locationName}</strong> according to DGVCL specifications.
            </p>
          </div>

          <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sub-Total (Materials + Labour):</span>
              <span className="font-mono font-bold text-slate-800">₹{bill.subTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18% on total):</span>
              <span className="font-mono font-bold text-slate-800">₹{bill.taxGst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Grand Total Claim:</span>
              <span className="font-mono text-emerald-700">₹{bill.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
