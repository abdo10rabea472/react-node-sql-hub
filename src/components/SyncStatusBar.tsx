import { WifiOff, RefreshCw, CloudOff, CheckCircle } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

export default function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, manualSync } = useSyncStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
        isOnline
          ? pendingCount > 0
            ? 'bg-amber-500 text-white'
            : 'bg-green-500 text-white'
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
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          <span>تم المزامنة</span>
        </>
      )}
    </div>
  );
}
