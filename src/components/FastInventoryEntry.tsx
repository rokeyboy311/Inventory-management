import React, { useEffect, useMemo, useRef } from 'react';
import { Check, ClipboardPaste, Keyboard, Save } from 'lucide-react';
import { DOLVAN_SHEET1_COLUMNS } from '../utils/dolvanTemplate';
import {
  computeSummaryQtyFromSizes,
  ensureCompleteMasterItems,
  isNonZeroQtyValue,
  PerformaRecord
} from '../types/performa';

interface FastInventoryEntryProps {
  performa: PerformaRecord;
  rowNumber: number;
  duplicateError: string | null;
  onChange: (updated: PerformaRecord) => void;
  onSaveAndNext: () => void;
}

interface ItemCellBinding {
  srLabel: string;
  sizeKey?: string;
}

const ITEM_CELL_BINDINGS: Record<number, ItemCellBinding> = {
  6: { srLabel: '1.1' },
  7: { srLabel: '1' },
  8: { srLabel: '2.1', sizeKey: '100' },
  9: { srLabel: '2.1', sizeKey: '200' },
  10: { srLabel: '2.1', sizeKey: '500' },
  11: { srLabel: '3' },
  12: { srLabel: '4', sizeKey: 'Nos.' },
  13: { srLabel: '4', sizeKey: 'C-1(70)' },
  14: { srLabel: '4', sizeKey: 'C-2(150)' },
  15: { srLabel: '5' },
  16: { srLabel: '6' },
  17: { srLabel: '6.1', sizeKey: '150' },
  18: { srLabel: '6.2', sizeKey: '185' },
  19: { srLabel: '6.3', sizeKey: '240' },
  20: { srLabel: '7' },
  21: { srLabel: '7', sizeKey: 'Ltr' },
  22: { srLabel: '9.2' },
  23: { srLabel: '10', sizeKey: '100Amp' },
  24: { srLabel: '10', sizeKey: '200Amp' },
  25: { srLabel: '11', sizeKey: '630 amp' },
  26: { srLabel: '11', sizeKey: '400 amp' },
  27: { srLabel: '11', sizeKey: '250 amp' },
  28: { srLabel: '12', sizeKey: '630 amp' },
  29: { srLabel: '12', sizeKey: '400 amp' },
  30: { srLabel: '12', sizeKey: '250 amp' },
  31: { srLabel: '13' },
  32: { srLabel: '14' },
  33: { srLabel: '15' },
  34: { srLabel: '16', sizeKey: '12MM' },
  35: { srLabel: '16', sizeKey: '20MM' },
  36: { srLabel: '16', sizeKey: '30MM' },
  37: { srLabel: '17', sizeKey: '12MM' },
  38: { srLabel: '17', sizeKey: '20MM' },
  39: { srLabel: '17', sizeKey: '30MM' },
  40: { srLabel: '18', sizeKey: '500 gm' },
  41: { srLabel: '2', sizeKey: '12MM' },
  42: { srLabel: '2', sizeKey: '20MM' }
};

function readCellValue(performa: PerformaRecord, columnIndex: number): string {
  if (columnIndex === 1) return performa.date || '';
  if (columnIndex === 2) return performa.location || '';
  if (columnIndex === 3) return performa.transformerSerialNo || '';
  if (columnIndex === 4) return performa.transformerMake || '';
  if (columnIndex === 5) return performa.capacity || '';

  const binding = ITEM_CELL_BINDINGS[columnIndex];
  if (!binding) return '';
  const item = performa.items.find(row => row.srLabel === binding.srLabel);
  const value = binding.sizeKey ? item?.sizeQtys?.[binding.sizeKey] : item?.qty;
  return value === undefined || value === null ? '' : String(value);
}

function updateCell(
  performa: PerformaRecord,
  columnIndex: number,
  value: string
): PerformaRecord {
  if (columnIndex === 1) return { ...performa, date: value };
  if (columnIndex === 2) return { ...performa, location: value };
  if (columnIndex === 3) return { ...performa, transformerSerialNo: value };
  if (columnIndex === 4) return { ...performa, transformerMake: value };
  if (columnIndex === 5) return { ...performa, capacity: value };

  const binding = ITEM_CELL_BINDINGS[columnIndex];
  if (!binding) return performa;

  const items = ensureCompleteMasterItems(performa.items);
  const itemIndex = items.findIndex(row => row.srLabel === binding.srLabel);
  if (itemIndex < 0) return performa;

  const item = { ...items[itemIndex] };
  if (binding.sizeKey) {
    const sizeQtys = { ...(item.sizeQtys || {}), [binding.sizeKey]: value };
    item.sizeQtys = sizeQtys;
    const hasSizeQuantity = Object.values(sizeQtys).some(isNonZeroQtyValue);
    if (binding.srLabel === '7' && binding.sizeKey === 'Ltr') {
      if (!isNonZeroQtyValue(item.qty) && hasSizeQuantity) item.qty = '1';
    } else {
      item.qty = computeSummaryQtyFromSizes(item.sizeFields, sizeQtys, item.qty);
    }
    const hasQuantity = isNonZeroQtyValue(item.qty) || hasSizeQuantity;
    item.materialYes = hasQuantity;
    item.labourYes = hasQuantity;
  } else {
    item.qty = value;
    const hasLiters = binding.srLabel === '7' &&
      Object.values(item.sizeQtys || {}).some(isNonZeroQtyValue);
    const hasQuantity = isNonZeroQtyValue(value) || hasLiters;
    if (!isNonZeroQtyValue(value) && hasLiters) item.qty = '1';
    item.materialYes = hasQuantity;
    item.labourYes = hasQuantity;
  }
  items[itemIndex] = item;
  return { ...performa, items };
}

function groupAdjacentHeaders(headerRow: number): Array<{ label: string; start: number; span: number }> {
  const groups: Array<{ label: string; start: number; span: number }> = [];
  DOLVAN_SHEET1_COLUMNS.forEach((column, index) => {
    const label = headerRow === 0
      ? column.header1
      : headerRow === 1
        ? column.header2
        : column.header3;
    const previous = groups[groups.length - 1];
    if (previous && previous.label === label) {
      previous.span += 1;
    } else {
      groups.push({ label, start: index, span: 1 });
    }
  });
  return groups;
}

export function FastInventoryEntry({
  performa,
  rowNumber,
  duplicateError,
  onChange,
  onSaveAndNext
}: FastInventoryEntryProps) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const headerGroups = useMemo(
    () => [0, 1, 2].map(groupAdjacentHeaders),
    []
  );

  useEffect(() => {
    inputRefs.current[1]?.focus();
  }, [performa.id]);

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text/plain');
    if (!pastedText.includes('\t') && !pastedText.includes('\n')) return;

    event.preventDefault();
    const values = pastedText.replace(/\r/g, '').replace(/\n$/, '').split(/\t|\n/);
    const startColumn = Number(event.currentTarget.dataset.column);
    const firstValue = (values[0] || '').trim();
    const includesSequenceColumn = startColumn === 1 && values.length >= 43 &&
      (!firstValue || Number.isFinite(Number(firstValue)));
    const offset = includesSequenceColumn ? 1 : 0;

    let updated = performa;
    values.forEach((value, index) => {
      const columnIndex = startColumn + index - offset;
      if (columnIndex > 0 && columnIndex < DOLVAN_SHEET1_COLUMNS.length) {
        updated = updateCell(updated, columnIndex, value.trim());
      }
    });
    onChange(updated);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    columnIndex: number
  ) => {
    if ((event.ctrlKey && event.key === 'Enter') || (event.altKey && event.key.toLowerCase() === 's')) {
      event.preventDefault();
      onSaveAndNext();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (columnIndex === DOLVAN_SHEET1_COLUMNS.length - 1) {
        onSaveAndNext();
        return;
      }
      inputRefs.current[columnIndex + 1]?.focus();
      inputRefs.current[columnIndex + 1]?.select();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onSaveAndNext();
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Fast inventory entry</h2>
          <p className="mt-1 text-xs text-slate-400">
            Excel 43-column order · paste a tab-separated Excel row · Enter moves across cells · Ctrl+Enter saves and opens the next record
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 font-mono">
            Performa {performa.id} · Row {rowNumber}
          </span>
          <button
            type="button"
            onClick={onSaveAndNext}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-500"
          >
            <Save className="h-3.5 w-3.5" />
            Save &amp; Next
          </button>
        </div>
      </div>

      {duplicateError && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {duplicateError}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1"><ClipboardPaste className="h-3.5 w-3.5 text-cyan-400" />Paste cells copied from Excel</span>
        <span className="inline-flex items-center gap-1"><Keyboard className="h-3.5 w-3.5 text-cyan-400" />Tab / Enter to move · Arrow Down to save &amp; next</span>
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" />Changes are saved to the same workbook</span>
      </div>

      <div className="overflow-auto rounded-lg border border-slate-600 bg-white">
        <table className="border-collapse text-[10px] text-slate-900">
          <colgroup>
            {DOLVAN_SHEET1_COLUMNS.map((column, index) => (
              <col key={column.key} style={{ width: `${Math.max(58, Math.min(340, column.width * 10))}px` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 text-center font-bold">
            <tr className="bg-slate-200">
              {DOLVAN_SHEET1_COLUMNS.slice(0, 6).map((column, index) => (
                <th key={column.key} rowSpan={3} className="border border-slate-400 px-1 py-2">
                  {column.header1}
                </th>
              ))}
              {headerGroups[0].slice(6).map(group => (
                <th key={`h1-${group.start}`} colSpan={group.span} className="border border-slate-400 px-1 py-2">
                  {group.label}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-100">
              {headerGroups[1].slice(6).map(group => (
                <th key={`h2-${group.start}`} colSpan={group.span} className="border border-slate-400 px-1 py-1">
                  {group.label}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50">
              {DOLVAN_SHEET1_COLUMNS.slice(6).map(column => (
                <th key={`h3-${column.key}`} className="border border-slate-400 px-1 py-1 font-semibold">
                  {column.header3}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-emerald-50">
              <td className="border border-slate-300 bg-slate-100 px-1 text-center font-bold">{rowNumber}</td>
              {DOLVAN_SHEET1_COLUMNS.slice(1).map((column, offset) => {
                const columnIndex = offset + 1;
                return (
                  <td key={column.key} className="border border-slate-300 p-0.5">
                    <input
                      ref={element => { inputRefs.current[columnIndex] = element; }}
                      data-column={columnIndex}
                      aria-label={`${column.header1}${column.header2 ? ` ${column.header2}` : ''}${column.header3 ? ` ${column.header3}` : ''}`}
                      type="text"
                      inputMode={columnIndex > 5 ? 'decimal' : 'text'}
                      value={readCellValue(performa, columnIndex)}
                      onChange={event => onChange(updateCell(performa, columnIndex, event.target.value))}
                      onPaste={handlePaste}
                      onKeyDown={event => handleKeyDown(event, columnIndex)}
                      className="h-8 w-full min-w-0 bg-transparent px-1 text-center text-[11px] font-medium outline-none focus:bg-amber-100 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        This entry grid follows the inventory workbook's column order. The separate GST bill sheets are recalculated from saved inventory quantities.
      </p>
    </section>
  );
}
