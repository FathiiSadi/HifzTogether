import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MapPin,
  RefreshCw,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
  Navigation,
  CheckCircle2,
  Bell,
  Volume2
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface PrayerDateMeta {
  readable: string;
  timestamp: string;
  hijri: {
    date: string;
    day: string;
    weekday: { en: string; ar?: string };
    month: { number: number; en: string; ar: string };
    year: string;
    designation: { abbreviated: string };
  };
  gregorian: {
    date: string;
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
  };
}

interface PrayerTimesWidgetProps {
  lang: Language;
  currentUser?: UserProfile;
  onNavigateToReader?: (pageNum: number) => void;
  onNavigateToReflections?: () => void;
}

const PRESET_CITIES = [
  { city: 'Makkah', country: 'Saudi Arabia', nameAr: 'مكة المكرمة', nameEn: 'Makkah, Saudi Arabia', method: 4 },
  { city: 'Madinah', country: 'Saudi Arabia', nameAr: 'المدينة المنورة', nameEn: 'Madinah, Saudi Arabia', method: 4 },
  { city: 'Cairo', country: 'Egypt', nameAr: 'القاهرة، مصر', nameEn: 'Cairo, Egypt', method: 5 },
  { city: 'Riyadh', country: 'Saudi Arabia', nameAr: 'الرياض، السعودية', nameEn: 'Riyadh, Saudi Arabia', method: 4 },
  { city: 'Amman', country: 'Jordan', nameAr: 'عَمّان، الأردن', nameEn: 'Amman, Jordan', method: 3 },
  { city: 'Jerusalem', country: 'Palestine', nameAr: 'القدس الشريف', nameEn: 'Jerusalem, Palestine', method: 3 },
  { city: 'Dubai', country: 'United Arab Emirates', nameAr: 'دبي، الإمارات', nameEn: 'Dubai, UAE', method: 8 },
  { city: 'Istanbul', country: 'Turkey', nameAr: 'إسطنبول، تركيا', nameEn: 'Istanbul, Turkey', method: 13 },
  { city: 'Doha', country: 'Qatar', nameAr: 'الدوحة، قطر', nameEn: 'Doha, Qatar', method: 10 },
  { city: 'Kuwait City', country: 'Kuwait', nameAr: 'الكويت', nameEn: 'Kuwait City', method: 9 },
  { city: 'Casablanca', country: 'Morocco', nameAr: 'الدار البيضاء، المغرب', nameEn: 'Casablanca, Morocco', method: 3 },
  { city: 'London', country: 'United Kingdom', nameAr: 'لندن، بريطانيا', nameEn: 'London, UK', method: 3 },
  { city: 'New York', country: 'United States', nameAr: 'نيويورك، أمريكا', nameEn: 'New York, USA', method: 2 },
  { city: 'Toronto', country: 'Canada', nameAr: 'تورونتو، كندا', nameEn: 'Toronto, Canada', method: 2 },
  { city: 'Kuala Lumpur', country: 'Malaysia', nameAr: 'كوالالمبور، ماليزيا', nameEn: 'Kuala Lumpur, Malaysia', method: 3 },
  { city: 'Jakarta', country: 'Indonesia', nameAr: 'جاكرتا، إندونيسيا', nameEn: 'Jakarta, Indonesia', method: 3 },
];

const CALC_METHODS = [
  { id: 4, nameEn: 'Umm Al-Qura University, Makkah', nameAr: 'جامعة أم القرى، مكة المكرمة' },
  { id: 5, nameEn: 'Egyptian General Authority of Survey', nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 3, nameEn: 'Muslim World League (MWL)', nameAr: 'رابطة العالم الإسلامي' },
  { id: 2, nameEn: 'Islamic Society of North America (ISNA)', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { id: 1, nameEn: 'Univ. of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية بكراتشي' },
  { id: 13, nameEn: 'Diyanet İşleri Başkanlığı, Turkey', nameAr: 'رئاسة الشؤون الدينية، تركيا' },
];

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({
  lang,
  currentUser,
  onNavigateToReader,
  onNavigateToReflections,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // State
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hifz_prayer_city_idx');
      return saved !== null ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [calcMethod, setCalcMethod] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hifz_prayer_calc_method');
      return saved !== null ? parseInt(saved, 10) : 4;
    } catch {
      return 4;
    }
  });

  const [useGpsLocation, setUseGpsLocation] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hifz_prayer_use_gps') === 'true';
    } catch {
      return false;
    }
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number; label?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('hifz_prayer_coords');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [timings, setTimings] = useState<PrayerTimesData | null>(() => {
    try {
      const saved = localStorage.getItem('hifz_cached_prayer_times');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [dateMeta, setDateMeta] = useState<PrayerDateMeta | null>(() => {
    try {
      const saved = localStorage.getItem('hifz_cached_prayer_date');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeSessionTab, setActiveSessionTab] = useState<'all' | 'fajr' | 'asr' | 'maghrib' | 'isha'>('all');

  // Clock tick every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Prayer Times from Aladhan API
  const fetchPrayerTimes = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      let url = '';
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      if (useGpsLocation && coords) {
        url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${coords.lat}&longitude=${coords.lng}&method=${calcMethod}`;
      } else {
        const activePreset = PRESET_CITIES[selectedCityIndex] || PRESET_CITIES[0];
        url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(activePreset.city)}&country=${encodeURIComponent(activePreset.country)}&method=${calcMethod}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.data) {
        setTimings(data.data.timings);
        setDateMeta(data.data.date);
        localStorage.setItem('hifz_cached_prayer_times', JSON.stringify(data.data.timings));
        localStorage.setItem('hifz_cached_prayer_date', JSON.stringify(data.data.date));
      }
    } catch (err: any) {
      console.warn('Aladhan API fetch fallback:', err);
      // If we don't have cached data, provide a sensible default
      if (!timings) {
        const fallbackTimings: PrayerTimesData = {
          Fajr: '04:45',
          Sunrise: '06:05',
          Dhuhr: '12:20',
          Asr: '15:45',
          Sunset: '18:35',
          Maghrib: '18:35',
          Isha: '19:55',
          Imsak: '04:35',
          Midnight: '23:30',
        };
        setTimings(fallbackTimings);
      }
      setErrorMsg(isAr ? 'تم استخدام المواقيت المحفوظة مسبقاً (وضع الأوفلاين)' : 'Using cached/offline prayer schedule');
    } finally {
      setLoading(false);
    }
  }, [useGpsLocation, coords, selectedCityIndex, calcMethod, isAr]);

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg(isAr ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: isAr ? 'الموقع الجغرافي الحالي (GPS)' : 'Current GPS Location',
        };
        setCoords(newCoords);
        setUseGpsLocation(true);
        localStorage.setItem('hifz_prayer_coords', JSON.stringify(newCoords));
        localStorage.setItem('hifz_prayer_use_gps', 'true');
        setErrorMsg(null);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMsg(isAr ? 'تعذر الحصول على إذن الموقع. يمكنك اختيار مدينتك من القائمة.' : 'Location permission denied. Please pick a city from the list.');
        setUseGpsLocation(false);
        localStorage.setItem('hifz_prayer_use_gps', 'false');
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Clean time string (strips "(EST)" etc if present)
  const parseTimeString = (timeStr: string): { hours: number; minutes: number; text: string } => {
    if (!timeStr) return { hours: 0, minutes: 0, text: '--:--' };
    const cleaned = timeStr.split(' ')[0];
    const [h, m] = cleaned.split(':').map((num) => parseInt(num, 10));
    return { hours: h || 0, minutes: m || 0, text: cleaned };
  };

  // Convert 24h to 12h formatted with AM/PM
  const formatTo12Hour = (timeStr: string): string => {
    const { hours, minutes } = parseTimeString(timeStr);
    const period = hours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
    const h12 = hours % 12 || 12;
    const mStr = minutes.toString().padStart(2, '0');
    return isAr ? `${toArabicDigits(h12)}:${toArabicDigits(mStr)} ${period}` : `${h12}:${mStr} ${period}`;
  };

  // Calculate Next Prayer and Countdown
  const prayerScheduleList = useMemo(() => {
    if (!timings) return [];

    const keys: { key: keyof PrayerTimesData; nameKey: string; icon: React.ReactNode; color: string }[] = [
      { key: 'Fajr', nameKey: 'fajr', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
      { key: 'Sunrise', nameKey: 'sunrise', icon: <Sunrise className="w-4 h-4" />, color: 'text-amber-500' },
      { key: 'Dhuhr', nameKey: 'dhuhr', icon: <Sun className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
      { key: 'Asr', nameKey: 'asr', icon: <Sunset className="w-4 h-4" />, color: 'text-orange-500' },
      { key: 'Maghrib', nameKey: 'maghrib', icon: <Sunset className="w-4 h-4" />, color: 'text-rose-600 dark:text-rose-400' },
      { key: 'Isha', nameKey: 'isha', icon: <Moon className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
    ];

    return keys.map((item) => {
      const rawTime = timings[item.key] || '00:00';
      const { hours, minutes, text } = parseTimeString(rawTime);
      const prayerDate = new Date(now);
      prayerDate.setHours(hours, minutes, 0, 0);

      return {
        key: item.key,
        name: t[item.nameKey as keyof typeof t] || item.key,
        rawTime: text,
        formatted12: formatTo12Hour(rawTime),
        dateObj: prayerDate,
        icon: item.icon,
        color: item.color,
        isPassed: now.getTime() > prayerDate.getTime(),
      };
    });
  }, [timings, now, t, isAr]);

  // Find next upcoming prayer
  const nextPrayer = useMemo(() => {
    if (prayerScheduleList.length === 0) return null;

    // Prayers that are today and haven't passed yet
    const upcoming = prayerScheduleList.find((p) => p.dateObj.getTime() > now.getTime());
    if (upcoming) {
      const diffMs = upcoming.dateObj.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      return {
        ...upcoming,
        remainingHours: diffHrs,
        remainingMinutes: diffMins,
        remainingSeconds: diffSecs,
        isTomorrow: false,
      };
    }

    // If all prayers today have passed, next is tomorrow's Fajr
    const firstPrayer = prayerScheduleList[0];
    const tomorrowFajr = new Date(firstPrayer.dateObj);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);

    const diffMs = tomorrowFajr.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      ...firstPrayer,
      dateObj: tomorrowFajr,
      remainingHours: diffHrs,
      remainingMinutes: diffMins,
      remainingSeconds: diffSecs,
      isTomorrow: true,
    };
  }, [prayerScheduleList, now]);

  // Current active location label
  const currentLocationLabel = useMemo(() => {
    if (useGpsLocation && coords) {
      return coords.label || (isAr ? 'موقعي الحالي' : 'Current Location');
    }
    const preset = PRESET_CITIES[selectedCityIndex] || PRESET_CITIES[0];
    return isAr ? preset.nameAr : preset.nameEn;
  }, [useGpsLocation, coords, selectedCityIndex, isAr]);

  // Hijri Date Formatted
  const hijriFormatted = useMemo(() => {
    if (!dateMeta || !dateMeta.hijri) return '';
    const h = dateMeta.hijri;
    if (isAr) {
      return `${toArabicDigits(h.day)} ${h.month.ar || h.month.en} ${toArabicDigits(h.year)} هـ`;
    }
    return `${h.day} ${h.month.en} ${h.year} AH`;
  }, [dateMeta, isAr]);

  return (
    <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 shadow-sm space-y-6 transition-all" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Top Header & Location Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#065F46] dark:text-emerald-300">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-stone-100">
              {t.prayerTimes}
            </h3>
            {hijriFormatted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>{hijriFormatted}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-stone-400">
            {t.prayerTimesSubtitle}
          </p>
        </div>

        {/* Location Selector & Refresh Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700 text-xs font-semibold transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />
            <span className="max-w-[150px] truncate">{currentLocationLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={fetchPrayerTimes}
            disabled={loading}
            title={t.refreshTimes}
            className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700 text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#065F46]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings / Location Dropdown Panel */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#065F46] dark:text-emerald-400" />
              <span>{t.selectCity}</span>
            </span>
            <button
              onClick={handleDetectLocation}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#065F46] text-white hover:bg-[#044e39] font-bold text-[11px] transition-all shadow-xs"
            >
              <Navigation className="w-3 h-3" />
              <span>{t.detectLocation}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_CITIES.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCityIndex(idx);
                  setUseGpsLocation(false);
                  localStorage.setItem('hifz_prayer_city_idx', idx.toString());
                  localStorage.setItem('hifz_prayer_use_gps', 'false');
                  setShowSettings(false);
                }}
                className={`p-2 rounded-xl text-start border transition-all text-[11px] ${
                  !useGpsLocation && selectedCityIndex === idx
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-[#059669] text-[#065F46] dark:text-emerald-300 font-bold ring-1 ring-emerald-400/40'
                    : 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800 text-slate-700 dark:text-stone-300 hover:border-emerald-300'
                }`}
              >
                <div className="font-semibold">{isAr ? c.nameAr : c.city}</div>
                <div className="text-[10px] text-slate-400 dark:text-stone-500">{c.country}</div>
              </button>
            ))}
          </div>

          {/* Calculation Method Selector */}
          <div className="pt-3 border-t border-slate-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold text-slate-700 dark:text-stone-300">
              {t.calculationMethod}:
            </span>
            <select
              value={calcMethod}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCalcMethod(val);
                localStorage.setItem('hifz_prayer_calc_method', val.toString());
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-slate-800 dark:text-stone-200 text-xs focus:outline-none"
            >
              {CALC_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.nameAr : m.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error / Offline Alert */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hero: Next Prayer Card & Live Countdown Banner */}
      {nextPrayer && (
        <div className="rounded-2xl bg-gradient-to-br from-[#065F46] via-[#054E39] to-[#033c2d] text-white p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{t.nextPrayer}</span>
                {nextPrayer.isTomorrow && <span>({isAr ? 'غداً' : 'Tomorrow'})</span>}
              </div>
              <div className="flex items-baseline gap-3">
                <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {nextPrayer.name}
                </h4>
                <span className="text-lg sm:text-xl font-bold text-amber-300 font-mono">
                  {nextPrayer.formatted12}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                {currentLocationLabel}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-4 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider mb-0.5">
                  {t.timeRemaining}
                </div>
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-white flex items-center justify-center gap-1">
                  <span>{isAr ? toArabicDigits(nextPrayer.remainingHours.toString().padStart(2, '0')) : nextPrayer.remainingHours.toString().padStart(2, '0')}</span>
                  <span className="animate-pulse">:</span>
                  <span>{isAr ? toArabicDigits(nextPrayer.remainingMinutes.toString().padStart(2, '0')) : nextPrayer.remainingMinutes.toString().padStart(2, '0')}</span>
                  <span className="animate-pulse">:</span>
                  <span className="text-amber-300">{isAr ? toArabicDigits(nextPrayer.remainingSeconds.toString().padStart(2, '0')) : nextPrayer.remainingSeconds.toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 Daily Prayer Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {prayerScheduleList.map((prayer) => {
          const isNext = nextPrayer?.key === prayer.key;
          return (
            <div
              key={prayer.key}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col justify-between gap-2 ${
                isNext
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#059669] shadow-sm ring-2 ring-emerald-500/30'
                  : prayer.isPassed
                  ? 'bg-slate-50/70 dark:bg-stone-950/40 border-slate-200 dark:border-stone-850 opacity-70'
                  : 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className={prayer.color}>{prayer.icon}</span>
                {isNext && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </div>

              <div>
                <div className={`font-bold text-xs ${isNext ? 'text-[#065F46] dark:text-emerald-300' : 'text-slate-800 dark:text-stone-200'}`}>
                  {prayer.name}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-stone-100 font-mono mt-0.5">
                  {prayer.formatted12}
                </div>
              </div>

              <div className="text-[10px] font-medium">
                {isNext ? (
                  <span className="text-[#059669] dark:text-emerald-400 font-bold">{isAr ? 'القادمة' : 'Next'}</span>
                ) : prayer.isPassed ? (
                  <span className="text-slate-400 dark:text-stone-500">{isAr ? 'انقضت' : 'Passed'}</span>
                ) : (
                  <span className="text-slate-500 dark:text-stone-400">{isAr ? 'اليوم' : 'Today'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Hifz & Muraja'ah Schedule Anchors */}
      <div className="pt-2 border-t border-slate-100 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.hifzRoutineSuggestion}</span>
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-stone-400 font-medium">
            {isAr ? 'مستوحى من هدي السلف في المدارسة' : 'Anchored to daily Salah routines'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          
          {/* Fajr Golden Hour */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-[#065F46] dark:text-emerald-300 flex items-center gap-1.5">
                  <Sunrise className="w-4 h-4 text-amber-600" />
                  <span>{t.goldenFajrWindow}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 font-bold text-[#065F46] dark:text-emerald-200">
                  {isAr ? 'حفظ جديد' : 'New Memorization'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-stone-300 leading-relaxed">
                {t.goldenFajrDesc}
              </p>
            </div>

            {onNavigateToReader && (
              <button
                onClick={() => onNavigateToReader(currentUser?.currentPage || 1)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-xs shadow-xs transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isAr ? `فتح المصحف (ص ${toArabicDigits(currentUser?.currentPage || 1)})` : `Open Reader (p. ${currentUser?.currentPage || 1})`}</span>
              </button>
            )}
          </div>

          {/* Asr Spaced Repetition */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sunset className="w-4 h-4 text-orange-500" />
                  <span>{t.asrMurajaahWindow}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 font-bold text-amber-900 dark:text-amber-200">
                  {isAr ? 'تثبيت وتكرار' : 'Spaced Review'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-stone-300 leading-relaxed">
                {t.asrMurajaahDesc}
              </p>
            </div>

            {onNavigateToReader && (
              <button
                onClick={() => onNavigateToReader(Math.max(1, (currentUser?.currentPage || 1) - 1))}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'مراجعة الصفحات المستحقة' : 'Review Due Pages'}</span>
              </button>
            )}
          </div>

          {/* Maghrib Reflection */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50/50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>{t.maghribTadabburWindow}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 font-bold text-rose-900 dark:text-rose-200">
                  {isAr ? 'تدبر وتفسير' : 'Reflection'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-stone-300 leading-relaxed">
                {t.maghribTadabburDesc}
              </p>
            </div>

            {onNavigateToReflections && (
              <button
                onClick={onNavigateToReflections}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'استعراض مواضيع التدبر' : 'Open Tadabbur Hub'}</span>
              </button>
            )}
          </div>

          {/* Isha & Qiyam Night Recitation */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-blue-500" />
                  <span>{t.ishaTahajjudWindow}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 font-bold text-blue-900 dark:text-blue-200">
                  {isAr ? 'قيام الليل' : 'Tahajjud Recitation'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-stone-300 leading-relaxed">
                {t.ishaTahajjudDesc}
              </p>
            </div>

            {onNavigateToReader && (
              <button
                onClick={() => onNavigateToReader(currentUser?.currentPage || 1)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{isAr ? 'تلاوة ورد الليل' : 'Recite Night Portion'}</span>
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
