# REFERENCE FIELD MAPPING SPECIFICATION

**Project:** Division Location Inventory & Material Consumption System  
**Reference Workbooks:**
1. `DOLVAN INVENTERY.xlsx` (Sheet 1: TC Maintenance & Material Usage, Sheet 2: Volt-Amp Reading)
2. `BILL FORM AND GST DOLVAN.xls` (Contractor Maintenance Bill Form & GST Calculation)

---

## 1. DOLVAN INVENTERY.xlsx — Sheet 1: Transformer Maintenance & Material Usage

| Reference File | Sheet | Original Field/Header | Meaning | Application Field | Data Type | Unit | Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DOLVAN INVENTERY.xlsx | Sheet1 | SR NO | Serial order in maintenance sheet | `serial_no` / `entry_id` | Integer | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet1 | Location of TC | Name of the electrical site / TC faliya | `location_id` (linked to `Location.name`) | String | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet1 | TC Serial Number | Physical serial number stamped on Transformer | `transformer.serial_number` | String | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet1 | TC Make | Transformer manufacturer name | `transformer.make` | String | - | No |
| DOLVAN INVENTERY.xlsx | Sheet1 | TC Capacity | Transformer power rating | `transformer.capacity` | String | KVA | Yes |
| DOLVAN INVENTERY.xlsx | Sheet1 | Replacement of bushing goti → HT | High Tension bushing porcelain goti replaced | Material: `Bushing Goti` / Variant: `HT` | Numeric | Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Replacement of bushing goti → LT | Low Tension bushing porcelain goti replaced | Material: `Bushing Goti` / Variant: `LT` | Numeric | Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Providing LT side AL. Patta KVA → 100 | Aluminum busbar patta for LT side (100 KVA / spec) | Material: `AL Patta` / Variant: `100 KVA` | Numeric | Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Check and Tight Earth Connection → Nos. | Grounding earthing tightening and maintenance | Material: `Earth Connection` / Variant: `Inspection & Tightening` | Numeric | Job / Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Replacement of LT damaged cable → C-1(70) | 70 sq mm LT armored/unarmored cable replaced | Material: `LT Cable` / Variant: `70 sq mm (C-1)` | Numeric | Meter | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Replacement of LT damaged cable → C-2(150) | 150 sq mm LT armored/unarmored cable replaced | Material: `LT Cable` / Variant: `150 sq mm (C-2)` | Numeric | Meter | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Providing of new termination in form of R,Y,B and N core → 70 | 4-core cable termination lugs & heat shrink / tape (70 sq mm) | Material: `Cable Termination` / Variant: `70 sq mm (4-Core)` | Numeric | Sets | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Providing of new termination in form of R,Y,B and N core → 150 | 4-core cable termination lugs & heat shrink / tape (150 sq mm) | Material: `Cable Termination` / Variant: `150 sq mm (4-Core)` | Numeric | Sets | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Providing of termination up to sq mm cable | Termination work performed up to specified cable size | Material: `Cable Termination` / Variant: `General / Up to Spec` | Numeric | Sets | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Half Stud / MS Hardware | Replacement of stud rods & nut bolts | Material: `Half Stud` / Variant: `Standard M.S.` | Numeric | Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Silica Gel / Breather | Breather servicing and silica gel replenishment | Material: `Silica Gel / Breather` / Variant: `Replenishment` | Numeric | Kg / Nos. | No (0 or more) |
| DOLVAN INVENTERY.xlsx | Sheet1 | Remarks / Work Nature | Operational observations / crew remarks | `DailyEntry.remarks` | Text | - | No |

---

## 2. DOLVAN INVENTERY.xlsx — Sheet 2: Volt-Amp Reading

| Reference File | Sheet | Original Field/Header | Meaning | Application Field | Data Type | Unit | Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DOLVAN INVENTERY.xlsx | Sheet2 | Sr. no. | Chronological reading serial | `reading_id` / `sr_no` | Integer | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Location | Location / site where transformer is situated | `location_id` | String | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Make | Transformer make | `transformer.make` | String | - | No |
| DOLVAN INVENTERY.xlsx | Sheet2 | TC Serial No. | Transformer Serial Number | `transformer.serial_number` | String | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Capacity | Transformer KVA capacity | `transformer.capacity` | String | KVA | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Voltage → RN | Red Phase to Neutral AC Voltage | `voltage_rn` | Decimal | Volts (V) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Voltage → YN | Yellow Phase to Neutral AC Voltage | `voltage_yn` | Decimal | Volts (V) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Voltage → BN | Blue Phase to Neutral AC Voltage | `voltage_bn` | Decimal | Volts (V) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Ampere → R | Red Phase Line Current | `ampere_r` | Decimal | Amperes (A) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Ampere → Y | Yellow Phase Line Current | `ampere_y` | Decimal | Amperes (A) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Ampere → B | Blue Phase Line Current | `ampere_b` | Decimal | Amperes (A) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Ampere → N | Neutral Return Current | `ampere_n` | Decimal | Amperes (A) | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Date / Time | Timestamp of field meter reading | `reading_date` / `reading_time` | Date/Time | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Entered By | Name of technician taking reading | `entered_by` | String | - | Yes |
| DOLVAN INVENTERY.xlsx | Sheet2 | Remark | Remarks (e.g. unbalance noted, normal load) | `remarks` | Text | - | No |

---

## 3. BILL FORM AND GST DOLVAN.xls — Bill Form & GST Calculation

| Reference File | Sheet | Original Field/Header | Meaning | Application Field | Data Type | Unit | Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BILL FORM AND GST DOLVAN.xls | Bill | Bill No & Date | Invoice reference and billing date | `bill.bill_number`, `bill.date` | String / Date | - | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Division / Sub-Division | Administrative division context (VYARA / DOLVAN) | `division_id`, `subdivision_id` | String | - | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Contractor / Vendor Details | Electrical maintenance contractor name & GSTIN | `bill.contractor_name`, `contractor_gstin` | String | - | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Work / Item Description | Line item describing work/material | `bill_item.description` | Text | - | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Quantity | Total consumed quantity for billing period | `bill_item.quantity` | Decimal | Mixed | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Unit Rate | Contract agreed schedule rate per unit | `bill_item.unit_rate` | Decimal | INR (₹) | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Taxable Amount | Total amount before GST (Qty × Rate) | `bill_item.amount` | Decimal | INR (₹) | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | CGST (%) & Amount | Central Goods & Services Tax (typically 9%) | `bill.cgst_rate`, `bill.cgst_amount` | Decimal | % / INR | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | SGST (%) & Amount | State Goods & Services Tax (typically 9%) | `bill.sgst_rate`, `bill.sgst_amount` | Decimal | % / INR | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Total GST | Combined CGST + SGST tax amount | `bill.total_gst` | Decimal | INR (₹) | Yes |
| BILL FORM AND GST DOLVAN.xls | Bill | Round Off | Rounding adjustment | `bill.round_off` | Decimal | INR (₹) | No |
| BILL FORM AND GST DOLVAN.xls | Bill | Net Bill Amount | Final payable amount after taxes | `bill.net_amount` | Decimal | INR (₹) | Yes |

---

## 4. Location Hierarchy Mapping

```
Division: VYARA (ID: div-vyara)
  └── Sub-Division: DOLVAN (ID: sub-dolvan)
        ├── KANDHA KONCHAL (ID: loc-kandha-konchal)
        ├── KANDHA NISHAL FALIYU (ID: loc-kandha-nishal)
        ├── KANDHA DHADHAR FALIYU (ID: loc-kandha-dhadhar)
        ├── PIDADARA CHODIYAVAD (ID: loc-pidadara-chodiyavad)
        └── PIDADARA PATEL FALIYA (ID: loc-pidadara-patel)
```

Each Location maintains:
1. **File 1 (Inventory Usage Log):** `[Location]_Inventory_Usage.xlsx` (reflecting Sheet 1 maintenance & material consumption)
2. **File 2 (Volt-Amp Reading Log):** `[Location]_Volt_Amp_Readings.xlsx` (reflecting Sheet 2 electrical parameters)
