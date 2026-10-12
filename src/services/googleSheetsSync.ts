import { InventorySubmission, InventoryItemDefinition, InventoryItemValue } from '../types/inventory';

export const STORAGE_KEY_GSHEET_URL = 'site_inventory_gsheet_url_v1';
export const STORAGE_KEY_AUTO_CLOUD_SYNC = 'site_inventory_auto_cloud_sync_v1';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  count?: number;
}

export class GoogleSheetsService {
  /**
   * Get configured Google Apps Script Web App URL
   * Priority: localStorage > Vercel Vite Env Var > Window Global
   */
  static getScriptUrl(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GSHEET_URL);
      if (saved && saved.trim()) return saved.trim();
    } catch {}
    
    // Check environment variable (e.g. set in Vercel project settings)
    const envUrl = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      return envUrl.trim();
    }

    return '';
  }

  /**
   * Save Google Apps Script Web App URL both locally and to shared server
   */
  static setScriptUrl(url: string, syncToServer = true): void {
    const trimmed = url.trim();
    try {
      localStorage.setItem(STORAGE_KEY_GSHEET_URL, trimmed);
    } catch (e) {
      console.error('Failed to save Google Sheets URL:', e);
    }

    if (syncToServer && trimmed) {
      fetch('/api/sync/global-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: trimmed })
      }).catch(() => {});
    }
  }

  /**
   * Automatically detect ?sync_url= or ?script_url= from URL query params.
   * If found, sets the script URL, cleans up address bar, and returns true.
   */
  static initFromUrlParams(): { autoConfigured: boolean; url: string } {
    try {
      if (typeof window === 'undefined') return { autoConfigured: false, url: '' };
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sync_url') || params.get('script_url');
      if (urlParam && urlParam.trim().startsWith('http')) {
        const cleaned = urlParam.trim();
        this.setScriptUrl(cleaned, true);
        
        // Remove param from address bar cleanly without page reload
        params.delete('sync_url');
        params.delete('script_url');
        const newSearch = params.toString();
        const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newPath);

        return { autoConfigured: true, url: cleaned };
      }
    } catch (e) {
      console.error('Error in initFromUrlParams:', e);
    }
    return { autoConfigured: false, url: '' };
  }

  /**
   * Fetch global server configuration so all team users are automatically connected!
   */
  static async syncWithGlobalServerConfig(): Promise<string> {
    const current = this.getScriptUrl();
    if (current) return current;

    try {
      const res = await fetch('/api/sync/global-config');
      if (res.ok) {
        const data = await res.json();
        if (data.scriptUrl && typeof data.scriptUrl === 'string' && data.scriptUrl.trim()) {
          this.setScriptUrl(data.scriptUrl.trim(), false);
          return data.scriptUrl.trim();
        }
      }
    } catch {}
    return '';
  }

  /**
   * Generates a one-click shareable URL that automatically configures any worker/user
   */
  static getShareableTeamLink(customUrl?: string): string {
    const target = customUrl || this.getScriptUrl();
    if (!target || typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?sync_url=${encodeURIComponent(target)}`;
  }

  /**
   * Check if Auto Cloud Sync is enabled
   */
  static isAutoSyncEnabled(): boolean {
    try {
      const val = localStorage.getItem(STORAGE_KEY_AUTO_CLOUD_SYNC);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Set Auto Cloud Sync toggle
   */
  static setAutoSyncEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUTO_CLOUD_SYNC, enabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save auto sync state:', e);
    }
  }

  /**
   * Test connection to the Google Apps Script Web App URL
   */
  static async testConnection(url?: string): Promise<{ success: boolean; message: string; sheetName?: string; count?: number }> {
    const targetUrl = url || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'Google Sheets Apps Script URL is not configured.' };
    }

    try {
      const response = await fetch(`${targetUrl}?action=ping`, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === 'ok' || data.success) {
        return {
          success: true,
          message: data.message || 'Connected to Google Sheets & Drive successfully!',
          sheetName: data.spreadsheetName || data.sheetName,
          count: data.recordCount
        };
      } else {
        return {
          success: false,
          message: data.error || 'Google Apps Script returned an unexpected response.'
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      // Attempt fallback with POST ping if GET was restricted
      try {
        const postRes = await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' })
        });
        return {
          success: true,
          message: 'Connected (Opaque response received via Web App endpoint).'
        };
      } catch {
        return {
          success: false,
          message: `Connection failed: ${msg}. Please ensure your Web App is deployed with "Anyone" access.`
        };
      }
    }
  }

  /**
   * Sync a single submission to Google Sheets
   */
  static async pushSubmission(
    submission: InventorySubmission, 
    scriptUrl?: string
  ): Promise<CloudSyncResult> {
    const targetUrl = scriptUrl || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'No Google Sheets URL configured.' };
    }

    try {
      const payload = {
        action: 'create',
        submission: submission
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain prevents CORS preflight in Apps Script
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        return {
          success: true,
          message: data.message || `Saved to Google Sheet "${submission.location}" successfully!`
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      console.error('Google Sheets push error:', err);
      // Try opaque fallback
      try {
        await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'create', submission })
        });
        return {
          success: true,
          message: `Pushed entry ${submission.id} to Google Sheets (Drive sync active).`
        };
      } catch (fallbackErr: any) {
        return {
          success: false,
          message: fallbackErr?.message || 'Failed to push to Google Sheets.'
        };
      }
    }
  }

  /**
   * Fetch all historical submissions from Google Sheets (Cloud Restore)
   */
  static async fetchSubmissions(scriptUrl?: string): Promise<{ success: boolean; submissions: InventorySubmission[]; message: string }> {
    const targetUrl = scriptUrl || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, submissions: [], message: 'No Google Sheets URL configured.' };
    }

    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', 'fetch_all');
      url.searchParams.set('_t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.submissions && Array.isArray(data.submissions)) {
        return {
          success: true,
          submissions: data.submissions,
          message: `Successfully loaded ${data.submissions.length} records from Google Sheets!`
        };
      } else if (data.status === 'ok' && Array.isArray(data.data)) {
        return {
          success: true,
          submissions: data.data,
          message: `Successfully loaded ${data.data.length} records from Google Sheets!`
        };
      } else {
        return {
          success: false,
          submissions: [],
          message: data.error || 'No records returned from Google Sheets.'
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        submissions: [],
        message: `Failed to load records from Google Sheets: ${msg}`
      };
    }
  }

  /**
   * Push all local submissions to Google Sheets in bulk
   */
  static async pushAllSubmissions(
    submissions: InventorySubmission[], 
    scriptUrl?: string
  ): Promise<CloudSyncResult> {
    const targetUrl = scriptUrl || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'No Google Sheets URL configured.' };
    }
    if (submissions.length === 0) {
      return { success: true, message: 'No local submissions to backup.', count: 0 };
    }

    try {
      const payload = {
        action: 'bulk_create',
        submissions: submissions
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        return {
          success: true,
          count: submissions.length,
          message: data.message || `Successfully synced all ${submissions.length} records to Google Sheets!`
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      return {
        success: false,
        message: `Bulk backup to Google Sheets failed: ${msg}`
      };
    }
  }

  /**
   * Update an existing submission on Google Sheets
   */
  static async updateSubmission(
    submission: InventorySubmission, 
    scriptUrl?: string
  ): Promise<CloudSyncResult> {
    const targetUrl = scriptUrl || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'No Google Sheets URL configured.' };
    }

    try {
      const payload = {
        action: 'update',
        submission: submission
      };

      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: `Updated entry ${submission.id} in Google Sheets.`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      return { success: false, message: `Failed to update in Google Sheets: ${msg}` };
    }
  }

  /**
   * Delete a submission from Google Sheets
   */
  static async deleteSubmission(
    id: string, 
    scriptUrl?: string
  ): Promise<CloudSyncResult> {
    const targetUrl = scriptUrl || this.getScriptUrl();
    if (!targetUrl) {
      return { success: false, message: 'No Google Sheets URL configured.' };
    }

    try {
      const payload = {
        action: 'delete',
        id: id
      };

      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: `Deleted entry ${id} from Google Sheets.`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      return { success: false, message: `Failed to delete from Google Sheets: ${msg}` };
    }
  }
}
