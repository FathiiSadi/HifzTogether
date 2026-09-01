import React, { useState, useEffect } from 'react';
import { Ayah, AyahTafsir, Language } from '../types';
import { fetchAyahTafsir } from '../services/quranApi';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { 
  BookOpen, 
  X, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Volume2,
  ExternalLink
} from 'lucide-react';

interface AyahTafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  ayahList?: Ayah[];
  onSelectAyah?: (ayah: Ayah) => void;
  isPlayingAudio?: boolean;
  onPlayAyahAudio?: (ayah: Ayah) => void;
  lang: Language;
  selectedFont?: 'Amiri' | 'Scheherazade New';
}

export const AyahTafsirModal: React.FC<AyahTafsirModalProps> = ({
  isOpen,
  onClose,
  ayah,
  ayahList = [],
  onSelectAyah,
  isPlayingAudio = false,
  onPlayAyahAudio,
  lang,
  selectedFont = 'Amiri',
}) => {
  const [tafsirData, setTafsirData] = useState<AyahTafsir | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tafsir' | 'translation'>('tafsir');

  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!isOpen || !ayah) return;

    let isMounted = true;
    setLoading(true);

    fetchAyahTafsir(ayah.number, ayah)
      .then((data) => {
        if (isMounted) {
          setTafsirData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error in AyahTafsirModal:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, ayah]);

  if (!isOpen || !ayah) return null;

  const currentIndex = ayahList.findIndex((a) => a.number === ayah.number);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < ayahList.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectAyah) {
      onSelectAyah(ayahList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectAyah) {
      onSelectAyah(ayahList[currentIndex + 1]);
    }
  };

  const handleCopy = () => {
    const textToCopy = `﴿ ${ayah.text} ﴾ [${ayah.surahName || ''}: ${ayah.numberInSurah}]\n\nالتفسير الميسر:\n${tafsirData?.tafsirAr || ''}\n\n${ayah.translation ? `Translation:\n${ayah.translation}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-3xl border border-[#E2E8F0] dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-[#E2E8F0] dark:border-stone-800 bg-[#FDFBF7] dark:bg-stone-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#065F46] text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0F172A] dark:text-stone-100">
                  {isAr ? `تفسير سورة ${ayah.surahName || tafsirData?.surahNameAr || ''}` : `Tafsir of Surah ${tafsirData?.surahNameEn || ayah.surahName || ''}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  {t.ayah} {isAr ? toArabicDigits(ayah.numberInSurah) : ayah.numberInSurah}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-stone-400">
                {t.page} {isAr ? toArabicDigits(ayah.page) : ayah.page} • {t.juz} {isAr ? toArabicDigits(ayah.juz) : ayah.juz}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Copy Button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-[#E2E8F0] dark:border-stone-700 hover:bg-[#F1F5F9] text-[#64748B] dark:text-stone-300 text-xs flex items-center gap-1 transition-all"
              title={t.copyAyahAndTafsir}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline text-[11px]">{copied ? t.copiedToClipboard : t.copyAyahAndTafsir}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-[#E2E8F0] dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 text-[#64748B] dark:text-stone-300 transition-colors"
              title={t.closeTafsir}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#0F172A] dark:text-stone-100">
          
          {/* Authentic Quranic Ayah Script Card */}
          <div className="p-5 rounded-2xl bg-[#FFFDF5] dark:bg-stone-950/70 border-2 border-[#D97706]/30 dark:border-amber-700/40 text-center relative shadow-sm">
            <div 
              className={`leading-loose tracking-wide text-[#065F46] dark:text-emerald-300 text-right sm:text-center ${
                selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
              }`}
              style={{ fontSize: '24px', lineHeight: 2.2 }}
              dir="rtl"
            >
              {ayah.text}
              <span className="inline-flex items-center justify-center mx-2 text-[#D97706] dark:text-amber-400 select-none text-xl font-serif">
                ۝<span className="text-sm font-mono font-bold mx-0.5 text-[#065F46] dark:text-emerald-300">{toArabicDigits(ayah.numberInSurah)}</span>
              </span>
            </div>

            {/* Audio Recitation Player Button on Ayah */}
            <div className="mt-4 pt-3 border-t border-[#D97706]/20 flex items-center justify-center gap-3">
              <button
                onClick={() => onPlayAyahAudio && onPlayAyahAudio(ayah)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm transition-all transform active:scale-95 ${
                  isPlayingAudio
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : 'bg-[#065F46] hover:bg-[#044e39] text-white'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlayingAudio ? (isAr ? 'إيقاف التلاوة' : 'Pause Recitation') : (isAr ? 'الاستماع إلى الآية' : 'Listen to Recitation')}</span>
              </button>
            </div>
          </div>

          {/* Tafsir Content Card */}
          <div className="space-y-4">
            
            {/* View Mode Toggle: Arabic Tafsir vs English Translation */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-stone-200">
                  {t.tafsirTitle}
                </h4>
              </div>

              <div className="flex items-center bg-[#F1F5F9] dark:bg-stone-800 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTab('tafsir')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'tafsir' ? 'bg-[#065F46] text-white shadow-sm' : 'text-[#64748B] dark:text-stone-400'
                  }`}
                >
                  {isAr ? 'التفسير الميسر' : 'Arabic Tafsir'}
                </button>
                <button
                  onClick={() => setActiveTab('translation')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'translation' ? 'bg-[#065F46] text-white shadow-sm' : 'text-[#64748B] dark:text-stone-400'
                  }`}
                >
                  {isAr ? 'الترجمة الإنجليزية' : 'English Meaning'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[#065F46] border-t-transparent animate-spin"></div>
                <p className="text-xs text-[#64748B] dark:text-stone-400 font-medium">
                  {isAr ? 'جارٍ جلب التفسير المعتمد من مجمع الملك فهد...' : 'Fetching authentic Tafseer Al-Muyassar...'}
                </p>
              </div>
            ) : (
              <div>
                {activeTab === 'tafsir' ? (
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800 text-right space-y-3 leading-relaxed" dir="rtl">
                    <p className="text-sm sm:text-base text-[#1E293B] dark:text-stone-200 leading-8 font-sans">
                      {tafsirData?.tafsirAr || 'يتناول هذا المقطع القرآني الكريم تدبر آيات الله وتوجيه المؤمنين إلى الخير والعمل الصالح.'}
                    </p>
                    <div className="pt-2 border-t border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between text-[11px] text-[#64748B] dark:text-stone-400">
                      <span className="flex items-center gap-1 font-semibold text-[#065F46] dark:text-emerald-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        {tafsirData?.sourceNameAr || 'التفسير الميسر'}
                      </span>
                      <span>Alquran.cloud API</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800 text-left space-y-3 leading-relaxed" dir="ltr">
                    <p className="text-sm sm:text-base text-[#1E293B] dark:text-stone-200 leading-7 font-sans">
                      {ayah.translation || tafsirData?.tafsirEn || 'No translation available.'}
                    </p>
                    <div className="pt-2 border-t border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between text-[11px] text-[#64748B] dark:text-stone-400">
                      <span className="font-semibold text-[#065F46] dark:text-emerald-400">
                        Sahih International
                      </span>
                      <span>Alquran.cloud API</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer Navigation Bar (Previous / Next Ayah on this Page) */}
        {ayahList.length > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-stone-800 bg-[#FDFBF7] dark:bg-stone-950/60 flex items-center justify-between text-xs">
            <button
              disabled={!hasPrev}
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-[#E2E8F0] dark:border-stone-700 hover:bg-[#F1F5F9] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-bold transition-all shadow-sm"
              title={t.prevAyahTafsir}
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{t.prevAyahTafsir}</span>
            </button>

            <span className="font-mono text-[#065F46] dark:text-emerald-400 font-bold text-xs">
              {isAr ? `${toArabicDigits(currentIndex + 1)} من ${toArabicDigits(ayahList.length)}` : `${currentIndex + 1} of ${ayahList.length}`}
            </span>

            <button
              disabled={!hasNext}
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-[#E2E8F0] dark:border-stone-700 hover:bg-[#F1F5F9] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-bold transition-all shadow-sm"
              title={t.nextAyahTafsir}
            >
              <span>{t.nextAyahTafsir}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
