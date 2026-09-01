import { useState, useEffect } from 'react';
import { getCachedJuzList, isJuzCachedOffline } from './offlineService';

export interface NetworkStatus {
  isOnline: boolean;
  cachedJuzList: number[];
  isJuzAvailableOffline: (juzNumber: number) => boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [cachedJuzList, setCachedJuzList] = useState<number[]>(() => {
    return getCachedJuzList();
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh cached list periodically or on storage event
    const handleStorage = () => {
      setCachedJuzList(getCachedJuzList());
    };
    window.addEventListener('storage', handleStorage);

    // Also check for Service Worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'JUZ_CACHE_COMPLETE') {
        setCachedJuzList(getCachedJuzList());
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const isJuzAvailableOffline = (juzNumber: number): boolean => {
    return cachedJuzList.includes(juzNumber);
  };

  return {
    isOnline,
    cachedJuzList,
    isJuzAvailableOffline,
  };
}
