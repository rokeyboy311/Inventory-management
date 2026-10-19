/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Persistent Central Database Engine for Division → Sub-Division → Location Inventory System
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  Division, 
  SubDivision, 
  Location, 
  Transformer, 
  Material, 
  MaterialVariant, 
  DailyEntry, 
  DailyEntryItem, 
  TransformerReading, 
  StockTransaction, 
  FileRegistryRecord, 
  AuditLogRecord, 
  BillRecord,
  InventorySubmission,
  InventoryItemValue
} from '../types/inventory.js';
import { Team } from '../types/team.js';
import { LocationWorkbook } from '../types/performa.js';
import { createDolvanSamplePerforma, createDefaultBillSheet } from '../utils/dolvanTemplate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  divisions: Division[];
  subdivisions: SubDivision[];
  locations: Location[];
  transformers: Transformer[];
  materials: Material[];
  dailyEntries: DailyEntry[];
  transformerReadings: TransformerReading[];
  stockTransactions: StockTransaction[];
  fileRegistry: FileRegistryRecord[];
  auditLogs: AuditLogRecord[];
  bills: BillRecord[];
  teams?: Team[];
  workbooks?: LocationWorkbook[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial Seed Data directly from "DOLVAN INVENTERY.xlsx" & "BILL FORM AND GST DOLVAN.xls"
function createInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString();

  const division: Division = {
    id: 'div-vyara',
    name: 'VYARA',
    code: 'VYR',
    status: 'active',
    googleDriveFolderId: 'gdrive-folder-vyara',
    createdAt: now,
    updatedAt: now
  };

  const subdivision: SubDivision = {
    id: 'sub-dolvan',
    divisionId: 'div-vyara',
    name: 'DOLVAN',
    code: 'DLV',
    status: 'active',
    googleDriveFolderId: 'gdrive-folder-dolvan',
    createdAt: now,
    updatedAt: now
  };

  const locations: Location[] = [
    {
      id: 'loc-kandha-konchal',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      name: 'KANDHA KONCHAL',
      code: 'KK-01',
      address: 'Kandha Konchal Village TC Point',
      status: 'active',
      googleDriveFolderId: 'gdrive-folder-kandha-konchal',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'loc-kandha-nishal',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      name: 'KANDHA NISHAL FALIYU',
      code: 'KNF-02',
      address: 'Kandha Nishal School Faliya TC',
      status: 'active',
      googleDriveFolderId: 'gdrive-folder-kandha-nishal',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'loc-kandha-dhadhar',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      name: 'KANDHA DHADHAR FALIYU',
      code: 'KDF-03',
      address: 'Kandha Dhadhar Faliya TC',
      status: 'active',
      googleDriveFolderId: 'gdrive-folder-kandha-dhadhar',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'loc-pidadara-chodiyavad',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      name: 'PIDADARA CHODIYAVAD',
      code: 'PC-04',
      address: 'Pidadara Chodiyavad Faliya TC',
      status: 'active',
      googleDriveFolderId: 'gdrive-folder-pidadara-chodiyavad',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'loc-pidadara-patel',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      name: 'PIDADARA PATEL FALIYA',
      code: 'PPF-05',
      address: 'Pidadara Patel Faliya TC',
      status: 'active',
      googleDriveFolderId: 'gdrive-folder-pidadara-patel',
      createdAt: now,
      updatedAt: now
    }
  ];

  const transformers: Transformer[] = [
    {
      id: 'tc-2508',
      locationId: 'loc-kandha-konchal',
      serialNumber: '2508',
      make: 'GETCO',
      capacity: '100 KVA',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tc-3120',
      locationId: 'loc-kandha-nishal',
      serialNumber: '3120',
      make: 'Voltamp',
      capacity: '63 KVA',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tc-5510',
      locationId: 'loc-kandha-dhadhar',
      serialNumber: '5510',
      make: 'BHEL',
      capacity: '100 KVA',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tc-1845',
      locationId: 'loc-pidadara-chodiyavad',
      serialNumber: '1845',
      make: 'Crompton',
      capacity: '100 KVA',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tc-4921',
      locationId: 'loc-pidadara-patel',
      serialNumber: '4921',
      make: 'GETCO',
      capacity: '63 KVA',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  ];

  const materials: Material[] = [
    {
      id: 'mat-bushing',
      name: 'Replacement of bushing goti',
      category: 'TC Maintenance',
      unit: 'Nos.',
      status: 'active',
      referenceField: 'Sheet1!BushingGoti',
      openingStock: 80,
      currentStock: 68,
      variants: [
        { id: 'var-bushing-ht', materialId: 'mat-bushing', variantName: 'HT', unit: 'Nos.', status: 'active' },
        { id: 'var-bushing-lt', materialId: 'mat-bushing', variantName: 'LT', unit: 'Nos.', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-al-patta',
      name: 'Providing LT side AL. Patta KVA',
      category: 'TC Maintenance',
      unit: 'Nos.',
      status: 'active',
      referenceField: 'Sheet1!ALPatta',
      openingStock: 50,
      currentStock: 42,
      variants: [
        { id: 'var-al-100', materialId: 'mat-al-patta', variantName: '100 KVA', unit: 'Nos.', status: 'active' },
        { id: 'var-al-63', materialId: 'mat-al-patta', variantName: '63 KVA', unit: 'Nos.', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-earth',
      name: 'Check and Tight Earth Connection',
      category: 'Earthing',
      unit: 'Job',
      status: 'active',
      referenceField: 'Sheet1!EarthConnection',
      openingStock: 30,
      currentStock: 26,
      variants: [
        { id: 'var-earth-tighten', materialId: 'mat-earth', variantName: 'Tighten & Test', unit: 'Job', status: 'active' },
        { id: 'var-earth-new', materialId: 'mat-earth', variantName: 'New Earth Pit', unit: 'Job', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-cable',
      name: 'Replacement of LT damaged cable',
      category: 'Cabling',
      unit: 'Meter',
      status: 'active',
      referenceField: 'Sheet1!LTDamagedCable',
      openingStock: 500,
      currentStock: 435,
      variants: [
        { id: 'var-cable-70', materialId: 'mat-cable', variantName: 'C-1 (70 sq mm)', unit: 'Meter', status: 'active' },
        { id: 'var-cable-150', materialId: 'mat-cable', variantName: 'C-2 (150 sq mm)', unit: 'Meter', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-termination',
      name: 'Providing of new termination R,Y,B,N',
      category: 'Cabling',
      unit: 'Sets',
      status: 'active',
      referenceField: 'Sheet1!Termination',
      openingStock: 60,
      currentStock: 54,
      variants: [
        { id: 'var-term-70', materialId: 'mat-termination', variantName: '70 sq mm (4-Core)', unit: 'Sets', status: 'active' },
        { id: 'var-term-150', materialId: 'mat-termination', variantName: '150 sq mm (4-Core)', unit: 'Sets', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-stud',
      name: 'Half Stud / Fasteners',
      category: 'Hardware',
      unit: 'Nos.',
      status: 'active',
      referenceField: 'Sheet1!HalfStud',
      openingStock: 120,
      currentStock: 112,
      variants: [
        { id: 'var-stud-std', materialId: 'mat-stud', variantName: 'Standard M.S.', unit: 'Nos.', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-breather',
      name: 'Breather & Silica Gel',
      category: 'Maintenance',
      unit: 'Kg',
      status: 'active',
      referenceField: 'Sheet1!SilicaGel',
      openingStock: 40,
      currentStock: 35,
      variants: [
        { id: 'var-breather-gel', materialId: 'mat-breather', variantName: 'Silica Gel Replenish', unit: 'Kg', status: 'active' },
        { id: 'var-breather-unit', materialId: 'mat-breather', variantName: 'Complete Breather', unit: 'Nos.', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'mat-box',
      name: 'Distribution Terminal Box',
      category: 'Enclosures',
      unit: 'Nos.',
      status: 'active',
      referenceField: 'Sheet1!Box',
      openingStock: 25,
      currentStock: 22,
      variants: [
        { id: 'var-box-4way', materialId: 'mat-box', variantName: '4-Way Junction Box', unit: 'Nos.', status: 'active' },
        { id: 'var-box-8way', materialId: 'mat-box', variantName: '8-Way DB Box', unit: 'Nos.', status: 'active' }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];

  // Daily entries reflecting real site work
  const dailyEntries: DailyEntry[] = [
    {
      id: 'ENTRY-20261007-001',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-kandha-konchal',
      transformerId: 'tc-2508',
      entryDate: '2026-10-07',
      enteredBy: 'Rajesh Patel (Lead Electrical)',
      locationType: 'Maintenance',
      remarks: 'Complete bushing overhaul and 70 sq mm LT cable replacement',
      version: 1,
      syncStatus: 'Synced',
      createdAt: '2026-10-07T09:15:00.000Z',
      updatedAt: '2026-10-07T09:15:00.000Z',
      items: [
        { id: 'item-1', entryId: 'ENTRY-20261007-001', materialId: 'mat-bushing', materialName: 'Replacement of bushing goti', variantId: 'var-bushing-ht', variantName: 'HT', quantity: 3, unit: 'Nos.', remark: 'Flashover replacement' },
        { id: 'item-2', entryId: 'ENTRY-20261007-001', materialId: 'mat-bushing', materialName: 'Replacement of bushing goti', variantId: 'var-bushing-lt', variantName: 'LT', quantity: 4, unit: 'Nos.', remark: 'Worn threads' },
        { id: 'item-3', entryId: 'ENTRY-20261007-001', materialId: 'mat-al-patta', materialName: 'Providing LT side AL. Patta KVA', variantId: 'var-al-100', variantName: '100 KVA', quantity: 4, unit: 'Nos.', remark: 'Replaced pitted bus' },
        { id: 'item-4', entryId: 'ENTRY-20261007-001', materialId: 'mat-earth', materialName: 'Check and Tight Earth Connection', variantId: 'var-earth-tighten', variantName: 'Tighten & Test', quantity: 1, unit: 'Job', remark: 'Grounding verified < 2.5 ohms' },
        { id: 'item-5', entryId: 'ENTRY-20261007-001', materialId: 'mat-cable', materialName: 'Replacement of LT damaged cable', variantId: 'var-cable-70', variantName: 'C-1 (70 sq mm)', quantity: 25, unit: 'Meter', remark: 'Burnt lead replaced' },
        { id: 'item-6', entryId: 'ENTRY-20261007-001', materialId: 'mat-termination', materialName: 'Providing of new termination R,Y,B,N', variantId: 'var-term-70', variantName: '70 sq mm (4-Core)', quantity: 1, unit: 'Sets', remark: 'Complete heat shrink' }
      ]
    },
    {
      id: 'ENTRY-20261007-002',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-kandha-nishal',
      transformerId: 'tc-3120',
      entryDate: '2026-10-07',
      enteredBy: 'Vikram Singh (Field Tech)',
      locationType: 'Maintenance',
      remarks: 'Neutral terminal tightening and silica gel replenishment',
      version: 1,
      syncStatus: 'Synced',
      createdAt: '2026-10-07T11:30:00.000Z',
      updatedAt: '2026-10-07T11:30:00.000Z',
      items: [
        { id: 'item-7', entryId: 'ENTRY-20261007-002', materialId: 'mat-bushing', materialName: 'Replacement of bushing goti', variantId: 'var-bushing-lt', variantName: 'LT', quantity: 2, unit: 'Nos.' },
        { id: 'item-8', entryId: 'ENTRY-20261007-002', materialId: 'mat-earth', materialName: 'Check and Tight Earth Connection', variantId: 'var-earth-tighten', variantName: 'Tighten & Test', quantity: 1, unit: 'Job' },
        { id: 'item-9', entryId: 'ENTRY-20261007-002', materialId: 'mat-breather', materialName: 'Breather & Silica Gel', variantId: 'var-breather-gel', variantName: 'Silica Gel Refill', quantity: 3, unit: 'Kg', remark: 'Moisture saturated gel renewed' },
        { id: 'item-10', entryId: 'ENTRY-20261007-002', materialId: 'mat-cable', materialName: 'Replacement of LT damaged cable', variantId: 'var-cable-70', variantName: 'C-1 (70 sq mm)', quantity: 15, unit: 'Meter' }
      ]
    },
    {
      id: 'ENTRY-20261008-003',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-pidadara-chodiyavad',
      transformerId: 'tc-1845',
      entryDate: '2026-10-08',
      enteredBy: 'Rajesh Patel (Lead Electrical)',
      locationType: 'Maintenance',
      remarks: 'Routine servicing and lug termination inspection',
      version: 1,
      syncStatus: 'Synced',
      createdAt: '2026-10-08T08:20:00.000Z',
      updatedAt: '2026-10-08T08:20:00.000Z',
      items: [
        { id: 'item-11', entryId: 'ENTRY-20261008-003', materialId: 'mat-bushing', materialName: 'Replacement of bushing goti', variantId: 'var-bushing-ht', variantName: 'HT', quantity: 2, unit: 'Nos.' },
        { id: 'item-12', entryId: 'ENTRY-20261008-003', materialId: 'mat-cable', materialName: 'Replacement of LT damaged cable', variantId: 'var-cable-150', variantName: 'C-2 (150 sq mm)', quantity: 20, unit: 'Meter' },
        { id: 'item-13', entryId: 'ENTRY-20261008-003', materialId: 'mat-termination', materialName: 'Providing of new termination R,Y,B,N', variantId: 'var-term-150', variantName: '150 sq mm (4-Core)', quantity: 1, unit: 'Sets' }
      ]
    }
  ];

  // Transformer Volt-Amp Readings strictly adhering to Sheet 2
  const transformerReadings: TransformerReading[] = [
    {
      id: 'READ-20261007-001',
      srNo: 1,
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-kandha-konchal',
      locationName: 'KANDHA KONCHAL',
      transformerId: 'tc-2508',
      transformerSerial: '2508',
      transformerMake: 'GETCO',
      transformerCapacity: '100 KVA',
      readingDate: '2026-10-07',
      readingTime: '09:45',
      voltageRN: 240,
      voltageYN: 241,
      voltageBN: 242,
      ampereR: 40.8,
      ampereY: 29.5,
      ampereB: 34.3,
      ampereN: 8.4,
      enteredBy: 'Rajesh Patel',
      remarks: 'Load balanced across phases; temperature normal',
      version: 1,
      createdAt: '2026-10-07T09:45:00.000Z',
      updatedAt: '2026-10-07T09:45:00.000Z'
    },
    {
      id: 'READ-20261007-002',
      srNo: 2,
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-kandha-nishal',
      locationName: 'KANDHA NISHAL FALIYU',
      transformerId: 'tc-3120',
      transformerSerial: '3120',
      transformerMake: 'Voltamp',
      transformerCapacity: '63 KVA',
      readingDate: '2026-10-07',
      readingTime: '11:50',
      voltageRN: 238,
      voltageYN: 239,
      voltageBN: 240,
      ampereR: 32.1,
      ampereY: 30.5,
      ampereB: 28.9,
      ampereN: 5.2,
      enteredBy: 'Vikram Singh',
      remarks: 'Normal peak agricultural feeder load',
      version: 1,
      createdAt: '2026-10-07T11:50:00.000Z',
      updatedAt: '2026-10-07T11:50:00.000Z'
    },
    {
      id: 'READ-20261008-003',
      srNo: 3,
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-pidadara-chodiyavad',
      locationName: 'PIDADARA CHODIYAVAD',
      transformerId: 'tc-1845',
      transformerSerial: '1845',
      transformerMake: 'Crompton',
      transformerCapacity: '100 KVA',
      readingDate: '2026-10-08',
      readingTime: '08:35',
      voltageRN: 242,
      voltageYN: 243,
      voltageBN: 241,
      ampereR: 44.2,
      ampereY: 38.0,
      ampereB: 41.5,
      ampereN: 6.8,
      enteredBy: 'Rajesh Patel',
      remarks: 'Morning domestic pump peak load',
      version: 1,
      createdAt: '2026-10-08T08:35:00.000Z',
      updatedAt: '2026-10-08T08:35:00.000Z'
    }
  ];

  // Stock Transactions linking daily entries to OUT and receipts to IN
  const stockTransactions: StockTransaction[] = [
    {
      id: 'STK-TX-001',
      materialId: 'mat-bushing',
      materialName: 'Replacement of bushing goti',
      variantId: 'var-bushing-ht',
      variantName: 'HT',
      type: 'IN',
      quantity: 80,
      unit: 'Nos.',
      referenceType: 'stock_receipt',
      referenceId: 'PO-2026-001',
      date: '2026-10-01',
      enteredBy: 'Store Supervisor',
      notes: 'Initial warehouse stock receipt',
      createdAt: now
    },
    {
      id: 'STK-TX-002',
      materialId: 'mat-bushing',
      materialName: 'Replacement of bushing goti',
      variantId: 'var-bushing-ht',
      variantName: 'HT',
      type: 'OUT',
      quantity: 3,
      unit: 'Nos.',
      referenceType: 'daily_entry',
      referenceId: 'ENTRY-20261007-001',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      locationId: 'loc-kandha-konchal',
      date: '2026-10-07',
      enteredBy: 'Rajesh Patel',
      notes: 'Consumed at Kandha Konchal TC 2508',
      createdAt: now
    }
  ];

  // File Registry: 2 dedicated files per location
  const fileRegistry: FileRegistryRecord[] = [];
  for (const loc of locations) {
    const cleanFolder = loc.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    
    // File 1: Inventory Usage Log (Sheet 1)
    fileRegistry.push({
      id: `file-inv-${loc.id}`,
      divisionId: loc.divisionId,
      subdivisionId: loc.subdivisionId,
      locationId: loc.id,
      locationName: loc.name,
      fileType: 'inventory_usage',
      fileName: `${cleanFolder}_Inventory_Usage.xlsx`,
      googleDriveFolderId: loc.googleDriveFolderId,
      googleDriveFileId: `gdrive-file-${loc.id}-inv`,
      lastSyncedAt: now,
      syncStatus: 'Synced',
      recordsCount: dailyEntries.filter(e => e.locationId === loc.id).length
    });

    // File 2: Volt-Amp Readings Log (Sheet 2)
    fileRegistry.push({
      id: `file-volt-${loc.id}`,
      divisionId: loc.divisionId,
      subdivisionId: loc.subdivisionId,
      locationId: loc.id,
      locationName: loc.name,
      fileType: 'volt_amp_reading',
      fileName: `${cleanFolder}_Volt_Amp_Readings.xlsx`,
      googleDriveFolderId: loc.googleDriveFolderId,
      googleDriveFileId: `gdrive-file-${loc.id}-volt`,
      lastSyncedAt: now,
      syncStatus: 'Synced',
      recordsCount: transformerReadings.filter(r => r.locationId === loc.id).length
    });
  }

  // Initial Audit Log
  const auditLogs: AuditLogRecord[] = [
    {
      id: 'AUDIT-INIT-001',
      user: 'System Admin',
      action: 'INITIALIZE_CENTRAL_DATABASE',
      entity: 'Database',
      entityId: 'SYSTEM',
      timestamp: now,
      newValue: 'Bootstrapped Division VYARA -> Sub-Division DOLVAN with 5 Locations and Material Master'
    }
  ];

  // Bills: Form & GST reference module
  const bills: BillRecord[] = [
    {
      id: 'BILL-2026-001',
      billNumber: 'BILL/DLV/2026/042',
      date: '2026-10-07',
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      contractorName: 'M/s Patel Electrical Works & Services',
      contractorGstin: '24AAACP1234F1Z8',
      items: [
        { id: 'bi-1', description: 'Replacement of Bushing goti (HT & LT)', quantity: 9, unit: 'Nos.', unitRate: 450, amount: 4050 },
        { id: 'bi-2', description: 'Providing LT side AL. Patta 100 KVA', quantity: 4, unit: 'Nos.', unitRate: 850, amount: 3400 },
        { id: 'bi-3', description: 'Check and Tight Earth Connection', quantity: 2, unit: 'Job', unitRate: 350, amount: 700 },
        { id: 'bi-4', description: 'Replacement of LT damaged cable 70 sq mm', quantity: 40, unit: 'Meter', unitRate: 120, amount: 4800 },
        { id: 'bi-5', description: 'Providing of new termination 70 sq mm (4-Core)', quantity: 2, unit: 'Sets', unitRate: 650, amount: 1300 }
      ],
      subtotal: 14250,
      cgstRate: 9,
      cgstAmount: 1282.5,
      sgstRate: 9,
      sgstAmount: 1282.5,
      totalGst: 2565,
      roundOff: 0,
      netAmount: 16815,
      remarks: 'Dolvan Section Monthly Maintenance Bill Oct 2026',
      status: 'Approved',
      createdAt: now,
      updatedAt: now
    }
  ];

  const defaultTeams: Team[] = [
    {
      id: 'team-dolvan-maintenance',
      name: 'Dolvan Maintenance Team',
      code: 'DLV-01',
      division: 'VYARA',
      subdivision: 'DOLVAN',
      inChargeEngineer: {
        name: 'Er. R. K. Patel',
        designation: 'Deputy Executive Engineer',
        contactNumber: '+91 98250 12345',
        email: 'rkpatel@dgvcl.co.in'
      },
      members: ['Kishan Kumar', 'Ramesh Bhai', 'Pravin Solanki'],
      locationExcelIds: ['dolvan'],
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'team-vyara-central',
      name: 'Vyara Maintenance Team',
      code: 'VYR-01',
      division: 'VYARA',
      subdivision: 'VYARA',
      members: ['Suresh Gamit', 'Bharat Vasava'],
      locationExcelIds: ['kandha_konchal'],
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  ];

  const defaultWorkbooks: LocationWorkbook[] = [
    {
      locationId: 'dolvan',
      teamId: 'team-dolvan-maintenance',
      locationName: 'Dolvan',
      workbookName: 'Dolvan.xlsx',
      activeSheetName: 'inventory',
      sheets: {
        inventory: {
          name: 'inventory',
          type: 'inventory',
          performas: [createDolvanSamplePerforma('Dolvan')],
          isCompatible: true,
          rawRowsCount: 1
        },
        bill: {
          name: 'bill',
          type: 'bill',
          performas: [],
          isCompatible: true,
          rawRowsCount: 11,
          billData: createDefaultBillSheet('Dolvan')
        }
      },
      lastModified: now
    }
  ];

  return {
    divisions: [division],
    subdivisions: [subdivision],
    locations,
    transformers,
    materials,
    dailyEntries,
    transformerReadings,
    stockTransactions,
    fileRegistry,
    auditLogs,
    bills,
    teams: defaultTeams,
    workbooks: defaultWorkbooks
  };
}

export class DatabaseStore {
  private static data: DatabaseSchema;
  private static isLoaded = false;

  public static initialize(): DatabaseSchema {
    ensureDataDir();

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        DatabaseStore.data = JSON.parse(raw);
        let needsSave = false;

        // Ensure teams & workbooks collections exist in existing DB
        if (!Array.isArray(DatabaseStore.data.teams) || DatabaseStore.data.teams.length === 0) {
          const seed = createInitialSeedData();
          DatabaseStore.data.teams = seed.teams;
          needsSave = true;
        }
        if (!Array.isArray(DatabaseStore.data.workbooks)) {
          const seed = createInitialSeedData();
          DatabaseStore.data.workbooks = seed.workbooks;
          needsSave = true;
        }

        DatabaseStore.isLoaded = true;
        if (needsSave) {
          DatabaseStore.saveToDisk();
        }
        console.log(`[Database] Loaded persistent database from ${DB_FILE}`);
        return DatabaseStore.data;
      } catch (err) {
        console.error('[Database] Failed to parse DB file, rebuilding seed:', err);
      }
    }

    // Seed if absent or corrupt
    DatabaseStore.data = createInitialSeedData();
    DatabaseStore.saveToDisk();
    DatabaseStore.isLoaded = true;
    console.log(`[Database] Initialized new persistent database at ${DB_FILE}`);
    return DatabaseStore.data;
  }

  public static get(): DatabaseSchema {
    if (!DatabaseStore.isLoaded) {
      return DatabaseStore.initialize();
    }
    return DatabaseStore.data;
  }

  public static getStorageStats(): { fileSizeBytes: number; teamsCount: number; workbooksCount: number; performasCount: number } {
    const db = DatabaseStore.get();
    let fileSizeBytes = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        fileSizeBytes = fs.statSync(DB_FILE).size;
      }
    } catch {
      // ignore
    }
    const teamsCount = (db.teams || []).length;
    const workbooksCount = (db.workbooks || []).length;
    const performasCount = (db.workbooks || []).reduce((acc, wb) => {
      const inv = wb.sheets?.['inventory'] || wb.sheets?.['Performas'];
      return acc + (inv?.performas?.length || 0);
    }, 0);

    return { fileSizeBytes, teamsCount, workbooksCount, performasCount };
  }

  public static optimizeAndCompact(): { beforeBytes: number; afterBytes: number } {
    const beforeBytes = DatabaseStore.getStorageStats().fileSizeBytes;
    const db = DatabaseStore.get();

    // 1. Prune audit logs to latest 100 entries to prevent storage bloat
    if (Array.isArray(db.auditLogs) && db.auditLogs.length > 100) {
      db.auditLogs = db.auditLogs.slice(0, 100);
    }

    // 2. Deduplicate teams by id
    if (Array.isArray(db.teams)) {
      const seenTeams = new Map<string, Team>();
      for (const t of db.teams) {
        if (t && t.id) seenTeams.set(t.id, t);
      }
      db.teams = Array.from(seenTeams.values());
    }

    // 3. Deduplicate workbooks & compact performas inside each workbook
    if (Array.isArray(db.workbooks)) {
      const seenWbs = new Map<string, LocationWorkbook>();
      for (const wb of db.workbooks) {
        if (!wb || !wb.locationId) continue;
        const cleanSheets: Record<string, any> = {};
        for (const [sName, sheet] of Object.entries(wb.sheets || {})) {
          if (!sheet) continue;
          const seenPerformaIds = new Set<string>();
          const cleanPerformas = [];
          for (const p of sheet.performas || []) {
            if (!p || !p.id) continue;
            const normId = p.id.trim().toLowerCase();
            if (!normId || seenPerformaIds.has(normId)) continue;
            seenPerformaIds.add(normId);
            cleanPerformas.push({
              ...p,
              id: p.id.trim(),
              status: 'saved',
              items: (p.items || []).map(it => ({
                id: it.id,
                srNo: it.srNo,
                ...(it.subIndex !== undefined ? { subIndex: it.subIndex } : {}),
                description: it.description,
                unit: it.unit,
                materialYes: !!it.materialYes,
                labourYes: !!it.labourYes,
                qty: Number(it.qty) || 0,
                remarks: (it.remarks || '').trim()
              }))
            });
          }
          cleanSheets[sName] = {
            ...sheet,
            performas: cleanPerformas,
            rawRowsCount: sheet.type === 'bill' ? (sheet.billData?.items?.length || 0) : cleanPerformas.length
          };
        }
        seenWbs.set(wb.locationId, {
          ...wb,
          sheets: cleanSheets
        });
      }
      db.workbooks = Array.from(seenWbs.values());
    }

    DatabaseStore.saveToDisk();
    const afterBytes = DatabaseStore.getStorageStats().fileSizeBytes;
    return { beforeBytes, afterBytes };
  }

  public static saveToDisk(): void {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    // Write compact JSON to minimize disk usage and speed up I/O
    const serialized = JSON.stringify(DatabaseStore.data);
    try {
      fs.writeFileSync(tempFile, serialized, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Atomic write error:', err);
      try {
        fs.writeFileSync(DB_FILE, serialized, 'utf-8');
      } catch (e2) {
        console.error('[Database] Direct write error:', e2);
      }
    }
  }

  // Audit Log helper
  public static logAudit(user: string, action: string, entity: string, entityId: string, oldValue?: any, newValue?: any) {
    const entry: AuditLogRecord = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: user || 'Anonymous',
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    DatabaseStore.data.auditLogs.unshift(entry);
    if (DatabaseStore.data.auditLogs.length > 500) {
      DatabaseStore.data.auditLogs.pop();
    }
  }

  // Helper to convert DailyEntries to InventorySubmission format for compatibility with UI
  public static getSubmissionsFormatted(): InventorySubmission[] {
    const db = DatabaseStore.get();
    const locMap = new Map(db.locations.map(l => [l.id, l]));
    const tcMap = new Map(db.transformers.map(t => [t.id, t]));

    return db.dailyEntries.map(entry => {
      const loc = locMap.get(entry.locationId);
      const tc = entry.transformerId ? tcMap.get(entry.transformerId) : undefined;
      const locationName = loc ? loc.name : entry.locationId;

      const items: InventoryItemValue[] = entry.items.map(it => ({
        itemId: it.materialId,
        itemName: it.materialName,
        fieldType: 'dual',
        value: it.quantity,
        selectedType: it.variantName || null,
        unit: it.unit
      }));

      return {
        id: entry.id,
        timestamp: entry.createdAt,
        divisionId: entry.divisionId,
        subdivisionId: entry.subdivisionId,
        locationId: entry.locationId,
        location: locationName,
        locationType: entry.locationType,
        transformerId: entry.transformerId,
        transformerSerial: tc?.serialNumber,
        submittedBy: entry.enteredBy,
        notes: entry.remarks,
        version: entry.version,
        syncStatus: entry.syncStatus,
        items
      };
    });
  }
}
