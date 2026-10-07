export interface SheetData {
  name: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export interface SyncState {
  version: number;
  lastUpdated: string;
  updatedBy: string;
  workbookName: string;
  sheets: SheetData[];
  activeSheetIndex: number;
  syncSource: 'direct' | 'webhook' | 'file_upload' | 'cloud_sync' | 'simulation';
}

export interface SyncLog {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  details: string;
  rowsAffected?: number;
  status: 'success' | 'warning' | 'info';
}

export interface SyncConfig {
  autoSync: boolean;
  syncIntervalSec: number; // 0 = immediate on blur/edit, >0 = periodic polling/push
  conflictMode: 'latest_wins' | 'server_wins' | 'merge';
  soundEnabled: boolean;
  localFileHandle?: FileSystemFileHandle | null;
  localFileName?: string;
}
