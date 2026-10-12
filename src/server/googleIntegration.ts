/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Server-Side Google Drive & Sheets Integration Engine
 * Manages Folder Hierarchy (Division → Sub-Division → Location) and File Registry
 */

import { DatabaseStore, DatabaseSchema } from './db.js';
import { FileRegistryRecord, DailyEntry, TransformerReading } from '../types/inventory.js';

export interface CloudSyncStatus {
  isConfigured: boolean;
  serviceType: 'Google Apps Script Web App' | 'Google Workspace OAuth / Service Account' | 'Local Persistent Storage';
  lastSyncTimestamp: string | null;
  pendingCount: number;
  retryQueueLength: number;
  lastError: string | null;
  registeredFilesCount: number;
}

export class GoogleCloudIntegration {
  private static lastSyncTimestamp: string | null = null;
  private static lastError: string | null = null;
  private static retryQueue: { id: string; type: string; payload: any; attempts: number; error: string }[] = [];

  /**
   * Determine configured Google script or endpoint URL
   */
  public static getTargetEndpoint(): string {
    return process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.VITE_GOOGLE_SHEETS_SCRIPT_URL || '';
  }

  /**
   * Status overview
   */
  public static getStatus(): CloudSyncStatus {
    const db = DatabaseStore.get();
    const endpoint = this.getTargetEndpoint();
    const pendingEntries = db.dailyEntries.filter(e => e.syncStatus === 'Pending' || e.syncStatus === 'Offline Queued').length;

    return {
      isConfigured: Boolean(endpoint),
      serviceType: endpoint ? 'Google Apps Script Web App' : 'Local Persistent Storage',
      lastSyncTimestamp: this.lastSyncTimestamp,
      pendingCount: pendingEntries,
      retryQueueLength: this.retryQueue.length,
      lastError: this.lastError,
      registeredFilesCount: db.fileRegistry.length
    };
  }

  /**
   * Ensures Drive Folder hierarchy:
   * Inventory Management /
   *    └── Division Name (e.g. VYARA)
   *          └── Sub-Division Name (e.g. DOLVAN)
   *                └── Location Name (e.g. KANDHA KONCHAL)
   */
  public static async syncHierarchyFolders(): Promise<{ success: boolean; message: string; folders: any[] }> {
    const db = DatabaseStore.get();
    const endpoint = this.getTargetEndpoint();

    const hierarchyTree = db.divisions.map(div => ({
      divisionId: div.id,
      divisionName: div.name,
      folderId: div.googleDriveFolderId || `gdrive-${div.id}`,
      subdivisions: db.subdivisions
        .filter(sub => sub.divisionId === div.id)
        .map(sub => ({
          subdivisionId: sub.id,
          subdivisionName: sub.name,
          folderId: sub.googleDriveFolderId || `gdrive-${sub.id}`,
          locations: db.locations
            .filter(loc => loc.subdivisionId === sub.id)
            .map(loc => ({
              locationId: loc.id,
              locationName: loc.name,
              folderId: loc.googleDriveFolderId || `gdrive-${loc.id}`,
              files: db.fileRegistry.filter(f => f.locationId === loc.id)
            }))
        }))
    }));

    if (!endpoint) {
      // Internal persistent registry maintained
      return {
        success: true,
        message: 'Folder hierarchy mapped and verified in persistent FileRegistry.',
        folders: hierarchyTree
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_hierarchy',
          hierarchy: hierarchyTree
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.lastSyncTimestamp = new Date().toISOString();
      this.lastError = null;

      return {
        success: true,
        message: 'Successfully synchronized folder structure to Google Drive.',
        folders: hierarchyTree
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sync failure';
      this.lastError = msg;
      return {
        success: false,
        message: `Google Drive sync notice: ${msg} (Local persistent registry active).`,
        folders: hierarchyTree
      };
    }
  }

  /**
   * Sync a Daily Entry to Central Google Sheets relational tables
   */
  public static async syncDailyEntry(entry: DailyEntry): Promise<{ success: boolean; message: string }> {
    const endpoint = this.getTargetEndpoint();

    if (!endpoint) {
      // Local persistent DB is already updated
      return {
        success: true,
        message: 'Saved to persistent database (Google cloud endpoint unconfigured).'
      };
    }

    try {
      const payload = {
        action: 'create_daily_entry',
        entry,
        items: entry.items
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.lastSyncTimestamp = new Date().toISOString();
      this.lastError = null;
      return { success: true, message: 'Synchronized with Central Google Sheet.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      this.lastError = msg;
      this.retryQueue.push({
        id: entry.id,
        type: 'daily_entry',
        payload: entry,
        attempts: 1,
        error: msg
      });
      return {
        success: false,
        message: `Queued for retry: ${msg}`
      };
    }
  }

  /**
   * Sync Transformer Volt-Amp Reading to Sheet 2 central table
   */
  public static async syncReading(reading: TransformerReading): Promise<{ success: boolean; message: string }> {
    const endpoint = this.getTargetEndpoint();

    if (!endpoint) {
      return {
        success: true,
        message: 'Volt-Amp Reading saved to local persistent storage.'
      };
    }

    try {
      const payload = {
        action: 'create_reading',
        reading
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.lastSyncTimestamp = new Date().toISOString();
      return { success: true, message: 'Volt-Amp Reading synced to Google Sheet!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      this.lastError = msg;
      this.retryQueue.push({
        id: reading.id,
        type: 'reading',
        payload: reading,
        attempts: 1,
        error: msg
      });
      return {
        success: false,
        message: `Queued for retry: ${msg}`
      };
    }
  }

  /**
   * Flush pending retry items
   */
  public static async flushRetryQueue(): Promise<{ processed: number; remaining: number }> {
    const endpoint = this.getTargetEndpoint();
    if (!endpoint || this.retryQueue.length === 0) {
      return { processed: 0, remaining: this.retryQueue.length };
    }

    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];
    let successCount = 0;

    for (const item of itemsToRetry) {
      try {
        let res: { success: boolean };
        if (item.type === 'daily_entry') {
          res = await this.syncDailyEntry(item.payload);
        } else {
          res = await this.syncReading(item.payload);
        }

        if (res.success) {
          successCount++;
        } else {
          item.attempts++;
          this.retryQueue.push(item);
        }
      } catch {
        item.attempts++;
        this.retryQueue.push(item);
      }
    }

    return { processed: successCount, remaining: this.retryQueue.length };
  }
}
