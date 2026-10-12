/**
 * Google Apps Script Code Generator
 * This script runs 100% FREE on Google Cloud / Google Drive / Google Sheets without any GCP billing or API keys.
 */

export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ============================================================================
 * SITE INVENTORY MANAGEMENT - GOOGLE SHEETS & DRIVE CLOUD CONNECTOR (v2.0)
 * 100% Lifetime Free Backend for Vercel & Web Application
 * ============================================================================
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open Google Sheets (https://sheets.new) or your existing Google Sheet.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Replace all existing code in the editor with this script.
 * 4. Click "Deploy" (top right button) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set "Execute as": "Me (<your email>)".
 * 7. Set "Who has access": "Anyone" (CRITICAL: this allows your Vercel web app to write/read).
 * 8. Click "Deploy" -> Authorize access with your Google account.
 * 9. Copy the generated "Web app URL" (ends with /exec) and paste it into your web app settings!
 * ============================================================================
 */

const SHEET_NAME_MASTER = "Master_Inventory_Log";

/**
 * Handle GET Requests (Health Check & Fetching Submissions)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "fetch_all";
    
    if (action === "ping") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse({
        status: "ok",
        success: true,
        message: "Google Apps Script Cloud Connected Successfully!",
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl()
      });
    }

    if (action === "fetch_all") {
      const submissions = readAllSubmissionsFromSheet();
      return jsonResponse({
        status: "ok",
        success: true,
        count: submissions.length,
        submissions: submissions
      });
    }

    return jsonResponse({ status: "error", error: "Unknown GET action: " + action });
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

/**
 * Handle POST Requests (Create, Bulk Create, Update, Delete)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || "create";

    if (action === "ping") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse({
        status: "ok",
        success: true,
        message: "Google Apps Script Cloud Ping OK!",
        spreadsheetName: ss.getName()
      });
    }

    if (action === "create" && payload.submission) {
      const sub = payload.submission;
      appendSubmissionToSheet(sub);
      return jsonResponse({
        status: "ok",
        success: true,
        message: "Entry " + sub.id + " successfully saved to Google Sheet & Drive!",
        id: sub.id
      });
    }

    if (action === "bulk_create" && payload.submissions) {
      const list = payload.submissions;
      for (let i = 0; i < list.length; i++) {
        appendSubmissionToSheet(list[i]);
      }
      return jsonResponse({
        status: "ok",
        success: true,
        count: list.length,
        message: list.length + " entries successfully synchronized to Google Sheet!"
      });
    }

    if (action === "update" && payload.submission) {
      updateSubmissionInSheet(payload.submission);
      return jsonResponse({
        status: "ok",
        success: true,
        message: "Entry " + payload.submission.id + " updated in Google Sheet!"
      });
    }

    if (action === "delete" && payload.id) {
      deleteSubmissionFromSheet(payload.id);
      return jsonResponse({
        status: "ok",
        success: true,
        message: "Entry " + payload.id + " removed from Google Sheet!"
      });
    }

    return jsonResponse({ status: "error", error: "Invalid action or missing parameters." });
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

/**
 * Ensures the target sheet exists and has the proper 2-tier formatted merged header
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // Setup 2-tier Header structure
    // Row 1: Top Categories & Parent Items
    // Row 2: Sub-options / Units / Specific columns
    const row1 = [
      "ID", "Date & Time", "Location", "Location Type", "Submitted By", "Notes", 
      "Power", "Earth Compaction", "Lug", "", "", "Box", "Cable", "", "", "", "Raw JSON Data"
    ];
    
    const row2 = [
      "Auto ID", "Timestamp", "Main Site", "Category", "User Name", "Remarks", 
      "kW / Volts", "Def = 1", "100", "200", "500", "Boxes", "1.5 sq mm", "2.5 sq mm", "4 sq mm", "Armoured", "Metadata"
    ];

    sheet.getRange(1, 1, 1, row1.length).setValues([row1]);
    sheet.getRange(2, 1, 1, row2.length).setValues([row2]);

    // Format Headers
    const headerRange = sheet.getRange(1, 1, 2, row1.length);
    headerRange.setFontFamily("Arial");
    headerRange.setFontSize(10);
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");

    // Row 1 background (Dark Slate)
    sheet.getRange(1, 1, 1, row1.length).setBackground("#0f172a").setFontColor("#38bdf8");
    // Row 2 background (Sub Header)
    sheet.getRange(2, 1, 1, row2.length).setBackground("#1e293b").setFontColor("#94a3b8");

    // Merge Standalone columns across Rows 1 & 2
    sheet.getRange("A1:A2").merge(); // ID
    sheet.getRange("B1:B2").merge(); // Timestamp
    sheet.getRange("C1:C2").merge(); // Location
    sheet.getRange("D1:D2").merge(); // Location Type
    sheet.getRange("E1:E2").merge(); // Submitted By
    sheet.getRange("F1:F2").merge(); // Notes
    sheet.getRange("G1:G2").merge(); // Power
    sheet.getRange("H1:H2").merge(); // Earth Compaction
    sheet.getRange("L1:L2").merge(); // Box
    sheet.getRange("Q1:Q2").merge(); // Raw JSON

    // Merge Lug options horizontally (Cols I, J, K -> 100, 200, 500)
    sheet.getRange("I1:K1").merge();
    sheet.getRange("I1").setValue("Lug");
    sheet.getRange("I1").setBackground("#065f46").setFontColor("#6ee7b7"); // Emerald Theme

    // Merge Cable options horizontally (Cols M, N, O, P -> 1.5, 2.5, 4, Armoured)
    sheet.getRange("M1:P1").merge();
    sheet.getRange("M1").setValue("Cable");
    sheet.getRange("M1").setBackground("#075985").setFontColor("#7dd3fc"); // Sky Theme

    sheet.setFrozenRows(2);
    sheet.autoResizeColumns(1, row1.length);
  }

  return sheet;
}

/**
 * Append a single submission to the spreadsheet
 */
function appendSubmissionToSheet(sub) {
  // Save into Consolidated Master Sheet
  const masterSheet = getOrCreateSheet(SHEET_NAME_MASTER);
  const rowData = extractSubmissionRow(sub);
  masterSheet.appendRow(rowData);

  // Also save into Location-specific Tab if desired
  const locTabName = (sub.location || "General").substring(0, 28) + "_" + (sub.locationType === "In house" ? "InHouse" : "Maint");
  try {
    const locSheet = getOrCreateSheet(locTabName);
    locSheet.appendRow(rowData);
  } catch (e) {
    // Tab name might contain invalid characters, master log is primary
  }
}

/**
 * Convert submission object to standardized table row
 */
function extractSubmissionRow(sub) {
  let powerVal = "";
  let earthVal = "1";
  let lug100 = "";
  let lug200 = "";
  let lug500 = "";
  let boxVal = "";
  let cable1_5 = "";
  let cable2_5 = "";
  let cable4 = "";
  let cableArmoured = "";

  if (sub.items && Array.isArray(sub.items)) {
    for (let i = 0; i < sub.items.length; i++) {
      const item = sub.items[i];
      const id = (item.itemId || "").toLowerCase();

      if (id === "power") {
        powerVal = item.value || "";
      } else if (id === "earth_compaction") {
        earthVal = item.value !== undefined ? item.value : "1";
      } else if (id === "lug") {
        if (item.optionValues) {
          lug100 = item.optionValues["100"] !== undefined ? item.optionValues["100"] : "";
          lug200 = item.optionValues["200"] !== undefined ? item.optionValues["200"] : "";
          lug500 = item.optionValues["500"] !== undefined ? item.optionValues["500"] : "";
        } else if (item.selectedType === "100") {
          lug100 = item.value || "";
        } else if (item.selectedType === "200") {
          lug200 = item.value || "";
        } else if (item.selectedType === "500") {
          lug500 = item.value || "";
        } else {
          lug100 = item.value || "";
        }
      } else if (id === "box") {
        boxVal = item.value || "";
      } else if (id === "cable") {
        if (item.optionValues) {
          cable1_5 = item.optionValues["1.5 sq mm"] !== undefined ? item.optionValues["1.5 sq mm"] : "";
          cable2_5 = item.optionValues["2.5 sq mm"] !== undefined ? item.optionValues["2.5 sq mm"] : "";
          cable4 = item.optionValues["4 sq mm"] !== undefined ? item.optionValues["4 sq mm"] : "";
          cableArmoured = item.optionValues["Armoured"] !== undefined ? item.optionValues["Armoured"] : "";
        } else if (item.selectedType === "1.5 sq mm") {
          cable1_5 = item.value || "";
        } else if (item.selectedType === "2.5 sq mm") {
          cable2_5 = item.value || "";
        } else if (item.selectedType === "4 sq mm") {
          cable4 = item.value || "";
        } else if (item.selectedType === "Armoured") {
          cableArmoured = item.value || "";
        } else {
          cable1_5 = item.value || "";
        }
      }
    }
  }

  return [
    sub.id || ("INV-" + new Date().getTime()),
    sub.timestamp || new Date().toISOString(),
    sub.location || "",
    sub.locationType || "In house",
    sub.submittedBy || "",
    sub.notes || "",
    powerVal,
    earthVal,
    lug100,
    lug200,
    lug500,
    boxVal,
    cable1_5,
    cable2_5,
    cable4,
    cableArmoured,
    JSON.stringify(sub) // Store entire pristine JSON in Col Q for perfect cloud restore
  ];
}

/**
 * Read all submissions from the Master Sheet
 */
function readAllSubmissionsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) return []; // Only headers

  const data = sheet.getRange(3, 1, lastRow - 2, 17).getValues();
  const list = [];

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    const rawJson = row[16];
    
    if (rawJson && typeof rawJson === "string" && rawJson.startsWith("{")) {
      try {
        const parsed = JSON.parse(rawJson);
        list.push(parsed);
        continue;
      } catch (e) {}
    }

    // Fallback if raw JSON not present
    const id = row[0];
    if (!id) continue;

    const sub = {
      id: String(id),
      timestamp: row[1] ? new Date(row[1]).toISOString() : new Date().toISOString(),
      location: String(row[2] || ""),
      locationType: String(row[3] || "In house"),
      submittedBy: String(row[4] || ""),
      notes: String(row[5] || ""),
      syncStatus: "Synced",
      items: [
        { itemId: "power", itemName: "Power", fieldType: "input_only", value: row[6] || "" },
        { itemId: "earth_compaction", itemName: "Earth Compaction", fieldType: "input_only", value: row[7] || "1" },
        { 
          itemId: "lug", 
          itemName: "Lug", 
          fieldType: "dual", 
          value: row[8] || row[9] || row[10] || "",
          selectedType: "100",
          optionValues: { "100": row[8] || "", "200": row[9] || "", "500": row[10] || "" }
        },
        { itemId: "box", itemName: "Box", fieldType: "input_only", value: row[11] || "" },
        { 
          itemId: "cable", 
          itemName: "Cable", 
          fieldType: "dual", 
          value: row[12] || row[13] || row[14] || row[15] || "",
          selectedType: "1.5 sq mm",
          optionValues: { "1.5 sq mm": row[12] || "", "2.5 sq mm": row[13] || "", "4 sq mm": row[14] || "", "Armoured": row[15] || "" }
        }
      ]
    };
    list.push(sub);
  }

  return list;
}

/**
 * Find and update a submission row by Entry ID
 */
function updateSubmissionInSheet(sub) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) return;

  const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
  for (let r = 0; r < ids.length; r++) {
    if (String(ids[r][0]) === String(sub.id)) {
      const rowIndex = r + 3;
      const rowData = extractSubmissionRow(sub);
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      break;
    }
  }
}

/**
 * Delete a submission row by Entry ID
 */
function deleteSubmissionFromSheet(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) return;

  const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
  for (let r = ids.length - 1; r >= 0; r--) {
    if (String(ids[r][0]) === String(id)) {
      sheet.deleteRow(r + 3);
    }
  }
}

/**
 * Standard Helper for JSON Output with CORS Support
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
