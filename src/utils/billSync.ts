import { PerformaRecord, BillSheetDefinition } from '../types/performa';
import { 
  calculateDgvclBillFromInventory, 
  getTenderTargetForLocation, 
  getTenderPercentForLocation 
} from './dgvclBillEngine';

/**
 * Extracts and sums all materials consumed across all performas in a location's inventory sheet,
 * and generates the complete Sheet 2 (bill) data using location-specific rates and authentic DGVCL SOR rules.
 */
export function syncBillFromInventory(
  performas: PerformaRecord[],
  locationName: string,
  existingBill?: BillSheetDefinition,
  locationId?: string
): BillSheetDefinition {
  const tenderTarget = existingBill?.tenderTargetAmount || (locationId ? getTenderTargetForLocation(locationId) : 2000000);
  const tenderPercent = existingBill?.tenderPercentage || (locationId ? getTenderPercentForLocation(locationId) : 20);

  const customRates: Record<string, number> = {};
  if (existingBill?.items) {
    existingBill.items.forEach(it => {
      if (it.rate !== undefined) {
        customRates[String(it.srNo)] = it.rate;
      }
    });
  }

  const result = calculateDgvclBillFromInventory(performas, locationName, {
    tenderTargetAmount: tenderTarget,
    tenderPercentage: tenderPercent,
    billNumber: existingBill?.billNumber,
    billDate: existingBill?.billDate,
    contractorName: existingBill?.contractorName,
    workOrderRef: existingBill?.workOrderRef,
    customRates
  });

  return result.billData;
}
