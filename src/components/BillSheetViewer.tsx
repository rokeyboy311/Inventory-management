import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  RotateCcw, 
  CheckCircle2,
  RefreshCw,
  Target,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { BillSheetDefinition, BillItem, PerformaRecord } from '../types/performa';
import { 
  calculateDgvclBillFromInventory,
  saveTenderTargetForLocation,
  saveTenderPercentForLocation
} from '../utils/dgvclBillEngine';
import { exportDualSheetLocationExcel } from '../utils/dolvanTemplate';

interface BillSheetViewerProps {
  billData: BillSheetDefinition;
  locationName: string;
  locationId?: string;
  performas?: PerformaRecord[];
  onUpdateBill: (updated: BillSheetDefinition) => void;
  onSwitchToInventory?: () => void;
  onExportExcel?: () => void;
}

export function BillSheetViewer({ 
  billData, 
  locationName, 
  locationId,
  performas = [], 
  onUpdateBill, 
  onSwitchToInventory,
  onExportExcel 
}: BillSheetViewerProps) {
  // Target Budget State (Default ₹20,00,000 / 20 Lakhs)
  const [tenderTarget, setTenderTarget] = useState<number>(billData.tenderTargetAmount ?? 2000000);
  // Tender percentage above/below (Default 20%)
  const [tenderPercent, setTenderPercent] = useState<number>(billData.tenderPercentage ?? 20);
  // Active Tab: 'page1' | 'page2' | 'all'
  const [activeTab, setActiveTab] = useState<'page1' | 'page2' | 'all'>('all');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [customRates, setCustomRates] = useState<Record<string, number>>(
    () => billData.customRates || {}
  );
  const [quantityOverrides, setQuantityOverrides] = useState<Record<string, number>>(
    () => billData.quantityOverrides || {}
  );

  // Compute live authentic DGVCL bill based on performas, tender target, and custom rates
  const calcResult = useMemo(() => {
    return calculateDgvclBillFromInventory(performas, locationName, {
      tenderTargetAmount: tenderTarget,
      tenderPercentage: tenderPercent,
      billNumber: billData.billNumber,
      billDate: billData.billDate,
      contractorName: billData.contractorName,
      workOrderRef: billData.workOrderRef,
      customRates,
      quantityOverrides
    });
  }, [performas, locationName, tenderTarget, tenderPercent, billData, customRates, quantityOverrides]);

  const bill = calcResult.billData;

  const handleTenderTargetChange = (val: number) => {
    const num = Math.max(0, val);
    setTenderTarget(num);
    if (locationId) saveTenderTargetForLocation(locationId, num);
    const updated = { ...bill, tenderTargetAmount: num };
    onUpdateBill(updated);
  };

  const handleTenderPercentChange = (val: number) => {
    const num = Math.max(0, val);
    setTenderPercent(num);
    if (locationId) saveTenderPercentForLocation(locationId, num);
    const updated = { ...bill, tenderPercentage: num };
    onUpdateBill(updated);
  };

  const handleRateChange = (itemId: string, newRate: number) => {
    const nextRates = { ...customRates, [itemId]: Math.max(0, newRate) };
    setCustomRates(nextRates);
    const updatedCalc = calculateDgvclBillFromInventory(performas, locationName, {
      tenderTargetAmount: tenderTarget,
      tenderPercentage: tenderPercent,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      contractorName: bill.contractorName,
      workOrderRef: bill.workOrderRef,
      customRates: nextRates,
      quantityOverrides
    });
    onUpdateBill(updatedCalc.billData);
  };

  const handleQuantityChange = (itemId: string, rawQuantity: string) => {
    const nextOverrides = { ...quantityOverrides };
    const quantity = Number(rawQuantity);
    if (rawQuantity.trim() && Number.isFinite(quantity)) {
      nextOverrides[itemId] = Math.max(0, quantity);
    } else {
      delete nextOverrides[itemId];
    }
    setQuantityOverrides(nextOverrides);
    const updatedCalc = calculateDgvclBillFromInventory(performas, locationName, {
      tenderTargetAmount: tenderTarget,
      tenderPercentage: tenderPercent,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      contractorName: bill.contractorName,
      workOrderRef: bill.workOrderRef,
      customRates,
      quantityOverrides: nextOverrides
    });
    onUpdateBill(updatedCalc.billData);
  };

  const handleSyncFromInventory = () => {
    const updatedCalc = calculateDgvclBillFromInventory(performas, locationName, {
      tenderTargetAmount: tenderTarget,
      tenderPercentage: tenderPercent,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      contractorName: bill.contractorName,
      workOrderRef: bill.workOrderRef,
      customRates,
      quantityOverrides
    });
    onUpdateBill(updatedCalc.billData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all SOR rates and tender parameters to standard DGVCL defaults?')) {
      setCustomRates({});
      setTenderPercent(20);
      setTenderTarget(2000000);
      const defaultCalc = calculateDgvclBillFromInventory(performas, locationName, {
        tenderTargetAmount: 2000000,
        tenderPercentage: 20,
        quantityOverrides
      });
      onUpdateBill(defaultCalc.billData);
    }
  };

  const handleExport = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      exportDualSheetLocationExcel({
        locationId: locationId || 'default',
        locationName,
        workbookName: `${locationName}.xlsx`,
        activeSheetName: 'bill',
        sheets: {
          'inventory': {
            name: 'inventory',
            type: 'inventory',
            performas,
            isCompatible: true
          },
          'bill': {
            name: 'bill',
            type: 'bill',
            performas: [],
            isCompatible: true,
            billData: bill
          }
        },
        tenderTargetAmount: tenderTarget,
        tenderPercentage: tenderPercent,
        lastModified: new Date().toISOString()
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isTargetAchieved = calcResult.tenderTargetAchieved;
  const progressPercent = calcResult.progressPercent;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6 animate-in fade-in duration-200">
      
      {/* ------------------------------------------------------------- */}
      {/* TENDER GOAL TRACKER & BUDGET MATCHING CONTROLLER (CORE REQUIREMENT) */}
      {/* ------------------------------------------------------------- */}
      <div className={`rounded-2xl border p-4 sm:p-6 shadow-xl transition-all ${
        isTargetAchieved 
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-emerald-500/50' 
          : 'bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-slate-700/80'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
              isTargetAchieved ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-blue-600 shadow-blue-500/30'
            }`}>
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tender Budget Target Tracker
                </span>
                {isTargetAchieved ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Target Reached • Ready to Submit
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> In Progress ({progressPercent}%)
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                DISCOM SOR Claim: <span className="font-mono text-emerald-400">₹{calcResult.grandTotal.toLocaleString()}</span>
                <span className="text-sm font-normal text-slate-400 ml-2">
                  / Target ₹{tenderTarget.toLocaleString()}
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchToInventory && (
              <button
                type="button"
                onClick={onSwitchToInventory}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Return to Sheet 1: inventory to enter more performas"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Enter Records (Sheet 1)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncFromInventory}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Recalculate rates & materials from inventory performas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync from Inventory</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isTargetAchieved 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20'
              }`}
              title="Exports the exact 3-sheet DISCOM workbook (inventory, GST BILL, GST BILL 2)"
            >
              <Download className="w-4 h-4" />
              <span>Export Official Excel (3 Sheets)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              Target Completion: <strong className={isTargetAchieved ? 'text-emerald-400' : 'text-blue-400'}>{progressPercent}%</strong>
            </span>
            <span className="font-mono text-xs text-slate-300">
              {isTargetAchieved ? (
                <span className="text-emerald-400 font-bold">
                  ₹{Math.abs(calcResult.varianceAmount).toLocaleString()} above target (Ready to submit)
                </span>
              ) : (
                <span className="text-amber-400 font-bold">
                  ₹{Math.abs(calcResult.varianceAmount).toLocaleString()} remaining to reach target
                </span>
              )}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetAchieved 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/50'
              }`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Goal Setting Controls & Quick Budget Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <label className="text-slate-400 block font-bold text-[11px] mb-1">
              Set Tender Target Budget (₹)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="50000"
                value={tenderTarget}
                onChange={(e) => handleTenderTargetChange(parseFloat(e.target.value) || 0)}
                className="w-full font-mono font-bold text-white bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500"
              />
              <div className="flex gap-1 shrink-0">
                {[1500000, 2000000, 2500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTenderTargetChange(preset)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      tenderTarget === preset 
                        ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ₹{preset / 100000}L
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block font-bold text-[11px] mb-1">
              Above Tender Premium (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tenderPercent}
                onChange={(e) => handleTenderPercentChange(parseFloat(e.target.value) || 0)}
                className="w-24 font-mono font-bold text-white bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400">
                Standard DGVCL ARC Rate is <strong>20% Above</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to official DGVCL standard rates"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Target Reached Status Alert Banner */}
        {isTargetAchieved && (
          <div className="mt-4 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <span>
                <strong>Tender Budget Goal Reached!</strong> Grand Total of <strong>₹{calcResult.grandTotal.toLocaleString()}</strong> meets your Tender Amount of <strong>₹{tenderTarget.toLocaleString()}</strong>.
                You can now stop entering data and export the official 3-sheet Excel package for submission!
              </span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow"
            >
              Download Excel Now
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SHEET NAVIGATION & METADATA BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Complete Bill (Page 1 + Page 2)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('page1')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'page1'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GST BILL (Page 1) • ₹{calcResult.page1Total.toLocaleString()}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('page2')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'page2'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GST BILL 2 (Page 2) • ₹{calcResult.grandTotal.toLocaleString()}
          </button>
        </div>

        {/* Sync Toast */}
        {showSavedToast && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-4 h-4" /> All inventory quantities & totals updated!
          </span>
        )}

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Inventory Records: <strong className="text-white">{performas.length}</strong></span>
          <span>•</span>
          <span>Location: <strong className="text-emerald-400">{locationName}</strong></span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PAGE 1: GST BILL (TABLE VIEW) */}
      {/* ------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'page1') && (
        <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
          <div className="border-b pb-3 mb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                Sheet 2: GST BILL (Page 1)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                DGVCL Transformer Maintenance Schedule of Rates Claim
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Page 1 Sub-Total:</span>
              <div className="text-base font-extrabold text-blue-800 font-mono">
                ₹{calcResult.page1Total.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px] border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">Sr No.</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-slate-300">Unit</th>
                  <th className="py-2 px-2 text-center w-20 border-r border-slate-300">Since Prev</th>
                  <th className="py-2 px-2 text-center w-20 border-r border-slate-300 bg-amber-50/70 text-amber-950 font-extrabold">Qty Executed</th>
                  <th className="py-2 px-3 min-w-[260px] border-r border-slate-300">Items of work or supplies</th>
                  <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Rate (₹)</th>
                  <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Prev Amt</th>
                  <th className="py-2 px-3 text-right w-28 border-r border-slate-300 bg-emerald-50/70 text-emerald-950 font-extrabold">This Bill Total</th>
                  <th className="py-2 px-2 text-center w-24">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calcResult.page1Items.map((item, idx) => {
                  const isHeader = item.remarks === 'Category Header';
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isHeader ? 'bg-slate-100/90 font-bold text-slate-800' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-center font-bold font-mono border-r border-slate-300 text-slate-600">
                        {isHeader ? '' : item.id.replace('dgvcl-item-', '').replace(/_/g, '.').split('-')[0]}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-300 text-slate-400">
                        -
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-amber-50/40 text-slate-900">
                        {isHeader ? '' : (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.qty}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            aria-label={`Quantity for ${item.description}`}
                            className="w-16 rounded border border-transparent bg-amber-50/40 px-1 py-0.5 text-center font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                          />
                        )}
                      </td>
                      <td className={`py-1.5 px-3 border-r border-slate-300 ${isHeader ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
                        {item.description}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono border-r border-slate-300">
                        {isHeader ? '' : (
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono font-bold bg-slate-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right border-r border-slate-300 text-slate-400">
                        -
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-300 bg-emerald-50/40 text-emerald-800">
                        {isHeader || item.totalAmount === 0 ? '' : `₹${item.totalAmount.toLocaleString()}`}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] text-slate-500">
                        {idx === 0 ? 'Full Rate recommended' : ''}
                      </td>
                    </tr>
                  );
                })}

                {/* Row 50: TOTAL OF PAGE */}
                <tr className="bg-slate-200/90 font-extrabold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={7} className="py-2.5 px-4 text-center tracking-wide border-r border-slate-300">
                    TOTAL OF PAGE (Sheet 2: Page 1)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-blue-900 border-r border-slate-300 text-sm">
                    ₹{calcResult.page1Total.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PAGE 2: GST BILL 2 (TABLE VIEW WITH RECAP & SIGNATURES) */}
      {/* ------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'page2') && (
        <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
          <div className="border-b pb-3 mb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                Sheet 3: GST BILL 2 (Page 2)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                DGVCL Summary, Above {tenderPercent}% Tender Premium, GST 18% &amp; Final Claim
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Grand Total Claim:</span>
              <div className="text-base font-black text-emerald-800 font-mono">
                ₹{calcResult.grandTotal.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px] border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">Sr No.</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-slate-300">Unit</th>
                  <th className="py-2 px-2 text-center w-20 border-r border-slate-300">Since Prev</th>
                  <th className="py-2 px-2 text-center w-20 border-r border-slate-300 bg-amber-50/70 text-amber-950 font-extrabold">Qty Executed</th>
                  <th className="py-2 px-3 min-w-[260px] border-r border-slate-300">Items of work or supplies</th>
                  <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Rate (₹)</th>
                  <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Prev Amt</th>
                  <th className="py-2 px-3 text-right w-28 border-r border-slate-300 bg-emerald-50/70 text-emerald-950 font-extrabold">This Bill Total</th>
                  <th className="py-2 px-2 text-center w-24">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Row 9: FIRST PAGE TOTAL CARRY FORWARD */}
                <tr className="bg-blue-50/80 font-bold text-blue-900 border-b border-slate-300">
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-300"></td>
                  <td className="py-2 px-2 text-center border-r border-slate-300"></td>
                  <td className="py-2 px-2 text-center border-r border-slate-300"></td>
                  <td className="py-2 px-2 text-center border-r border-slate-300"></td>
                  <td className="py-2 px-3 font-extrabold border-r border-slate-300">FIRST PAGE TOTAL (Carried Forward)</td>
                  <td className="py-2 px-2 text-right border-r border-slate-300"></td>
                  <td className="py-2 px-2 text-right border-r border-slate-300"></td>
                  <td className="py-2 px-3 text-right font-mono font-extrabold border-r border-slate-300 text-blue-900">
                    ₹{calcResult.page1Total.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-center text-[10px] text-slate-500">Full Rate recommended</td>
                </tr>

                {/* Page 2 Items */}
                {calcResult.page2Items.map((item) => {
                  const isHeader = item.remarks === 'Category Header';
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isHeader ? 'bg-slate-100/90 font-bold text-slate-800' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-center font-bold font-mono border-r border-slate-300 text-slate-600">
                        {isHeader ? '' : item.id.replace('dgvcl-item-', '').replace(/_/g, '.').split('-')[0]}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-300 text-slate-400">
                        -
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold border-r border-slate-300 bg-amber-50/40 text-slate-900">
                        {isHeader ? '' : (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.qty}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            aria-label={`Quantity for ${item.description}`}
                            className="w-16 rounded border border-transparent bg-amber-50/40 px-1 py-0.5 text-center font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                          />
                        )}
                      </td>
                      <td className={`py-1.5 px-3 border-r border-slate-300 ${isHeader ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
                        {item.description}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono border-r border-slate-300">
                        {isHeader ? '' : (
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono font-bold bg-slate-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right border-r border-slate-300 text-slate-400">
                        -
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-300 bg-emerald-50/40 text-emerald-800">
                        {isHeader || item.totalAmount === 0 ? '' : `₹${item.totalAmount.toLocaleString()}`}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] text-slate-400"></td>
                    </tr>
                  );
                })}

                {/* Total value of work done (A) */}
                <tr className="bg-slate-100 font-extrabold text-slate-800 border-t border-slate-300">
                  <td colSpan={7} className="py-2 px-3 text-right border-r border-slate-300">
                    Total value of work done or supplies made to date (A)….→
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                    ₹{calcResult.workDoneTotalA.toLocaleString()}
                  </td>
                  <td className="py-2 px-2"></td>
                </tr>

                {/* Above 20% Tender Premium */}
                <tr className="bg-slate-50 font-bold text-slate-700">
                  <td colSpan={7} className="py-2 px-3 text-right border-r border-slate-300">
                    Above {tenderPercent}% Tender Premium:
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-300">
                    ₹{calcResult.aboveTenderAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2"></td>
                </tr>

                {/* Net Total */}
                <tr className="bg-slate-100 font-extrabold text-slate-900">
                  <td colSpan={7} className="py-2 px-3 text-right border-r border-slate-300">
                    Net Total (A + Premium):
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900 border-r border-slate-300">
                    ₹{calcResult.netTotal.toLocaleString()}
                  </td>
                  <td className="py-2 px-2"></td>
                </tr>

                {/* GST Extra (18%) */}
                <tr className="bg-slate-50 font-bold text-slate-700">
                  <td colSpan={7} className="py-2 px-3 text-right border-r border-slate-300">
                    GST Extra (18%):
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-300">
                    ₹{calcResult.taxGst.toLocaleString()}
                  </td>
                  <td className="py-2 px-2"></td>
                </tr>

                {/* Grand Total */}
                <tr className="bg-emerald-50 border-t-2 border-emerald-500 font-black text-emerald-950 text-sm">
                  <td colSpan={7} className="py-3 px-3 text-right border-r border-slate-300 text-emerald-900 uppercase">
                    Grand Total Contractor Claim:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-900 border-r border-slate-300 text-base">
                    ₹{calcResult.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-emerald-700 font-bold">
                    {isTargetAchieved ? '✓ Met Target' : `${progressPercent}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Certificate & Verification Signatures (matching reference sheet) */}
          <div className="mt-8 pt-6 border-t border-slate-300 space-y-6 text-xs text-slate-700">
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                II CERTIFICATES AND SIGNATURES
              </h4>
              <p className="leading-relaxed">
                The measurements were made by __________________________________________ on _________________________________ and are Recorded at page ________________ of Measurement Book No : _________________________. No advance payment has been made previously without detailed measurements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center">
              <div className="space-y-8">
                <p className="font-semibold text-slate-800">Dated signature of Officer preparing the bill</p>
                <p className="text-slate-500 border-t border-slate-400 pt-2 font-mono font-bold">Dy.Engr. / Jr. Engr.</p>
              </div>
              <div className="space-y-8">
                <p className="font-semibold text-slate-800">Dated signature of Officer Authorising the bill</p>
                <p className="text-slate-500 border-t border-slate-400 pt-2 font-mono font-bold">Executive Engineer</p>
              </div>
              <div className="space-y-8">
                <p className="font-semibold text-slate-800">Signature of the Contractor</p>
                <p className="text-slate-500 border-t border-slate-400 pt-2 font-mono font-bold">SHIV ELECTRICALS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
