import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CloudOff, X } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncToast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, lastSyncResult, manualSync } = useSyncStatus();
  const [toasts, setToasts] = useState<SyncToast[]>([]);

  // Show toast on sync complete
  useEffect(() => {
    if (!lastSyncResult) return;
    const { synced, failed, conflicts } = lastSyncResult;

    if (synced > 0 && failed === 0 && conflicts === 0) {
      addToast(`✅ تمت مزامنة ${synced} عملية بنجاح`, 'success');
    } else if (failed > 0) {
      addToast(`❌ فشل مزامنة ${failed} عملية - ستتم المحاولة لاحقاً`, 'error');
    }
    if (conflicts > 0) {
      addToast(`⚠️ تم حل ${conflicts} تعارض (السيرفر يكسب)`, 'warning');
    }
  }, [lastSyncResult]);

  // Show toast when going offline/online
  useEffect(() => {
    // Skip initial render
    const timeout = setTimeout(() => {
      if (!isOnline) {
        addToast('📡 انقطع الإنترنت - البيانات تُحفظ محلياً', 'warning');
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [isOnline]);

  const addToast = (message: string, type: SyncToast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toastColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2" dir="rtl">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`${toastColors[t.type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 min-w-[280px]`}
            >
              <span className="flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      {(!isOnline || pendingCount > 0) && (
        <div
          className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
            isOnline
              ? pendingCount > 0
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          dir="rtl"
        >
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>بدون إنترنت - البيانات تُحفظ محلياً</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {pendingCount} معلّق
                </span>
              )}
            </>
          ) : pendingCount > 0 ? (
            <>
              <CloudOff className="h-4 w-4" />
              <span>{pendingCount} عملية تنتظر المزامنة</span>
              <button
                onClick={manualSync}
                disabled={isSyncing}
                className="mr-2 rounded bg-white/20 p-1 hover:bg-white/30 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
