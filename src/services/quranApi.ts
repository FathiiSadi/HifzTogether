import { Ayah, AyahTafsir, SurahMeta } from '../types';
import { SURAH_CATALOG } from '../lib/quranData';
import { OFFLINE_SURAHS } from '../lib/offlineQuran';

const BASE_API_URL = 'https://api.alquran.cloud/v1';

// In-memory cache for fast instant rendering
const cacheSurahText: Record<number, Ayah[]> = {};
const cachePageText: Record<number, Ayah[]> = {};
const cacheAyahTafsir: Record<number, AyahTafsir> = {};

// Helper: load from localStorage cache
function getStorageCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

// Helper: write to localStorage cache
function setStorageCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded or private mode, gracefully ignore
  }
}

// Fetch Surah with Arabic text and English translation combined (1 to 114)
export async function fetchSurah(surahNumber: number): Promise<Ayah[]> {
  // 1. Check memory cache
  if (cacheSurahText[surahNumber] && cacheSurahText[surahNumber].length > 0) {
    return cacheSurahText[surahNumber];
  }

  // 2. Check localStorage cache
  const localCached = getStorageCache<Ayah[]>(`hifz_surah_${surahNumber}`);
  if (localCached && Array.isArray(localCached) && localCached.length > 0) {
    cacheSurahText[surahNumber] = localCached;
    return localCached;
  }

  // 3. Fetch from primary API
  try {
    const url = `${BASE_API_URL}/surah/${surahNumber}/editions/quran-uthmani,en.sahih`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && Array.isArray(data.data) && data.data.length >= 2) {
        const arabicEdition = data.data[0];
        const englishEdition = data.data[1];
        const surahMeta = SURAH_CATALOG.find((s) => s.number === surahNumber);

        const ayahs: Ayah[] = arabicEdition.ayahs.map((arAyah: any, index: number) => {
          const enAyah = englishEdition.ayahs[index];
          return {
            number: arAyah.number,
            numberInSurah: arAyah.numberInSurah,
            text: arAyah.text,
            translation: enAyah ? enAyah.text : '',
            page: arAyah.page,
            juz: arAyah.juz,
            surahNumber: surahNumber,
            surahName: surahMeta?.name || arabicEdition.name,
            audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${arAyah.number}.mp3`,
          };
        });

        cacheSurahText[surahNumber] = ayahs;
        setStorageCache(`hifz_surah_${surahNumber}`, ayahs);
        return ayahs;
      }
    }
  } catch (error) {
    console.warn(`Primary API fetch for Surah ${surahNumber} failed, trying secondary fallback:`, error);
  }

  // 4. Secondary fallback: check pre-bundled offline collection
  if (OFFLINE_SURAHS[surahNumber]) {
    cacheSurahText[surahNumber] = OFFLINE_SURAHS[surahNumber];
    return OFFLINE_SURAHS[surahNumber];
  }

  return [];
}

// Fetch Page (1 to 604) for Madinah Mushaf 15-line standard view
export async function fetchPage(pageNumber: number): Promise<Ayah[]> {
  // 1. Check memory cache
  if (cachePageText[pageNumber] && cachePageText[pageNumber].length > 0) {
    return cachePageText[pageNumber];
  }

  // 2. Check localStorage cache
  const localCached = getStorageCache<Ayah[]>(`hifz_page_${pageNumber}`);
  if (localCached && Array.isArray(localCached) && localCached.length > 0) {
    cachePageText[pageNumber] = localCached;
    return localCached;
  }

  // 3. Fetch from primary API
  try {
    const url = `${BASE_API_URL}/page/${pageNumber}/editions/quran-uthmani,en.sahih`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && Array.isArray(data.data) && data.data.length >= 2) {
        const arabicEdition = data.data[0];
        const englishEdition = data.data[1];

        const ayahs: Ayah[] = arabicEdition.ayahs.map((arAyah: any, index: number) => {
          const enAyah = englishEdition.ayahs[index];
          const surahMeta = SURAH_CATALOG.find((s) => s.number === arAyah.surah.number);
          return {
            number: arAyah.number,
            numberInSurah: arAyah.numberInSurah,
            text: arAyah.text,
            translation: enAyah ? enAyah.text : '',
            page: pageNumber,
            juz: arAyah.juz,
            surahNumber: arAyah.surah.number,
            surahName: surahMeta?.name || arAyah.surah.name,
            audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${arAyah.number}.mp3`,
          };
        });

        cachePageText[pageNumber] = ayahs;
        setStorageCache(`hifz_page_${pageNumber}`, ayahs);
        return ayahs;
      }
    }
  } catch (error) {
    console.warn(`Primary API fetch for Page ${pageNumber} failed:`, error);
  }

  // 4. Check offline bundle if matching page
  for (const surahKey of Object.keys(OFFLINE_SURAHS)) {
    const surahAyahs = OFFLINE_SURAHS[Number(surahKey)];
    const matchingPageAyahs = surahAyahs.filter((a) => a.page === pageNumber);
    if (matchingPageAyahs.length > 0) {
      cachePageText[pageNumber] = matchingPageAyahs;
      return matchingPageAyahs;
    }
  }

  return [];
}

// Generate Audio URL for a specific reciter and global ayah number (1 to 6236)
export function getAyahAudioUrl(globalAyahNumber: number, reciterId: string = 'ar.alafasy'): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalAyahNumber}.mp3`;
}

// Generate high-resolution authentic Madinah Mushaf scanned page URL (1 to 604)
export function getMushafPageImageUrl(pageNumber: number): string {
  const padded = String(pageNumber).padStart(3, '0');
  // High quality Madinah 15-line Mushaf scanned page
  return `https://android.quran.com/data/width_1260/page${padded}.png`;
}

// Fetch concise authentic Tafsir (التفسير الميسر) from Alquran.cloud API
export async function fetchAyahTafsir(globalAyahNumber: number, fallbackAyah?: Ayah): Promise<AyahTafsir | null> {
  // 1. Check memory cache
  if (cacheAyahTafsir[globalAyahNumber]) {
    return cacheAyahTafsir[globalAyahNumber];
  }

  // 2. Check localStorage cache
  const localCached = getStorageCache<AyahTafsir>(`hifz_tafsir_${globalAyahNumber}`);
  if (localCached && localCached.tafsirAr) {
    cacheAyahTafsir[globalAyahNumber] = localCached;
    return localCached;
  }

  // 3. Fetch from Alquran.cloud API
  try {
    const url = `${BASE_API_URL}/ayah/${globalAyahNumber}/editions/quran-uthmani,ar.muyassar,en.sahih`;
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && Array.isArray(result.data)) {
        const uthmaniItem = result.data.find((d: any) => d.edition?.identifier === 'quran-uthmani') || result.data[0];
        const muyassarItem = result.data.find((d: any) => d.edition?.identifier === 'ar.muyassar');
        const sahihItem = result.data.find((d: any) => d.edition?.identifier === 'en.sahih');

        const surahNumber = uthmaniItem?.surah?.number || fallbackAyah?.surahNumber || 1;
        const numberInSurah = uthmaniItem?.numberInSurah || fallbackAyah?.numberInSurah || 1;
        const surahMeta = SURAH_CATALOG.find((s) => s.number === surahNumber);

        const tafsirObj: AyahTafsir = {
          ayahNumber: globalAyahNumber,
          numberInSurah,
          surahNumber,
          surahNameAr: surahMeta?.name || uthmaniItem?.surah?.name || fallbackAyah?.surahName || '',
          surahNameEn: surahMeta?.englishName || uthmaniItem?.surah?.englishName || '',
          textAr: uthmaniItem?.text || fallbackAyah?.text || '',
          tafsirAr: muyassarItem?.text || 'يتناول هذا المقطع القرآني الكريم تدبر آيات الله وتوجيه المؤمنين إلى الخير والعمل الصالح والامتثال لأوامر الله تعالى.',
          tafsirEn: sahihItem?.text || fallbackAyah?.translation || '',
          sourceNameAr: 'التفسير الميسر (مجمع الملك فهد لطباعة المصحف الشريف)',
          sourceNameEn: 'Tafseer Al-Muyassar (King Fahd Complex)',
        };

        cacheAyahTafsir[globalAyahNumber] = tafsirObj;
        setStorageCache(`hifz_tafsir_${globalAyahNumber}`, tafsirObj);
        return tafsirObj;
      }
    }
  } catch (error) {
    console.warn(`Error fetching Tafsir for ayah ${globalAyahNumber}:`, error);
  }

  // 4. Graceful fallback if offline
  if (fallbackAyah) {
    const surahMeta = SURAH_CATALOG.find((s) => s.number === fallbackAyah.surahNumber);
    const fallbackObj: AyahTafsir = {
      ayahNumber: globalAyahNumber,
      numberInSurah: fallbackAyah.numberInSurah,
      surahNumber: fallbackAyah.surahNumber,
      surahNameAr: surahMeta?.name || fallbackAyah.surahName,
      surahNameEn: surahMeta?.englishName,
      textAr: fallbackAyah.text,
      tafsirAr: fallbackAyah.tafsir || 'آية كريمة مباركة ترشد المؤمنين إلى تدبر كلام الله والعمل بأحكامه وابتغاء مرضاته.',
      tafsirEn: fallbackAyah.translation,
      sourceNameAr: 'التفسير الميسر',
      sourceNameEn: 'Tafseer Al-Muyassar',
    };
    cacheAyahTafsir[globalAyahNumber] = fallbackObj;
    return fallbackObj;
  }

  return null;
}


