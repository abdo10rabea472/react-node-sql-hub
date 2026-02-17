import api from './api';
import {
  getPendingOperations,
  markAsSynced,
  resolveServerId,
  cleanSyncedOperations,
  type OfflineRecord,
} from './lib/offlineDb';

// خريطة ربط الجداول بالـ API endpoints
const TABLE_ENDPOINTS: Record<string, { base: string; idParam: string }> = {
  invoices: { base: '/invoices.php', idParam: 'id' },
  customers: { base: '/customers.php', idParam: 'id' },
  purchases: { base: '/purchases.php', idParam: 'id' },
  expenses: { base: '/expenses.php?path=expenses', idParam: 'id' },
  advances: { base: '/expenses.php?path=advances', idParam: 'id' },
  attendance: { base: '/expenses.php?path=attendance', idParam: 'id' },
  salaries: { base: '/expenses.php?path=salaries', idParam: 'id' },
  packages: { base: '/pricing.php', idParam: 'id' },
  wedding_albums: { base: '/weddingPricing.php?path=albums', idParam: 'id' },
  wedding_videos: { base: '/weddingPricing.php?path=videos', idParam: 'id' },
  wedding_invoices: { base: '/weddingInvoices.php', idParam: 'id' },
  inventory: { base: '/inventory.php', idParam: 'id' },
  users: { base: '/users.php', idParam: 'id' },
};

type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'sync_conflict' | 'online' | 'offline';

interface SyncEvent {
  type: SyncEventType;
  details?: any;
}

type SyncListener = (event: SyncEvent) => void;

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: SyncListener[] = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit({ type: 'online' });
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit({ type: 'offline' });
    });

    // مزامنة دورية كل 30 ثانية
    this.syncInterval = setInterval(() => {
      if (this.isOnline) this.syncNow();
    }, 30000);

    // تنظيف العمليات القديمة كل ساعة
    setInterval(() => cleanSyncedOperations(24), 3600000);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  onEvent(listener: SyncListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: SyncEvent) {
    this.listeners.forEach(l => l(event));
  }

  async syncNow(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    this.emit({ type: 'sync_start' });

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      const pending = await getPendingOperations();

      // ترتيب: create أولاً، ثم update، ثم delete
      const sorted = pending.sort((a, b) => {
        const order = { create: 0, update: 1, delete: 2 };
        return order[a.sync_action] - order[b.sync_action];
      });

      for (const op of sorted) {
        try {
          const result = await this.syncOperation(op);
          if (result === 'synced') synced++;
          else if (result === 'conflict') conflicts++;
          else failed++;
        } catch (err) {
          console.error(`فشل مزامنة ${op.table_name}:${op.local_id}`, err);
          failed++;
        }
      }

      this.emit({
        type: 'sync_complete',
        details: { synced, failed, conflicts },
      });
    } catch (err) {
      this.emit({ type: 'sync_error', details: err });
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed, conflicts };
  }

  private async syncOperation(op: OfflineRecord): Promise<'synced' | 'conflict' | 'failed'> {
    const endpoint = TABLE_ENDPOINTS[op.table_name];
    if (!endpoint) {
      console.warn(`لا يوجد endpoint للجدول: ${op.table_name}`);
      return 'failed';
    }

    try {
      if (op.sync_action === 'create') {
        return await this.syncCreate(op, endpoint);
      } else if (op.sync_action === 'update') {
        return await this.syncUpdate(op, endpoint);
      } else if (op.sync_action === 'delete') {
        return await this.syncDelete(op, endpoint);
      }
      return 'failed';
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // تعارض - السيرفر يكسب
        this.emit({ type: 'sync_conflict', details: { operation: op, error: err.response.data } });
        await markAsSynced(op.local_id, op.server_id || 0);
        return 'conflict';
      }
      throw err;
    }
  }

  private async syncCreate(op: OfflineRecord, endpoint: { base: string; idParam: string }): Promise<'synced' | 'conflict' | 'failed'> {
    // حل أي IDs مرجعية (مثل customer_id قد يكون local_id)
    const resolvedData = await this.resolveReferences(op.data);

    try {
      const response = await api.post(endpoint.base, resolvedData);
      const serverId = response.data?.id || response.data?.insertId || response.data?.lastInsertId;

      if (serverId) {
        await markAsSynced(op.local_id, serverId);
      } else {
        await markAsSynced(op.local_id, 0);
      }
      return 'synced';
    } catch (err: any) {
      // لو السجل موجود فعلاً (duplicate) - نعتبره synced
      if (err?.response?.status === 409 || err?.response?.data?.message?.includes('Duplicate')) {
        await markAsSynced(op.local_id, 0);
        return 'conflict';
      }
      throw err;
    }
  }

  private async syncUpdate(op: OfflineRecord, endpoint: { base: string; idParam: string }): Promise<'synced' | 'conflict' | 'failed'> {
    const serverId = op.server_id || (await resolveServerId(op.local_id));
    if (!serverId) {
      console.warn(`لا يمكن تحديث سجل بدون server_id: ${op.local_id}`);
      return 'failed';
    }

    const resolvedData = await this.resolveReferences(op.data);
    const separator = endpoint.base.includes('?') ? '&' : '?';
    await api.put(`${endpoint.base}${separator}${endpoint.idParam}=${serverId}`, resolvedData);
    await markAsSynced(op.local_id, serverId);
    return 'synced';
  }

  private async syncDelete(op: OfflineRecord, endpoint: { base: string; idParam: string }): Promise<'synced' | 'conflict' | 'failed'> {
    const serverId = op.server_id || (await resolveServerId(op.local_id));
    if (!serverId) {
      await markAsSynced(op.local_id, 0);
      return 'synced'; // لو مفيش server_id يبقى مش موجود أصلاً
    }

    const separator = endpoint.base.includes('?') ? '&' : '?';
    try {
      await api.delete(`${endpoint.base}${separator}${endpoint.idParam}=${serverId}`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // محذوف فعلاً
      } else {
        throw err;
      }
    }
    await markAsSynced(op.local_id, serverId);
    return 'synced';
  }

  // حل المراجع: لو حقل ينتهي بـ _id وقيمته UUID → استبداله بالـ server_id
  private async resolveReferences(data: Record<string, any>): Promise<Record<string, any>> {
    const resolved = { ...data };
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const [key, value] of Object.entries(resolved)) {
      if (key.endsWith('_id') && typeof value === 'string' && uuidPattern.test(value)) {
        const serverId = await resolveServerId(value);
        if (serverId) {
          resolved[key] = serverId;
        }
      }
    }

    return resolved;
  }

  destroy() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}

// Singleton
export const syncManager = new SyncManager();
export default syncManager;
