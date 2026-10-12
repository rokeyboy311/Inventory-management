# GOOGLE DRIVE & GOOGLE SHEETS SETUP GUIDE

**Project:** Division Location Inventory & Material Consumption System  
**Zero-Cost Central Cloud Storage Architecture**

---

## 1. Cloud Architecture Concept

The application connects with Google Drive and Google Sheets using a secure server-proxied architecture.

```
React UI ──> Express API (/api/cloud/*) ──> Google Apps Script Web App / Sheets API
```

No private service account keys or OAuth client secrets are exposed to the browser.

---

## 2. Automatic Google Drive Folder Hierarchy

When synchronizing the hierarchy, the backend creates and registers the following structure:

```
Google Drive Root /
└── Inventory Management/
      └── VYARA/ (Division)
            └── DOLVAN/ (Sub-Division)
                  ├── KANDHA KONCHAL/
                  │     ├── KANDHA_KONCHAL_Inventory_Usage.xlsx
                  │     └── KANDHA_KONCHAL_Volt_Amp_Readings.xlsx
                  ├── KANDHA NISHAL FALIYU/
                  │     ├── KANDHA_NISHAL_FALIYU_Inventory_Usage.xlsx
                  │     └── KANDHA_NISHAL_FALIYU_Volt_Amp_Readings.xlsx
                  ├── KANDHA DHADHAR FALIYU/
                  ├── PIDADARA CHODIYAVAD/
                  └── PIDADARA PATEL FALIYA/
```

### Folder & File Identity Guarantee
- Before creating a folder or file, the system looks up the `FileRegistry`.
- If an entry already has a `googleDriveFolderId` or `googleDriveFileId`, the existing file is updated in place.
- Duplicates such as `Location_new.xlsx` or `Location_final.xlsx` are never created.

---

## 3. Central Google Sheet Structure

One central Google Spreadsheet serves as the cloud database with the following relational tabs:

1. **`Divisions`**: `division_id`, `name`, `code`, `status`, `drive_folder_id`, `created_at`
2. **`SubDivisions`**: `subdivision_id`, `division_id`, `name`, `code`, `status`, `drive_folder_id`
3. **`Locations`**: `location_id`, `division_id`, `subdivision_id`, `name`, `code`, `drive_folder_id`
4. **`Transformers`**: `transformer_id`, `location_id`, `serial_no`, `make`, `capacity`, `status`
5. **`Materials`**: `material_id`, `name`, `category`, `unit`, `opening_stock`, `current_stock`
6. **`DailyEntries`**: `entry_id`, `division_id`, `subdivision_id`, `location_id`, `entry_date`, `entered_by`, `location_type`, `remarks`, `version`
7. **`DailyEntryItems`**: `item_id`, `entry_id`, `material_id`, `variant_name`, `quantity`, `unit`, `remark`
8. **`TransformerReadings`**: `reading_id`, `location_id`, `tc_serial`, `reading_date`, `time`, `voltage_rn`, `voltage_yn`, `voltage_bn`, `ampere_r`, `ampere_y`, `ampere_b`, `ampere_n`, `entered_by`, `remarks`
9. **`StockTransactions`**: `tx_id`, `material_id`, `variant`, `type`, `quantity`, `reference_id`, `date`, `user`
10. **`FileRegistry`**: `file_id`, `location_id`, `file_type`, `file_name`, `drive_file_id`, `records_count`, `last_synced_at`
11. **`AuditLog`**: `audit_id`, `timestamp`, `user`, `action`, `entity`, `entity_id`

---

## 4. Google Apps Script Web App Deployment (5 Minutes Setup)

1. Open [Google Drive](https://drive.google.com) and create a new Google Sheet named:
   `DOLVAN_Inventory_Central_Database`
2. In the Google Sheet, open **Extensions** → **Apps Script**.
3. Copy and paste the Apps Script template from `/src/utils/googleAppsScriptTemplate.ts`.
4. Click **Deploy** → **New deployment**.
5. Select type: **Web app**.
6. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
7. Click **Deploy** and copy the generated **Web App URL**.
8. In the application:
   - Click the **Cloud Sync** button in the header.
   - Paste the Web App URL and click **Connect**.
   - Or set in `.env.example` as `GOOGLE_SHEETS_SCRIPT_URL="YOUR_URL"`.
