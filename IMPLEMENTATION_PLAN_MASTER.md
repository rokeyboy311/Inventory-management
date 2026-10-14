# CONSOLIDATED MASTER IMPLEMENTATION PLAN — INVENTORY MANAGEMENT SYSTEM

## 1. Baseline & Inventory Status
- **Files inventoried**: 26 components, 2 server modules, 2 client services, 4 utility files, 2 type definitions, `server.ts`, database, and markdown documents.
- **Current Baseline Status**: 
  - Database backed up at `data/backup/database.json.bak`
  - Central database has 1 division, 1 subdivision, 5 locations, 5 transformers, 8 materials, 4 daily entries, 3 readings.
  - Express backend running on Port 3000.

## 2. Verified Defects Register
| Defect ID | Severity | File(s) | Root Cause | Fix Description |
|---|---|---|---|---|
| DEF-01 | High | `server.ts` | Missing `DELETE /api/inventory/entries/:id` route called by `App.tsx:1063` | Add route with atomic stock restoration, audit logging & SSE broadcast |
| DEF-02 | High | `server.ts` | Missing `GET/POST /api/sync/global-config` endpoints called by `googleSheetsSync.ts` | Implement global config endpoints with thread-safe persistence |
| DEF-03 | High | `server.ts` | Missing `PUT /api/subdivisions/:id` & safe cascade delete validation | Add safe rename & protected deletion logic |
| DEF-04 | Critical | `server.ts`, `LocationExplorerView.tsx`, `excelExporter.ts` | Discrepancy between single primary workbook requirement and 2/3 legacy files per location | Unify into canonical Single Primary Excel Workbook named after Sub-Division (`[SubDivision].xlsx`) containing all site usage records, plus explicit item usage summary view |
| DEF-05 | Medium | `server.ts` | Entry deletion and batch-sync did not restore/deduct stock consistently | Unify stock movements in entry creation, deletion, and batch synchronization |
| DEF-06 | Medium | `QuickEntryView.tsx` | Quick Entry lacked dynamic Division dropdown cascading to Sub-Divisions | Connect Division selector, filter child Sub-Divisions, reset on change |

## 3. Workstreams & Execution Steps
1. **Database & API Foundation (`server.ts`, `db.ts`)**:
   - Add `/api/sync/global-config` GET and POST endpoints.
   - Add `/api/inventory/entries/:id` DELETE endpoint with material stock restoration.
   - Add `PUT /api/subdivisions/:id` and safe `DELETE /api/subdivisions/:id`.
   - Add `generateSubdivisionWorkbook(subdivisionId)` creating canonical `[SubDivision].xlsx` with Sheet 1: Material Consumption & Maintenance (exact merged headers & formulas) and Sheet 2: TC Volt-Amp Readings.
   - Add `/api/inventory/export/subdivision-file?subdivisionId=...` endpoint.
2. **Canonical Excel Exporter (`src/utils/excelExporter.ts`)**:
   - Implement `exportSubdivisionPrimaryExcelFile(subdivisionId, subdivisionName, entries, readings, itemDefs)`.
   - Implement formula preservation and exact layout matching `DOLVAN INVENTERY.xlsx`.
3. **Application Entry & Folder Navigation (`LocationExplorerView.tsx`)**:
   - Level 1: Division Folders (Create, Rename, Open).
   - Level 2: Sub-Division Folders (Create, Rename, Open, Breadcrumb navigation).
   - Level 3: Inside Sub-Division:
     - Prominent Single Primary Excel Workbook Card: `[SubDivision].xlsx` (View Spreadsheet, Export .XLSX, Download CSV).
     - "Item Usage & Stock Consumption View" option with date filters, search, and totals.
     - Associated Site Locations list inside this Sub-Division with "+ Add Location" form.
4. **Quick Entry Workflow (`QuickEntryView.tsx`, `App.tsx`)**:
   - Enforce Division Selection -> Sub-Division Selection (filtered to selected Division) -> Location -> TC -> Form Entry.
   - Validates inputs, handles double submission prevention with submission lock, and links to existing canonical Sub-Division workbook.
5. **Detailed Item-Usage Modal / View (`LocationFileViewerModal.tsx`)**:
   - Adapt viewer to support viewing the canonical Sub-Division primary workbook or item-usage records.
   - Include search, date filter, edit/delete actions, and instant summary metrics.
6. **E2E Verification & Audit**:
   - Build, type-check, automated tests, and final audit report.
