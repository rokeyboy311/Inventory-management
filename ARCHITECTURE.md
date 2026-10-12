# SYSTEM ARCHITECTURE

**Project:** Division Location Inventory & Material Consumption System  
**Organization Hierarchy:** Division (VYARA) → Sub-Division (DOLVAN) → Site Locations → TC Maintenance / Daily Work

---

## 1. Architectural Overview

The system is designed as a centralized, high-performance web platform tailored for electrical field maintenance crews and store controllers. It decouples client-side UI actions from authoritative backend state while preserving multi-user real-time synchronization and offline resilience.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Field Clients (Mobile / Desktop)             │
│  - Quick Entry View      - Location Folders     - Volt-Amp Log   │
│  - Material Stock        - Billing & GST        - Offline Queue  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP REST / SSE Stream
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express API & Storage Server                │
│  - Version Conflict Engine     - Transactional Batch Writer      │
│  - SSE Broadcaster             - Excel Generation Engine        │
│  - Persistent DB Layer (Atomic Write JSON Store: data/db.json)  │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
                 ▼                               ▼
┌────────────────────────────────┐ ┌──────────────────────────────┐
│  Central Google Sheets Storage │ │  Google Drive Folders        │
│  (Relational Cloud Database)   │ │  - VYARA/                    │
│  - Divisions   - Locations     │ │    └── DOLVAN/               │
│  - Materials   - DailyEntries  │ │        ├── [Location_A]/     │
│  - Readings    - StockLedger   │ │        └── [Location_B]/     │
└────────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### A. Persistent Authoritative Database
- Eliminates temporary in-memory arrays.
- Backed by an atomic write filesystem store in `data/database.json`. Every transaction writes to a temporary file before an atomic rename (`renameSync`), preventing corruptions on process restarts.
- Initial seed data is pre-populated with real-world electrical maintenance data from the `DOLVAN INVENTERY.xlsx` workbook.

### B. Two-File Identity per Location
Each site location maintains exactly two persistent files:
1. **`[Location]_Inventory_Usage.xlsx`** (Sheet 1 Transformer Maintenance & Daily Material Consumption)
2. **`[Location]_Volt_Amp_Readings.xlsx`** (Sheet 2 Operational Voltage & Load Current Log)

File metadata, IDs, and sync timestamps are tracked in the `FileRegistry`.

### C. Transactional Daily Entry & Stock Deductions
- An entry containing multiple material rows (e.g., Bushing HT, Bushing LT, 70 sq mm Cable, Lugs) is processed as **ONE atomic transaction**.
- Material quantities automatically deduct from current stock balances and create corresponding `OUT` records in the `StockTransactions` ledger.

### D. Multi-User Real-Time Synchronization (SSE)
- Server-Sent Events (`/api/sync/events`) maintain live connections with all connected browsers.
- Events broadcasted include:
  - `ENTRY_CREATED` / `ENTRY_UPDATED` / `ENTRY_DELETED`
  - `READING_CREATED`
  - `STOCK_UPDATED`
  - `LOCATION_CREATED` / `MATERIAL_CREATED`
- Client state invalidates and refreshes without full-page reloads.

### E. Optimistic Offline Mode & Auto-Recovery
- When connection drops, entries are serialized to `localStorage` under `site_inventory_offline_queue_v1` with status `Offline Queued`.
- As soon as the network returns (`online` window event), the `SyncService.flushOfflineQueue` batches items to `/api/inventory/batch-sync`.
- Records are marked `Synced` only upon server receipt confirmation.

### F. Conflict Protection
- Mutable entities carry `version` and `updatedAt` metadata.
- If a client submits an update with a mismatched version, the server responds with `HTTP 409 Conflict`, requiring the user to refresh and merge changes.
