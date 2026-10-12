# DATA MODEL SPECIFICATION

**Project:** Division Location Inventory & Material Consumption System  
**Authority:** Persistent Central Database (`data/database.json`) & Central Google Spreadsheet

---

## 1. Entities & Relations Diagram

```
Division (1) ───< SubDivision (N) ───< Location (N) ───< Transformer (N)
                                             │                 │
                                             ├──────┐          │
                                             ▼      ▼          ▼
                                        DailyEntry  TransformerReading
                                             │
                                             ▼
                                      DailyEntryItem (N)
                                             │
                                             ▼
                                     Material + Variant (1)
                                             │
                                             ▼
                                      StockTransaction (Ledger)
```

---

## 2. Table / Entity Schemas

### 1. `Division`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique ID (e.g., `div-vyara`) |
| `name` | String | Division Name (e.g., `VYARA`) |
| `code` | String | Short Code (e.g., `VYR`) |
| `status` | Enum | `'active'` \| `'inactive'` |
| `googleDriveFolderId` | String | Cloud Drive Folder ID |
| `createdAt` | ISO DateTime | Creation timestamp |
| `updatedAt` | ISO DateTime | Last update timestamp |

### 2. `SubDivision`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique ID (e.g., `sub-dolvan`) |
| `divisionId` | String (FK) | Reference to `Division.id` |
| `name` | String | Sub-Division Name (e.g., `DOLVAN`) |
| `code` | String | Short Code (e.g., `DLV`) |
| `status` | Enum | `'active'` \| `'inactive'` |
| `googleDriveFolderId` | String | Cloud Drive Folder ID |
| `createdAt` | ISO DateTime | Creation timestamp |
| `updatedAt` | ISO DateTime | Last update timestamp |

### 3. `Location`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique ID (e.g., `loc-kandha-konchal`) |
| `divisionId` | String (FK) | Reference to `Division.id` |
| `subdivisionId` | String (FK) | Reference to `SubDivision.id` |
| `name` | String | Site Location Name (e.g., `KANDHA KONCHAL`) |
| `code` | String | Location Code (e.g., `KK-01`) |
| `address` | String | Physical landmark / TC point |
| `status` | Enum | `'active'` \| `'inactive'` |
| `googleDriveFolderId` | String | Dedicated Drive Folder ID |
| `createdAt` | ISO DateTime | Creation timestamp |
| `updatedAt` | ISO DateTime | Last update timestamp |

### 4. `Transformer`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique ID (e.g., `tc-2508`) |
| `locationId` | String (FK) | Reference to `Location.id` |
| `serialNumber` | String | Transformer Serial Number (e.g., `2508`) |
| `make` | String | Make / Manufacturer (e.g., `GETCO`, `Voltamp`) |
| `capacity` | String | Power rating (e.g., `100 KVA`, `63 KVA`) |
| `status` | Enum | `'active'` \| `'inactive'` |
| `createdAt` | ISO DateTime | Creation timestamp |
| `updatedAt` | ISO DateTime | Last update timestamp |

### 5. `Material`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique ID (e.g., `mat-bushing`) |
| `name` | String | Material Name (e.g., `Replacement of bushing goti`) |
| `category` | String | Category (e.g., `TC Maintenance`, `Cabling`) |
| `unit` | String | Unit of measurement (`Nos.`, `Meter`, `Job`, `Sets`) |
| `status` | Enum | `'active'` \| `'inactive'` |
| `referenceField` | String | Mapping reference from Excel Sheet 1 |
| `openingStock` | Decimal | Opening balance |
| `currentStock` | Decimal | Current stock after all transactions |
| `variants` | Array | Child specification variants |
| `createdAt` | ISO DateTime | Creation timestamp |
| `updatedAt` | ISO DateTime | Last update timestamp |

### 6. `DailyEntry`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique Transaction ID (`ENTRY-YYYYMMDD-XXX`) |
| `divisionId` | String (FK) | Division reference |
| `subdivisionId` | String (FK) | Sub-Division reference |
| `locationId` | String (FK) | Location reference |
| `transformerId` | String (FK) | Optional specific Transformer reference |
| `entryDate` | Date | Date of work (`YYYY-MM-DD`) |
| `enteredBy` | String | Technician or Engineer name |
| `locationType` | Enum | `'In house'` \| `'Maintenance'` |
| `remarks` | Text | Work order notes / observation |
| `version` | Integer | Concurrency version counter (starts at 1) |
| `syncStatus` | Enum | `'Synced'` \| `'Offline Queued'` \| `'Error'` |
| `items` | Array | Child line items (`DailyEntryItem[]`) |
| `createdAt` | ISO DateTime | Timestamp |
| `updatedAt` | ISO DateTime | Timestamp |

### 7. `TransformerReading` (Volt-Amp Operational Log)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Reading ID (`READ-YYYYMMDD-XXX`) |
| `srNo` | Integer | Chronological sequence |
| `divisionId` | String (FK) | Division reference |
| `subdivisionId` | String (FK) | Sub-Division reference |
| `locationId` | String (FK) | Location reference |
| `transformerId` | String (FK) | Transformer reference |
| `readingDate` | Date | Measurement Date (`YYYY-MM-DD`) |
| `readingTime` | String | Time of measurement (e.g., `10:30 AM`) |
| `voltageRN` | Decimal | Red-to-Neutral AC Voltage (V) |
| `voltageYN` | Decimal | Yellow-to-Neutral AC Voltage (V) |
| `voltageBN` | Decimal | Blue-to-Neutral AC Voltage (V) |
| `ampereR` | Decimal | Red Phase Current (A) |
| `ampereY` | Decimal | Yellow Phase Current (A) |
| `ampereB` | Decimal | Blue Phase Current (A) |
| `ampereN` | Decimal | Neutral Current (A) |
| `enteredBy` | String | Person who recorded measurement |
| `remarks` | Text | Phase balance / load observations |

### 8. `StockTransaction` (Audit Ledger)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Transaction ID (`STK-TX-XXX`) |
| `materialId` | String (FK) | Material reference |
| `variantName` | String | Variant specification |
| `type` | Enum | `'IN'` \| `'OUT'` \| `'ADJUSTMENT'` \| `'RETURN'` |
| `quantity` | Decimal | Numeric quantity |
| `unit` | String | Unit of measurement |
| `referenceType` | String | `'daily_entry'` \| `'stock_receipt'` \| `'manual_adjustment'` |
| `referenceId` | String | Linked Daily Entry ID or PO number |
| `date` | Date | Transaction Date |
| `enteredBy` | String | Operator name |

### 9. `FileRegistryRecord`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Registry item ID |
| `locationId` | String (FK) | Associated location |
| `fileType` | Enum | `'inventory_usage'` \| `'volt_amp_reading'` |
| `fileName` | String | Target Excel file name |
| `googleDriveFileId` | String | Persistent cloud Drive file ID |
| `googleDriveFolderId`| String | Location folder ID in Google Drive |
| `lastSyncedAt` | ISO DateTime | Last sync timestamp |
| `recordsCount` | Integer | Total records in this file |
