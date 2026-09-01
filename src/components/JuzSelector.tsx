import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight, 
  Bookmark, 
  Play, 
  Layers, 
  Award,
  Flame,
  Check,
  DownloadCloud,
  Wifi,
  WifiOff,
  HardDrive
} from 'lucide-react';
import { JuzMeta, UserProfile, PageProgressRecord, Language } from '../types';
import { JUZ_CATALOG } from '../lib/juzData';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { DEFAULT_USERS } from '../lib/firebase';
import { downloadJuzForOffline, JuzCacheProgress } from '../lib/offlineService';
import { useNetworkStatus } from '../lib/useNetworkStatus';

interface JuzSelectorProps {
  currentUser?: UserProfile;
  otherUser?: UserProfile;
  pageProgress?: Record<string, PageProgressRecord>;
  lang: Language;
  onSelectJuzForMemorization?: (juz: JuzMeta) => void;
  onSelectJuz?: (juzNumber: number, startPage: number) => void;
  onSetTargetJuz?: (juzNumber: number) => void;
}

export const JuzSelector: React.FC<JuzSelectorProps> = ({
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  pageProgress = {},
  lang,
  onSelectJuzForMemorization,
  onSelectJuz,
  onSetTargetJuz,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const { isOnline, cachedJuzList, isJuzAvailableOffline } = useNetworkStatus();
  const [downloadingJuz, setDownloadingJuz] = useState<Record<number, JuzCacheProgress>>({});

  const handleSelectMemorize = (juz: JuzMeta) => {
    if (typeof onSelectJuzForMemorization === 'function') {
      onSelectJuzForMemorization(juz);
    } else if (typeof onSelectJuz === 'function') {
      onSelectJuz(juz.number, juz.startPage);
    }
  };

  const handleTarget = (juzNumber: number) => {
    if (typeof onSetTargetJuz === 'function') {
      onSetTargetJuz(juzNumber);
    } else if (typeof onSelectJuz === 'function') {
      const found = JUZ_CATALOG.find((j) => j.number === juzNumber);
      onSelectJuz(juzNumber, found ? found.startPage : 1);
    } else if (typeof onSelectJuzForMemorization === 'function') {
      const found = JUZ_CATALOG.find((j) => j.number === juzNumber);
      if (found) onSelectJuzForMemorization(found);
    }
  };

  const handleDownloadJuz = async (juzNumber: number) => {
    if (downloadingJuz[juzNumber]?.status === 'downloading') return;

    await downloadJuzForOffline(juzNumber, (prog) => {
      setDownloadingJuz((prev) => ({
        ...prev,
        [juzNumber]: prog,
      }));
    });
  };

  // Calculate statistics for each Juz
  const calculateJuzStats = (juz: JuzMeta, userId: string) => {
    const totalPagesInJuz = juz.endPage - juz.startPage + 1;
    let memorizedCount = 0;
    let reviewedCount = 0;
    let inProgressCount = 0;

    for (let p = juz.startPage; p <= juz.endPage; p++) {
      const record = pageProgress?.[`${userId || 'user_a'}_page_${p}`];
      if (record) {
        if (record.status === 'memorized') memorizedCount++;
        else if (record.status === 'reviewed') reviewedCount++;
        else if (record.status === 'in_progress') inProgressCount++;
      }
    }

    const percent = Math.round((memorizedCount / totalPagesInJuz) * 100);
    return {
      totalPagesInJuz,
      memorizedCount,
      reviewedCount,
      inProgressCount,
      percent,
    };
  };

  const currentTargetJuzNum = currentUser.targetJuz || 30;
  const targetJuzObj = JUZ_CATALOG.find((j) => j.number === currentTargetJuzNum) || JUZ_CATALOG[29];
  const targetStats = calculateJuzStats(targetJuzObj, currentUser?.id || 'user_a');
  const isTargetCached = isJuzAvailableOffline(targetJuzObj.number);

  return (
    <div className="space-y-8 animate-in fade-in pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Offline Status Alert if device is disconnected */}
      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {isAr ? 'أنت في وضع عدم الاتصال (أوفلاين)' : 'You are currently offline'}
              </p>
              <p className="text-amber-800/80 dark:text-amber-300">
                {isAr 
                  ? `الأجزاء المحملة سابقاً متاحة بالكامل للتلاوة والتسميع بدون إنترنت (${cachedJuzList.length > 0 ? `الأجزاء: ${cachedJuzList.join('، ')}` : 'لم يتم تحميل أجزاء بعد'})` 
                  : `Cached Juz are available for full offline practice (${cachedJuzList.length > 0 ? `Juz: ${cachedJuzList.join(', ')}` : 'No cached Juz yet'})`}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-200 dark:bg-amber-900 font-bold text-amber-950 dark:text-amber-100 shrink-0">
            {isAr ? 'وضع الأوفلاين نشط' : 'Offline Mode Active'}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#065F46] via-[#054E39] to-[#043d2e] text-white p-6 sm:p-8 shadow-md relative overflow-hidden border border-[#044e39]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'خطة الأجزاء الـ ٣٠ وميزة الحفظ بدون إنترنت' : '30 Juz Mastery & Offline Memorization'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t.juzExplorerTitle}
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              {t.juzExplorerSubtitle}
            </p>
          </div>

          {/* Active Focused Juz Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-full md:w-auto min-w-[300px] shadow-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-emerald-200 mb-2 font-medium">
              <span>{t.targetJuzHeading}</span>
              <span className="bg-emerald-300/20 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                {targetStats.percent}% {t.memorized}
              </span>
            </div>
            <div className="font-bold text-lg text-white mb-1">
              {isAr ? targetJuzObj.nameAr : targetJuzObj.nameEn}
            </div>
            <div className="text-xs text-emerald-100/80 mb-3">
              {isAr ? `الصفحات: ${toArabicDigits(targetJuzObj.startPage)} - ${toArabicDigits(targetJuzObj.endPage)}` : `Pages ${targetJuzObj.startPage} - ${targetJuzObj.endPage}`}
              <span> • </span>
              {isAr ? `${toArabicDigits(targetStats.memorizedCount)} / ${toArabicDigits(targetStats.totalPagesInJuz)} صفحة` : `${targetStats.memorizedCount} / ${targetStats.totalPagesInJuz} pages`}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSelectMemorize(targetJuzObj)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.resumeJuz}</span>
              </button>

              {/* Cache / Offline Button for Target Juz */}
              <button
                onClick={() => handleDownloadJuz(targetJuzObj.number)}
                disabled={downloadingJuz[targetJuzObj.number]?.status === 'downloading'}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isTargetCached
                    ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>
                  {downloadingJuz[targetJuzObj.number]?.status === 'downloading'
                    ? (isAr ? `جار التحميل (${downloadingJuz[targetJuzObj.number]?.progress}%)` : `Caching (${downloadingJuz[targetJuzObj.number]?.progress}%)`)
                    : isTargetCached
                    ? (isAr ? 'جاهز للاستخدام بدون إنترنت ✅' : 'Cached for Offline ✅')
                    : (isAr ? 'تحميل الجزء للحفظ بدون إنترنت 📶' : 'Download Juz for Offline')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of All 30 Juz */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#065F46] dark:text-emerald-400" />
            <span>{isAr ? 'اختر الجزء الذي ترغب في حفظه ومراجعته:' : 'Select a Juz to Start Memorizing:'}</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-stone-400 font-medium">
            {isAr ? '٣٠ جزءاً' : '30 Total Juz'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {JUZ_CATALOG.map((juz) => {
            const myStats = calculateJuzStats(juz, currentUser.id);
            const otherStats = calculateJuzStats(juz, otherUser.id);
            const isTarget = juz.number === currentTargetJuzNum;
            const isCached = isJuzAvailableOffline(juz.number);
            const downloadProgress = downloadingJuz[juz.number];

            return (
              <div
                key={juz.number}
                className={`rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between gap-4 ${
                  isTarget
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-[#059669] shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800 hover:border-emerald-400/60 dark:hover:border-emerald-600/60 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {isAr ? toArabicDigits(juz.number) : juz.number}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-stone-100">
                          {isAr ? juz.nameAr : juz.nameEn}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-stone-400">
                          {isAr 
                            ? `الصفحات ${toArabicDigits(juz.startPage)} - ${toArabicDigits(juz.endPage)} (${toArabicDigits(juz.totalAyahs)} آية)`
                            : `Pages ${juz.startPage}-${juz.endPage} (${juz.totalAyahs} ayahs)`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCached && (
                        <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold" title={isAr ? 'محفوظ بدون إنترنت' : 'Cached Offline'}>
                          📶
                        </span>
                      )}
                      {isTarget && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#065F46] text-white text-[10px] font-bold">
                          {isAr ? 'المستهدف' : 'Current'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Surahs included pill list */}
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-stone-400 mb-1.5">
                      {t.surahsInJuz}:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(isAr ? juz.surahsIncluded : juz.surahsIncludedEn).slice(0, 4).map((sName, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 text-[10px] font-medium"
                        >
                          {sName}
                        </span>
                      ))}
                      {juz.surahsIncluded.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-stone-800 text-slate-500 text-[10px]">
                          +{juz.surahsIncluded.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual User Progress in this Juz */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                    
                    {/* Current User */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-900 dark:text-stone-200 flex items-center gap-1">
                          <span>{currentUser.avatar}</span>
                          <span>{currentUser.name}</span>
                        </span>
                        <span className="font-mono text-[#065F46] dark:text-emerald-400 font-bold">
                          {isAr ? `${toArabicDigits(myStats.memorizedCount)} / ${toArabicDigits(myStats.totalPagesInJuz)} (${toArabicDigits(myStats.percent)}%)` : `${myStats.memorizedCount}/${myStats.totalPagesInJuz} (${myStats.percent}%)`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#059669] rounded-full transition-all duration-300"
                          style={{ width: `${myStats.percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Partner User */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-slate-500 dark:text-stone-400 flex items-center gap-1">
                          <span>{otherUser.avatar}</span>
                          <span>{otherUser.name}</span>
                        </span>
                        <span className="font-mono text-slate-500 dark:text-stone-400 font-medium">
                          {isAr ? `${toArabicDigits(otherStats.memorizedCount)} / ${toArabicDigits(otherStats.totalPagesInJuz)} (${toArabicDigits(otherStats.percent)}%)` : `${otherStats.memorizedCount}/${otherStats.totalPagesInJuz} (${otherStats.percent}%)`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0284c7] rounded-full transition-all duration-300"
                          style={{ width: `${otherStats.percent}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  {/* Download Progress if active */}
                  {downloadProgress && downloadProgress.status === 'downloading' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-200 font-bold mb-1">
                        <span>{isAr ? 'جار تحميل صفحات الجزء...' : 'Caching pages...'}</span>
                        <span>{downloadProgress.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 transition-all duration-200" 
                          style={{ width: `${downloadProgress.progress}%` }} 
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Actions: Start Memorizing vs Set as Target vs Download Offline */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-stone-800">
                  <button
                    onClick={() => handleSelectMemorize(juz)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t.startMemorizingJuz}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadJuz(juz.number)}
                    title={isCached ? (isAr ? 'الجزء متاح أوفلاين' : 'Cached for offline') : (isAr ? 'تحميل الجزء أوفلاين' : 'Cache for offline')}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      isCached
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-stone-800 hover:bg-slate-100 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-stone-700'
                    }`}
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleTarget(juz.number)}
                    title={t.selectThisJuz}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      isTarget
                        ? 'bg-emerald-50 text-[#065F46] border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-stone-800 hover:bg-slate-100 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-stone-700'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
