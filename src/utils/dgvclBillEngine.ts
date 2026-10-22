import { PerformaRecord, BillSheetDefinition, BillItem, isNonZeroQtyValue } from '../types/performa';

export interface DgvclSorRowDef {
  page: 1 | 2;
  srNo: string;
  unit: string;
  description: string;
  rate: number;
  isHeader?: boolean;
  isLabor?: boolean;
  remarks?: string;
  // Which canonical inventory column key or computation this row draws from
  inventorySource?: string;
}

/**
 * Standard DISCOM DGVCL Schedule of Rates (SOR) items across GST BILL (Page 1) and GST BILL 2 (Page 2)
 * Extracted directly from reference DISCOM workbook BILL FORM AND GST GIDC SHIV ELE RA-2.xlsx
 */
export const DGVCL_SOR_SCHEDULE: DgvclSorRowDef[] = [
  // --- PAGE 1: GST BILL ---
  {
    page: 1,
    srNo: '1',
    unit: 'No.',
    description: 'Labour Charge for Providing of HT/LT bushing goti if requried',
    rate: 100,
    isLabor: true,
    inventorySource: 'LABOR_BUSHING'
  },
  {
    page: 1,
    srNo: '1.1',
    unit: 'No.',
    description: 'Replacement of LTbushing goti/ Rubber washer',
    rate: 38,
    inventorySource: 'COL_H' // LT bushing goti
  },
  {
    page: 1,
    srNo: '1.2',
    unit: 'No.',
    description: 'Replacement of HT bushing goti/ Rubber washer',
    rate: 30,
    inventorySource: 'COL_G' // HT bushing goti
  },
  {
    page: 1,
    srNo: '2',
    unit: 'No.',
    description: 'Providing of AL. Patta on LT side up to 200 KVA TR if reqired',
    rate: 140,
    inventorySource: 'AL_PATTA_200' // Col I (100) + Col J (200)
  },
  {
    page: 1,
    srNo: '2.1',
    unit: 'No.',
    description: 'Labour charge of AL. Patta on LT side up to 200 KVA TR if reqired',
    rate: 5,
    isLabor: true,
    inventorySource: 'LABOR_AL_PATTA_200'
  },
  {
    page: 1,
    srNo: '3',
    unit: 'No.',
    description: 'Providing of AL. Patta on LT side up to 500 KVA TR if reqired',
    rate: 165,
    inventorySource: 'COL_K' // Col K (500)
  },
  {
    page: 1,
    srNo: '3.1',
    unit: 'No.',
    description: 'Labour charge of AL. Patta on LT side up to 500 KVA TR if reqired',
    rate: 10,
    isLabor: true,
    inventorySource: 'LABOR_AL_PATTA_500'
  },
  {
    page: 1,
    srNo: '4',
    unit: 'LS',
    description: 'Check and Tight earth connection, if requried provide lugs & nut-bolt to the neutral terminal of TRF and the body terminal of TRF and dist. Box earth',
    rate: 50,
    inventorySource: 'COL_L'
  },
  {
    page: 1,
    srNo: '5',
    unit: 'No.',
    description: 'Replacement of demage LT cable with new one of right capacity (cable provide by DGVCL)',
    rate: 150,
    inventorySource: 'COL_M'
  },
  {
    page: 1,
    srNo: '6',
    unit: 'No.',
    description: 'providing of new termination in form of R,Y,B and N core including PVC tape',
    rate: 150,
    inventorySource: 'COL_P'
  },
  {
    page: 1,
    srNo: '6.1',
    unit: 'No.',
    description: 'Termination of 25/50/70 Sq mm cable',
    rate: 8,
    inventorySource: 'COL_Q' // 70 Sq mm
  },
  {
    page: 1,
    srNo: '6.2',
    unit: 'No.',
    description: 'Termination of 300 Sq mm cable',
    rate: 45,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '6.3',
    unit: 'No.',
    description: 'Termination of 95/120/150 Sq mm cable',
    rate: 16,
    inventorySource: 'COL_R' // 150 Sq mm
  },
  {
    page: 1,
    srNo: '6.4',
    unit: 'No.',
    description: 'Termination of 185 Sq mm cable',
    rate: 23,
    inventorySource: 'COL_S' // 185 Sq mm
  },
  {
    page: 1,
    srNo: '6.5',
    unit: 'No.',
    description: 'Termination of 240 Sq mm cable',
    rate: 32,
    inventorySource: 'COL_T' // 240 Sq mm
  },
  {
    page: 1,
    srNo: '6.6',
    unit: 'No.',
    description: 'Labour Charge of Termination of 25/50/70/150/185 Sq mm cable',
    rate: 20,
    isLabor: true,
    inventorySource: 'LABOR_TERMINATION' // Q + R + S + T
  },
  {
    page: 1,
    srNo: '7',
    unit: 'Per No.',
    description: 'Measurment of Volatage and Ampre',
    rate: 150,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '8',
    unit: 'No.',
    description: 'check oil leakage from drain off valve/gasket/tank leak etc,Topping of oil to maintain proper oil level (oil provided by DGVCL)',
    rate: 150,
    inventorySource: 'COL_U'
  },
  {
    page: 1,
    srNo: '9',
    unit: 'No.',
    description: 'Checking and replacement of LT Dist Box if required',
    rate: 3650,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '9.1',
    unit: 'No.',
    description: 'Fixing of new dist. Box with complete wiring including clamps, nut bolts etc',
    rate: 544,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '9.2',
    unit: 'No.',
    description: 'Replacement of detoriarated /providing LT dist. Box with new up to 100 KVA capacity',
    rate: 706,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '9.3',
    unit: 'No.',
    description: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity',
    rate: 1388,
    inventorySource: 'COL_W'
  },
  {
    page: 1,
    srNo: '10',
    unit: '',
    description: 'Checking and replacement of Kit-Ket fuse if required (Kit-Ket fuse be provided by DGVCL)',
    rate: 0,
    isHeader: true
  },
  {
    page: 1,
    srNo: '10.1',
    unit: 'No.',
    description: '100 amp Kit-Ket fuse',
    rate: 20,
    inventorySource: 'COL_X'
  },
  {
    page: 1,
    srNo: '10.2',
    unit: 'No.',
    description: '200 amp Kit-Ket fuse',
    rate: 20,
    inventorySource: 'COL_Y'
  },
  {
    page: 1,
    srNo: '11',
    unit: '',
    description: 'Checking and replacement of HRC fuse base if required (HRC fuse base provided by contractor)',
    rate: 0,
    isHeader: true
  },
  {
    page: 1,
    srNo: '11.1',
    unit: 'No.',
    description: '630 amp HRC fuse base',
    rate: 682,
    inventorySource: 'COL_Z'
  },
  {
    page: 1,
    srNo: '11.2',
    unit: 'No.',
    description: '400 amp HRC fuse base',
    rate: 525,
    inventorySource: 'COL_AA'
  },
  {
    page: 1,
    srNo: '11.3',
    unit: 'No.',
    description: '250 amp HRC fuse base',
    rate: 370,
    inventorySource: 'COL_AB'
  },
  {
    page: 1,
    srNo: '11.4',
    unit: 'No.',
    description: 'Labour Charge of HRC fuse Base',
    rate: 50,
    isLabor: true,
    inventorySource: 'LABOR_HRC_BASE' // Z + AA + AB
  },
  {
    page: 1,
    srNo: '12',
    unit: '',
    description: 'Checking and replacement of HRC fuse bridge if required (HRC fuse base provided by contractor)',
    rate: 0,
    isHeader: true
  },
  {
    page: 1,
    srNo: '12.1',
    unit: 'No.',
    description: '630 amp HRC fuse',
    rate: 690,
    inventorySource: 'COL_AC'
  },
  {
    page: 1,
    srNo: '12.2',
    unit: 'No.',
    description: '400 amp HRC fuse',
    rate: 490,
    inventorySource: 'COL_AD'
  },
  {
    page: 1,
    srNo: '12.3',
    unit: 'No.',
    description: '250 amp HRC fuse',
    rate: 352,
    inventorySource: 'COL_AE'
  },
  {
    page: 1,
    srNo: '13',
    unit: 'No.',
    description: 'Providing of proper size of fuse element on HT side (on D.O. fuse with cleaning of horns)',
    rate: 15,
    inventorySource: 'COL_AF'
  },
  {
    page: 1,
    srNo: '13.1',
    unit: 'No.',
    description: 'Labour Charge of fuse element on HT side (on D.O. fuse with cleaning of horns)',
    rate: 30,
    isLabor: true,
    inventorySource: 'LABOR_DO_FUSE' // AF
  },
  {
    page: 1,
    srNo: '14',
    unit: 'LS',
    description: 'Providing and replacement of sundry items like nut, bolt, washer etc. of appropriate size.',
    rate: 200,
    inventorySource: 'COL_AG'
  },
  {
    page: 1,
    srNo: '15',
    unit: 'JOB',
    description: 'General condition like clean off all dirt and submission location wise performa',
    rate: 150,
    inventorySource: 'COL_AH'
  },
  {
    page: 1,
    srNo: '15.7',
    unit: 'No.',
    description: "Supply & Providing of neutral earthing using G.I strip to neutral terminal of X'mer and Dist. Box neutral earthing (Plate type earthing)",
    rate: 850,
    inventorySource: 'ZERO'
  },
  {
    page: 1,
    srNo: '16',
    unit: '',
    description: 'Half Stud',
    rate: 0,
    isHeader: true
  },
  {
    page: 1,
    srNo: '16.1',
    unit: 'No.',
    description: 'LT side Brass hlf stud with 2 no brass nut & washer of size 12 mm',
    rate: 150,
    inventorySource: 'COL_AP' // 12 mm half stud
  },

  // --- PAGE 2: GST BILL 2 ---
  {
    page: 2,
    srNo: '16.2',
    unit: 'No.',
    description: 'LT side Brass hlf stud with 2 no brass nut & washer of size 20 mm',
    rate: 300,
    inventorySource: 'COL_AQ' // 20 mm half stud
  },
  {
    page: 2,
    srNo: '16.3',
    unit: 'No.',
    description: 'Labour Charge of LT side Brass hlf stud with 2 no brass nut & washer of size 20 mm',
    rate: 18,
    isLabor: true,
    inventorySource: 'LABOR_HALF_STUD' // AP + AQ
  },
  {
    page: 2,
    srNo: '17',
    unit: '',
    description: 'LT side Brass Nuts and Washer',
    rate: 0,
    isHeader: true
  },
  {
    page: 2,
    srNo: '17.1',
    unit: 'No.',
    description: '12 mm Brass LT side nuts',
    rate: 16,
    inventorySource: 'COL_AI'
  },
  {
    page: 2,
    srNo: '17.2',
    unit: 'No.',
    description: '20 mm Brass LT side nuts',
    rate: 40,
    inventorySource: 'COL_AJ'
  },
  {
    page: 2,
    srNo: '17.3',
    unit: 'No.',
    description: '30 mm Brass LT side nuts',
    rate: 68,
    inventorySource: 'COL_AK'
  },
  {
    page: 2,
    srNo: '17.4',
    unit: 'No.',
    description: 'Labour Charge of Brass LT Side nuts',
    rate: 12,
    isLabor: true,
    inventorySource: 'LABOR_BRASS_NUTS' // AI + AJ + AK
  },
  {
    page: 2,
    srNo: '17.5',
    unit: 'No.',
    description: '12 mm Brass LT side washer',
    rate: 10,
    inventorySource: 'COL_AL'
  },
  {
    page: 2,
    srNo: '17.6',
    unit: 'No.',
    description: '20 mm Brass LT side washer',
    rate: 17,
    inventorySource: 'COL_AM'
  },
  {
    page: 2,
    srNo: '17.7',
    unit: 'No.',
    description: '30 mm Brass LT side washer',
    rate: 20,
    inventorySource: 'COL_AN'
  },
  {
    page: 2,
    srNo: '17.8',
    unit: 'No.',
    description: 'Labour Charge of Brass LT Side washer',
    rate: 12,
    isLabor: true,
    inventorySource: 'LABOR_BRASS_WASHERS' // AL + AM + AN
  },
  {
    page: 2,
    srNo: '18',
    unit: '',
    description: 'Breather',
    rate: 0,
    isHeader: true
  },
  {
    page: 2,
    srNo: '18.1',
    unit: 'No.',
    description: 'Breather plastic transparent body cast metal cap and bottom, 1/2" thread pipe, 250 grams. ( Dry gel weight 250 gm)',
    rate: 250,
    inventorySource: 'ZERO'
  },
  {
    page: 2,
    srNo: '18.2',
    unit: 'No.',
    description: 'Breather plastic transparent body cast metal cap and bottom, 1/2" thread pipe, 500 grams. ( Dry gel weight 500 gm)',
    rate: 450,
    inventorySource: 'COL_AO'
  },
  {
    page: 2,
    srNo: '18.3',
    unit: 'No.',
    description: 'Labour Charge of Breather plastic transparent body cast metal cap and bottom, 1/2" thread pipe, 250 grams. ( Dry gel weight 250 gm and 500 gm)',
    rate: 55,
    isLabor: true,
    inventorySource: 'LABOR_BREATHER' // AO
  }
];

export interface DgvclBillCalculationResult {
  billData: BillSheetDefinition;
  page1Items: BillItem[];
  page2Items: BillItem[];
  page1Total: number;
  page2ItemsTotal: number;
  workDoneTotalA: number; // Total value of work done to date (A) = Page 1 + Page 2 items
  tenderPercentage: number; // default 20%
  aboveTenderAmount: number; // (Total A * 20) / 100
  netTotal: number; // Total A + Above Tender
  taxGst: number; // 18% of Net Total
  roundOff: number;
  grandTotal: number;
  tenderTargetAmount: number; // e.g. 2000000
  tenderTargetAchieved: boolean; // grandTotal >= tenderTargetAmount
  progressPercent: number; // e.g. 108.8%
  varianceAmount: number; // grandTotal - tenderTargetAmount
}

/**
 * Calculates item quantities directly from performa records matching the 43-column canonical layout
 */
export function extractInventoryColumnQuantities(performas: PerformaRecord[]): Record<string, number> {
  const totals: Record<string, number> = {
    COL_G: 0,  // HT bushing
    COL_H: 0,  // LT bushing
    COL_I: 0,  // AL Patta 100
    COL_J: 0,  // AL Patta 200
    COL_K: 0,  // AL Patta 500
    COL_L: 0,  // Earth connection
    COL_M: 0,  // Cable Nos.
    COL_N: 0,  // Cable 70
    COL_O: 0,  // Cable 150
    COL_P: 0,  // Termination RYBN
    COL_Q: 0,  // Termination 70
    COL_R: 0,  // Termination 150
    COL_S: 0,  // Termination 185
    COL_T: 0,  // Termination 240
    COL_U: 0,  // Oil leakage check
    COL_V: 0,  // Oil ltr
    COL_W: 0,  // Dist box > 100 kva
    COL_X: 0,  // Kit-Kat 100
    COL_Y: 0,  // Kit-Kat 200
    COL_Z: 0,  // HRC base 630
    COL_AA: 0, // HRC base 400
    COL_AB: 0, // HRC base 250
    COL_AC: 0, // HRC link 630
    COL_AD: 0, // HRC link 400
    COL_AE: 0, // HRC link 250
    COL_AF: 0, // Fuse element DO
    COL_AG: 0, // Sundry
    COL_AH: 0, // General condition
    COL_AI: 0, // Brass nut 12mm
    COL_AJ: 0, // Brass nut 20mm
    COL_AK: 0, // Brass nut 30mm
    COL_AL: 0, // Brass washer 12mm
    COL_AM: 0, // Brass washer 20mm
    COL_AN: 0, // Brass washer 30mm
    COL_AO: 0, // Breather 500g
    COL_AP: 0, // Half stud 12mm
    COL_AQ: 0  // Half stud 20mm
  };

  const getNum = (v: any): number => {
    if (!isNonZeroQtyValue(v)) return 0;
    const n = parseFloat(String(v).trim());
    return isNaN(n) ? 0 : n;
  };

  performas.forEach(p => {
    (p.items || []).forEach(it => {
      const label = String(it.srLabel || it.srNo || '').trim();
      const desc = (it.description || '').toLowerCase();
      const sq = it.sizeQtys || {};

      // Bushing Goti
      if (label === '1.1' || desc.includes('ht bushing')) {
        const val = getNum(it.qty);
        totals.COL_G += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      } else if (label === '1' || desc.includes('lt bushing')) {
        const val = getNum(it.qty);
        totals.COL_H += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      }
      // AL Patta
      else if (label === '3' || desc.includes('al. patta') || desc.includes('al patta')) {
        totals.COL_I += getNum(sq['100']);
        totals.COL_J += getNum(sq['200']);
        totals.COL_K += getNum(sq['500']);
        if (!sq['100'] && !sq['200'] && !sq['500']) {
          const val = getNum(it.qty);
          totals.COL_I += val;
        }
      }
      // Earth connection
      else if (label === '4' || desc.includes('earth connection')) {
        const val = getNum(it.qty);
        totals.COL_L += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      }
      // Replacement LT Cable
      else if (label === '5' || (desc.includes('cable') && desc.includes('replacement'))) {
        const val = getNum(it.qty);
        totals.COL_M += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
        totals.COL_N += getNum(sq['C- 1(70)']);
        totals.COL_O += getNum(sq['C- 2(150)']);
      }
      // Termination RYBN & Cable Terminations
      else if (label === '6' || desc.includes('termination')) {
        const val = getNum(it.qty);
        totals.COL_P += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
        totals.COL_Q += getNum(sq['70']) || getNum(sq['25/50/70 Sq mm']) || getNum(sq['25/50/70']);
        totals.COL_R += getNum(sq['150']) || getNum(sq['95/120/150 Sq mm']) || getNum(sq['95/120/150']);
        totals.COL_S += getNum(sq['185']) || getNum(sq['185 Sq mm']);
        totals.COL_T += getNum(sq['240']) || getNum(sq['240 Sq mm']);
      }
      // Oil leakage & top up
      else if (label === '8' || desc.includes('oil leakage') || desc.includes('topping of oil')) {
        const val = getNum(it.qty);
        totals.COL_U += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
        totals.COL_V += getNum(sq['Ltr']) || getNum(sq['ltr']);
      }
      // Dist Box
      else if (label === '9' || desc.includes('dist. box') || desc.includes('dist box')) {
        const above100 = getNum(sq['above 100 Amp']) || getNum(sq['above 100']) || getNum(sq['Replacement of new box above 100 Amp']);
        totals.COL_W += above100 > 0 ? above100 : (getNum(it.qty) > 0 ? getNum(it.qty) : (it.materialYes || it.labourYes ? 1 : 0));
      }
      // Kit-Kat Fuse
      else if (label === '10' || desc.includes('kit-kat') || desc.includes('kit-ket')) {
        totals.COL_X += getNum(sq['100 Amp']) || getNum(sq['100']);
        totals.COL_Y += getNum(sq['200 Amp']) || getNum(sq['200']);
      }
      // HRC Fuse Base
      else if (label === '11' || desc.includes('hrc fuse base') || desc.includes('fuse base')) {
        totals.COL_Z += getNum(sq['630 Amp']) || getNum(sq['630']);
        totals.COL_AA += getNum(sq['400 Amp']) || getNum(sq['400']);
        totals.COL_AB += getNum(sq['250 Amp']) || getNum(sq['250']);
      }
      // HRC Fuse Link
      else if (label === '12' || desc.includes('hrc fuse link') || desc.includes('fuse link') || desc.includes('hrc fuse bridge')) {
        totals.COL_AC += getNum(sq['630 Amp']) || getNum(sq['630']);
        totals.COL_AD += getNum(sq['400 Amp']) || getNum(sq['400']);
        totals.COL_AE += getNum(sq['250 Amp']) || getNum(sq['250']);
      }
      // Fuse Element DO
      else if (label === '13' || desc.includes('fuse element') || desc.includes('d.o. fuse')) {
        const val = getNum(it.qty);
        totals.COL_AF += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      }
      // Sundry items
      else if (label === '14' || desc.includes('sundry')) {
        const val = getNum(it.qty);
        totals.COL_AG += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      }
      // General condition
      else if (label === '15' || desc.includes('general condition')) {
        const val = getNum(it.qty);
        totals.COL_AH += val > 0 ? val : (it.materialYes || it.labourYes ? 1 : 0);
      }
      // Brass Nuts
      else if (label === '17' && desc.includes('nut')) {
        totals.COL_AI += getNum(sq['12MM']) || getNum(sq['12 mm']);
        totals.COL_AJ += getNum(sq['20MM']) || getNum(sq['20 mm']);
        totals.COL_AK += getNum(sq['30MM']) || getNum(sq['30 mm']);
      }
      // Brass Washers
      else if (label === '17' && desc.includes('washer')) {
        totals.COL_AL += getNum(sq['12MM']) || getNum(sq['12 mm']);
        totals.COL_AM += getNum(sq['20MM']) || getNum(sq['20 mm']);
        totals.COL_AN += getNum(sq['30MM']) || getNum(sq['30 mm']);
      }
      // Combined Brass Nuts and Washers row
      else if (label === '17' || desc.includes('brass nut') || desc.includes('brass washer')) {
        totals.COL_AI += getNum(sq['12MM']) || getNum(sq['12 mm']);
        totals.COL_AJ += getNum(sq['20MM']) || getNum(sq['20 mm']);
        totals.COL_AK += getNum(sq['30MM']) || getNum(sq['30 mm']);
        totals.COL_AL += getNum(sq['12MM']) || getNum(sq['12 mm']);
        totals.COL_AM += getNum(sq['20MM']) || getNum(sq['20 mm']);
        totals.COL_AN += getNum(sq['30MM']) || getNum(sq['30 mm']);
      }
      // Breather
      else if (label === '18' || desc.includes('breather')) {
        totals.COL_AO += getNum(sq['500 gm']) || getNum(sq['500gm']) || getNum(it.qty);
      }
      // Half Stud
      else if (label === '2' || desc.includes('half stud')) {
        totals.COL_AP += getNum(sq['12MM']) || getNum(sq['12 mm']);
        totals.COL_AQ += getNum(sq['20MM']) || getNum(sq['20 mm']);
        if (!sq['12MM'] && !sq['20MM']) {
          totals.COL_AP += getNum(it.qty);
        }
      }
    });
  });

  return totals;
}

/**
 * Executes the complete authentic DGVCL SOR Bill computation across Page 1 and Page 2,
 * linking all quantities, calculating SOR totals, tender percentage (+20%), GST 18%,
 * and evaluating against the Tender Target Budget (e.g. ₹20,00,000).
 */
export function calculateDgvclBillFromInventory(
  performas: PerformaRecord[],
  locationName: string,
  options?: {
    tenderTargetAmount?: number;
    tenderPercentage?: number;
    billNumber?: string;
    billDate?: string;
    contractorName?: string;
    workOrderRef?: string;
    customRates?: Record<string, number>;
  }
): DgvclBillCalculationResult {
  const tenderTargetAmount = options?.tenderTargetAmount ?? 2000000;
  const tenderPercentage = options?.tenderPercentage ?? 20;
  const cleanLoc = (locationName || 'LOCATION').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
  const year = new Date().getFullYear();

  const colTotals = extractInventoryColumnQuantities(performas);

  // Helper to resolve quantity for an SOR row
  const getQtyForSorItem = (itemDef: DgvclSorRowDef): number => {
    if (itemDef.isHeader) return 0;
    switch (itemDef.inventorySource) {
      case 'COL_G': return colTotals.COL_G;
      case 'COL_H': return colTotals.COL_H;
      case 'LABOR_BUSHING': return colTotals.COL_G + colTotals.COL_H;
      case 'AL_PATTA_200': return colTotals.COL_I + colTotals.COL_J;
      case 'LABOR_AL_PATTA_200': return colTotals.COL_I + colTotals.COL_J;
      case 'COL_K': return colTotals.COL_K;
      case 'LABOR_AL_PATTA_500': return colTotals.COL_K;
      case 'COL_L': return colTotals.COL_L;
      case 'COL_M': return colTotals.COL_M;
      case 'COL_P': return colTotals.COL_P;
      case 'COL_Q': return colTotals.COL_Q;
      case 'COL_R': return colTotals.COL_R;
      case 'COL_S': return colTotals.COL_S;
      case 'COL_T': return colTotals.COL_T;
      case 'LABOR_TERMINATION': return colTotals.COL_Q + colTotals.COL_R + colTotals.COL_S + colTotals.COL_T;
      case 'COL_U': return colTotals.COL_U;
      case 'COL_W': return colTotals.COL_W;
      case 'COL_X': return colTotals.COL_X;
      case 'COL_Y': return colTotals.COL_Y;
      case 'COL_Z': return colTotals.COL_Z;
      case 'COL_AA': return colTotals.COL_AA;
      case 'COL_AB': return colTotals.COL_AB;
      case 'LABOR_HRC_BASE': return colTotals.COL_Z + colTotals.COL_AA + colTotals.COL_AB;
      case 'COL_AC': return colTotals.COL_AC;
      case 'COL_AD': return colTotals.COL_AD;
      case 'COL_AE': return colTotals.COL_AE;
      case 'COL_AF': return colTotals.COL_AF;
      case 'LABOR_DO_FUSE': return colTotals.COL_AF;
      case 'COL_AG': return colTotals.COL_AG;
      case 'COL_AH': return colTotals.COL_AH;
      case 'COL_AP': return colTotals.COL_AP;
      case 'COL_AQ': return colTotals.COL_AQ;
      case 'LABOR_HALF_STUD': return colTotals.COL_AP + colTotals.COL_AQ;
      case 'COL_AI': return colTotals.COL_AI;
      case 'COL_AJ': return colTotals.COL_AJ;
      case 'COL_AK': return colTotals.COL_AK;
      case 'LABOR_BRASS_NUTS': return colTotals.COL_AI + colTotals.COL_AJ + colTotals.COL_AK;
      case 'COL_AL': return colTotals.COL_AL;
      case 'COL_AM': return colTotals.COL_AM;
      case 'COL_AN': return colTotals.COL_AN;
      case 'LABOR_BRASS_WASHERS': return colTotals.COL_AL + colTotals.COL_AM + colTotals.COL_AN;
      case 'COL_AO': return colTotals.COL_AO;
      case 'LABOR_BREATHER': return colTotals.COL_AO;
      case 'ZERO':
      default:
        return 0;
    }
  };

  const page1Items: BillItem[] = [];
  const page2Items: BillItem[] = [];
  const allBillItems: BillItem[] = [];

  let page1RunningTotal = 0;
  let page2RunningTotal = 0;

  DGVCL_SOR_SCHEDULE.forEach((sorDef, idx) => {
    const rate = options?.customRates?.[sorDef.srNo] ?? sorDef.rate;
    const qty = getQtyForSorItem(sorDef);
    const amount = sorDef.isHeader ? 0 : Math.round(qty * rate);

    const billItem: BillItem = {
      id: `dgvcl-item-${sorDef.srNo.replace(/\./g, '_')}-${idx}`,
      srNo: idx + 1,
      description: sorDef.description,
      unit: sorDef.unit,
      qty,
      rate,
      labourRate: sorDef.isLabor ? rate : 0,
      materialAmount: sorDef.isLabor ? 0 : amount,
      labourAmount: sorDef.isLabor ? amount : 0,
      totalAmount: amount,
      remarks: sorDef.isHeader ? 'Category Header' : (sorDef.remarks || '')
    };

    allBillItems.push(billItem);

    if (sorDef.page === 1) {
      page1Items.push(billItem);
      page1RunningTotal += amount;
    } else {
      page2Items.push(billItem);
      page2RunningTotal += amount;
    }
  });

  // Total value of work done to date (A) = Page 1 Total + Page 2 items total
  const page1Total = page1RunningTotal;
  const page2ItemsTotal = page2RunningTotal;
  const workDoneTotalA = page1Total + page2ItemsTotal;

  // Tender percentage above (e.g. 20%)
  const aboveTenderAmount = Math.round(((workDoneTotalA * tenderPercentage) / 100) * 100) / 100;
  const netTotal = Math.round((workDoneTotalA + aboveTenderAmount) * 100) / 100;
  const taxGst = Math.round((netTotal * 0.18) * 100) / 100;
  const roundOff = 0;
  const grandTotal = Math.round((netTotal + taxGst + roundOff) * 100) / 100;

  const tenderTargetAchieved = grandTotal >= tenderTargetAmount;
  const progressPercent = tenderTargetAmount > 0 
    ? Math.round((grandTotal / tenderTargetAmount) * 1000) / 10 
    : 100;
  const varianceAmount = Math.round((grandTotal - tenderTargetAmount) * 100) / 100;

  const billData: BillSheetDefinition = {
    name: 'bill',
    billNumber: options?.billNumber || `BILL-${cleanLoc.slice(0, 3).toUpperCase()}-${year}-001`,
    billDate: options?.billDate || new Date().toISOString().slice(0, 10),
    contractorName: options?.contractorName || 'SHIV ELECTRICALS - DGVCL AUTHORIZED CONTRACTOR',
    workOrderRef: options?.workOrderRef || `WO/DGVCL/${cleanLoc.slice(0, 3).toUpperCase()}/RA-2/${year}`,
    items: allBillItems,
    subTotal: workDoneTotalA,
    taxGst,
    grandTotal,
    tenderTargetAmount,
    tenderPercentage,
    page1Total,
    workDoneTotalA,
    aboveTenderAmount,
    netTotal,
    roundOff
  };

  return {
    billData,
    page1Items,
    page2Items,
    page1Total,
    page2ItemsTotal,
    workDoneTotalA,
    tenderPercentage,
    aboveTenderAmount,
    netTotal,
    taxGst,
    roundOff,
    grandTotal,
    tenderTargetAmount,
    tenderTargetAchieved,
    progressPercent,
    varianceAmount
  };
}

/**
 * Storage helpers for Location-specific Tender Target Budget
 */
const TENDER_TARGET_KEY_PREFIX = 'dgvcl_tender_target_';
const TENDER_PERCENT_KEY_PREFIX = 'dgvcl_tender_percent_';

export function getTenderTargetForLocation(locationId: string): number {
  try {
    const raw = localStorage.getItem(`${TENDER_TARGET_KEY_PREFIX}${locationId}`);
    if (raw) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return 2000000; // default ₹20 Lakhs
}

export function saveTenderTargetForLocation(locationId: string, amount: number): void {
  try {
    localStorage.setItem(`${TENDER_TARGET_KEY_PREFIX}${locationId}`, String(amount));
  } catch {
    // ignore
  }
}

export function getTenderPercentForLocation(locationId: string): number {
  try {
    const raw = localStorage.getItem(`${TENDER_PERCENT_KEY_PREFIX}${locationId}`);
    if (raw) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return 20; // default 20%
}

export function saveTenderPercentForLocation(locationId: string, percent: number): void {
  try {
    localStorage.setItem(`${TENDER_PERCENT_KEY_PREFIX}${locationId}`, String(percent));
  } catch {
    // ignore
  }
}
