import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Type Definitions for Location-Based Inventory Files
// -------------------------------------------------------------
export interface InventoryItemValue {
  itemId: string;
  itemName: string;
  fieldType: 'input_only' | 'dropdown_only' | 'dual';
  value: string | number;
  selectedType?: string | null;
  unit?: string;
  optionValues?: Record<string, string | number>;
}

export interface InventorySubmission {
  id: string;
  timestamp: string;
  location: string;
  locationType: 'In house' | 'Maintenance';
  submittedBy: string;
  notes?: string;
  syncStatus: 'Synced' | 'Pending' | 'Offline Queued' | 'Error';
  items: InventoryItemValue[];
}

// In-Memory Database with pre-populated locations
let inventorySubmissions: InventorySubmission[] = [
  {
    id: 'INV-20261007-001',
    timestamp: '2026-10-07T08:30:00.000Z',
    location: 'Site A - Main Substation',
    locationType: 'In house',
    submittedBy: 'Rajesh Patel (Lead Electrical)',
    notes: 'Primary transformer installation check',
    syncStatus: 'Synced',
    items: [
      { itemId: 'power', itemName: 'Power', fieldType: 'input_only', value: '450 kW' },
      { itemId: 'earth_compaction', itemName: 'Earth Compaction', fieldType: 'input_only', value: '1' },
      { itemId: 'lug', itemName: 'Lug', fieldType: 'dual', value: 35, selectedType: 'Ring - Copper 70mm' },
      { itemId: 'box', itemName: 'Box', fieldType: 'input_only', value: '12 Junction Boxes' },
      { itemId: 'cable', itemName: 'Cable', fieldType: 'dual', value: 120, selectedType: 'Armoured 4-Core 16 sq mm' }
    ]
  },
  {
    id: 'INV-20261007-002',
    timestamp: '2026-10-07T10:15:00.000Z',
    location: 'Warehouse 1 - Central Depot',
    locationType: 'Maintenance',
    submittedBy: 'Vikram Singh (Maintenance Tech)',
    notes: 'Feeder line circuit repair and ground check',
    syncStatus: 'Synced',
    items: [
      { itemId: 'power', itemName: 'Power', fieldType: 'input_only', value: '230 V' },
      { itemId: 'earth_compaction', itemName: 'Earth Compaction', fieldType: 'input_only', value: '1' },
      { itemId: 'lug', itemName: 'Lug', fieldType: 'dual', value: 18, selectedType: 'Pin - Brass 25mm' },
      { itemId: 'box', itemName: 'Box', fieldType: 'input_only', value: '4 Terminal Boxes' },
      { itemId: 'cable', itemName: 'Cable', fieldType: 'dual', value: 45, selectedType: '2.5 sq mm Flexible' }
    ]
  },
  {
    id: 'INV-20261007-003',
    timestamp: '2026-10-07T11:45:00.000Z',
    location: 'Site B - Generator Room',
    locationType: 'In house',
    submittedBy: 'Anand Kumar (Field Engineer)',
    notes: 'Auxiliary backup generator wiring test',
    syncStatus: 'Synced',
    items: [
      { itemId: 'power', itemName: 'Power', fieldType: 'input_only', value: '380 V 3-Phase' },
      { itemId: 'earth_compaction', itemName: 'Earth Compaction', fieldType: 'input_only', value: '2' },
      { itemId: 'lug', itemName: 'Lug', fieldType: 'dual', value: 24, selectedType: 'Fork - Heavy Duty' },
      { itemId: 'box', itemName: 'Box', fieldType: 'input_only', value: '6 Weatherproof Enclosures' },
      { itemId: 'cable', itemName: 'Cable', fieldType: 'dual', value: 90, selectedType: '10 sq mm Armoured' }
    ]
  },
  {
    id: 'INV-20261006-004',
    timestamp: '2026-10-06T15:20:00.000Z',
    location: 'Project Alpha - Tower C',
    locationType: 'Maintenance',
    submittedBy: 'Neha Sharma (QC Inspector)',
    notes: 'Routine earthing inspection and grounding replacement',
    syncStatus: 'Synced',
    items: [
      { itemId: 'power', itemName: 'Power', fieldType: 'input_only', value: '110 V DC' },
      { itemId: 'earth_compaction', itemName: 'Earth Compaction', fieldType: 'input_only', value: '1' },
      { itemId: 'lug', itemName: 'Lug', fieldType: 'dual', value: 50, selectedType: 'Ring - Heavy Duty 95mm' },
      { itemId: 'box', itemName: 'Box', fieldType: 'input_only', value: '8 Push Button Boxes' },
      { itemId: 'cable', itemName: 'Cable', fieldType: 'dual', value: 160, selectedType: '6 sq mm Copper' }
    ]
  }
];

// Helper to format Location and File Names
export function sanitizeFolderName(location: string): string {
  return location.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
}

// Standard default item definitions for server-side exports
const defaultServerItemDefs = [
  { id: 'power', name: 'Power', fieldType: 'input_only' },
  { id: 'earth_compaction', name: 'Earth Compaction', fieldType: 'input_only', defaultValue: '1' },
  { id: 'lug', name: 'Lug', fieldType: 'dual', options: ['100', '200', '500'] },
  { id: 'box', name: 'Box', fieldType: 'input_only' },
  { id: 'cable', name: 'Cable', fieldType: 'dual', options: ['1.5 sq mm', '2.5 sq mm', '4 sq mm', 'Armoured'] }
];

export interface ServerColumnLayout {
  itemId?: string;
  itemName?: string;
  subOption?: string;
  headerLevel1: string;
  headerLevel2: string;
}

export function buildServerHierarchicalColumnLayout(itemDefs = defaultServerItemDefs): ServerColumnLayout[] {
  const layout: ServerColumnLayout[] = [
    { headerLevel1: 'Entry_ID', headerLevel2: 'ID' },
    { headerLevel1: 'Timestamp', headerLevel2: 'Date / Time' }
  ];

  for (const item of itemDefs) {
    if (item.options && item.options.length > 0) {
      for (const opt of item.options) {
        layout.push({
          itemId: item.id,
          itemName: item.name,
          subOption: opt,
          headerLevel1: item.name,
          headerLevel2: opt
        });
      }
    } else {
      layout.push({
        itemId: item.id,
        itemName: item.name,
        headerLevel1: item.name,
        headerLevel2: 'Value'
      });
    }
  }

  layout.push(
    { headerLevel1: 'Submitted_By', headerLevel2: 'User' },
    { headerLevel1: 'Notes', headerLevel2: 'Remarks' },
    { headerLevel1: 'Sync_Status', headerLevel2: 'Status' }
  );

  return layout;
}

export function generateHierarchicalExcelData(location: string, locationType: 'In house' | 'Maintenance') {
  const matched = inventorySubmissions.filter(
    s => s.location.toLowerCase() === location.toLowerCase() && s.locationType === locationType
  );

  const columnLayout = buildServerHierarchicalColumnLayout();
  const headerRow1 = columnLayout.map(c => c.headerLevel1);
  const headerRow2 = columnLayout.map(c => c.headerLevel2);

  // Merges calculation
  const merges: XLSX.Range[] = [];
  let colIdx = 0;
  while (colIdx < columnLayout.length) {
    const currentH1 = columnLayout[colIdx].headerLevel1;
    let endCol = colIdx;
    while (endCol + 1 < columnLayout.length && columnLayout[endCol + 1].headerLevel1 === currentH1) {
      endCol++;
    }
    if (endCol > colIdx) {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: endCol } });
    } else {
      merges.push({ s: { r: 0, c: colIdx }, e: { r: 1, c: colIdx } });
    }
    colIdx = endCol + 1;
  }

  const dataRows: (string | number)[][] = [];

  for (const sub of matched) {
    const row: (string | number)[] = [];
    const itemValueMap = new Map(sub.items.map(it => [it.itemId, it]));

    for (const col of columnLayout) {
      if (col.headerLevel1 === 'Entry_ID') {
        row.push(sub.id);
      } else if (col.headerLevel1 === 'Timestamp') {
        row.push(new Date(sub.timestamp).toLocaleString());
      } else if (col.headerLevel1 === 'Submitted_By') {
        row.push(sub.submittedBy || 'Site Personnel');
      } else if (col.headerLevel1 === 'Notes') {
        row.push(sub.notes || '');
      } else if (col.headerLevel1 === 'Sync_Status') {
        row.push(sub.syncStatus);
      } else if (col.itemId) {
        const itemVal = itemValueMap.get(col.itemId);
        if (!itemVal) {
          row.push('');
          continue;
        }

        if (col.subOption) {
          if (itemVal.optionValues && itemVal.optionValues[col.subOption] !== undefined && itemVal.optionValues[col.subOption] !== '') {
            row.push(itemVal.optionValues[col.subOption]);
          } else if (itemVal.selectedType && itemVal.selectedType.toLowerCase() === col.subOption.toLowerCase()) {
            row.push(itemVal.value !== undefined ? itemVal.value : '');
          } else {
            row.push('');
          }
        } else {
          row.push(itemVal.value !== undefined ? itemVal.value : '');
        }
      } else {
        row.push('');
      }
    }

    dataRows.push(row);
  }

  return { headerRow1, headerRow2, dataRows, columnLayout, merges, matched };
}

/**
 * Generates Excel rows for a specific Location and Type with Item Name as primary column.
 * Column Mapping: Item_Name | Value_Entered | Item_Type_Selected | Timestamp | Submitted_By | Entry_ID | Notes | Sync_Status
 */
export function generateLocationSpecificExcelRows(location: string, locationType: 'In house' | 'Maintenance') {
  return generateHierarchicalExcelData(location, locationType);
}

export function generateItemMasterRegisterRows(location: string, locationType: 'In house' | 'Maintenance') {
  const headers = [
    'Item_Name',
    'Total_Logged_Count',
    'Total_Numeric_Qty',
    'Latest_Value',
    'Latest_Type_Selected',
    'Last_Updated',
    'Last_Submitted_By'
  ];

  const matched = inventorySubmissions.filter(
    s => s.location.toLowerCase() === location.toLowerCase() && s.locationType === locationType
  );

  const itemMap = new Map<string, { count: number; numericSum: number; hasNumeric: boolean; latestVal: string | number; latestType: string; lastDate: string; lastBy: string }>();

  const standardOrder = ['Power', 'Earth Compaction', 'Lug', 'Box', 'Cable'];
  for (const name of standardOrder) {
    itemMap.set(name, { count: 0, numericSum: 0, hasNumeric: false, latestVal: '-', latestType: '-', lastDate: '-', lastBy: '-' });
  }

  const sorted = [...matched].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const sub of sorted) {
    for (const item of sub.items) {
      if (!itemMap.has(item.itemName)) {
        itemMap.set(item.itemName, { count: 0, numericSum: 0, hasNumeric: false, latestVal: '-', latestType: '-', lastDate: '-', lastBy: '-' });
      }
      const cur = itemMap.get(item.itemName)!;
      cur.count += 1;
      cur.latestVal = item.value !== '' && item.value !== undefined ? item.value : cur.latestVal;
      cur.latestType = item.selectedType || cur.latestType;
      cur.lastDate = new Date(sub.timestamp).toLocaleString();
      cur.lastBy = sub.submittedBy;

      const num = Number(item.value);
      if (!isNaN(num) && item.value !== '') {
        cur.numericSum += num;
        cur.hasNumeric = true;
      }
    }
  }

  const rows: (string | number)[][] = [];
  for (const [name, data] of itemMap.entries()) {
    rows.push([
      name,
      data.count,
      data.hasNumeric ? data.numericSum : '-',
      data.latestVal,
      data.latestType,
      data.lastDate,
      data.lastBy
    ]);
  }

  return { headers, rows };
}

// SSE Connected Clients set
const sseClients = new Set<Response>();

function broadcastSync(data: unknown, eventType: string = 'inventory_sync') {
  const payload = JSON.stringify({ type: eventType, data });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -------------------------------------------------------------
// REST Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    totalSubmissions: inventorySubmissions.length,
    connectedClients: sseClients.size
  });
});

// GET all inventory entries
app.get('/api/inventory/entries', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: inventorySubmissions.length,
    submissions: inventorySubmissions
  });
});

// GET Location folders tree with the 2 files per location
app.get('/api/inventory/locations-tree', (_req: Request, res: Response) => {
  const locationMap = new Map<string, { inHouseCount: number; inHouseItems: number; maintenanceCount: number; maintenanceItems: number; lastUpdated: string }>();

  // Extract all distinct locations
  for (const sub of inventorySubmissions) {
    if (!locationMap.has(sub.location)) {
      locationMap.set(sub.location, { inHouseCount: 0, inHouseItems: 0, maintenanceCount: 0, maintenanceItems: 0, lastUpdated: sub.timestamp });
    }
    const current = locationMap.get(sub.location)!;
    if (new Date(sub.timestamp) > new Date(current.lastUpdated)) {
      current.lastUpdated = sub.timestamp;
    }
    if (sub.locationType === 'In house') {
      current.inHouseCount += 1;
      current.inHouseItems += sub.items.length;
    } else {
      current.maintenanceCount += 1;
      current.maintenanceItems += sub.items.length;
    }
  }

  const folders = Array.from(locationMap.entries()).map(([loc, data]) => {
    const cleanName = sanitizeFolderName(loc);
    return {
      locationName: loc,
      folderName: cleanName,
      lastUpdated: data.lastUpdated,
      files: [
        {
          fileName: `${cleanName}_In_House.xlsx`,
          type: 'In house' as const,
          submissionsCount: data.inHouseCount,
          itemsCount: data.inHouseItems
        },
        {
          fileName: `${cleanName}_Maintenance.xlsx`,
          type: 'Maintenance' as const,
          submissionsCount: data.maintenanceCount,
          itemsCount: data.maintenanceItems
        }
      ]
    };
  });

  res.json({ success: true, folders });
});

// POST new submission (appends into the respective Location folder & File)
app.post('/api/inventory/entries', (req: Request, res: Response) => {
  try {
    const { location, locationType, submittedBy, notes, items, id } = req.body;

    if (!location || !locationType || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: location, locationType, and items array are required.'
      });
    }

    const cleanLoc = String(location).trim();
    const cleanType: 'In house' | 'Maintenance' = locationType === 'Maintenance' ? 'Maintenance' : 'In house';
    const cleanFolder = sanitizeFolderName(cleanLoc);
    const targetFile = cleanType === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;

    const newId = id || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newSubmission: InventorySubmission = {
      id: newId,
      timestamp: new Date().toISOString(),
      location: cleanLoc,
      locationType: cleanType,
      submittedBy: String(submittedBy || 'Site Engineer').trim(),
      notes: notes ? String(notes).trim() : undefined,
      syncStatus: 'Synced',
      items: items.map((it: InventoryItemValue) => ({
        itemId: it.itemId || it.itemName.toLowerCase().replace(/\s+/g, '_'),
        itemName: it.itemName,
        fieldType: it.fieldType || 'input_only',
        value: it.value !== undefined ? it.value : '',
        selectedType: it.selectedType || null,
        unit: it.unit,
        optionValues: it.optionValues
      }))
    };

    inventorySubmissions.unshift(newSubmission);

    // Broadcast in real-time
    broadcastSync({
      action: 'created',
      submission: newSubmission,
      targetFolder: cleanFolder,
      targetFile,
      totalCount: inventorySubmissions.length
    }, 'submission_created');

    return res.status(201).json({
      success: true,
      message: `Inventory submission saved. Synced into folder "${cleanFolder}/" in file "${targetFile}".`,
      submission: newSubmission,
      targetFolder: cleanFolder,
      targetFile,
      rowsAppended: newSubmission.items.length
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
});

// PUT update an existing submission
app.put('/api/inventory/entries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = inventorySubmissions.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Submission not found' });
  }

  const { location, locationType, submittedBy, notes, items } = req.body;

  inventorySubmissions[index] = {
    ...inventorySubmissions[index],
    location: location !== undefined ? location : inventorySubmissions[index].location,
    locationType: locationType !== undefined ? locationType : inventorySubmissions[index].locationType,
    submittedBy: submittedBy !== undefined ? submittedBy : inventorySubmissions[index].submittedBy,
    notes: notes !== undefined ? notes : inventorySubmissions[index].notes,
    items: items !== undefined ? items : inventorySubmissions[index].items,
    syncStatus: 'Synced'
  };

  broadcastSync({
    action: 'updated',
    submission: inventorySubmissions[index]
  }, 'submission_updated');

  return res.json({
    success: true,
    message: 'Submission updated successfully',
    submission: inventorySubmissions[index]
  });
});

// DELETE a submission
app.delete('/api/inventory/entries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = inventorySubmissions.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Submission not found' });
  }

  const deleted = inventorySubmissions.splice(index, 1)[0];

  broadcastSync({
    action: 'deleted',
    id: id
  }, 'submission_deleted');

  return res.json({
    success: true,
    message: 'Submission deleted successfully',
    deleted
  });
});

// POST batch sync for offline queue
app.post('/api/inventory/batch-sync', (req: Request, res: Response) => {
  const { submissions } = req.body;

  if (!submissions || !Array.isArray(submissions)) {
    return res.status(400).json({ success: false, error: 'Submissions array is required' });
  }

  let addedCount = 0;
  for (const sub of submissions) {
    const existing = inventorySubmissions.find(s => s.id === sub.id);
    if (!existing) {
      inventorySubmissions.unshift({
        ...sub,
        syncStatus: 'Synced'
      });
      addedCount++;
    }
  }

  broadcastSync({
    action: 'batch_synced',
    addedCount
  }, 'batch_synced');

  return res.json({
    success: true,
    message: `Batch sync completed: ${addedCount} offline entries synchronized into respective Location Excel files.`,
    totalRecords: inventorySubmissions.length
  });
});

// Download a specific Location Excel File ([Location]_In_House.xlsx or [Location]_Maintenance.xlsx)
app.get('/api/inventory/export/location-file', (req: Request, res: Response) => {
  try {
    const location = String(req.query.location || '').trim();
    const type = req.query.type === 'Maintenance' ? 'Maintenance' : 'In house';

    if (!location) {
      return res.status(400).json({ success: false, error: 'Location query parameter required' });
    }

    const { headerRow1, headerRow2, dataRows, merges } = generateHierarchicalExcelData(location, type);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);
    ws['!merges'] = merges;
    ws['!cols'] = headerRow1.map((_, i) => ({ wch: Math.max(12, String(headerRow2[i] || '').length + 4) }));

    const sheetTitle = type === 'In house' ? 'In_House_Log' : 'Maintenance_Log';
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const cleanFolder = sanitizeFolderName(location);
    const fileName = type === 'In house' ? `${cleanFolder}_In_House.xlsx` : `${cleanFolder}_Maintenance.xlsx`;

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Export failed';
    return res.status(500).json({ success: false, error: errorMsg });
  }
});

// Download ALL Location Folders in a complete ZIP package
app.get('/api/inventory/export/all-folders-zip', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const uniqueLocations = Array.from(new Set(inventorySubmissions.map(s => s.location)));

    for (const loc of uniqueLocations) {
      const cleanFolder = sanitizeFolderName(loc);
      const folder = zip.folder(cleanFolder);

      if (folder) {
        // 1. File 1: In House
        const inHouseData = generateHierarchicalExcelData(loc, 'In house');
        const wbInHouse = XLSX.utils.book_new();
        const wsInHouse = XLSX.utils.aoa_to_sheet([inHouseData.headerRow1, inHouseData.headerRow2, ...inHouseData.dataRows]);
        wsInHouse['!merges'] = inHouseData.merges;
        wsInHouse['!cols'] = inHouseData.headerRow1.map((_, i) => ({ wch: Math.max(12, String(inHouseData.headerRow2[i] || '').length + 4) }));
        XLSX.utils.book_append_sheet(wbInHouse, wsInHouse, 'In_House_Log');
        const bufInHouse = XLSX.write(wbInHouse, { type: 'buffer', bookType: 'xlsx' });
        folder.file(`${cleanFolder}_In_House.xlsx`, bufInHouse);

        // 2. File 2: Maintenance
        const maintData = generateHierarchicalExcelData(loc, 'Maintenance');
        const wbMaint = XLSX.utils.book_new();
        const wsMaint = XLSX.utils.aoa_to_sheet([maintData.headerRow1, maintData.headerRow2, ...maintData.dataRows]);
        wsMaint['!merges'] = maintData.merges;
        wsMaint['!cols'] = maintData.headerRow1.map((_, i) => ({ wch: Math.max(12, String(maintData.headerRow2[i] || '').length + 4) }));
        XLSX.utils.book_append_sheet(wbMaint, wsMaint, 'Maintenance_Log');
        const bufMaint = XLSX.write(wbMaint, { type: 'buffer', bookType: 'xlsx' });
        folder.file(`${cleanFolder}_Maintenance.xlsx`, bufMaint);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Location_Excel_Folders_Package.zip"');
    return res.send(zipBuffer);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'ZIP generation failed';
    return res.status(500).json({ success: false, error: errorMsg });
  }
});

// SSE Live stream
app.get('/api/sync/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'initial_state', data: inventorySubmissions })}\n\n`);
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
    console.log(`Location-Based Inventory System running on http://localhost:${PORT}`);
  });
}

startServer();
