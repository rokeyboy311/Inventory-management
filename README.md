# Division Location Inventory & Material Consumption System

A centralized, production-grade Electrical Inventory Management and Daily Material Consumption web application organized by:

$$\text{Division} \longrightarrow \text{Sub-Division} \longrightarrow \text{Location} \longrightarrow \text{Transformer} \longrightarrow \text{Daily Work Entry} \longrightarrow \text{Material Used}$$

This system records exactly what materials were used, how much was used, where it was used, on which date, and by whom at electrical work sites across **Division (VYARA)** and **Sub-Division (DOLVAN)**.

---

## ⚡ Key Highlights & Core Capabilities

1. **Central Centralized Database**:
   - Replaced all transient in-memory arrays with a persistent atomic-write database layer (`data/database.json`).
   - Browser `localStorage` is used solely for optimistic offline caching and auto-sync queue.
2. **Two Persistent Location Files**:
   Each site location maintains exactly two persistent files:
   - `[Location]_Inventory_Usage.xlsx` (Sheet 1 Transformer Maintenance & Material Usage)
   - `[Location]_Volt_Amp_Readings.xlsx` (Sheet 2 Operational Voltage & Current Log)
3. **Dedicated Volt-Amp Operational Log**:
   - Dedicated workflow for recording Phase-to-Neutral AC Voltages (RN, YN, BN) and Load Currents (R, Y, B, N).
   - Chronological historical entries; past readings are never overwritten.
4. **Material Master & Variant Ledger**:
   - Materials mapped directly from the reference workbooks: Bushing goti (HT / LT), AL Patta (100 KVA / 63 KVA), Earth Connection (Tighten & Test), LT Damaged Cable (70 sq mm / 150 sq mm), Termination (70 / 150), Half Stud, Silica Gel & Breathers, Terminal Boxes.
   - Real-time stock balance tracking: $\text{Current Stock} = \text{Opening Stock} + \text{IN} + \text{RETURN} - \text{OUT} + \text{ADJUSTMENT}$.
   - Daily work entries automatically generate `OUT` transactions.
5. **Contractor Maintenance Bill Form & GST Module**:
   - Reference billing module for contractor maintenance works with Schedule Rates, CGST (9%), SGST (9%), and total bill certification based on `BILL FORM AND GST DOLVAN.xls`.
6. **Multi-User Real-Time Sync & Conflict Protection**:
   - Server-Sent Events (SSE) push live updates to all connected browser clients.
   - Version concurrency check prevents silent overwriting between field engineers.
7. **Offline Queue & Resilient Cloud Sync**:
   - Offline form submissions are queued and automatically synchronized when connectivity returns.
   - Support for Google Drive folder hierarchy creation and Google Sheets relational synchronization.

---

## 📂 Project Directory Structure

```
├── data/
│   └── database.json              # Persistent Authoritative Central Database
├── src/
│   ├── components/
│   │   ├── MainNavigationHeader.tsx  # 6-Tab Navigation (Dashboard, Quick Entry, Locations, Volt-Amp, Stock, Billing)
│   │   ├── DashboardView.tsx         # Inventory KPI metrics, Top Consumed Materials, Recent Entries
│   │   ├── QuickEntryView.tsx        # Fast field entry: Division -> Sub-Div -> Location -> Date -> Materials
│   │   ├── LocationExplorerView.tsx  # Hierarchy Explorer (Division -> Sub-Div -> Locations & 2 files each)
│   │   ├── ReadingsView.tsx          # Dedicated Sheet 2 Volt-Amp Reading Register & Excel Export
│   │   ├── MaterialsStockView.tsx    # Material Master & Stock Ledger (IN, OUT, ADJUSTMENT, RETURN)
│   │   ├── BillingView.tsx           # Contractor Maintenance Bill Form & GST (CGST/SGST 9%)
│   │   ├── LocationFileViewerModal.tsx # 2-Tier Hierarchical Merged Spreadsheet Viewer
│   │   ├── ItemSettingsModal.tsx     # Material & Dynamic Row settings
│   │   ├── GoogleDriveSyncModal.tsx  # Google Drive / Sheets sync setup & restore
│   │   └── DynamicInventoryForm.tsx  # Field input rendering engine
│   ├── services/
│   │   ├── syncService.ts            # Client sync controller & offline queue
│   │   └── googleSheetsSync.ts       # Google Apps Script Web App client
│   ├── server/
│   │   ├── db.ts                     # Persistent database store & seed data engine
│   │   └── googleIntegration.ts      # Server-side Google Drive & Sheets API engine
│   ├── types/
│   │   └── inventory.ts              # Strongly-typed TypeScript interfaces
│   └── utils/
│       ├── excelExporter.ts          # 2-Tier hierarchical Excel (.xlsx) builder with pre-export validation
│       └── googleAppsScriptTemplate.ts # Google Apps Script template for zero-cost cloud storage
├── ARCHITECTURE.md                   # System Architecture Documentation
├── DATA_MODEL.md                     # Central Database Schema Specification
├── REFERENCE_FIELD_MAPPING.md        # Reference Workbook Field Mapping
├── GOOGLE_DRIVE_SHEETS_SETUP.md      # Zero-Cost Cloud Setup Guide
├── SYNC_WORKFLOW.md                  # Multi-User & Offline Sync Flow
├── EXCEL_FORMAT_SPEC.md              # Excel Format Specification & Validation
├── TEST_PLAN.md                      # Comprehensive Test Plan & Verification Report
├── server.ts                         # Express Full-Stack Server with REST API & SSE
└── package.json
```

---

## 🚀 Running the Application

### Development Server
```bash
npm run dev
```

### Production Build & Verification
```bash
npm run lint
npm run build
npm start
```
The server runs on port 3000.
