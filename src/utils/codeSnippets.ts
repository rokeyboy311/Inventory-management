export function getVbaMacroSnippet(webhookUrl: string): string {
  return `' ================================================================
' Excel VBA Macro for Real-Time Sync with Web Application
' Paste this code into a standard module in your Excel Workbook (Alt + F11)
' ================================================================

Sub SyncActiveSheetToWebApp()
    Dim http As Object
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim r As Long, c As Long
    Dim jsonPayload As String
    Dim url As String
    
    url = "${webhookUrl}"
    Set ws = ActiveSheet
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    If lastRow < 1 Or lastCol < 1 Then
        MsgBox "No data found in active sheet!", vbExclamation
        Exit Sub
    End If
    
    ' Build JSON Columns Header
    jsonPayload = "{" & vbCrLf
    jsonPayload = jsonPayload & "  ""sheetName"": """ & ws.Name & """," & vbCrLf
    jsonPayload = jsonPayload & "  ""workbookName"": """ & ThisWorkbook.Name & """," & vbCrLf
    jsonPayload = jsonPayload & "  ""sender"": ""Excel VBA Desktop Client""," & vbCrLf
    
    ' Columns
    jsonPayload = jsonPayload & "  ""columns"": ["
    For c = 1 To lastCol
        jsonPayload = jsonPayload & """" & Replace(ws.Cells(1, c).Text, """", "\""") & """"
        If c < lastCol Then jsonPayload = jsonPayload & ", "
    Next c
    jsonPayload = jsonPayload & "]," & vbCrLf
    
    ' Rows data
    jsonPayload = jsonPayload & "  ""rows"": [" & vbCrLf
    For r = 2 To lastRow
        jsonPayload = jsonPayload & "    ["
        For c = 1 To lastCol
            Dim cellVal As Variant
            cellVal = ws.Cells(r, c).Value
            If IsNumeric(cellVal) And Not IsEmpty(cellVal) Then
                jsonPayload = jsonPayload & cellVal
            Else
                jsonPayload = jsonPayload & """" & Replace(ws.Cells(r, c).Text, """", "\""") & """"
            End If
            If c < lastCol Then jsonPayload = jsonPayload & ", "
        Next c
        jsonPayload = jsonPayload & "]"
        If r < lastRow Then jsonPayload = jsonPayload & ","
        jsonPayload = jsonPayload & vbCrLf
    Next r
    jsonPayload = jsonPayload & "  ]" & vbCrLf
    jsonPayload = jsonPayload & "}"
    
    ' Send HTTP POST Request
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonPayload
    
    If http.Status = 200 Then
        MsgBox "Excel data synced in real-time successfully!", vbInformation, "LiveSync Pro"
    Else
        MsgBox "Sync error: " & http.responseText, vbCritical, "LiveSync Pro"
    End If
End Sub

' Optional: Automatically sync whenever the workbook is saved
Private Sub Workbook_BeforeSave(ByVal SaveAsUI As Boolean, Cancel As Boolean)
    Call SyncActiveSheetToWebApp
End Sub
`;
}

export function getOfficeScriptSnippet(webhookUrl: string): string {
  return `/**
 * Microsoft Office Script for Excel Online / Excel 365
 * Automate real-time synchronization to your Web Application
 */
async function main(workbook: ExcelScript.Workbook) {
  const sheet = workbook.getActiveWorksheet();
  const usedRange = sheet.getUsedRange();
  
  if (!usedRange) {
    console.log("No data found in sheet.");
    return;
  }
  
  const values = usedRange.getValues();
  const columns = values[0].map(v => String(v));
  const rows = values.slice(1);
  
  const payload = {
    sheetName: sheet.getName(),
    workbookName: "Excel_365_Online.xlsx",
    sender: "Microsoft Excel 365 Cloud",
    columns: columns,
    rows: rows
  };
  
  const response = await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  console.log("Real-time sync result:", result);
}
`;
}

export function getPythonSnippet(webhookUrl: string): string {
  return `# Python Real-Time Excel File Sync Watcher
# pip install pandas openpyxl requests watchdog

import time
import requests
import pandas as pd
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

EXCEL_FILE_PATH = "my_data.xlsx"
WEBHOOK_URL = "${webhookUrl}"

def sync_excel_to_web():
    try:
        xls = pd.ExcelFile(EXCEL_FILE_PATH)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(xls, sheet_name=sheet_name)
        df = df.fillna("")
        
        payload = {
            "sheetName": sheet_name,
            "workbookName": EXCEL_FILE_PATH,
            "sender": "Python Live Excel Watcher",
            "columns": list(df.columns),
            "rows": df.values.tolist()
        }
        
        res = requests.post(WEBHOOK_URL, json=payload)
        if res.status_code == 200:
            print(f"[SUCCESS] Real-time synced {len(df)} rows from {EXCEL_FILE_PATH}")
        else:
            print(f"[ERROR] Sync failed: {res.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

class ExcelChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(EXCEL_FILE_PATH):
            print(f"Detected change in {EXCEL_FILE_PATH}, syncing...")
            time.sleep(1) # wait for excel file write lock release
            sync_excel_to_web()

if __name__ == "__main__":
    print(f"Watching {EXCEL_FILE_PATH} for real-time Excel changes...")
    sync_excel_to_web() # initial sync
    event_handler = ExcelChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=".", recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
`;
}

export function getGoogleSheetsScriptSnippet(webhookUrl: string): string {
  return `/**
 * Google Sheets Real-Time Sync Script
 * Open Google Sheets -> Extensions -> Apps Script -> Paste this code
 */
function syncSheetToWebApp() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return;
  
  const columns = data[0];
  const rows = data.slice(1);
  
  const payload = {
    sheetName: sheet.getName(),
    workbookName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    sender: "Google Sheets Sync",
    columns: columns,
    rows: rows
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch("${webhookUrl}", options);
}

// Trigger automatically on every edit in Google Sheets
function onEdit(e) {
  syncSheetToWebApp();
}
`;
}
