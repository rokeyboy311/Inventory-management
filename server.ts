import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { DatabaseStore } from './src/server/db.js';
import { GoogleCloudIntegration } from './src/server/googleIntegration.js';
import { 
  Division, 
  SubDivision, 
  Location, 
  Transformer, 
  Material, 
  DailyEntry, 
  DailyEntryItem, 
  TransformerReading, 
  StockTransaction, 
  BillRecord,
  InventorySubmission,
  InventoryItemValue
} from './src/types/inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize persistent database
DatabaseStore.initialize();

// SSE Connected Clients set
const sseClients = new Set<Response>();

export function broadcastSync(payloadData: unknown, eventType: string = 'inventory_sync') {
  const payload = JSON.stringify({ type: eventType, data: payloadData, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper to sanitize folder name
export function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
}

// -------------------------------------------------------------
// Excel Export Helpers (Preserving Hierarchical Merged Headers)
// -------------------------------------------------------------
export function generateLocationUsageExcel(locationId: string) {
  const db = DatabaseStore.get();
  const loc = db.locations.find(l => l.id === locationId || l.name.toLowerCase() === locationId.toLowerCase());
  const locName = loc ? loc.name : locationId;
  const entries = db.dailyEntries.filter(e => e.locationId === loc?.id || e.locationId === locationId);

  // Reference Sheet 1 style column structure
  const headersRow1 = [
    'SR NO',
    'Location of TC',
    'TC Serial Number',
    'Date',
    'Type',
    'Replacement of bushing goti',
    'Replacement of bushing goti',
    'Providing LT side AL. Patta KVA',
    'Check and Tight Earth Connection',
    'Replacement of LT damaged cable',
    'Replacement of LT damaged cable',
    'Providing of new termination R,Y,B,N',
    'Providing of new termination R,Y,B,N',
    'Half Stud',
    'Silica Gel / Breather',
    'Remarks',
    'Entered By'
  ];

  const headersRow2 = [
    'No.',
    'Site Name',
    'TC No.',
    'Date',
    'Category',
    'HT',
    'LT',
    '100 KVA',
    'Nos.',
    'C-1(70)',
    'C-2(150)',
    '70',
    '150',
    'M.S.',
    'Kg',
    'Notes',
    'User'
  ];

  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
    { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // Bushing HT/LT
    { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // Cable 70/150
    { s: { r: 0, c: 11 }, e: { r: 0, c: 12 } }, // Termination 70/150
    { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } },
    { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } },
    { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } },
    { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }
  ];

  const dataRows: (string | number)[][] = [];

  entries.forEach((entry, idx) => {
    const tc = db.transformers.find(t => t.id === entry.transformerId);
    const itemMap = new Map<string, number>();

    entry.items.forEach(it => {
      const key = `${it.materialId}:${it.variantName || ''}`.toLowerCase();
      itemMap.set(key, (itemMap.get(key) || 0) + it.quantity);
      itemMap.set(it.materialId.toLowerCase(), (itemMap.get(it.materialId.toLowerCase()) || 0) + it.quantity);
    });

    dataRows.push([
      idx + 1,
      locName,
      tc ? tc.serialNumber : 'General TC',
      entry.entryDate,
      entry.locationType,
      itemMap.get('mat-bushing:ht') || itemMap.get('bushing:ht') || '',
      itemMap.get('mat-bushing:lt') || itemMap.get('bushing:lt') || '',
      itemMap.get('mat-al-patta:100 kva') || itemMap.get('mat-al-patta') || '',
      itemMap.get('mat-earth:tighten & test') || itemMap.get('mat-earth') || '',
      itemMap.get('mat-cable:c-1 (70 sq mm)') || itemMap.get('mat-cable:70') || '',
      itemMap.get('mat-cable:c-2 (150 sq mm)') || itemMap.get('mat-cable:150') || '',
      itemMap.get('mat-termination:70 sq mm (4-core)') || '',
      itemMap.get('mat-termination:150 sq mm (4-core)') || '',
      itemMap.get('mat-stud:standard m.s.') || itemMap.get('mat-stud') || '',
      itemMap.get('mat-breather:silica gel replenish') || itemMap.get('mat-breather') || '',
      entry.remarks || '',
      entry.enteredBy
    ]);
  });

  return { headersRow1, headersRow2, merges, dataRows, locName };
}

export function generateLocationReadingsExcel(locationId: string) {
  const db = DatabaseStore.get();
  const loc = db.locations.find(l => l.id === locationId || l.name.toLowerCase() === locationId.toLowerCase());
  const locName = loc ? loc.name : locationId;
  const readings = db.transformerReadings.filter(r => r.locationId === loc?.id || r.locationId === locationId);

  const headersRow1 = [
    'Sr. no.',
    'Location',
    'Make',
    'TC Serial No.',
    'Capacity',
    'Date / Time',
    'Voltage',
    'Voltage',
    'Voltage',
    'Ampere',
    'Ampere',
    'Ampere',
    'Ampere',
    'Entered By',
    'Remark'
  ];

  const headersRow2 = [
    'No.',
    'Site',
    'Make',
    'Serial',
    'KVA',
    'Timestamp',
    'RN',
    'YN',
    'BN',
    'R',
    'Y',
    'B',
    'N',
    'Technician',
    'Status'
  ];

  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
    { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } },  // Voltage RN, YN, BN
    { s: { r: 0, c: 9 }, e: { r: 0, c: 12 } }, // Ampere R, Y, B, N
    { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } },
    { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } }
  ];

  const dataRows: (string | number)[][] = readings.map((r, i) => [
    i + 1,
    r.locationName,
    r.transformerMake,
    r.transformerSerial,
    r.transformerCapacity,
    `${r.readingDate} ${r.readingTime || ''}`.trim(),
    r.voltageRN,
    r.voltageYN,
    r.voltageBN,
    r.ampereR,
    r.ampereY,
    r.ampereB,
    r.ampereN,
    r.enteredBy,
    r.remarks || ''
  ]);

  return { headersRow1, headersRow2, merges, dataRows, locName };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Health check & system overview
app.get('/api/health', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    divisions: db.divisions.length,
    subdivisions: db.subdivisions.length,
    locations: db.locations.length,
    transformers: db.transformers.length,
    materials: db.materials.length,
    dailyEntries: db.dailyEntries.length,
    transformerReadings: db.transformerReadings.length,
    connectedClients: sseClients.size
  });
});

// 2. Divisions Management
app.get('/api/divisions', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, divisions: db.divisions });
});

app.post('/api/divisions', (req: Request, res: Response) => {
  try {
    const { name, code, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Division name and code are required.' });
    }

    const db = DatabaseStore.get();
    const existing = db.divisions.find(d => d.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: `Division "${name}" already exists.` });
    }

    const newDivision: Division = {
      id: `div-${Date.now()}`,
      name: String(name).trim().toUpperCase(),
      code: String(code).trim().toUpperCase(),
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.divisions.push(newDivision);
    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(req.body.user || 'Admin', 'CREATE_DIVISION', 'Division', newDivision.id, null, newDivision);
    broadcastSync(newDivision, 'DIVISION_CREATED');

    return res.status(201).json({ success: true, division: newDivision });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

app.put('/api/divisions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.get();
  const div = db.divisions.find(d => d.id === id);
  if (!div) return res.status(404).json({ success: false, error: 'Division not found' });

  const old = { ...div };
  if (req.body.name) div.name = String(req.body.name).trim().toUpperCase();
  if (req.body.code) div.code = String(req.body.code).trim().toUpperCase();
  if (req.body.status) div.status = req.body.status;
  div.updatedAt = new Date().toISOString();

  DatabaseStore.saveToDisk();
  DatabaseStore.logAudit(req.body.user || 'Admin', 'UPDATE_DIVISION', 'Division', div.id, old, div);
  broadcastSync(div, 'DIVISION_UPDATED');

  res.json({ success: true, division: div });
});

// 3. Sub-Divisions Management
app.get('/api/subdivisions', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, subdivisions: db.subdivisions });
});

app.post('/api/subdivisions', (req: Request, res: Response) => {
  try {
    const { divisionId, name, code, status } = req.body;
    if (!divisionId || !name || !code) {
      return res.status(400).json({ success: false, error: 'divisionId, name and code are required.' });
    }

    const db = DatabaseStore.get();
    const parentDiv = db.divisions.find(d => d.id === divisionId);
    if (!parentDiv) {
      return res.status(404).json({ success: false, error: 'Parent Division does not exist.' });
    }

    const existing = db.subdivisions.find(s => s.divisionId === divisionId && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: `Sub-Division "${name}" already exists in this Division.` });
    }

    const newSub: SubDivision = {
      id: `sub-${Date.now()}`,
      divisionId,
      name: String(name).trim().toUpperCase(),
      code: String(code).trim().toUpperCase(),
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.subdivisions.push(newSub);
    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(req.body.user || 'Admin', 'CREATE_SUBDIVISION', 'SubDivision', newSub.id, null, newSub);
    broadcastSync(newSub, 'SUBDIVISION_CREATED');

    return res.status(201).json({ success: true, subdivision: newSub });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 4. Locations Management
app.get('/api/locations', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, locations: db.locations });
});

app.post('/api/locations', (req: Request, res: Response) => {
  try {
    const { divisionId, subdivisionId, name, code, address, status } = req.body;
    if (!subdivisionId || !name) {
      return res.status(400).json({ success: false, error: 'subdivisionId and name are required.' });
    }

    const db = DatabaseStore.get();
    const sub = db.subdivisions.find(s => s.id === subdivisionId);
    if (!sub) return res.status(404).json({ success: false, error: 'Sub-Division does not exist.' });

    const parentDivId = divisionId || sub.divisionId;
    const existing = db.locations.find(l => l.subdivisionId === subdivisionId && l.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: `Location "${name}" already exists in this Sub-Division.` });
    }

    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      divisionId: parentDivId,
      subdivisionId,
      name: String(name).trim().toUpperCase(),
      code: code ? String(code).trim().toUpperCase() : `LOC-${Math.floor(10 + Math.random() * 90)}`,
      address: address ? String(address).trim() : undefined,
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.locations.push(newLoc);

    // Register 2 files in FileRegistry for this new location
    const cleanFolder = sanitizeFolderName(newLoc.name);
    db.fileRegistry.push({
      id: `file-inv-${newLoc.id}`,
      divisionId: newLoc.divisionId,
      subdivisionId: newLoc.subdivisionId,
      locationId: newLoc.id,
      locationName: newLoc.name,
      fileType: 'inventory_usage',
      fileName: `${cleanFolder}_Inventory_Usage.xlsx`,
      lastSyncedAt: newLoc.createdAt,
      syncStatus: 'Synced',
      recordsCount: 0
    });
    db.fileRegistry.push({
      id: `file-volt-${newLoc.id}`,
      divisionId: newLoc.divisionId,
      subdivisionId: newLoc.subdivisionId,
      locationId: newLoc.id,
      locationName: newLoc.name,
      fileType: 'volt_amp_reading',
      fileName: `${cleanFolder}_Volt_Amp_Readings.xlsx`,
      lastSyncedAt: newLoc.createdAt,
      syncStatus: 'Synced',
      recordsCount: 0
    });

    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(req.body.user || 'Admin', 'CREATE_LOCATION', 'Location', newLoc.id, null, newLoc);
    broadcastSync(newLoc, 'LOCATION_CREATED');

    return res.status(201).json({ success: true, location: newLoc });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 5. Transformers Master
app.get('/api/transformers', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, transformers: db.transformers });
});

app.post('/api/transformers', (req: Request, res: Response) => {
  try {
    const { locationId, serialNumber, make, capacity, status } = req.body;
    if (!locationId || !serialNumber || !capacity) {
      return res.status(400).json({ success: false, error: 'locationId, serialNumber and capacity are required.' });
    }

    const db = DatabaseStore.get();
    const newTC: Transformer = {
      id: `tc-${Date.now()}`,
      locationId,
      serialNumber: String(serialNumber).trim(),
      make: String(make || 'Standard').trim(),
      capacity: String(capacity).trim(),
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.transformers.push(newTC);
    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(req.body.user || 'Admin', 'CREATE_TRANSFORMER', 'Transformer', newTC.id, null, newTC);
    broadcastSync(newTC, 'TRANSFORMER_CREATED');

    return res.status(201).json({ success: true, transformer: newTC });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 6. Materials Master & Variants
app.get('/api/materials', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, materials: db.materials });
});

app.post('/api/materials', (req: Request, res: Response) => {
  try {
    const { name, category, unit, variants, openingStock } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ success: false, error: 'Material name and unit are required.' });
    }

    const db = DatabaseStore.get();
    const matId = `mat-${Date.now()}`;
    const initialStock = Number(openingStock) || 0;

    const variantList = Array.isArray(variants) ? variants.map((v: any, i: number) => ({
      id: v.id || `var-${matId}-${i}`,
      materialId: matId,
      variantName: String(typeof v === 'string' ? v : v.variantName).trim(),
      unit: v.unit || unit,
      status: 'active' as const
    })) : [];

    const newMaterial: Material = {
      id: matId,
      name: String(name).trim(),
      category: String(category || 'General').trim(),
      unit: String(unit).trim(),
      status: 'active',
      variants: variantList,
      openingStock: initialStock,
      currentStock: initialStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.materials.push(newMaterial);
    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(req.body.user || 'Admin', 'CREATE_MATERIAL', 'Material', newMaterial.id, null, newMaterial);
    broadcastSync(newMaterial, 'MATERIAL_CREATED');

    return res.status(201).json({ success: true, material: newMaterial });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 7. Daily Work Entries (The Main Feature - Atomic & Transactional)
app.get('/api/entries', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, count: db.dailyEntries.length, entries: db.dailyEntries });
});

app.post('/api/entries', async (req: Request, res: Response) => {
  try {
    const { 
      divisionId, 
      subdivisionId, 
      locationId, 
      transformerId, 
      entryDate, 
      enteredBy, 
      locationType, 
      remarks, 
      items 
    } = req.body;

    if (!locationId || !entryDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'locationId, entryDate, and at least one item in items array are required.'
      });
    }

    const db = DatabaseStore.get();
    let targetLoc = db.locations.find(l => l.id === locationId || l.name.toLowerCase() === String(locationId).toLowerCase());
    
    // Auto-create location if field user entered a new site location
    if (!targetLoc) {
      const cleanName = String(locationId).trim().toUpperCase();
      const firstSub = db.subdivisions[0];
      targetLoc = {
        id: `loc-${Date.now()}`,
        divisionId: firstSub ? firstSub.divisionId : 'div-vyara',
        subdivisionId: firstSub ? firstSub.id : 'sub-dolvan',
        name: cleanName,
        code: `LOC-${Math.floor(100 + Math.random() * 900)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.locations.push(targetLoc);
    }

    const finalDivId = divisionId || targetLoc.divisionId;
    const finalSubId = subdivisionId || targetLoc.subdivisionId;
    const newEntryId = `ENTRY-${entryDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    // Build Entry Items and validate quantities
    const entryItems: DailyEntryItem[] = [];
    const stockOutTransactions: StockTransaction[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = Number(it.quantity !== undefined ? it.quantity : it.value) || 0;
      if (qty <= 0 && (!it.value || it.value === '')) continue; // Skip blank zero rows

      const mat = db.materials.find(m => m.id === it.materialId || m.name.toLowerCase() === String(it.materialName || it.itemName).toLowerCase());
      const matName = mat ? mat.name : (it.materialName || it.itemName || 'Custom Item');
      const matId = mat ? mat.id : (it.materialId || `mat-${i}`);
      const unit = it.unit || mat?.unit || 'Nos.';
      const variantName = it.variantName || it.selectedType || undefined;

      const entryItem: DailyEntryItem = {
        id: `item-${newEntryId}-${i + 1}`,
        entryId: newEntryId,
        materialId: matId,
        materialName: matName,
        variantName,
        quantity: qty,
        unit,
        remark: it.remark
      };
      entryItems.push(entryItem);

      // Create Stock OUT transaction
      stockOutTransactions.push({
        id: `TX-OUT-${newEntryId}-${i + 1}`,
        materialId: matId,
        materialName: matName,
        variantName,
        type: 'OUT',
        quantity: qty,
        unit,
        referenceType: 'daily_entry',
        referenceId: newEntryId,
        divisionId: finalDivId,
        subdivisionId: finalSubId,
        locationId: targetLoc.id,
        date: entryDate,
        enteredBy: enteredBy || 'Site Personnel',
        notes: `Used for daily work at ${targetLoc.name}`,
        createdAt: new Date().toISOString()
      });

      // Deduct stock if tracked material
      if (mat) {
        mat.currentStock = Math.max(0, mat.currentStock - qty);
        mat.updatedAt = new Date().toISOString();
      }
    }

    const newDailyEntry: DailyEntry = {
      id: newEntryId,
      divisionId: finalDivId,
      subdivisionId: finalSubId,
      locationId: targetLoc.id,
      transformerId,
      entryDate,
      enteredBy: String(enteredBy || 'Field Engineer').trim(),
      locationType: locationType === 'Maintenance' ? 'Maintenance' : 'In house',
      remarks: remarks ? String(remarks).trim() : undefined,
      version: 1,
      syncStatus: 'Synced',
      items: entryItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.dailyEntries.unshift(newDailyEntry);
    db.stockTransactions.push(...stockOutTransactions);

    // Update File Registry count
    const fileReg = db.fileRegistry.find(f => f.locationId === targetLoc!.id && f.fileType === 'inventory_usage');
    if (fileReg) {
      fileReg.recordsCount += 1;
      fileReg.lastSyncedAt = newDailyEntry.createdAt;
    }

    // Persist to disk atomically
    DatabaseStore.saveToDisk();

    // Log Audit
    DatabaseStore.logAudit(
      newDailyEntry.enteredBy,
      'CREATE_DAILY_ENTRY',
      'DailyEntry',
      newDailyEntry.id,
      null,
      { location: targetLoc.name, itemsCount: entryItems.length }
    );

    // Real-Time SSE broadcast
    broadcastSync(newDailyEntry, 'ENTRY_CREATED');
    broadcastSync({ action: 'stock_deducted', transactions: stockOutTransactions }, 'STOCK_UPDATED');

    // Cloud background sync
    GoogleCloudIntegration.syncDailyEntry(newDailyEntry).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Daily entry saved and stock updated at ${targetLoc.name}.`,
      entry: newDailyEntry
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// Update an existing Daily Entry with Version Conflict Protection
app.put('/api/entries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.get();
  const entry = db.dailyEntries.find(e => e.id === id);

  if (!entry) {
    return res.status(404).json({ success: false, error: 'Daily Entry not found' });
  }

  // Conflict Protection Check (Phase 26)
  if (req.body.version !== undefined && Number(req.body.version) !== entry.version) {
    return res.status(409).json({
      success: false,
      conflict: true,
      error: 'This record was modified by another user. Please refresh before saving.'
    });
  }

  const oldEntry = JSON.parse(JSON.stringify(entry));

  if (req.body.remarks !== undefined) entry.remarks = req.body.remarks;
  if (req.body.locationType !== undefined) entry.locationType = req.body.locationType;
  if (req.body.enteredBy !== undefined) entry.enteredBy = req.body.enteredBy;
  if (req.body.entryDate !== undefined) entry.entryDate = req.body.entryDate;
  if (req.body.items && Array.isArray(req.body.items)) {
    entry.items = req.body.items;
  }

  entry.version += 1;
  entry.updatedAt = new Date().toISOString();

  DatabaseStore.saveToDisk();
  DatabaseStore.logAudit(entry.enteredBy, 'UPDATE_DAILY_ENTRY', 'DailyEntry', entry.id, oldEntry, entry);
  broadcastSync(entry, 'ENTRY_UPDATED');

  return res.json({ success: true, entry });
});

// Delete a Daily Entry (Soft Delete / Historical audit protection)
app.delete('/api/entries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.get();
  const index = db.dailyEntries.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Entry not found' });
  }

  const deleted = db.dailyEntries.splice(index, 1)[0];
  DatabaseStore.saveToDisk();
  DatabaseStore.logAudit(req.body.user || 'Admin', 'DELETE_DAILY_ENTRY', 'DailyEntry', id, deleted, null);
  broadcastSync({ id }, 'ENTRY_DELETED');

  return res.json({ success: true, message: 'Daily Entry removed.', deleted });
});

// 8. Transformer Volt-Amp Readings (Dedicated Workflow per Phase 4)
app.get('/api/readings', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, count: db.transformerReadings.length, readings: db.transformerReadings });
});

app.post('/api/readings', (req: Request, res: Response) => {
  try {
    const {
      locationId,
      transformerId,
      readingDate,
      readingTime,
      voltageRN,
      voltageYN,
      voltageBN,
      ampereR,
      ampereY,
      ampereB,
      ampereN,
      enteredBy,
      remarks
    } = req.body;

    if (!locationId || !readingDate || voltageRN === undefined || ampereR === undefined) {
      return res.status(400).json({
        success: false,
        error: 'locationId, readingDate, Voltage RN and Ampere R readings are required.'
      });
    }

    const db = DatabaseStore.get();
    const loc = db.locations.find(l => l.id === locationId || l.name.toLowerCase() === String(locationId).toLowerCase());
    const tc = transformerId ? db.transformers.find(t => t.id === transformerId) : undefined;
    const locName = loc ? loc.name : String(locationId);

    const newReading: TransformerReading = {
      id: `READ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      srNo: db.transformerReadings.length + 1,
      divisionId: loc ? loc.divisionId : 'div-vyara',
      subdivisionId: loc ? loc.subdivisionId : 'sub-dolvan',
      locationId: loc ? loc.id : locationId,
      locationName: locName,
      transformerId: tc ? tc.id : 'tc-general',
      transformerSerial: tc ? tc.serialNumber : (req.body.transformerSerial || 'General'),
      transformerMake: tc ? tc.make : (req.body.transformerMake || 'Standard'),
      transformerCapacity: tc ? tc.capacity : (req.body.transformerCapacity || '100 KVA'),
      readingDate,
      readingTime: readingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voltageRN: Number(voltageRN) || 0,
      voltageYN: Number(voltageYN) || 0,
      voltageBN: Number(voltageBN) || 0,
      ampereR: Number(ampereR) || 0,
      ampereY: Number(ampereY) || 0,
      ampereB: Number(ampereB) || 0,
      ampereN: Number(ampereN) || 0,
      enteredBy: String(enteredBy || 'Technician').trim(),
      remarks: remarks ? String(remarks).trim() : undefined,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.transformerReadings.unshift(newReading);

    // Update File Registry count
    const fileReg = db.fileRegistry.find(f => f.locationId === loc?.id && f.fileType === 'volt_amp_reading');
    if (fileReg) {
      fileReg.recordsCount += 1;
      fileReg.lastSyncedAt = newReading.createdAt;
    }

    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(newReading.enteredBy, 'CREATE_READING', 'TransformerReading', newReading.id, null, newReading);
    broadcastSync(newReading, 'READING_CREATED');

    GoogleCloudIntegration.syncReading(newReading).catch(() => {});

    return res.status(201).json({ success: true, message: 'Volt-Amp Reading recorded.', reading: newReading });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 9. Stock Inventory Status & Transactions
app.get('/api/stock', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({
    success: true,
    materials: db.materials.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      unit: m.unit,
      openingStock: m.openingStock,
      currentStock: m.currentStock,
      variants: m.variants
    })),
    recentTransactions: db.stockTransactions.slice(-20)
  });
});

app.post('/api/stock/transaction', (req: Request, res: Response) => {
  try {
    const { materialId, type, quantity, notes, enteredBy, variantName } = req.body;
    if (!materialId || !type || !quantity) {
      return res.status(400).json({ success: false, error: 'materialId, type (IN, OUT, ADJUSTMENT, RETURN) and quantity required.' });
    }

    const db = DatabaseStore.get();
    const mat = db.materials.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ success: false, error: 'Material not found.' });

    const qty = Number(quantity);
    if (type === 'IN' || type === 'RETURN') {
      mat.currentStock += qty;
    } else if (type === 'OUT') {
      mat.currentStock = Math.max(0, mat.currentStock - qty);
    } else if (type === 'ADJUSTMENT') {
      mat.currentStock = qty; // direct stock count adjustment
    }

    const tx: StockTransaction = {
      id: `STK-TX-${Date.now()}`,
      materialId: mat.id,
      materialName: mat.name,
      variantName,
      type,
      quantity: qty,
      unit: mat.unit,
      referenceType: 'manual_adjustment',
      date: new Date().toISOString().slice(0, 10),
      enteredBy: enteredBy || 'Inventory Controller',
      notes,
      createdAt: new Date().toISOString()
    };

    db.stockTransactions.push(tx);
    DatabaseStore.saveToDisk();
    DatabaseStore.logAudit(enteredBy || 'Admin', 'STOCK_ADJUSTMENT', 'Material', mat.id, null, { type, quantity: qty, balance: mat.currentStock });
    broadcastSync(tx, 'STOCK_UPDATED');

    return res.status(201).json({ success: true, material: mat, transaction: tx });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 10. File Registry & Google Drive Sync Status
app.get('/api/file-registry', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, files: db.fileRegistry });
});

app.get('/api/cloud/status', (_req: Request, res: Response) => {
  res.json({ success: true, status: GoogleCloudIntegration.getStatus() });
});

app.post('/api/cloud/sync-hierarchy', async (_req: Request, res: Response) => {
  const result = await GoogleCloudIntegration.syncHierarchyFolders();
  res.json(result);
});

// 11. Bill Reference Module (BILL FORM AND GST DOLVAN.xls)
app.get('/api/bills', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, bills: db.bills });
});

app.post('/api/bills', (req: Request, res: Response) => {
  try {
    const { billNumber, date, contractorName, contractorGstin, items, cgstRate = 9, sgstRate = 9, remarks } = req.body;
    if (!billNumber || !contractorName || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'billNumber, contractorName, and items are required.' });
    }

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unitRate)), 0);
    const cgstAmount = Math.round((subtotal * (Number(cgstRate) / 100)) * 100) / 100;
    const sgstAmount = Math.round((subtotal * (Number(sgstRate) / 100)) * 100) / 100;
    const totalGst = cgstAmount + sgstAmount;
    const netAmount = Math.round(subtotal + totalGst);

    const newBill: BillRecord = {
      id: `BILL-${Date.now()}`,
      billNumber: String(billNumber).trim(),
      date: date || new Date().toISOString().slice(0, 10),
      divisionId: 'div-vyara',
      subdivisionId: 'sub-dolvan',
      contractorName: String(contractorName).trim(),
      contractorGstin: String(contractorGstin || '').trim(),
      items: items.map((it: any, i: number) => ({
        id: `bi-${i + 1}`,
        description: it.description,
        quantity: Number(it.quantity),
        unit: it.unit || 'Nos.',
        unitRate: Number(it.unitRate),
        amount: Number(it.quantity) * Number(it.unitRate)
      })),
      subtotal,
      cgstRate: Number(cgstRate),
      cgstAmount,
      sgstRate: Number(sgstRate),
      sgstAmount,
      totalGst,
      roundOff: netAmount - (subtotal + totalGst),
      netAmount,
      remarks,
      status: 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = DatabaseStore.get();
    db.bills.unshift(newBill);
    DatabaseStore.saveToDisk();

    return res.status(201).json({ success: true, bill: newBill });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// 12. Audit Logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  res.json({ success: true, count: db.auditLogs.length, logs: db.auditLogs });
});

// -------------------------------------------------------------
// UI Compatibility Endpoints (/api/inventory/*)
// -------------------------------------------------------------

// GET all inventory entries formatted for UI
app.get('/api/inventory/entries', (_req: Request, res: Response) => {
  const submissions = DatabaseStore.getSubmissionsFormatted();
  res.json({ success: true, count: submissions.length, submissions });
});

// POST new submission from UI Quick Entry
app.post('/api/inventory/entries', async (req: Request, res: Response) => {
  try {
    const { location, locationType, submittedBy, notes, items, id } = req.body;
    if (!location || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'location and items are required.' });
    }

    const db = DatabaseStore.get();
    let targetLoc = db.locations.find(l => l.name.toLowerCase() === String(location).trim().toLowerCase() || l.id === location);
    if (!targetLoc) {
      targetLoc = {
        id: `loc-${Date.now()}`,
        divisionId: db.divisions[0]?.id || 'div-vyara',
        subdivisionId: db.subdivisions[0]?.id || 'sub-dolvan',
        name: String(location).trim().toUpperCase(),
        code: `LOC-${Math.floor(100 + Math.random() * 900)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.locations.push(targetLoc);
    }

    const cleanType: 'In house' | 'Maintenance' = locationType === 'Maintenance' ? 'Maintenance' : 'In house';
    const entryDate = new Date().toISOString().slice(0, 10);
    const newEntryId = id || `INV-${entryDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const entryItems: DailyEntryItem[] = [];
    const stockTransactions: StockTransaction[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = Number(it.value !== undefined ? it.value : it.quantity) || 0;
      if (qty <= 0 && (!it.value || it.value === '')) continue;

      const mat = db.materials.find(m => m.id === it.itemId || m.name.toLowerCase() === String(it.itemName).toLowerCase());
      const matName = mat ? mat.name : it.itemName;
      const matId = mat ? mat.id : (it.itemId || `mat-${i}`);

      entryItems.push({
        id: `item-${newEntryId}-${i + 1}`,
        entryId: newEntryId,
        materialId: matId,
        materialName: matName,
        variantName: it.selectedType || undefined,
        quantity: qty,
        unit: it.unit || mat?.unit || 'Nos.',
        remark: it.remark
      });

      stockTransactions.push({
        id: `TX-OUT-${newEntryId}-${i + 1}`,
        materialId: matId,
        materialName: matName,
        variantName: it.selectedType || undefined,
        type: 'OUT',
        quantity: qty,
        unit: it.unit || mat?.unit || 'Nos.',
        referenceType: 'daily_entry',
        referenceId: newEntryId,
        divisionId: targetLoc.divisionId,
        subdivisionId: targetLoc.subdivisionId,
        locationId: targetLoc.id,
        date: entryDate,
        enteredBy: submittedBy || 'Site Personnel',
        createdAt: new Date().toISOString()
      });

      if (mat) {
        mat.currentStock = Math.max(0, mat.currentStock - qty);
      }
    }

    const dailyEntry: DailyEntry = {
      id: newEntryId,
      divisionId: targetLoc.divisionId,
      subdivisionId: targetLoc.subdivisionId,
      locationId: targetLoc.id,
      entryDate,
      enteredBy: String(submittedBy || 'Site Engineer').trim(),
      locationType: cleanType,
      remarks: notes ? String(notes).trim() : undefined,
      version: 1,
      syncStatus: 'Synced',
      items: entryItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.dailyEntries.unshift(dailyEntry);
    db.stockTransactions.push(...stockTransactions);
    DatabaseStore.saveToDisk();

    const formattedSubmission: InventorySubmission = {
      id: dailyEntry.id,
      timestamp: dailyEntry.createdAt,
      divisionId: targetLoc.divisionId,
      subdivisionId: targetLoc.subdivisionId,
      locationId: targetLoc.id,
      location: targetLoc.name,
      locationType: dailyEntry.locationType,
      submittedBy: dailyEntry.enteredBy,
      notes: dailyEntry.remarks,
      version: 1,
      syncStatus: 'Synced',
      items: dailyEntry.items.map(it => ({
        itemId: it.materialId,
        itemName: it.materialName,
        fieldType: 'dual',
        value: it.quantity,
        selectedType: it.variantName || null,
        unit: it.unit
      }))
    };

    broadcastSync({ action: 'created', submission: formattedSubmission }, 'submission_created');
    broadcastSync(dailyEntry, 'ENTRY_CREATED');

    const cleanFolder = sanitizeFolderName(targetLoc.name);
    const targetFile = cleanType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;

    return res.status(201).json({
      success: true,
      message: `Inventory submission saved. Synced into folder "${cleanFolder}/" in file "${targetFile}".`,
      submission: formattedSubmission,
      targetFolder: cleanFolder,
      targetFile
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET Location Explorer tree with the 2 persistent files
app.get('/api/inventory/locations-tree', (_req: Request, res: Response) => {
  const db = DatabaseStore.get();
  const divMap = new Map(db.divisions.map(d => [d.id, d]));
  const subMap = new Map(db.subdivisions.map(s => [s.id, s]));

  const folders = db.locations.map(loc => {
    const cleanFolder = sanitizeFolderName(loc.name);
    const div = divMap.get(loc.divisionId);
    const sub = subMap.get(loc.subdivisionId);

    const locEntries = db.dailyEntries.filter(e => e.locationId === loc.id);
    const inHouseEntries = locEntries.filter(e => e.locationType === 'In house');
    const maintEntries = locEntries.filter(e => e.locationType === 'Maintenance');
    const readings = db.transformerReadings.filter(r => r.locationId === loc.id);

    return {
      locationId: loc.id,
      locationName: loc.name,
      folderName: cleanFolder,
      divisionName: div ? div.name : 'VYARA',
      subdivisionName: sub ? sub.name : 'DOLVAN',
      lastUpdated: locEntries[0]?.createdAt || loc.updatedAt,
      files: [
        {
          fileName: `${cleanFolder}_Inventory_Usage.xlsx`,
          type: 'In house' as const,
          submissionsCount: inHouseEntries.length,
          itemsCount: inHouseEntries.reduce((sum, e) => sum + e.items.length, 0),
          lastUpdated: inHouseEntries[0]?.createdAt || loc.updatedAt
        },
        {
          fileName: `${cleanFolder}_Maintenance_Log.xlsx`,
          type: 'Maintenance' as const,
          submissionsCount: maintEntries.length,
          itemsCount: maintEntries.reduce((sum, e) => sum + e.items.length, 0),
          lastUpdated: maintEntries[0]?.createdAt || loc.updatedAt
        },
        {
          fileName: `${cleanFolder}_Volt_Amp_Readings.xlsx`,
          type: 'volt_amp_reading' as const,
          submissionsCount: readings.length,
          itemsCount: readings.length,
          lastUpdated: readings[0]?.createdAt || loc.updatedAt
        }
      ]
    };
  });

  res.json({ success: true, folders });
});

// Batch sync for offline queue (Phase 29)
app.post('/api/inventory/batch-sync', (req: Request, res: Response) => {
  const { submissions } = req.body;
  if (!submissions || !Array.isArray(submissions)) {
    return res.status(400).json({ success: false, error: 'Submissions array is required' });
  }

  const db = DatabaseStore.get();
  let addedCount = 0;

  for (const sub of submissions) {
    const exists = db.dailyEntries.find(e => e.id === sub.id);
    if (!exists) {
      const loc = db.locations.find(l => l.name.toLowerCase() === String(sub.location).toLowerCase()) || db.locations[0];
      const newEntry: DailyEntry = {
        id: sub.id,
        divisionId: loc.divisionId,
        subdivisionId: loc.subdivisionId,
        locationId: loc.id,
        entryDate: sub.timestamp ? sub.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
        enteredBy: sub.submittedBy || 'Field Personnel',
        locationType: sub.locationType === 'Maintenance' ? 'Maintenance' : 'In house',
        remarks: sub.notes,
        version: 1,
        syncStatus: 'Synced',
        items: (sub.items || []).map((it: any, i: number) => ({
          id: `item-${sub.id}-${i + 1}`,
          entryId: sub.id,
          materialId: it.itemId || `mat-${i}`,
          materialName: it.itemName || 'Material',
          variantName: it.selectedType,
          quantity: Number(it.value) || 0,
          unit: it.unit || 'Nos.'
        })),
        createdAt: sub.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.dailyEntries.unshift(newEntry);
      addedCount++;
    }
  }

  DatabaseStore.saveToDisk();
  broadcastSync({ addedCount }, 'batch_synced');

  res.json({
    success: true,
    message: `Synchronized ${addedCount} offline entries into persistent central storage.`,
    totalRecords: db.dailyEntries.length
  });
});

// Download a specific Location Excel File (.xlsx with hierarchical merged headers)
app.get('/api/inventory/export/location-file', (req: Request, res: Response) => {
  try {
    const location = String(req.query.location || '').trim();
    const fileType = String(req.query.fileType || req.query.type || 'usage');

    if (!location) {
      return res.status(400).json({ success: false, error: 'Location query parameter required' });
    }

    const cleanFolder = sanitizeFolderName(location);
    const wb = XLSX.utils.book_new();

    if (fileType === 'volt_amp' || fileType === 'readings') {
      const data = generateLocationReadingsExcel(location);
      const ws = XLSX.utils.aoa_to_sheet([data.headersRow1, data.headersRow2, ...data.dataRows]);
      ws['!merges'] = data.merges;
      ws['!cols'] = data.headersRow1.map((_, i) => ({ wch: Math.max(12, String(data.headersRow2[i] || '').length + 4) }));
      XLSX.utils.book_append_sheet(wb, ws, 'Volt_Amp_Readings');
      const fileName = `${cleanFolder}_Volt_Amp_Readings.xlsx`;
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } else {
      const data = generateLocationUsageExcel(location);
      const ws = XLSX.utils.aoa_to_sheet([data.headersRow1, data.headersRow2, ...data.dataRows]);
      ws['!merges'] = data.merges;
      ws['!cols'] = data.headersRow1.map((_, i) => ({ wch: Math.max(14, String(data.headersRow2[i] || '').length + 4) }));
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Usage');
      const fileName = `${cleanFolder}_Inventory_Usage.xlsx`;
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

// Download ALL Location Folders in a complete ZIP package
app.get('/api/inventory/export/all-folders-zip', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const db = DatabaseStore.get();

    for (const loc of db.locations) {
      const cleanFolder = sanitizeFolderName(loc.name);
      const folder = zip.folder(cleanFolder);

      if (folder) {
        // 1. File 1: Inventory Usage Log (.xlsx)
        const usageData = generateLocationUsageExcel(loc.id);
        const wbUsage = XLSX.utils.book_new();
        const wsUsage = XLSX.utils.aoa_to_sheet([usageData.headersRow1, usageData.headersRow2, ...usageData.dataRows]);
        wsUsage['!merges'] = usageData.merges;
        wsUsage['!cols'] = usageData.headersRow1.map((_, i) => ({ wch: Math.max(14, String(usageData.headersRow2[i] || '').length + 4) }));
        XLSX.utils.book_append_sheet(wbUsage, wsUsage, 'Inventory_Usage');
        const bufUsage = XLSX.write(wbUsage, { type: 'buffer', bookType: 'xlsx' });
        folder.file(`${cleanFolder}_Inventory_Usage.xlsx`, bufUsage);

        // 2. File 2: Volt-Amp Readings Log (.xlsx)
        const readData = generateLocationReadingsExcel(loc.id);
        const wbRead = XLSX.utils.book_new();
        const wsRead = XLSX.utils.aoa_to_sheet([readData.headersRow1, readData.headersRow2, ...readData.dataRows]);
        wsRead['!merges'] = readData.merges;
        wsRead['!cols'] = readData.headersRow1.map((_, i) => ({ wch: Math.max(12, String(readData.headersRow2[i] || '').length + 4) }));
        XLSX.utils.book_append_sheet(wbRead, wsRead, 'Volt_Amp_Readings');
        const bufRead = XLSX.write(wbRead, { type: 'buffer', bookType: 'xlsx' });
        folder.file(`${cleanFolder}_Volt_Amp_Readings.xlsx`, bufRead);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Division_Locations_Excel_Package.zip"');
    return res.send(zipBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'ZIP generation failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

// SSE Live Stream for Multi-User Real-Time Sync (Phase 25)
app.get('/api/sync/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const submissions = DatabaseStore.getSubmissionsFormatted();
  res.write(`data: ${JSON.stringify({ type: 'initial_state', data: submissions })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[Server] Division Location Inventory System running on port ${PORT}`);
  });
}

startServer();
