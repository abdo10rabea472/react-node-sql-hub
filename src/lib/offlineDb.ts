/**
 * Offline Database - SQLite-based (sql.js WASM)
 * يخزن البيانات في ملف SQLite محلي بدل IndexedDB
 * في Electron: يحفظ في مجلد Documents (يبقى حتى لو التطبيق اتمسح)
 * في الويب: يحفظ في IndexedDB كـ fallback
 */
// @ts-ignore - sql.js doesn't have type declarations
import initSqlJs from 'sql.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== Types ====================
export interface SyncMeta {
  local_id: string;
  server_id?: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  sync_action: 'create' | 'update' | 'delete';
  updated_at: string;
  composite_key: string;
}

export interface OfflineRecord extends SyncMeta {
  table_name: string;
  data: Record<string, any>;
}

// ==================== Electron FS Bridge ====================
interface ElectronFS {
  readFile: (path: string) => Promise<ArrayBuffer | null>;
  writeFile: (path: string, data: ArrayBuffer) => Promise<boolean>;
  getDbPath: () => Promise<string>;
  isElectron: boolean;
}

const electronFS: ElectronFS | undefined = (window as any).electronFS;
const isElectron = !!electronFS?.isElectron;

// ==================== SQLite Manager ====================
let db: any = null;
let dbPath: string = '';
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const SQL_INIT = `
  CREATE TABLE IF NOT EXISTS pending_ops (
    local_id TEXT PRIMARY KEY,
    server_id INTEGER,
    table_name TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    sync_action TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    composite_key TEXT NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sync_status ON pending_ops(sync_status);
  CREATE INDEX IF NOT EXISTS idx_composite_key ON pending_ops(composite_key);
  CREATE INDEX IF NOT EXISTS idx_table_name ON pending_ops(table_name);

  CREATE TABLE IF NOT EXISTS id_map (
    local_id TEXT PRIMARY KEY,
    server_id INTEGER NOT NULL,
    table_name TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_id_map_table ON id_map(table_name, server_id);
`;

// تهيئة قاعدة البيانات
async function initDB(): Promise<any> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  // محاولة تحميل قاعدة بيانات موجودة
  let existingData: ArrayBuffer | null = null;

  if (isElectron && electronFS) {
    dbPath = await electronFS.getDbPath();
    existingData = await electronFS.readFile(dbPath);
    console.log(`💾 [SQLite] مسار القاعدة: ${dbPath}`);
  } else {
    // في الويب: نحمل من IndexedDB
    existingData = await loadFromIndexedDB();
  }

  if (existingData && existingData.byteLength > 0) {
    db = new SQL.Database(new Uint8Array(existingData));
    console.log('💾 [SQLite] تم تحميل قاعدة بيانات موجودة');
  } else {
    db = new SQL.Database();
    console.log('💾 [SQLite] تم إنشاء قاعدة بيانات جديدة');
  }

  // إنشاء الجداول
  db.run(SQL_INIT);
  await persistDB();

  return db;
}

// حفظ القاعدة للملف (مع debounce)
async function persistDB(): Promise<void> {
  if (!db) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (!db) return;
    const data = db.export();
    const buffer = data.buffer;

    if (isElectron && electronFS) {
      await electronFS.writeFile(dbPath, buffer);
    } else {
      await saveToIndexedDB(buffer);
    }
  }, 100);
}

// حفظ فوري (للعمليات الحرجة)
async function persistDBNow(): Promise<void> {
  if (!db) return;
  if (saveTimeout) clearTimeout(saveTimeout);

  const data = db.export();
  const buffer = data.buffer;

  if (isElectron && electronFS) {
    await electronFS.writeFile(dbPath, buffer);
  } else {
    await saveToIndexedDB(buffer);
  }
}

// ==================== IndexedDB Fallback (للويب) ====================
const IDB_NAME = 'StudioSQLiteStore';
const IDB_STORE = 'database';

function loadFromIndexedDB(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const get = store.get('main');
        get.onsuccess = () => resolve(get.result || null);
        get.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function saveToIndexedDB(data: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(data, 'main');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ==================== Composite Key ====================
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

// ==================== CRUD Operations ====================

export async function addPendingOperation(
  tableName: string,
  action: 'create' | 'update' | 'delete',
  data: Record<string, any>,
  serverId?: number
): Promise<string> {
  const database = await initDB();
  const localId = uuidv4();
  const compositeKey = generateCompositeKey(tableName, data);

  // تحقق من وجود عملية مشابهة معلقة
  const existing = database.exec(
    `SELECT local_id FROM pending_ops WHERE composite_key = ? AND sync_status = 'pending' LIMIT 1`,
    [compositeKey]
  );

  if (existing.length > 0 && existing[0].values.length > 0 && action === 'create') {
    const existingId = existing[0].values[0][0] as string;
    database.run(
      `UPDATE pending_ops SET data = ?, updated_at = ? WHERE local_id = ?`,
      [JSON.stringify(data), new Date().toISOString(), existingId]
    );
    await persistDB();
    return existingId;
  }

  database.run(
    `INSERT INTO pending_ops (local_id, server_id, table_name, sync_status, sync_action, updated_at, composite_key, data)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
    [localId, serverId ?? null, tableName, action, new Date().toISOString(), compositeKey, JSON.stringify(data)]
  );

  if (serverId) {
    database.run(
      `INSERT OR REPLACE INTO id_map (local_id, server_id, table_name) VALUES (?, ?, ?)`,
      [localId, serverId, tableName]
    );
  }

  await persistDBNow(); // حفظ فوري للعمليات الجديدة
  return localId;
}

export async function getPendingOperations(): Promise<OfflineRecord[]> {
  const database = await initDB();
  const result = database.exec(
    `SELECT local_id, server_id, table_name, sync_status, sync_action, updated_at, composite_key, data
     FROM pending_ops WHERE sync_status = 'pending'`
  );

  if (result.length === 0) return [];

  return result[0].values.map((row: any[]) => ({
    local_id: row[0] as string,
    server_id: row[1] as number | undefined,
    table_name: row[2] as string,
    sync_status: row[3] as 'pending',
    sync_action: row[4] as 'create' | 'update' | 'delete',
    updated_at: row[5] as string,
    composite_key: row[6] as string,
    data: JSON.parse(row[7] as string),
  }));
}

export async function markAsSynced(localId: string, serverId: number): Promise<void> {
  const database = await initDB();
  database.run(
    `UPDATE pending_ops SET sync_status = 'synced', server_id = ? WHERE local_id = ?`,
    [serverId, localId]
  );

  const record = database.exec(
    `SELECT table_name FROM pending_ops WHERE local_id = ?`,
    [localId]
  );

  if (record.length > 0 && record[0].values.length > 0) {
    const tableName = record[0].values[0][0] as string;
    database.run(
      `INSERT OR REPLACE INTO id_map (local_id, server_id, table_name) VALUES (?, ?, ?)`,
      [localId, serverId, tableName]
    );
  }

  await persistDB();
}

export async function resolveServerId(localId: string): Promise<number | undefined> {
  const database = await initDB();
  const result = database.exec(
    `SELECT server_id FROM id_map WHERE local_id = ?`,
    [localId]
  );

  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return undefined;
}

export async function cleanSyncedOperations(olderThanHours = 24): Promise<void> {
  const database = await initDB();
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  database.run(
    `DELETE FROM pending_ops WHERE sync_status = 'synced' AND updated_at < ?`,
    [cutoff]
  );
  await persistDB();
}

// ==================== Utility ====================
export async function getPendingCount(): Promise<number> {
  const database = await initDB();
  const result = database.exec(
    `SELECT COUNT(*) FROM pending_ops WHERE sync_status = 'pending'`
  );
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return 0;
}

// للتصدير (متوافق مع الكود القديم)
const offlineDb = { initDB, getPendingCount };
export { offlineDb };
export default offlineDb;
