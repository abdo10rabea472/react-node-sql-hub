import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../syncManager';
import { getPendingOperations } from '../lib/offlineDb';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(syncManager.getOnlineStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number; conflicts: number } | null>(null);

  const refreshPendingCount = useCallback(async () => {
    const pending = await getPendingOperations();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    const unsub = syncManager.onEvent((event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync_start':
          setIsSyncing(true);
          break;
        case 'sync_complete':
          setIsSyncing(false);
          setLastSyncResult(event.details);
          refreshPendingCount();
          break;
        case 'sync_error':
          setIsSyncing(false);
          break;
      }
    });

    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  const manualSync = useCallback(async () => {
    const result = await syncManager.syncNow();
    return result;
  }, []);

  return { isOnline, isSyncing, pendingCount, lastSyncResult, manualSync, refreshPendingCount };
}
