import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  HeartHandshake, 
  Shield, 
  Compass, 
  BookOpen, 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause,
  Layers,
  Heart,
  Copy,
  Check,
  Languages,
  Search,
  BookMarked,
  Info
} from 'lucide-react';
import { ReflectionItem, ReflectionCategory, UserProfile, SharedReflectionNote, Language } from '../types';
import { REFLECTION_CATEGORIES, CURATED_REFLECTIONS, SURAH_CATALOG } from '../lib/quranData';
import { formatTimeAgo, toArabicDigits } from '../lib/utils';
import { getTranslation } from '../lib/i18n';
import { DEFAULT_USERS } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface ReflectionsHubProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  reflectionNotes: SharedReflectionNote[];
  lang: Language;
  onAddReflectionNote: (reflectionId: string, text: string) => void;
  onNavigateToSurahPage: (page: number, surahNumber: number) => void;
  selectedFont: string;
  fontSize: number;
}

type ReflectionViewLangMode = 'bilingual' | 'ar' | 'en';

export const ReflectionsHub: React.FC<ReflectionsHubProps> = ({
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  reflectionNotes = [],
  lang,
  onAddReflectionNote,
  onNavigateToSurahPage,
  selectedFont,
  fontSize,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // Display language mode for reflections (defaults to bilingual so both Arabic and English are visible)
  const [viewLangMode, setViewLangMode] = useState<ReflectionViewLangMode>('bilingual');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTafsir, setExpandedTafsir] = useState<Record<string, boolean>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleTafsir = (id: string) => {
    setExpandedTafsir((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const playAudio = (item: ReflectionItem) => {
    if (!item.audioUrl) return;
    if (playingAudioId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = item.audioUrl;
        audioRef.current.play().then(() => {
          setPlayingAudioId(item.id);
        }).catch((e) => console.warn('Audio error:', e));
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingAudioId(null);
  };

  const handleCopyReflection = (item: ReflectionItem) => {
    const textToCopy = `📖 ${item.surahNameAr} (${item.surahNameEn}) - ${isAr ? toArabicDigits(item.ayahNumber) : item.ayahNumber}
"${item.ayahTextAr}"
"${item.ayahTranslationEn}"

💎 ${isAr ? 'التدبر الإيماني' : 'Heart Takeaway (Arabic)'}:
${item.contextAndTakeawayAr || item.contextAndTakeaway}

🌱 Heart Takeaway (English):
${item.contextAndTakeawayEn || item.contextAndTakeaway}

📚 ${item.tafsirSourceAr || 'خلاصة التفسير'}:
${item.tafsirSummaryAr || item.tafsirSummary}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendNote = (reflectionId: string, textOverride?: string) => {
    const text = (textOverride || noteInputs[reflectionId])?.trim();
    if (!text) return;

    onAddReflectionNote(reflectionId, text);
    if (!textOverride) {
      setNoteInputs((prev) => ({ ...prev, [reflectionId]: '' }));
    }
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.8 },
      colors: ['#065F46', '#D97706', '#3b82f6'],
    });
  };

  const filteredReflections = CURATED_REFLECTIONS.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.categoryId === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.surahNameAr.toLowerCase().includes(q) ||
      r.surahNameEn.toLowerCase().includes(q) ||
      r.ayahTextAr.toLowerCase().includes(q) ||
      r.ayahTranslationEn.toLowerCase().includes(q) ||
      (r.contextAndTakeawayAr && r.contextAndTakeawayAr.toLowerCase().includes(q)) ||
      (r.contextAndTakeawayEn && r.contextAndTakeawayEn.toLowerCase().includes(q)) ||
      (r.tagsAr && r.tagsAr.some((tag) => tag.toLowerCase().includes(q))) ||
      (r.tagsEn && r.tagsEn.some((tag) => tag.toLowerCase().includes(q)))
    );
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield': return <Shield className="w-4 h-4" />;
      case 'HeartHandshake': return <HeartHandshake className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Quick reflection prompts for mutual inspiration
  const quickPrompts = [
    { ar: 'سبحان الله العظيم، ما أعظم هذا التدبر', en: 'SubhanAllah, what a profound reflection' },
    { ar: 'آية تلامس شغاف القلب وتبعث الطمأنينة', en: 'A verse that touches the heart with deep calm' },
    { ar: 'اللهم اجعلنا من الصابرين الذاكرين', en: 'May Allah make us steadfast and grateful' },
    { ar: 'الحمد لله على نعمة القرآن وتيسيره', en: 'Alhamdulillah for the blessing and ease of the Quran' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] p-6 sm:p-8 text-white border border-[#043d2e] shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FCD34D]" />
              <span>
                {isAr 
                  ? 'تأملات وتدبر إيماني باللغتين العربية والإنجليزية' 
                  : 'Quranic Tadabbur & Reflections in Both Arabic & English'}
              </span>
            </div>

            {/* Language View Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/25 border border-white/15 text-xs">
              <Languages className="w-3.5 h-3.5 ml-1.5 text-emerald-300 hidden sm:inline" />
              <button
                onClick={() => setViewLangMode('bilingual')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  viewLangMode === 'bilingual'
                    ? 'bg-white text-[#064E3B] shadow-sm'
                    : 'text-emerald-100/80 hover:text-white'
                }`}
                title="Bilingual View (Arabic & English)"
              >
                🌐 {isAr ? 'كلاهما (عربي + English)' : 'Bilingual (Both)'}
              </button>
              <button
                onClick={() => setViewLangMode('ar')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  viewLangMode === 'ar'
                    ? 'bg-white text-[#064E3B] shadow-sm'
                    : 'text-emerald-100/80 hover:text-white'
                }`}
              >
                🇸🇦 العربية
              </button>
              <button
                onClick={() => setViewLangMode('en')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  viewLangMode === 'en'
                    ? 'bg-white text-[#064E3B] shadow-sm'
                    : 'text-emerald-100/80 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? 'تأملات وتدبر القرآن العظيم' : 'Life Reflections & Quranic Tadabbur'}
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              {viewLangMode === 'bilingual'
                ? (isAr 
                    ? 'ربط الآيات العظيمة بالصبر، السكينة، الرجاء، والهداية مع التفسير والتدبر باللغتين العربية والإنجليزية وتبادل الخواطر مع الشريك.'
                    : 'Connect divine wisdom with patience, anxiety, hope, and purpose through authentic Tafsir & heart takeaways presented in both Arabic and English.')
                : isAr 
                    ? t.reflectionsDesc 
                    : t.reflectionsDesc}
            </p>
          </div>

          {/* Search bar inside header */}
          <div className="relative max-w-md pt-2">
            <Search className={`w-4 h-4 absolute top-5 text-emerald-300/80 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في الآيات، المعاني، السور، أو الكلمات المفتاحية...' : 'Search verses, takeaways, surahs, or themes...'}
              className={`w-full py-2.5 rounded-2xl bg-black/20 hover:bg-black/30 focus:bg-black/40 border border-white/20 text-white placeholder-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute top-4 text-xs text-emerald-200/80 hover:text-white font-bold ${isAr ? 'left-3' : 'right-3'}`}
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
            selectedCategory === 'all'
              ? 'bg-[#065F46] text-white shadow-emerald-900/20'
              : 'bg-white dark:bg-stone-900 hover:bg-[#F8FAFC] text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            {viewLangMode === 'bilingual'
              ? (isAr ? 'جميع الموضوعات • All Themes' : 'All Themes • جميع الموضوعات')
              : isAr ? 'جميع الموضوعات' : 'All Themes'}
          </span>
        </button>

        {REFLECTION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === cat.id
                ? 'bg-[#065F46] text-white shadow-emerald-900/20'
                : 'bg-white dark:bg-stone-900 hover:bg-[#F8FAFC] text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-800'
            }`}
          >
            {getCategoryIcon(cat.iconName)}
            <span>
              {viewLangMode === 'bilingual'
                ? `${cat.titleAr} • ${cat.titleEn}`
                : isAr ? cat.titleAr : cat.titleEn}
            </span>
          </button>
        ))}
      </div>

      {/* Active Category Description Banner */}
      {selectedCategory !== 'all' && (() => {
        const activeCat = REFLECTION_CATEGORIES.find((c) => c.id === selectedCategory);
        if (!activeCat) return null;
        return (
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-xs text-[#065F46] dark:text-emerald-300 flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#065F46] dark:text-emerald-400" />
            <div className="space-y-1">
              <span className="font-bold text-sm">
                {viewLangMode === 'bilingual'
                  ? `${activeCat.titleAr} — ${activeCat.titleEn}`
                  : isAr ? activeCat.titleAr : activeCat.titleEn}
              </span>
              <p className="text-[#334155] dark:text-stone-300 leading-relaxed">
                {viewLangMode === 'bilingual' ? (
                  <>
                    <span className="block font-medium">🇸🇦 {activeCat.descriptionAr}</span>
                    <span className="block font-sans text-stone-600 dark:text-stone-400">🇬🇧 {activeCat.descriptionEn}</span>
                  </>
                ) : isAr ? activeCat.descriptionAr : activeCat.descriptionEn}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Empty State */}
      {filteredReflections.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-[#E2E8F0] dark:border-stone-800 p-8">
          <BookMarked className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#1E293B] dark:text-stone-100">
            {isAr ? 'لم يتم العثور على تأملات مطابقة' : 'No reflections matched your search'}
          </h3>
          <p className="text-xs text-[#64748B] dark:text-stone-400 mt-1">
            {isAr ? 'جرّب البحث بكلمات أخرى أو اختر موضوعاً مختلفاً.' : 'Try a different keyword or select another category.'}
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 rounded-2xl bg-[#065F46] text-white text-xs font-bold"
          >
            {isAr ? 'عرض جميع التأملات' : 'Reset Filters'}
          </button>
        </div>
      )}

      {/* Reflections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReflections.map((item) => {
          const category = REFLECTION_CATEGORIES.find((c) => c.id === item.categoryId);
          const isPlaying = playingAudioId === item.id;
          const isTafsirOpen = !!expandedTafsir[item.id];
          const notesForThis = reflectionNotes.filter((n) => n.reflectionId === item.id);
          const isCopied = copiedId === item.id;
          const surahMeta = SURAH_CATALOG.find((s) => s.number === item.surahNumber);

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* 1. Header: Category & Reference */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${category?.accent || 'text-[#065F46] bg-[#ECFDF5] border-emerald-200'}`}>
                    {category && getCategoryIcon(category.iconName)}
                    <span>
                      {viewLangMode === 'bilingual'
                        ? `${category?.titleAr} • ${category?.titleEn}`
                        : isAr ? category?.titleAr : category?.titleEn}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#D97706] font-mono bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      {isAr 
                        ? `سورة ${item.surahNameAr} ۝ ${toArabicDigits(item.ayahNumber)}` 
                        : `${item.surahNameEn} : ${item.ayahNumber}`}
                      {viewLangMode === 'bilingual' && (
                        <span className="text-[10px] text-[#92400E] ml-1 mr-1">
                          ({isAr ? item.surahNameEn : item.surahNameAr})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Arabic Quranic Ayah Text */}
                <div 
                  className={`text-right p-5 rounded-2xl bg-[#FDFCF7] dark:bg-stone-950/80 border border-[#E2E8F0] dark:border-stone-800 text-[#0F172A] dark:text-stone-100 shadow-inner ${
                    selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
                  }`}
                  dir="rtl"
                  style={{ fontSize: `${Math.max(21, fontSize)}px`, lineHeight: 2.3 }}
                >
                  <span className="leading-loose select-text font-bold">
                    {item.ayahTextAr}
                  </span>
                </div>

                {/* 3. Ayah Translation & Arabic Meaning */}
                <div className="space-y-2.5">
                  {/* English Translation (Shown in bilingual and English modes) */}
                  {(viewLangMode === 'bilingual' || viewLangMode === 'en') && (
                    <div className="text-[#334155] dark:text-stone-200 text-xs sm:text-sm leading-relaxed p-3 rounded-2xl bg-slate-50 dark:bg-stone-950/40 border-l-4 border-[#065F46] font-sans">
                      <span className="text-[10px] font-bold text-[#065F46] dark:text-emerald-400 block mb-0.5 uppercase tracking-wider">
                        🇬🇧 English Translation (Sahih Int.):
                      </span>
                      <p className="italic">"{item.ayahTranslationEn}"</p>
                    </div>
                  )}

                  {/* Arabic Vocabulary / Sharh (Shown in bilingual and Arabic modes) */}
                  {(viewLangMode === 'bilingual' || viewLangMode === 'ar') && item.ayahMeaningAr && (
                    <div className="text-xs leading-relaxed p-3 rounded-2xl bg-amber-50/50 dark:bg-stone-950/40 border border-amber-200/60 dark:border-stone-800 text-[#78350F] dark:text-amber-300" dir="rtl">
                      <span className="font-bold text-[#B45309] block mb-0.5">
                        🇸🇦 معاني المفردات والبيان:
                      </span>
                      <p>{item.ayahMeaningAr}</p>
                    </div>
                  )}
                </div>

                {/* 4. Heart Takeaway & Life Tadabbur (Dual Language Card) */}
                <div className="p-4 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2.5">
                  <div className="font-bold text-xs text-[#065F46] dark:text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#D97706] fill-amber-400/30" />
                      {viewLangMode === 'bilingual' 
                        ? 'الدرس الإيماني والتدبر • Heart Takeaway & Life Tadabbur'
                        : t.heartTakeaway}
                    </span>
                  </div>

                  {/* Bilingual View: Both Arabic & English Takeaways */}
                  {viewLangMode === 'bilingual' ? (
                    <div className="space-y-2 text-xs leading-relaxed">
                      {/* Arabic Takeaway */}
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-emerald-200/60 dark:border-emerald-800/40" dir="rtl">
                        <span className="text-[11px] font-bold text-[#065F46] dark:text-emerald-400 block mb-0.5">
                          🇸🇦 التدبر والدرس الإيماني:
                        </span>
                        <p className="text-[#1E293B] dark:text-stone-200 leading-relaxed">
                          {item.contextAndTakeawayAr || item.contextAndTakeaway}
                        </p>
                      </div>

                      {/* English Takeaway */}
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-emerald-200/60 dark:border-emerald-800/40 font-sans" dir="ltr">
                        <span className="text-[11px] font-bold text-[#065F46] dark:text-emerald-400 block mb-0.5">
                          🇬🇧 Heart Takeaway & Life Reflection:
                        </span>
                        <p className="text-[#1E293B] dark:text-stone-200 leading-relaxed">
                          {item.contextAndTakeawayEn || item.contextAndTakeaway}
                        </p>
                      </div>
                    </div>
                  ) : viewLangMode === 'ar' ? (
                    <p className="text-xs text-[#1E293B] dark:text-stone-200 leading-relaxed" dir="rtl">
                      {item.contextAndTakeawayAr || item.contextAndTakeaway}
                    </p>
                  ) : (
                    <p className="text-xs text-[#1E293B] dark:text-stone-200 leading-relaxed font-sans" dir="ltr">
                      {item.contextAndTakeawayEn || item.contextAndTakeaway}
                    </p>
                  )}
                </div>

                {/* 5. Collapsible Scholarly Tafsir Section */}
                {isTafsirOpen && (
                  <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-stone-950 border border-[#FDE68A] dark:border-stone-800 text-xs text-[#92400E] dark:text-stone-300 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between font-bold text-[#B45309] border-b border-amber-200 dark:border-stone-800 pb-1.5">
                      <span>{isAr ? '📚 التفسير المأثور وسياق الآية:' : '📚 Scholarly Tafsir & Context:'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-950 text-[#92400E] dark:text-amber-300">
                        {isAr ? (item.tafsirSourceAr || 'تفسير ابن كثير / السعدي') : (item.tafsirSourceEn || 'Tafsir Ibn Kathir / Al-Sa\'di')}
                      </span>
                    </div>

                    {/* Bilingual Tafsir Content */}
                    {viewLangMode === 'bilingual' ? (
                      <div className="space-y-2.5">
                        {/* Arabic Tafsir */}
                        <div dir="rtl" className="p-2.5 rounded-xl bg-white/70 dark:bg-stone-900 border border-amber-200/50 dark:border-stone-800">
                          <span className="text-[10px] font-bold text-[#B45309] block mb-0.5">
                            🇸🇦 {item.tafsirSourceAr || 'خلاصة التفسير المعتمد'}:
                          </span>
                          <p className="leading-relaxed text-[#78350F] dark:text-stone-300">
                            {item.tafsirSummaryAr || item.tafsirSummary}
                          </p>
                        </div>

                        {/* English Tafsir */}
                        <div dir="ltr" className="p-2.5 rounded-xl bg-white/70 dark:bg-stone-900 border border-amber-200/50 dark:border-stone-800 font-sans">
                          <span className="text-[10px] font-bold text-[#B45309] block mb-0.5">
                            🇬🇧 {item.tafsirSourceEn || 'English Tafsir Summary'}:
                          </span>
                          <p className="leading-relaxed text-[#78350F] dark:text-stone-300">
                            {item.tafsirSummaryEn || item.tafsirSummary}
                          </p>
                        </div>
                      </div>
                    ) : viewLangMode === 'ar' ? (
                      <p className="leading-relaxed text-[#78350F] dark:text-stone-300" dir="rtl">
                        {item.tafsirSummaryAr || item.tafsirSummary}
                      </p>
                    ) : (
                      <p className="leading-relaxed text-[#78350F] dark:text-stone-300 font-sans" dir="ltr">
                        {item.tafsirSummaryEn || item.tafsirSummary}
                      </p>
                    )}
                  </div>
                )}

                {/* 6. Bilingual Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {viewLangMode === 'bilingual' ? (
                    <>
                      {item.tagsAr?.map((tag, idx) => (
                        <span key={`ar-${idx}`} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-[#475569] dark:text-stone-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                      {item.tagsEn?.map((tag, idx) => (
                        <span key={`en-${idx}`} className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#065F46] dark:text-emerald-300 font-sans">
                          #{tag}
                        </span>
                      ))}
                    </>
                  ) : isAr ? (
                    item.tagsAr?.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-[#475569] dark:text-stone-300">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    item.tagsEn?.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-[#475569] dark:text-stone-300">
                        #{tag}
                      </span>
                    ))
                  )}
                </div>

              </div>

              {/* Action Bar & Partner Collaboration */}
              <div className="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-stone-800 space-y-4">
                
                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Audio Play/Pause Button */}
                    <button
                      onClick={() => playAudio(item)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-bold transition-all shadow-sm ${
                        isPlaying
                          ? 'bg-[#D97706] text-white shadow-amber-900/20 animate-pulse'
                          : 'bg-[#065F46] hover:bg-[#044e39] text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlaying ? t.pause : t.listenRecitation}</span>
                    </button>

                    {/* Tafsir Toggle Button */}
                    <button
                      onClick={() => toggleTafsir(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-700 font-medium transition-colors"
                    >
                      <span>{t.tafsir}</span>
                      {isTafsirOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyReflection(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-700 transition-colors"
                      title={isAr ? 'نسخ التأمل كاملاً' : 'Copy Reflection'}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopied ? t.copied : t.copyReflection}</span>
                    </button>
                  </div>

                  {/* Open in Mushaf Reader Button */}
                  <button
                    onClick={() => onNavigateToSurahPage(surahMeta?.startPage || 1, item.surahNumber)}
                    className="flex items-center gap-1.5 text-[#065F46] dark:text-emerald-400 hover:underline font-bold text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t.openInMushaf}</span>
                  </button>
                </div>

                {/* Partner Reflection Notes Stream */}
                <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-stone-800/60">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-stone-400">
                    <span className="font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#D97706]" />
                      {isAr 
                        ? `تأملات الشريكين (${toArabicDigits(notesForThis.length)})` 
                        : `Brotherly Notes (${notesForThis.length})`}
                    </span>
                  </div>

                  {/* Notes List */}
                  {notesForThis.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {notesForThis.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-2xl text-xs border ${
                            n.userId === 'user_a'
                              ? 'bg-[#ECFDF5] border-emerald-200 text-[#065F46] dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-200'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B] dark:bg-stone-950 dark:border-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <div className="flex justify-between font-bold text-[10px] text-[#64748B] dark:text-stone-400 mb-0.5">
                            <span>{n.userName}</span>
                            <span>{formatTimeAgo(n.timestamp)}</span>
                          </div>
                          <p className="leading-relaxed">{n.noteText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Inspiration Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {quickPrompts.map((qp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendNote(item.id, isAr ? qp.ar : qp.en)}
                        className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-stone-800 dark:hover:bg-emerald-950/60 text-[#475569] dark:text-stone-300 hover:text-[#065F46] border border-slate-200/80 dark:border-stone-700 transition-colors"
                      >
                        + {isAr ? qp.ar : qp.en}
                      </button>
                    ))}
                  </div>

                  {/* Add Partner Note Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendNote(item.id);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={noteInputs[item.id] || ''}
                      onChange={(e) => setNoteInputs({ ...noteInputs, [item.id]: e.target.value })}
                      placeholder={isAr ? 'أضف تدبراً أو خاطرة إيمانية مع شريكك...' : 'Add a Tadabbur reflection note for your partner...'}
                      className="flex-1 px-3.5 py-2 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs text-[#1E293B] dark:text-stone-200 placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#065F46]"
                    />
                    <button
                      type="submit"
                      disabled={!(noteInputs[item.id]?.trim())}
                      className="p-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] disabled:opacity-40 text-white shadow-sm transition-all"
                      title={isAr ? 'نشر التأمل' : 'Send Note'}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
