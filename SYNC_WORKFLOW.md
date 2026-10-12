# MULTI-USER & OFFLINE SYNCHRONIZATION WORKFLOW

**Project:** Division Location Inventory & Material Consumption System  

---

## 1. Quick Entry Save & Update Flow

```
User submits Quick Entry
        │
        ▼
Validation (Location selected, valid quantities > 0, units intact)
        │
        ▼
Server REST Endpoint: POST /api/inventory/entries or POST /api/entries
        │
        ├── 1. Generate stable Entry ID: ENTRY-YYYYMMDD-XXX
        ├── 2. Map material items and specifications
        ├── 3. Deduct stock balances and log OUT transaction in StockLedger
        ├── 4. Update FileRegistry record for target location file
        ├── 5. Atomic persist to disk in data/database.json
        ├── 6. Append audit log entry
        │
        ▼
Server-Sent Events (SSE) Broadcast:
        │
        ├── Dispatches 'ENTRY_CREATED' to all connected browser clients
        └── Dispatches 'STOCK_UPDATED' to update real-time material balances
        │
        ▼
Asynchronous Cloud Sync:
        └── Appends relational row to Central Google Spreadsheet
            └── Updates existing Google Drive File
```

---

## 2. Multi-User Shared Data Flow

- **Scenario:** User A logs 15m of LT Cable at `KANDHA KONCHAL`.
- **Immediate Reaction:**
  1. Server broadcasts `ENTRY_CREATED` event over `/api/sync/events`.
  2. User B, C, and D's browsers automatically receive the payload without refreshing.
  3. UI updates the Recent Entries feed, Location folder metrics, and decreases LT Cable stock in the Stock Register.
  4. Both users see the exact same central authoritative figures.

---

## 3. Conflict Protection Workflow (Phase 26)

Every mutable entity carries:
- `version` (integer counter)
- `updatedAt` (ISO timestamp)
- `enteredBy` (user identity)

When User A attempts an update:
```
Client Payload: { id: "ENTRY-...", version: 1, ... }
Server State:   { id: "ENTRY-...", version: 2, ... }  <-- User B already updated it!
```
- Server rejects update with `HTTP 409 Conflict`.
- UI informs User A:
  *«This record was modified by another user. Please refresh before saving.»*
- Protects newer data from being silently overwritten.

---

## 4. Offline Recovery Flow (Phase 29 & 30)

```
Device loses network connectivity (navigator.onLine === false)
        │
        ▼
User saves Daily Work Entry
        │
        ▼
Cached in localStorage: site_inventory_offline_queue_v1
Status marked: 'Offline Queued'
UI Notification: "Saved locally. Cloud sync pending."
        │
        ▼
Device reconnects to Internet ('online' event triggered)
        │
        ▼
SyncService.flushOfflineQueue()
        │
        ▼
Server processes batch at /api/inventory/batch-sync
        │
        ▼
Server returns HTTP 200 with synced count
        │
        ▼
Offline queue purged. Status updated to 'Synced'.
```
