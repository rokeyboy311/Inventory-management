import { PerformaRecord, BillSheetDefinition, BillItem, isNonZeroQtyValue } from '../types/performa';
import { getMasterItemsList } from './itemsMaster';

/**
 * Standard default contractor rates by description keywords
 */
function getDefaultRatesForDescription(description: string, srLabel?: string): { rate: number; labourRate: number } {
  const master = getMasterItemsList();
  if (srLabel) {
    const match = master.find(m => m.srLabel === srLabel);
    if (match && match.defaultRate !== undefined) {
      return { rate: match.defaultRate, labourRate: match.defaultLabourRate ?? 50 };
    }
  }

  const d = description.toLowerCase();
  if (d.includes('al. patta') || d.includes('al patta')) return { rate: 350, labourRate: 80 };
  if (d.includes('cable') || d.includes('c-2') || d.includes('c-1')) return { rate: 450, labourRate: 100 };
  if (d.includes('lt bushing')) return { rate: 120, labourRate: 40 };
  if (d.includes('ht bushing')) return { rate: 150, labourRate: 50 };
  if (d.includes('half stud')) return { rate: 220, labourRate: 50 };
  if (d.includes('earth connection')) return { rate: 0, labourRate: 150 };
  if (d.includes('termination')) return { rate: 160, labourRate: 80 };
  if (d.includes('oil leakage') || d.includes('top up of oil') || d.includes('transformer oil')) return { rate: 180, labourRate: 50 };
  if (d.includes('box') || d.includes('fixing new box')) return { rate: 850, labourRate: 200 };
  if (d.includes('kit-kat')) return { rate: 280, labourRate: 60 };
  if (d.includes('hrc fuse base') || d.includes('fuse base')) return { rate: 420, labourRate: 70 };
  if (d.includes('hrc fuse link') || d.includes('fuse link')) return { rate: 260, labourRate: 50 };
  if (d.includes('fuse element')) return { rate: 80, labourRate: 30 };
  if (d.includes('sundry')) return { rate: 90, labourRate: 30 };
  if (d.includes('brass nut')) return { rate: 60, labourRate: 25 };
  if (d.includes('brass washer')) return { rate: 40, labourRate: 20 };
  if (d.includes('breather')) return { rate: 380, labourRate: 70 };
  if (d.includes('general condition')) return { rate: 0, labourRate: 250 };
  return { rate: 150, labourRate: 50 };
}

/**
 * Extracts and sums all materials consumed across all performas in a location's inventory sheet,
 * and generates the complete Sheet 2 (bill) data.
 */
export function syncBillFromInventory(
  performas: PerformaRecord[],
  locationName: string,
  existingBill?: BillSheetDefinition
): BillSheetDefinition {
  const cleanLoc = (locationName || 'LOCATION').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const year = new Date().getFullYear();

  // Map of item key -> aggregated quantity and metadata
  interface AggregatedMaterial {
    srLabel?: string;
    description: string;
    unit: string;
    qty: number;
    performaCount: number;
  }

  const materialMap = new Map<string, AggregatedMaterial>();

  performas.forEach(p => {
    (p.items || []).forEach(item => {
      // Check if material is active or quantity specified
      const hasSizeQty = item.sizeFields && item.sizeQtys && item.sizeFields.some(sf => isNonZeroQtyValue(item.sizeQtys?.[sf]));
      const hasDirectQty = isNonZeroQtyValue(item.qty);
      const isMaterialActive = item.materialYes || hasSizeQty || hasDirectQty;

      if (!isMaterialActive) return;

      // Handle multi-size sub-fields (e.g. C-2(150), 250 amp, 12MM)
      if (item.sizeFields && item.sizeQtys && hasSizeQty) {
        item.sizeFields.forEach(sf => {
          const val = item.sizeQtys?.[sf];
          if (isNonZeroQtyValue(val)) {
            const num = parseFloat(String(val)) || 1;
            const subKey = `${item.description} (${sf})`;
            const existing = materialMap.get(subKey);
            if (existing) {
              existing.qty += num;
              existing.performaCount += 1;
            } else {
              materialMap.set(subKey, {
                srLabel: item.srLabel,
                description: subKey,
                unit: item.unit || 'Nos.',
                qty: num,
                performaCount: 1
              });
            }
          }
        });
      } else {
        // Flat item without size breakdown
        const num = isDirectQtyValidNumber(item.qty) ? Number(item.qty) : 1;
        const mainKey = item.description;
        const existing = materialMap.get(mainKey);
        if (existing) {
          existing.qty += num;
          existing.performaCount += 1;
        } else {
          materialMap.set(mainKey, {
            srLabel: item.srLabel,
            description: mainKey,
            unit: item.unit || 'Nos.',
            qty: num,
            performaCount: 1
          });
        }
      }
    });
  });

  function isDirectQtyValidNumber(val: any): boolean {
    if (!isNonZeroQtyValue(val)) return false;
    const n = Number(String(val).trim());
    return !isNaN(n) && n > 0;
  }

  // Map existing bill items to retain user-configured rates
  const existingRatesMap = new Map<string, { rate: number; labourRate: number; remarks?: string }>();
  if (existingBill && Array.isArray(existingBill.items)) {
    existingBill.items.forEach(it => {
      existingRatesMap.set(it.description.toLowerCase().trim(), {
        rate: it.rate,
        labourRate: it.labourRate,
        remarks: it.remarks
      });
    });
  }

  const billItems: BillItem[] = [];
  let itemIndex = 1;

  materialMap.forEach((agg) => {
    const existingRate = existingRatesMap.get(agg.description.toLowerCase().trim());
    const defaultRates = getDefaultRatesForDescription(agg.description, agg.srLabel);

    const rate = existingRate ? existingRate.rate : defaultRates.rate;
    const labourRate = existingRate ? existingRate.labourRate : defaultRates.labourRate;
    const materialAmount = Math.round(agg.qty * rate);
    const labourAmount = Math.round(agg.qty * labourRate);
    const totalAmount = materialAmount + labourAmount;

    billItems.push({
      id: `bill-item-${itemIndex}-${Date.now()}`,
      srNo: itemIndex,
      description: agg.description,
      unit: agg.unit,
      qty: agg.qty,
      rate,
      labourRate,
      materialAmount,
      labourAmount,
      totalAmount,
      remarks: existingRate?.remarks || `Used in ${agg.performaCount} Performa(s)`
    });

    itemIndex++;
  });

  // Preserve any custom items the user manually added directly to the Bill sheet
  if (existingBill && Array.isArray(existingBill.items)) {
    existingBill.items.forEach(existingIt => {
      const isAutoItem = materialMap.has(existingIt.description) ||
        Array.from(materialMap.keys()).some(k => k.toLowerCase() === existingIt.description.toLowerCase());
      if (!isAutoItem && (existingIt.id.startsWith('bill-item-custom-') || existingIt.remarks?.includes('Manual'))) {
        billItems.push({
          ...existingIt,
          srNo: itemIndex++
        });
      }
    });
  }

  // If no items have been added in inventory yet, show at least 1 helpful placeholder line
  if (billItems.length === 0) {
    const defaultRates = getDefaultRatesForDescription('Replacement of LT bushing Goti');
    billItems.push({
      id: 'b-empty-1',
      srNo: 1,
      description: 'Material consumption will appear here automatically when entered in Inventory sheet',
      unit: 'Nos.',
      qty: 0,
      rate: defaultRates.rate,
      labourRate: defaultRates.labourRate,
      materialAmount: 0,
      labourAmount: 0,
      totalAmount: 0,
      remarks: 'Awaiting performa inventory entries'
    });
  }

  const subTotal = billItems.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
  const taxGst = Math.round(subTotal * 0.18);
  const grandTotal = subTotal + taxGst;

  return {
    name: 'bill',
    billNumber: existingBill?.billNumber || `BILL-${cleanLoc.slice(0, 3).toUpperCase()}-${year}-001`,
    billDate: existingBill?.billDate || new Date().toISOString().slice(0, 10),
    contractorName: existingBill?.contractorName || 'DGVCL Authorized Electrical Maintenance Contractor',
    workOrderRef: existingBill?.workOrderRef || `WO/DGVCL/${cleanLoc.slice(0, 3).toUpperCase()}/${year}/772`,
    items: billItems,
    subTotal,
    taxGst,
    grandTotal
  };
}
