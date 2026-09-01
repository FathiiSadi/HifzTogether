import { JUZ_CATALOG } from './juzData';
import { fetchPage, fetchSurah } from '../services/quranApi';
import { Ayah } from '../types';

const OFFLINE_JUZ_STORAGE_KEY = 'hifz_offline_cached_juz_list';

export interface JuzCacheProgress {
  juzNumber: number;
  progress: number; // 0 to 100
  status: 'idle' | 'downloading' | 'completed' | 'error';
  currentPage?: number;
  totalPages?: number;
  message?: string;
}

/**
 * Register Service Worker
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('HifzTogether Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    });
  }
}

/**
 * Get list of currently cached Juz numbers from local storage
 */
export function getCachedJuzList(): number[] {
  try {
    const saved = localStorage.getItem(OFFLINE_JUZ_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading cached juz list:', e);
  }
  return [];
}

/**
 * Check if a specific Juz is cached for offline memorization
 */
export function isJuzCachedOffline(juzNumber: number): boolean {
  const list = getCachedJuzList();
  return list.includes(juzNumber);
}

/**
 * Mark a Juz as cached in local storage
 */
export function markJuzAsCached(juzNumber: number): void {
  try {
    const list = getCachedJuzList();
    if (!list.includes(juzNumber)) {
      list.push(juzNumber);
      localStorage.setItem(OFFLINE_JUZ_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Error saving cached juz list:', e);
  }
}

/**
 * Remove a Juz from cached list
 */
export function removeJuzFromCache(juzNumber: number): void {
  try {
    const list = getCachedJuzList().filter((j) => j !== juzNumber);
    localStorage.setItem(OFFLINE_JUZ_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error removing cached juz:', e);
  }
}

/**
 * Download & Cache all pages and surahs of a Juz for offline use
 */
export async function downloadJuzForOffline(
  juzNumber: number,
  onProgress?: (progress: JuzCacheProgress) => void
): Promise<boolean> {
  const juzMeta = JUZ_CATALOG.find((j) => j.number === juzNumber);
  if (!juzMeta) {
    onProgress?.({
      juzNumber,
      progress: 0,
      status: 'error',
      message: 'Juz not found',
    });
    return false;
  }

  const { startPage, endPage } = juzMeta;
  const totalPages = endPage - startPage + 1;
  let completedPages = 0;

  onProgress?.({
    juzNumber,
    progress: 5,
    status: 'downloading',
    currentPage: startPage,
    totalPages,
    message: `بدء تحميل الجزء ${juzNumber}...`,
  });

  const apiUrlsToCache: string[] = [];

  try {
    // 1. Sequentially fetch and cache all pages in the Juz
    for (let page = startPage; page <= endPage; page++) {
      const pageUrl = `https://api.alquran.cloud/v1/page/${page}/editions/quran-uthmani,en.sahih`;
      apiUrlsToCache.push(pageUrl);

      // Trigger fetch which automatically caches in memory and localStorage
      await fetchPage(page);
      completedPages++;

      const pct = Math.round((completedPages / totalPages) * 85);
      onProgress?.({
        juzNumber,
        progress: pct,
        status: 'downloading',
        currentPage: page,
        totalPages,
        message: `تم تحميل صفحة ${page} من ${endPage}`,
      });
    }

    // 2. Dispatch to Service Worker if active for robust browser-level cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_JUZ_BATCH',
        juzNumber,
        urls: apiUrlsToCache,
      });
    }

    // 3. Mark as successfully cached
    markJuzAsCached(juzNumber);

    onProgress?.({
      juzNumber,
      progress: 100,
      status: 'completed',
      totalPages,
      message: `تم حفظ الجزء ${juzNumber} بالكامل للعمل بدون إنترنت ✅`,
    });

    return true;
  } catch (err: any) {
    console.error(`Failed to cache Juz ${juzNumber} for offline:`, err);
    onProgress?.({
      juzNumber,
      progress: Math.round((completedPages / totalPages) * 100),
      status: 'error',
      message: err?.message || 'حدث خطأ أثناء تحميل الجزء',
    });
    return false;
  }
}
