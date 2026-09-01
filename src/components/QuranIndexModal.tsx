import React, { useState } from 'react';
import { Search, X, BookOpen, Layers, Bookmark, ArrowRight, ArrowLeft } from 'lucide-react';
import { SURAH_CATALOG } from '../lib/quranData';
import { JUZ_CATALOG } from '../lib/juzData';
import { Language, SurahMeta, JuzMeta } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';

interface QuranIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSurah: (surahNumber: number, startPage: number, mode?: 'mushaf_page' | 'surah_view') => void;
  onSelectJuz: (juzNumber: number, startPage: number) => void;
  onSelectPage: (pageNumber: number) => void;
  currentPage: number;
  lang: Language;
}

export const QuranIndexModal: React.FC<QuranIndexModalProps> = ({
  isOpen,
  onClose,
  onSelectSurah,
  onSelectJuz,
  onSelectPage,
  currentPage,
  lang,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'surahs' | 'juz' | 'pages'>('surahs');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPageInput, setCustomPageInput] = useState<string>(currentPage.toString());

  // Filter Surahs
  const filteredSurahs = SURAH_CATALOG.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.number.toString() === q ||
      s.name.includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.startPage.toString() === q
    );
  });

  // Filter Juz
  const filteredJuz = JUZ_CATALOG.filter((j) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      j.number.toString() === q ||
      j.nameAr.includes(q) ||
      j.nameEn.toLowerCase().includes(q) ||
      j.shortNameAr.includes(q) ||
      j.surahsIncluded.some((s) => s.includes(q)) ||
      j.surahsIncludedEn.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(customPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
      onSelectPage(pageNum);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between gap-3 bg-[#F8FAFC] dark:bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#065F46] text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-stone-100">
                {t.quranIndex}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-stone-400">
                {isAr ? '١١٤ سورة • ٣٠ جزءاً • ٦٠٤ صفحات من المصحف الشريف' : '114 Surahs • 30 Juz • 604 Madinah Mushaf Pages'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white dark:bg-stone-800 text-[#64748B] dark:text-stone-400 hover:text-black dark:hover:text-white border border-[#E2E8F0] dark:border-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="p-4 border-b border-[#E2E8F0] dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-[#F1F5F9] dark:bg-stone-950 p-1 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('surahs')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'surahs'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
              >
                {t.surahList}
              </button>
              <button
                onClick={() => setActiveTab('juz')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'juz'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
              >
                {t.juzList}
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'pages'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
              >
                {t.jumpToPage}
              </button>
            </div>

            {/* Quick shortcuts indicator */}
            <span className="hidden sm:inline-block text-[11px] text-[#64748B] dark:text-stone-400 font-mono">
              {activeTab === 'surahs' ? `${filteredSurahs.length} / 114` : `${filteredJuz.length} / 30`}
            </span>
          </div>

          {activeTab !== 'pages' && (
            <div className="relative">
              <Search className={`w-4 h-4 text-[#94A3B8] absolute top-3.5 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchQuranIndex}
                className={`w-full py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 text-xs font-medium text-[#1E293B] dark:text-stone-200 border border-[#E2E8F0] dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-[#065F46] ${
                  isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
                }`}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {/* TAB 1: ALL 114 SURAHS */}
          {activeTab === 'surahs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredSurahs.map((surah) => (
                <div
                  key={surah.number}
                  className="p-3 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 bg-[#FDFCF7] dark:bg-stone-950 hover:border-emerald-500/50 hover:shadow-sm transition-all group flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 text-[#065F46] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {isAr ? toArabicDigits(surah.number) : surah.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-[#0F172A] dark:text-stone-100 truncate">
                        {surah.name} ({surah.englishName})
                      </h3>
                      <p className="text-[11px] text-[#64748B] dark:text-stone-400">
                        {isAr ? toArabicDigits(surah.numberOfAyahs) : surah.numberOfAyahs} {t.verses} • {isAr ? (surah.revelationType === 'Meccan' ? t.meccan : t.medinan) : surah.revelationType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onSelectSurah(surah.number, surah.startPage, 'mushaf_page');
                        onClose();
                      }}
                      className="px-2 py-1 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-[10px] font-bold transition-transform active:scale-95"
                      title={isAr ? `فتح صفحة ${surah.startPage}` : `Open Page ${surah.startPage}`}
                    >
                      {t.page} {isAr ? toArabicDigits(surah.startPage) : surah.startPage}
                    </button>
                    <button
                      onClick={() => {
                        onSelectSurah(surah.number, surah.startPage, 'surah_view');
                        onClose();
                      }}
                      className="px-2 py-1 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 text-[10px] font-semibold"
                      title={t.surahViewMode}
                    >
                      {isAr ? 'كاملة' : 'Full'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ALL 30 JUZ */}
          {activeTab === 'juz' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredJuz.map((juz) => (
                <div
                  key={juz.number}
                  className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 bg-[#FDFCF7] dark:bg-stone-950 hover:border-emerald-500/50 hover:shadow-sm transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                        {t.juz} {isAr ? toArabicDigits(juz.number) : juz.number}
                      </span>
                      <h3 className="font-bold text-xs text-[#0F172A] dark:text-stone-100">
                        {isAr ? juz.nameAr : juz.nameEn}
                      </h3>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-stone-400">
                      {isAr
                        ? `من صفحة ${toArabicDigits(juz.startPage)} إلى ${toArabicDigits(juz.endPage)} (${toArabicDigits(juz.endPage - juz.startPage + 1)} صفحة)`
                        : `Pages ${juz.startPage} to ${juz.endPage} (${juz.endPage - juz.startPage + 1} pages)`}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] dark:text-stone-500 truncate max-w-xs">
                      {isAr ? juz.surahsIncluded.join('، ') : juz.surahsIncludedEn.join(', ')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectJuz(juz.number, juz.startPage);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1"
                  >
                    <span>{t.page} {isAr ? toArabicDigits(juz.startPage) : juz.startPage}</span>
                    {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DIRECT PAGE JUMP */}
          {activeTab === 'pages' && (
            <div className="p-6 text-center space-y-6 max-w-lg mx-auto">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-stone-100 mb-1">
                  {isAr ? 'الانتقال المباشر لأي صفحة من المصحف' : 'Direct Jump to Any Page in the Mushaf'}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-stone-400">
                  {isAr ? 'أدخل رقم الصفحة من ١ إلى ٦٠٤ للانتقال الفوري' : 'Enter any page number from 1 to 604 to jump instantly'}
                </p>
              </div>

              <form onSubmit={handlePageJumpSubmit} className="flex items-center justify-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={customPageInput}
                  onChange={(e) => setCustomPageInput(e.target.value)}
                  className="w-32 py-3 px-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border-2 border-[#065F46] text-center font-mono font-bold text-lg text-[#0F172A] dark:text-stone-100 focus:outline-none shadow-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="py-3 px-6 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-sm shadow-md transition-all"
                >
                  {t.go}
                </button>
              </form>

              {/* Quick Jump Buttons for famous Milestones */}
              <div className="pt-4 border-t border-[#E2E8F0] dark:border-stone-800 space-y-2">
                <p className="text-xs font-semibold text-[#64748B] dark:text-stone-400">
                  {isAr ? 'محطات ومقاصد شائعة:' : 'Popular Quran Milestones:'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { nameAr: 'الفاتحة', nameEn: 'Al-Fatihah', page: 1 },
                    { nameAr: 'البقرة', nameEn: 'Al-Baqarah', page: 2 },
                    { nameAr: 'الكهف', nameEn: 'Al-Kahf', page: 293 },
                    { nameAr: 'يس', nameEn: 'Yasin', page: 440 },
                    { nameAr: 'الرحمن', nameEn: 'Ar-Rahman', page: 531 },
                    { nameAr: 'الواقعة', nameEn: 'Al-Waqi\'ah', page: 534 },
                    { nameAr: 'الملك', nameEn: 'Al-Mulk', page: 562 },
                    { nameAr: 'النبأ (جزء عم)', nameEn: 'An-Naba (Juz Amma)', page: 582 },
                    { nameAr: 'الضحى', nameEn: 'Ad-Duha', page: 596 },
                    { nameAr: 'الإخلاص والمعوذتان', nameEn: 'Al-Ikhlas & Mu\'awwidhat', page: 604 },
                  ].map((item) => (
                    <button
                      key={item.page}
                      onClick={() => {
                        onSelectPage(item.page);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-emerald-100 hover:text-[#065F46] text-[#475569] dark:text-stone-300 text-xs font-medium border border-[#E2E8F0] dark:border-stone-700 transition-all"
                    >
                      {isAr ? `${item.nameAr} (ص ${toArabicDigits(item.page)})` : `${item.nameEn} (Pg ${item.page})`}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
