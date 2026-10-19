import { useEffect, useState } from 'react';

/**
 * Hook to track browser online/offline status and sync events
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      setSynced(false);
    };
    const handleSynced = () => {
      setSynced(true);
      setTimeout(() => setSynced(false), 3200);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('dulingo_synced', handleSynced);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dulingo_synced', handleSynced);
    };
  }, []);

  return { online, synced };
}
