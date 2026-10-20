import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getOfflineQueueCount, syncOfflineQueue } from '../services/api.js';

export function OfflineSyncBanner() {
  const { online, synced } = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(getOfflineQueueCount());
  const [syncing, setSyncing] = useState(false);
  const [syncedMsg, setSyncedMsg] = useState(false);

  const refreshCount = () => setQueueCount(getOfflineQueueCount());

  useEffect(() => {
    refreshCount();

    const handleQueued = () => refreshCount();
    const handleSyncing = () => setSyncing(true);
    const handleSynced = (e) => {
      setSyncing(false);
      refreshCount();
      const count = e.detail?.synced || 0;
      if (count > 0) {
        setSyncedMsg(true);
        setTimeout(() => setSyncedMsg(false), 3800);
      }
    };

    window.addEventListener('dulingo_offline_queued', handleQueued);
    window.addEventListener('dulingo_syncing', handleSyncing);
    window.addEventListener('dulingo_synced', handleSynced);
    window.addEventListener('online', refreshCount);
    window.addEventListener('offline', refreshCount);

    return () => {
      window.removeEventListener('dulingo_offline_queued', handleQueued);
      window.removeEventListener('dulingo_syncing', handleSyncing);
      window.removeEventListener('dulingo_synced', handleSynced);
      window.removeEventListener('online', refreshCount);
      window.removeEventListener('offline', refreshCount);
    };
  }, []);

  const handleManualSync = async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setSyncing(false);
      refreshCount();
    }
  };

  // Only render banner when offline, syncing, synced notification, or queue has pending items
  const shouldShow = !online || queueCount > 0 || syncing || syncedMsg;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        aria-live="polite"
        className="sticky top-14 z-35 px-3 py-1.5"
      >
        <div className="mx-auto max-w-4xl">
          {/* Offline State */}
          {!online && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-1.5 text-xs font-black text-amber-900 shadow-sm backdrop-blur-md dark:border-amber-700/80 dark:bg-amber-950/90 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <WifiOff size={15} className="shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>
                  <strong>Offline Mode:</strong> You can continue practicing cached tasks.{' '}
                  {queueCount > 0 ? (
                    <span className="font-extrabold text-amber-800 dark:text-amber-300">
                      ({queueCount} answer{queueCount > 1 ? 's' : ''} saved locally)
                    </span>
                  ) : (
                    'Your answers will be saved offline.'
                  )}
                </span>
              </div>
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                Auto-sync on reconnect
              </span>
            </div>
          )}

          {/* Online with Pending Queue State */}
          {online && queueCount > 0 && !syncedMsg && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-300 bg-brand-50/95 px-3 py-1.5 text-xs font-black text-brand-900 shadow-sm backdrop-blur-md dark:border-brand-700/80 dark:bg-brand-950/90 dark:text-brand-200">
              <div className="flex items-center gap-2">
                <Wifi size={15} className="shrink-0 text-brand-600 dark:text-brand-400" />
                <span>
                  Internet connected! You have <strong>{queueCount} offline answer{queueCount > 1 ? 's' : ''}</strong>{' '}
                  ready to sync.
                </span>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="btn btn-primary !py-1 !px-3 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          )}

          {/* Sync Success State */}
          {syncedMsg && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50/95 px-3 py-1.5 text-xs font-black text-emerald-900 shadow-sm backdrop-blur-md dark:border-emerald-700/80 dark:bg-emerald-950/90 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>All saved answers synced to server! Your XP and daily streak are up to date.</span>
              </div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-300">
                Synced ✓
              </span>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
