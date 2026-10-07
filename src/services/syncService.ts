import { InventorySubmission } from '../types/inventory';

const STORAGE_KEY_SUBMISSIONS = 'site_inventory_submissions_v1';
const STORAGE_KEY_OFFLINE_QUEUE = 'site_inventory_offline_queue_v1';
const STORAGE_KEY_SYNC_CONFIG = 'site_inventory_sync_config_v1';

export class SyncService {
  /**
   * Loads submissions from localStorage
   */
  static loadLocalSubmissions(): InventorySubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load local submissions:', e);
    }
    return [];
  }

  /**
   * Saves submissions to localStorage
   */
  static saveLocalSubmissions(submissions: InventorySubmission[]) {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    } catch (e) {
      console.error('Failed to save local submissions:', e);
    }
  }

  /**
   * Retrieves offline queue
   */
  static getOfflineQueue(): InventorySubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read offline queue:', e);
    }
    return [];
  }

  /**
   * Adds an item to the offline queue
   */
  static enqueueOffline(submission: InventorySubmission) {
    try {
      const queue = this.getOfflineQueue();
      // Prevent duplicates
      const exists = queue.some(s => s.id === submission.id);
      if (!exists) {
        queue.push({ ...submission, syncStatus: 'Offline Queued' });
        localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch (e) {
      console.error('Failed to enqueue offline item:', e);
    }
  }

  /**
   * Clears or updates the offline queue
   */
  static setOfflineQueue(queue: InventorySubmission[]) {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to set offline queue:', e);
    }
  }

  /**
   * Flushes offline queue to backend server and external webhooks
   */
  static async flushOfflineQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0, remainingCount: 0 };

    if (!navigator.onLine) {
      return { syncedCount: 0, remainingCount: queue.length };
    }

    try {
      const response = await fetch('/api/inventory/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: queue })
      });

      if (response.ok) {
        // Clear queue
        this.setOfflineQueue([]);
        return { syncedCount: queue.length, remainingCount: 0 };
      }
    } catch (err) {
      console.error('Failed to flush offline queue:', err);
    }

    return { syncedCount: 0, remainingCount: queue.length };
  }

  /**
   * Synchronizes a single submission with backend and optional external Google Sheets
   */
  static async syncSubmission(submission: InventorySubmission): Promise<{ success: boolean; status: 'Synced' | 'Offline Queued' | 'Error'; message: string }> {
    if (!navigator.onLine) {
      this.enqueueOffline(submission);
      return {
        success: true,
        status: 'Offline Queued',
        message: 'No internet connection. Saved to offline queue; will auto-sync when online.'
      };
    }

    try {
      const res = await fetch('/api/inventory/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (res.ok) {
        return {
          success: true,
          status: 'Synced',
          message: 'Saved & successfully synchronized with Excel / Sheets API.'
        };
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected submission');
      }
    } catch (err: unknown) {
      // Fallback: save to offline queue
      this.enqueueOffline(submission);
      const msg = err instanceof Error ? err.message : 'Network failure';
      return {
        success: false,
        status: 'Offline Queued',
        message: `Sync failed (${msg}). Stored in offline cache for retry.`
      };
    }
  }
}
