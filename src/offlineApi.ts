/**
 * Offline-first API wrapper
 * يغلّف كل عمليات API للعمل بدون إنترنت مع مزامنة تلقائية
 */
import api from './api';
import { addPendingOperation } from './lib/offlineDb';
import { syncManager } from './syncManager';

// تحقق من الاتصال الفعلي (ليس فقط navigator.onLine)
async function isActuallyOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(api.defaults.baseURL + '/auth.php?path=verify', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

type ApiMethod = 'get' | 'post' | 'put' | 'delete';

interface OfflineApiOptions {
  tableName: string;
  serverId?: number;
}

/**
 * دالة عامة: تنفّذ الطلب أونلاين، وإن فشل تخزّنه محلياً
 */
async function offlineRequest(
  method: ApiMethod,
  url: string,
  data: Record<string, any> | undefined,
  options: OfflineApiOptions
) {
  const online = await isActuallyOnline();

  if (online) {
    try {
      console.log(`🌐 [SQL Server] ${method.toUpperCase()} ${url}`, data || '');
      const response = method === 'get' || method === 'delete'
        ? await api[method](url)
        : await api[method](url, data);
      console.log(`✅ [SQL Server] نجح الحفظ في السيرفر:`, response.data);
      return response;
    } catch (err: any) {
      // لو الخطأ شبكة → خزّن محلياً
      if (err.code === 'ERR_NETWORK' || !err.response) {
        console.warn(`⚠️ [Offline] فشل الاتصال، يتم التخزين محلياً...`);
        return handleOffline(method, data, options);
      }
      throw err;
    }
  }

  console.log(`💾 [IndexedDB] أوفلاين - يتم التخزين محلياً: ${options.tableName}`, data);
  return handleOffline(method, data, options);
}

async function handleOffline(
  method: ApiMethod,
  data: Record<string, any> | undefined,
  options: OfflineApiOptions
) {
  if (method === 'get') {
    // GET في الأوفلاين: لا نقدر نخزنها، نرجع خطأ واضح
    throw new Error('OFFLINE_NO_DATA');
  }

  const action = method === 'post' ? 'create' : method === 'put' ? 'update' : 'delete';
  const localId = await addPendingOperation(
    options.tableName,
    action,
    data || {},
    options.serverId
  );

  return {
    data: {
      message: 'تم الحفظ محلياً - سيتم المزامنة عند عودة الإنترنت',
      offline: true,
      local_id: localId,
    },
  };
}

// ==================== Wrapped API Functions ====================

// Invoices
export const offlineGetInvoices = () => api.get("/invoices.php");
export const offlineCreateInvoice = (data: any) =>
  offlineRequest('post', '/invoices.php', data, { tableName: 'invoices' });
export const offlineUpdateInvoice = (id: number, data: any) =>
  offlineRequest('put', `/invoices.php?id=${id}`, data, { tableName: 'invoices', serverId: id });
export const offlineDeleteInvoice = (id: number) =>
  offlineRequest('delete', `/invoices.php?id=${id}`, undefined, { tableName: 'invoices', serverId: id });

// Customers
export const offlineGetCustomers = () => api.get("/customers.php");
export const offlineCreateCustomer = (data: any) =>
  offlineRequest('post', '/customers.php', data, { tableName: 'customers' });
export const offlineUpdateCustomer = (id: number, data: any) =>
  offlineRequest('put', `/customers.php?id=${id}`, data, { tableName: 'customers', serverId: id });
export const offlineDeleteCustomer = (id: number) =>
  offlineRequest('delete', `/customers.php?id=${id}`, undefined, { tableName: 'customers', serverId: id });

// Purchases
export const offlineGetPurchases = () => api.get("/purchases.php");
export const offlineCreatePurchase = (data: any) =>
  offlineRequest('post', '/purchases.php', data, { tableName: 'purchases' });
export const offlineUpdatePurchase = (id: number, data: any) =>
  offlineRequest('put', `/purchases.php?id=${id}`, data, { tableName: 'purchases', serverId: id });
export const offlineDeletePurchase = (id: number) =>
  offlineRequest('delete', `/purchases.php?id=${id}`, undefined, { tableName: 'purchases', serverId: id });

// Expenses
export const offlineGetExpenses = () => api.get("/expenses.php?path=expenses");
export const offlineCreateExpense = (data: any) =>
  offlineRequest('post', '/expenses.php?path=expenses', data, { tableName: 'expenses' });
export const offlineDeleteExpense = (id: number) =>
  offlineRequest('delete', `/expenses.php?path=expenses&id=${id}`, undefined, { tableName: 'expenses', serverId: id });

// Advances
export const offlineGetAdvances = () => api.get("/expenses.php?path=advances");
export const offlineCreateAdvance = (data: any) =>
  offlineRequest('post', '/expenses.php?path=advances', data, { tableName: 'advances' });
export const offlineUpdateAdvance = (id: number, data: any) =>
  offlineRequest('put', `/expenses.php?path=advances&id=${id}`, data, { tableName: 'advances', serverId: id });
export const offlineDeleteAdvance = (id: number) =>
  offlineRequest('delete', `/expenses.php?path=advances&id=${id}`, undefined, { tableName: 'advances', serverId: id });

// Attendance
export const offlineCreateAttendance = (data: any) =>
  offlineRequest('post', '/expenses.php?path=attendance', data, { tableName: 'attendance' });
export const offlineDeleteAttendance = (id: number) =>
  offlineRequest('delete', `/expenses.php?path=attendance&id=${id}`, undefined, { tableName: 'attendance', serverId: id });

// Salaries
export const offlineCreateSalary = (data: any) =>
  offlineRequest('post', '/expenses.php?path=salaries', data, { tableName: 'salaries' });
export const offlineDeleteSalary = (id: number) =>
  offlineRequest('delete', `/expenses.php?path=salaries&id=${id}`, undefined, { tableName: 'salaries', serverId: id });

// Packages
export const offlineCreatePackage = (data: any) =>
  offlineRequest('post', '/pricing.php', data, { tableName: 'packages' });
export const offlineUpdatePackage = (id: number, data: any) =>
  offlineRequest('put', `/pricing.php?id=${id}`, data, { tableName: 'packages', serverId: id });
export const offlineDeletePackage = (id: number) =>
  offlineRequest('delete', `/pricing.php?id=${id}`, undefined, { tableName: 'packages', serverId: id });

// Wedding Albums
export const offlineCreateWeddingAlbum = (data: any) =>
  offlineRequest('post', '/weddingPricing.php?path=albums', data, { tableName: 'wedding_albums' });
export const offlineUpdateWeddingAlbum = (id: number, data: any) =>
  offlineRequest('put', `/weddingPricing.php?path=albums&id=${id}`, data, { tableName: 'wedding_albums', serverId: id });
export const offlineDeleteWeddingAlbum = (id: number) =>
  offlineRequest('delete', `/weddingPricing.php?path=albums&id=${id}`, undefined, { tableName: 'wedding_albums', serverId: id });

// Wedding Videos
export const offlineCreateWeddingVideo = (data: any) =>
  offlineRequest('post', '/weddingPricing.php?path=videos', data, { tableName: 'wedding_videos' });
export const offlineUpdateWeddingVideo = (id: number, data: any) =>
  offlineRequest('put', `/weddingPricing.php?path=videos&id=${id}`, data, { tableName: 'wedding_videos', serverId: id });
export const offlineDeleteWeddingVideo = (id: number) =>
  offlineRequest('delete', `/weddingPricing.php?path=videos&id=${id}`, undefined, { tableName: 'wedding_videos', serverId: id });

// Wedding Invoices
export const offlineCreateWeddingInvoice = (data: any) =>
  offlineRequest('post', '/weddingInvoices.php', data, { tableName: 'wedding_invoices' });
export const offlineUpdateWeddingInvoice = (id: number, data: any) =>
  offlineRequest('put', `/weddingInvoices.php?id=${id}`, data, { tableName: 'wedding_invoices', serverId: id });
export const offlineDeleteWeddingInvoice = (id: number) =>
  offlineRequest('delete', `/weddingInvoices.php?id=${id}`, undefined, { tableName: 'wedding_invoices', serverId: id });

// Inventory
export const offlineCreateInventoryItem = (data: any) =>
  offlineRequest('post', '/inventory.php', data, { tableName: 'inventory' });
export const offlineUpdateInventoryItem = (id: number, data: any) =>
  offlineRequest('put', `/inventory.php?id=${id}`, data, { tableName: 'inventory', serverId: id });
export const offlineDeleteInventoryItem = (id: number) =>
  offlineRequest('delete', `/inventory.php?id=${id}`, undefined, { tableName: 'inventory', serverId: id });

// دالة مساعدة لعرض حالة المزامنة
export function getSyncStatus() {
  return {
    isOnline: syncManager.getOnlineStatus(),
  };
}

// بدء المزامنة يدوياً
export function triggerSync() {
  return syncManager.syncNow();
}
