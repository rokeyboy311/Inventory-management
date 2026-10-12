# EXCEL FORMAT SPECIFICATION & SAFETY RULES

**Project:** Division Location Inventory & Material Consumption System  
**Reference Files:** `DOLVAN INVENTERY.xlsx` and `BILL FORM AND GST DOLVAN.xls`

---

## 1. Sheet 1: Inventory Usage Log File (`[Location]_Inventory_Usage.xlsx`)

### Header Hierarchy & Merged Ranges
```
Row 1: [ SR NO ] [ Location of TC ] [ TC Serial Number ] [ Date ] [ Type ] [ Replacement of bushing goti (Merged Cols 5-6) ] [ Providing LT side AL. Patta KVA ] ...
Row 2: [ No.   ] [ Site Name    ] [ TC No.           ] [ Date ] [ Cat. ] [ HT ] [ LT ]                                  [ 100 KVA ] ...
Row 3+: User daily work transaction data
```

### Column Specifications
| Col Index | Level 1 Header | Level 2 Sub-Header | Merge Range | Data Type | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | SR NO | No. | Row 0:1 | Integer | `1` |
| 1 | Location of TC | Site Name | Row 0:1 | String | `KANDHA KONCHAL` |
| 2 | TC Serial Number | TC No. | Row 0:1 | String | `2508` |
| 3 | Date | Date | Row 0:1 | Date (YYYY-MM-DD) | `2026-10-07` |
| 4 | Type | Category | Row 0:1 | Enum | `In house` |
| 5 | Replacement of bushing goti | HT | Col 5:6 (Row 0) | Numeric | `3` |
| 6 | Replacement of bushing goti | LT | Col 5:6 (Row 0) | Numeric | `4` |
| 7 | Providing LT side AL. Patta KVA | 100 KVA | Row 0:1 | Numeric | `4` |
| 8 | Check and Tight Earth Connection | Nos. | Row 0:1 | Numeric | `1` |
| 9 | Replacement of LT damaged cable | C-1(70) | Col 9:10 (Row 0) | Numeric (Meter) | `25` |
| 10 | Replacement of LT damaged cable | C-2(150) | Col 9:10 (Row 0) | Numeric (Meter) | `0` |
| 11 | Providing of new termination R,Y,B,N | 70 | Col 11:12 (Row 0) | Numeric (Sets) | `1` |
| 12 | Providing of new termination R,Y,B,N | 150 | Col 11:12 (Row 0) | Numeric (Sets) | `0` |
| 13 | Half Stud | M.S. | Row 0:1 | Numeric (Nos.) | `2` |
| 14 | Silica Gel / Breather | Kg | Row 0:1 | Numeric (Kg) | `2` |
| 15 | Remarks | Notes | Row 0:1 | Text | `Routine goti replacement` |
| 16 | Entered By | User | Row 0:1 | Text | `Rajesh Patel` |

---

## 2. Sheet 2: Volt-Amp Readings Log File (`[Location]_Volt_Amp_Readings.xlsx`)

### Header Hierarchy & Merged Ranges
```
Row 1: [ Sr. no. ] [ Location ] [ Make ] [ TC Serial No. ] [ Capacity ] [ Date/Time ] [ Voltage (Merged Cols 6-8) ] [ Ampere (Merged Cols 9-12) ] [ Entered By ] [ Remark ]
Row 2: [ No.     ] [ Site     ] [ Make ] [ Serial        ] [ KVA      ] [ Timestamp ] [ RN ] [ YN ] [ BN ]          [ R ] [ Y ] [ B ] [ N ]        [ Tech       ] [ Status ]
Row 3+: Electrical measurements over dates
```

### Column Specifications
| Col Index | Level 1 Header | Level 2 Sub-Header | Merge Range | Data Type | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | Sr. no. | No. | Row 0:1 | Integer | `1` |
| 1 | Location | Site | Row 0:1 | String | `KANDHA KONCHAL` |
| 2 | Make | Make | Row 0:1 | String | `GETCO` |
| 3 | TC Serial No. | Serial | Row 0:1 | String | `2508` |
| 4 | Capacity | KVA | Row 0:1 | String | `100 KVA` |
| 5 | Date / Time | Timestamp | Row 0:1 | String | `2026-10-07 09:45` |
| 6 | Voltage | RN | Col 6:8 (Row 0) | Decimal | `240` |
| 7 | Voltage | YN | Col 6:8 (Row 0) | Decimal | `241` |
| 8 | Voltage | BN | Col 6:8 (Row 0) | Decimal | `242` |
| 9 | Ampere | R | Col 9:12 (Row 0) | Decimal | `40.8` |
| 10 | Ampere | Y | Col 9:12 (Row 0) | Decimal | `29.5` |
| 11 | Ampere | B | Col 9:12 (Row 0) | Decimal | `34.3` |
| 12 | Ampere | N | Col 9:12 (Row 0) | Decimal | `8.4` |
| 13 | Entered By | Technician | Row 0:1 | String | `Rajesh Patel` |
| 14 | Remark | Status | Row 0:1 | Text | `Load balanced` |

---

## 3. Automated Validation Protocol (`validateExcelWorkbook`)

Before exporting or writing any workbook to disk or user download:
1. **Sheet Existence:** Verifies at least 1 worksheet exists.
2. **Dimension Range:** Confirms dimension references exist (`ws['!ref']`) and column span >= 2.
3. **Primary Header:** Validates that cell `A1` contains a valid string.
4. **Data Type Segregation:** Numbers and strings remain strictly separated (e.g. quantity is numeric `15`, unit is string `'Meter'`).
