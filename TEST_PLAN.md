# COMPREHENSIVE TEST PLAN & VERIFICATION REPORT

**Project:** Division Location Inventory & Material Consumption System  
**Test Suite:** End-to-End Functional, Structural, Multi-User & Data Integrity Tests

---

## 1. Master Data Hierarchy Tests

| Test Case | Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-01: Division CRUD** | Create Division `VYARA`, edit code `VYR`, deactivate | Division created with persistent ID `div-vyara`; soft deactivation preserves historical transactions | **PASS** |
| **TC-02: Sub-Division Linking** | Create Sub-Division `DOLVAN` under `VYARA` | UI and backend enforce valid parent `divisionId` | **PASS** |
| **TC-03: Duplicate Prevention** | Submit duplicate Sub-Division `DOLVAN` under same `divisionId` | Server responds with `HTTP 409 Conflict` duplicate error | **PASS** |
| **TC-04: Location Uniqueness** | Add `KANDHA KONCHAL` under `DOLVAN` | Successfully registered with dedicated Google Drive folder ID | **PASS** |
| **TC-05: Transformer Association** | Associate TC `#2508` (GETCO / 100 KVA) with `KANDHA KONCHAL` | Linked via `locationId`, displays in Quick Entry TC picker | **PASS** |

---

## 2. Daily Work & Material Consumption Tests

| Test Case | Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-06: Atomic Multi-Row Save** | Enter Bushing HT (2), Bushing LT (4), Earth (1), Cable (15m), Termination (1) in one form submission | One `DailyEntry` created with 5 child line items atomically | **PASS** |
| **TC-07: Stock Auto-Deduction** | Verify Material Master stock balances after TC-06 save | Bushing stock decreased by 6, Cable decreased by 15; corresponding `OUT` transactions logged | **PASS** |
| **TC-08: Zero/Empty Field Handling** | Leave optional rows blank | Only entered items with quantity > 0 are persisted to transaction | **PASS** |
| **TC-09: Date Traceability** | Log work on 07-Oct and 08-Oct for same location | Historical records remain distinct over dates without overwriting | **PASS** |
| **TC-10: Two-File Target File Routing** | Submit "In house" entry and "Maintenance" entry | In house routes to `[Location]_Inventory_Usage.xlsx`; Maintenance routes to `[Location]_Maintenance_Log.xlsx` | **PASS** |

---

## 3. Volt-Amp Reading Register Tests (Sheet 2)

| Test Case | Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-11: Volt-Amp Logging** | Record RN: 240V, YN: 241V, BN: 242V, R: 40.8A, Y: 29.5A, B: 34.3A, N: 8.4A | Appends new record to `TransformerReading` table; never overwrites past readings | **PASS** |
| **TC-12: Multi-Date Chronology** | Record readings for TC 2508 on 07-Oct and 08-Oct | Both readings visible chronologically in Volt-Amp view | **PASS** |
| **TC-13: Reading Excel Export** | Click Export Excel on Volt-Amp Register | Generates `.xlsx` matching Reference Sheet 2 with merged Voltage and Ampere headers | **PASS** |

---

## 4. Multi-User & Synchronization Tests

| Test Case | Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-14: SSE Real-Time Sync** | User A submits Quick Entry | Server emits `ENTRY_CREATED` and `STOCK_UPDATED`; User B UI updates automatically | **PASS** |
| **TC-15: Version Conflict Check** | User A and User B edit same entry simultaneously | Second submitter receives `HTTP 409 Conflict` warning to refresh | **PASS** |
| **TC-16: Offline Queue & Recovery** | Disconnect internet, save entry, reconnect | Queued with `Offline Queued` status; flushed automatically upon reconnection | **PASS** |

---

## 5. Excel Generation & Validation Tests

| Test Case | Procedure | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **TC-17: Hierarchical Merged Header** | Export Location Excel workbook | Row 1 contains merged material titles; Row 2 contains sub-options (HT, LT, 70, 150) | **PASS** |
| **TC-18: Pre-Download Safety Audit** | Execute `validateExcelWorkbook(wb)` | Validates dimension references, sheets, and headers before triggering download | **PASS** |
| **TC-19: Complete Package ZIP Export** | Download All Locations Package (.ZIP) | Emits zip file containing folder structure with the 2 dedicated Excel files per location | **PASS** |
