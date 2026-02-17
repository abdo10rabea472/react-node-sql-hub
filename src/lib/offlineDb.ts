import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// كل سجل محلي يحتوي على حقول مزامنة
export interface SyncMeta {
  local_id: string;       // UUID محلي ثابت لا يتغير
  server_id?: number;     // ID السيرفر (يتغير) - يتم ربطه بعد المزامنة
  sync_status: 'pending' | 'synced' | 'conflict';
  sync_action: 'create' | 'update' | 'delete';
  updated_at: string;     // ISO timestamp للتعارضات
  composite_key: string;  // مفتاح مركب للكشف عن التكرار
}

export interface OfflineRecord extends SyncMeta {
  table_name: string;
  data: Record<string, any>;
}

class OfflineDatabase extends Dexie {
  pendingOps!: Table<OfflineRecord, string>;
  idMap!: Table<{ local_id: string; server_id: number; table_name: string }, string>;

  constructor() {
    super('StudioOfflineDB');
    this.version(1).stores({
      // جدول العمليات المعلقة
      pendingOps: 'local_id, table_name, sync_status, composite_key, sync_action',
      // جدول ربط ID المحلي بالسيرفر
      idMap: 'local_id, [table_name+server_id]',
    });
  }
}

export const offlineDb = new OfflineDatabase();

// توليد Composite Key من بيانات السجل لمنع التكرار
export function generateCompositeKey(tableName: string, data: Record<string, any>): string {
  const keyFields: Record<string, string[]> = {
    invoices: ['customer_id', 'total_amount', 'created_at'],
    customers: ['name', 'phone'],
    purchases: ['item_name', 'total_cost', 'supplier'],
    expenses: ['description', 'amount', 'date'],
    advances: ['user_id', 'amount', 'date'],
    attendance: ['user_id', 'date', 'status'],
    salaries: ['user_id', 'month', 'total'],
    packages: ['name', 'price'],
    wedding_albums: ['name', 'price'],
    wedding_videos: ['name', 'price'],
    wedding_invoices: ['customer_id', 'total_amount'],
    inventory: ['name', 'category'],
    users: ['email'],
    settings: ['key'],
  };

  const fields = keyFields[tableName] || Object.keys(data).slice(0, 3);
  const values = fields.map(f => String(data[f] ?? '').toLowerCase().trim());
  return `${tableName}|${values.join('|')}`;
}

// إضافة عملية معلقة
export async function addPendingOperation(
  tableName: string,
  action: 'create' | 'update' | 'delete',
  data: Record<string, any>,
  serverId?: number
): Promise<string> {
  const localId = uuidv4();
  const compositeKey = generateCompositeKey(tableName, data);

  // تحقق من وجود عملية مشابهة معلقة (نفس الـ composite key)
  const existing = await offlineDb.pendingOps
    .where('composite_key')
    .equals(compositeKey)
    .and(r => r.sync_status === 'pending')
    .first();

  if (existing && action === 'create') {
    // تحديث العملية الموجودة بدل إنشاء واحدة جديدة
    await offlineDb.pendingOps.update(existing.local_id, {
      data,
      updated_at: new Date().toISOString(),
    });
    return existing.local_id;
  }

  await offlineDb.pendingOps.put({
    local_id: localId,
    server_id: serverId,
    table_name: tableName,
    sync_status: 'pending',
    sync_action: action,
    updated_at: new Date().toISOString(),
    composite_key: compositeKey,
    data,
  });

  if (serverId) {
    await offlineDb.idMap.put({ local_id: localId, server_id: serverId, table_name: tableName });
  }

  return localId;
}

// الحصول على كل العمليات المعلقة
export async function getPendingOperations(): Promise<OfflineRecord[]> {
  return offlineDb.pendingOps
    .where('sync_status')
    .equals('pending')
    .toArray();
}

// تحديث حالة المزامنة بعد النجاح
export async function markAsSynced(localId: string, serverId: number): Promise<void> {
  await offlineDb.pendingOps.update(localId, {
    sync_status: 'synced',
    server_id: serverId,
  });
  // حفظ ربط الـ ID
  const record = await offlineDb.pendingOps.get(localId);
  if (record) {
    await offlineDb.idMap.put({
      local_id: localId,
      server_id: serverId,
      table_name: record.table_name,
    });
  }
}

// حل الـ ID المحلي إلى ID السيرفر
export async function resolveServerId(localId: string): Promise<number | undefined> {
  const mapping = await offlineDb.idMap.get(localId);
  return mapping?.server_id;
}

// حذف العمليات المتزامنة القديمة (تنظيف)
export async function cleanSyncedOperations(olderThanHours = 24): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  await offlineDb.pendingOps
    .where('sync_status')
    .equals('synced')
    .and(r => r.updated_at < cutoff)
    .delete();
}

export default offlineDb;
