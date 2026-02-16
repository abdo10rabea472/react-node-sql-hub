// Simple event emitter for data refresh across components
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export const dataEvents = {
  emit(table: string) {
    listeners.get(table)?.forEach(fn => fn());
    listeners.get('*')?.forEach(fn => fn());
  },
  on(table: string, fn: Listener) {
    if (!listeners.has(table)) listeners.set(table, new Set());
    listeners.get(table)!.add(fn);
    return () => { listeners.get(table)?.delete(fn); };
  },
};

// Wrap API calls to auto-emit after mutations
export const withRefresh = (table: string) => async <T,>(promise: Promise<T>): Promise<T> => {
  const result = await promise;
  setTimeout(() => dataEvents.emit(table), 100);
  return result;
};
