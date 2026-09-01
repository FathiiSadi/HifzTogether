import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  Type,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  HelpCircle,
  Sliders,
  AudioLines,
  FileText,
  Image as ImageIcon,
  LayoutList,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import { Ayah, Language, PageProgressRecord, UserProfile, SurahMeta } from '../types';
import { fetchPage, fetchSurah, getAyahAudioUrl, getMushafPageImageUrl } from '../services/quranApi';
import { SURAH_CATALOG, RECITERS } from '../lib/quranData';
import { JUZ_CATALOG } from '../lib/juzData';
import { toArabicDigits } from '../lib/utils';
import { getTranslation } from '../lib/i18n';
import { DEFAULT_USERS } from '../lib/firebase';
import { QuranIndexModal } from './QuranIndexModal';
import { AudioWaveform } from './AudioWaveform';
import { AyahTafsirModal } from './AyahTafsirModal';
import confetti from 'canvas-confetti';

interface QuranReaderProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageProgress: Record<string, PageProgressRecord>;
  onMarkPageProgress: (page: number, status: 'memorized' | 'reviewed' | 'in_progress') => void;
  lang: Language;
  onOpenQuizModal?: (juzNumber?: number) => void;
  currentUser?: UserProfile;
  otherUser?: UserProfile;
  onApproveMemorization?: (recordId: string) => void;
  onRequestRevision?: (recordId: string, notes?: string) => void;
  selectedFont?: 'Amiri' | 'Scheherazade New';
  fontSize?: number;
}

// Clean leading Bismillah from Ayah 1 of Surahs 2-114
function cleanAyahArabicText(ayah: Ayah): string {
  if (ayah.numberInSurah === 1 && ayah.surahNumber !== 1) {
    // Regex matches leading Bismillah variations in Uthmani text
    return ayah.text.replace(/^(بِسْمِ\s+[^\s]+\s+[^\s]+\s+[^\s]+\s*)/, '').trim();
  }
  return ayah.text.trim();
}

export const QuranReader: React.FC<QuranReaderProps> = ({
  currentPage,
  onPageChange,
  pageProgress,
  onMarkPageProgress,
  lang,
  onOpenQuizModal,
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  onApproveMemorization,
  onRequestRevision,
  selectedFont: propSelectedFont,
  fontSize: propFontSize,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // Primary Navigation View: 'mushaf_page' | 'surah_view'
  const [viewMode, setViewMode] = useState<'mushaf_page' | 'surah_view'>('mushaf_page');
  
  // Mushaf Page Presentation Style: 'flowing' | 'scanned' | 'cards'
  const [mushafDisplayType, setMushafDisplayType] = useState<'flowing' | 'scanned' | 'cards'>('flowing');
  const [imageZoomLevel, setImageZoomLevel] = useState<number>(100);

  const [selectedSurah, setSelectedSurah] = useState<number>(currentUser?.currentSurah || 67);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isIndexModalOpen, setIsIndexModalOpen] = useState<boolean>(false);
  const [quickPageInput, setQuickPageInput] = useState<string>('');

  // Selected Ayah for quick inspector & tooltip
  const [selectedAyahIndex, setSelectedAyahIndex] = useState<number | null>(null);

  // Tafsir Modal state (Alquran.cloud API concise Tafsir)
  const [tafsirModalAyah, setTafsirModalAyah] = useState<Ayah | null>(null);
  const [isTafsirModalOpen, setIsTafsirModalOpen] = useState<boolean>(false);

  const handleOpenTafsir = (ayah: Ayah) => {
    setTafsirModalAyah(ayah);
    setIsTafsirModalOpen(true);
  };

  // Memorization Mode ("Hide & Reveal")
  const [memorizationMode, setMemorizationMode] = useState<boolean>(false);
  const [revealDifficulty, setRevealDifficulty] = useState<'blur_all' | 'first_word' | 'blanks'>('blur_all');
  const [revealedWords, setRevealedWords] = useState<Record<number, Set<number>>>({});
  
  // Translation display
  const [showTranslation, setShowTranslation] = useState<boolean>(true);

  // Voice Player Open / Closed State & Infinite / Continuous Playback
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState<boolean>(false);
  const [continuousInfinitePlayback, setContinuousInfinitePlayback] = useState<boolean>(true);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatCount, setRepeatCount] = useState<number>(999); // Default to infinite recitation loop or continuous
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.alafasy');
  const [autoPlayNextPage, setAutoPlayNextPage] = useState<boolean>(false);

  // Font & Visual Settings
  const fontSize = propFontSize || 26;
  const selectedFont = propSelectedFont || 'Amiri';

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Current page progress record
  const progressRecordId = `${currentUser.id}_page_${currentPage}`;
  const currentRecord = pageProgress[progressRecordId];

  // Current Surah metadata & Juz lookup
  const currentSurahMeta = SURAH_CATALOG.find((s) => s.number === selectedSurah) || SURAH_CATALOG[66];
  const currentJuzObj = JUZ_CATALOG.find((j) => currentPage >= j.startPage && currentPage <= j.endPage) || JUZ_CATALOG[28];

  // Surahs present on the current page
  const pageSurahNumbers = Array.from(new Set(ayahs.map((a) => a.surahNumber)));
  const pageSurahs = pageSurahNumbers
    .map((num) => SURAH_CATALOG.find((s) => s.number === num))
    .filter(Boolean) as SurahMeta[];

  // Load Quran Data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      let data: Ayah[] = [];
      if (viewMode === 'mushaf_page') {
        data = await fetchPage(currentPage);
      } else {
        data = await fetchSurah(selectedSurah);
      }

      if (isMounted) {
        setAyahs(data);
        setLoading(false);
        resetRevealedState(data, revealDifficulty);
        setSelectedAyahIndex(null);

        // If continuous playback triggered page advance, start first ayah automatically
        if (autoPlayNextPage && isAudioPlayerOpen && data.length > 0) {
          setAutoPlayNextPage(false);
          setTimeout(() => {
            playAyahIndex(0, data);
          }, 300);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedSurah, viewMode]);

  // Keyboard navigation for Turning Pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (viewMode === 'mushaf_page') {
        if (e.key === 'ArrowLeft') {
          // In RTL Arabic: Left arrow goes to Next page, Right goes to Prev
          if (isAr) {
            if (currentPage < 604) onPageChange(currentPage + 1);
          } else {
            if (currentPage > 1) onPageChange(currentPage - 1);
          }
        } else if (e.key === 'ArrowRight') {
          if (isAr) {
            if (currentPage > 1) onPageChange(currentPage - 1);
          } else {
            if (currentPage < 604) onPageChange(currentPage + 1);
          }
        }
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        togglePlayCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, viewMode, isAr, isPlaying, playingAyahIndex, ayahs]);

  // Handle difficulty changes
  const resetRevealedState = (ayahList: Ayah[], difficulty: 'blur_all' | 'first_word' | 'blanks') => {
    const newRevealed: Record<number, Set<number>> = {};
    ayahList.forEach((ayah, aIdx) => {
      const cleanText = cleanAyahArabicText(ayah);
      const words = cleanText.split(/\s+/);
      const set = new Set<number>();
      if (difficulty === 'first_word') {
        set.add(0); // Reveal only first word
      } else if (difficulty === 'blanks') {
        words.forEach((_, wIdx) => {
          if (wIdx % 2 === 0) set.add(wIdx);
        });
      }
      newRevealed[aIdx] = set;
    });
    setRevealedWords(newRevealed);
  };

  const handleDifficultyChange = (newDiff: 'blur_all' | 'first_word' | 'blanks') => {
    setRevealDifficulty(newDiff);
    resetRevealedState(ayahs, newDiff);
  };

  // Toggle word reveal on tap
  const toggleWordReveal = (ayahIdx: number, wordIdx: number) => {
    setRevealedWords((prev) => {
      const currentSet = new Set(prev[ayahIdx] || []);
      if (currentSet.has(wordIdx)) {
        currentSet.delete(wordIdx);
      } else {
        currentSet.add(wordIdx);
      }
      return { ...prev, [ayahIdx]: currentSet };
    });
  };

  // Reveal next word in current view
  const revealNextWord = () => {
    setRevealedWords((prev) => {
      const updated = { ...prev };
      for (let aIdx = 0; aIdx < ayahs.length; aIdx++) {
        const cleanText = cleanAyahArabicText(ayahs[aIdx]);
        const words = cleanText.split(/\s+/);
        const set = new Set(updated[aIdx] || []);
        for (let wIdx = 0; wIdx < words.length; wIdx++) {
          if (!set.has(wIdx)) {
            set.add(wIdx);
            updated[aIdx] = set;
            return updated;
          }
        }
      }
      return updated;
    });
  };

  const revealAllWords = () => {
    const allRevealed: Record<number, Set<number>> = {};
    ayahs.forEach((ayah, aIdx) => {
      const cleanText = cleanAyahArabicText(ayah);
      const words = cleanText.split(/\s+/);
      allRevealed[aIdx] = new Set(words.map((_, i) => i));
    });
    setRevealedWords(allRevealed);
  };

  const hideAllWords = () => {
    resetRevealedState(ayahs, revealDifficulty);
  };

  // Audio Playback Engine
  const playAyahIndex = (index: number, currentAyahList: Ayah[] = ayahs) => {
    if (!currentAyahList[index]) return;
    const ayah = currentAyahList[index];
    const audioUrl = getAyahAudioUrl(ayah.number, selectedReciter);

    setIsAudioPlayerOpen(true);
    setSelectedAyahIndex(index);

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setPlayingAyahIndex(index);
        setIsPlaying(true);
        setCurrentRepeatIteration(1);
      }).catch((e) => console.warn('Audio play error:', e));
    }
  };

  const togglePlayCurrent = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsAudioPlayerOpen(true);
      const targetIndex = playingAyahIndex !== null ? playingAyahIndex : (selectedAyahIndex !== null ? selectedAyahIndex : 0);
      playAyahIndex(targetIndex);
    }
  };

  // Handle Audio Ended (Infinite & Continuous Playback Across Pages)
  const handleAudioEnded = () => {
    if (!isAudioPlayerOpen) return;

    // Check if repeat loop on same ayah is requested (e.g. 3x, 5x)
    if (repeatCount !== 999 && currentRepeatIteration < repeatCount) {
      setCurrentRepeatIteration((prev) => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    // Move to next ayah on this page
    if (playingAyahIndex !== null && playingAyahIndex < ayahs.length - 1) {
      playAyahIndex(playingAyahIndex + 1);
      return;
    }

    // If at end of page and continuous playback is active: advance to next page!
    if (continuousInfinitePlayback || repeatCount === 999) {
      if (currentPage < 604) {
        setAutoPlayNextPage(true);
        onPageChange(currentPage + 1);
      } else {
        // Reached end of Mushaf -> loop back to Page 1
        setAutoPlayNextPage(true);
        onPageChange(1);
      }
    } else {
      setIsPlaying(false);
      setPlayingAyahIndex(null);
    }
  };

  const handleCloseAudioPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsAudioPlayerOpen(false);
    setPlayingAyahIndex(null);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleMarkMemorized = () => {
    onMarkPageProgress(currentPage, 'memorized');
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#059669', '#10b981', '#f59e0b'],
    });
  };

  // Group ayahs on this page by surah for accurate headers and flowing layout
  const surahGroups: { surahMeta: SurahMeta; ayahs: { ayah: Ayah; indexInPage: number }[]; isNewSurahStart: boolean }[] = [];
  
  ayahs.forEach((ayah, indexInPage) => {
    const lastGroup = surahGroups[surahGroups.length - 1];
    if (!lastGroup || lastGroup.surahMeta.number !== ayah.surahNumber) {
      const meta = SURAH_CATALOG.find((s) => s.number === ayah.surahNumber) || SURAH_CATALOG[0];
      surahGroups.push({
        surahMeta: meta,
        ayahs: [{ ayah, indexInPage }],
        isNewSurahStart: ayah.numberInSurah === 1,
      });
    } else {
      lastGroup.ayahs.push({ ayah, indexInPage });
    }
  });

  return (
    <div className="space-y-6 pb-28 animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={(e) => console.warn('Audio stream error:', e)}
      />

      {/* Control Topbar */}
      <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Navigation Mode & Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Quran Index (Fihris) Trigger Button */}
          <button
            onClick={() => setIsIndexModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            title={t.quranIndex}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.quranIndex}</span>
          </button>

          {/* Mushaf Page vs Surah Mode */}
          <div className="flex items-center bg-[#F1F5F9] dark:bg-stone-950 p-1 rounded-full border border-[#E2E8F0] dark:border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('mushaf_page')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                viewMode === 'mushaf_page' ? 'bg-[#065F46] text-white shadow-sm' : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
              }`}
            >
              {t.mushafPageMode}
            </button>
            <button
              onClick={() => setViewMode('surah_view')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                viewMode === 'surah_view' ? 'bg-[#065F46] text-white shadow-sm' : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
              }`}
            >
              {t.surahViewMode}
            </button>
          </div>

          {/* Mushaf Presentation Sub-style Selector (When in Mushaf Page Mode) */}
          {viewMode === 'mushaf_page' && (
            <div className="flex items-center bg-[#F8FAFC] dark:bg-stone-950 p-1 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 text-xs">
              <button
                onClick={() => setMushafDisplayType('flowing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  mushafDisplayType === 'flowing'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
                title={t.mushafFlow}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.mushafFlow}</span>
              </button>

              <button
                onClick={() => setMushafDisplayType('scanned')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  mushafDisplayType === 'scanned'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
                title={t.mushafScanned}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.mushafScanned}</span>
              </button>

              <button
                onClick={() => setMushafDisplayType('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  mushafDisplayType === 'cards'
                    ? 'bg-[#065F46] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
                }`}
                title={t.mushafAyahList}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.mushafAyahList}</span>
              </button>
            </div>
          )}

          {/* Page Stepper & Direct Jump Input */}
          {viewMode === 'mushaf_page' ? (
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-stone-950 px-2.5 py-1 rounded-full border border-[#E2E8F0] dark:border-stone-800 text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1 rounded-full hover:bg-white dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300 disabled:opacity-30"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-[#0F172A] dark:text-stone-200">
                  {t.pageNav}
                </span>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={quickPageInput !== '' ? quickPageInput : currentPage}
                  onChange={(e) => setQuickPageInput(e.target.value)}
                  onBlur={() => {
                    const p = parseInt(quickPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= 604) {
                      onPageChange(p);
                    }
                    setQuickPageInput('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(quickPageInput, 10);
                      if (!isNaN(p) && p >= 1 && p <= 604) {
                        onPageChange(p);
                      }
                      setQuickPageInput('');
                    }
                  }}
                  className="w-12 text-center bg-white dark:bg-stone-800 font-mono font-bold text-xs py-0.5 rounded border border-[#E2E8F0] dark:border-stone-700 text-[#065F46] dark:text-emerald-300 focus:outline-none"
                  title={isAr ? 'اضغط Enter للانتقال' : 'Press Enter to jump'}
                />
                <span className="font-mono text-[#64748B] dark:text-stone-400">
                  {t.of604}
                </span>
              </div>

              <button
                disabled={currentPage >= 604}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1 rounded-full hover:bg-white dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300 disabled:opacity-30"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <select
              value={selectedSurah}
              onChange={(e) => setSelectedSurah(Number(e.target.value))}
              className="bg-[#F8FAFC] dark:bg-stone-950 text-[#1E293B] dark:text-stone-200 text-xs font-medium px-3.5 py-2 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 focus:ring-1 focus:ring-[#065F46] focus:outline-none"
            >
              {SURAH_CATALOG.map((s) => (
                <option key={s.number} value={s.number}>
                  {isAr ? toArabicDigits(s.number) : s.number}. {s.name} ({s.englishName}) - {isAr ? toArabicDigits(s.numberOfAyahs) : s.numberOfAyahs} {t.versesCount}
                </option>
              ))}
            </select>
          )}

        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Audio Player Toggle Button */}
          <button
            onClick={() => {
              if (isAudioPlayerOpen) {
                handleCloseAudioPlayer();
              } else {
                setIsAudioPlayerOpen(true);
                togglePlayCurrent();
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              isAudioPlayerOpen
                ? 'bg-[#065F46] text-white shadow-sm ring-2 ring-emerald-400'
                : 'bg-[#ECFDF5] hover:bg-[#d1fae5] dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isAudioPlayerOpen ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isAudioPlayerOpen ? t.closeVoicePlayer : t.openVoicePlayer}</span>
          </button>

          {/* Memorization Mode Toggle */}
          <button
            onClick={() => setMemorizationMode(!memorizationMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              memorizationMode
                ? 'bg-[#D97706] text-white shadow-sm ring-2 ring-amber-400'
                : 'bg-[#FEF3C7] hover:bg-[#FDE68A] dark:bg-amber-950 text-[#92400E] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800'
            }`}
          >
            {memorizationMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{memorizationMode ? t.hideRecallActive : t.memorizationMode}</span>
          </button>

          {/* Mark Memorized / Approval Status */}
          {currentRecord?.status === 'memorized' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-sm">
              <CheckCircle className="w-4 h-4 text-[#059669]" />
              <span>{isAr ? 'تم الحفظ ومعتمد ✓' : 'Memorized & Verified ✓'}</span>
            </div>
          ) : currentRecord?.status === 'pending_approval' ? (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>{t.waitingForPartner}</span>
            </div>
          ) : (
            <button
              onClick={handleMarkMemorized}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all transform active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.markMemorized}</span>
            </button>
          )}

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`p-2 rounded-2xl border transition-all text-xs ${
              showTranslation
                ? 'bg-[#F1F5F9] dark:bg-stone-800 text-[#0F172A] dark:text-stone-100 border-[#CBD5E1]'
                : 'bg-transparent text-[#94A3B8] border-transparent hover:bg-[#F1F5F9]'
            }`}
            title={t.englishTranslation}
          >
            <Type className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Memorization Active Recall Drill Toolbar */}
      {memorizationMode && (
        <div className="rounded-3xl bg-[#FEF3C7] dark:bg-amber-950/70 border border-[#FDE68A] dark:border-amber-800/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs text-[#92400E] dark:text-amber-200 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>{t.activeRecallTools}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-stone-800 rounded-full p-0.5 border border-[#FDE68A] dark:border-stone-700">
              <button
                onClick={() => handleDifficultyChange('blur_all')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  revealDifficulty === 'blur_all' ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#78350F] dark:text-stone-300'
                }`}
              >
                {t.blurAll}
              </button>
              <button
                onClick={() => handleDifficultyChange('first_word')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  revealDifficulty === 'first_word' ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#78350F] dark:text-stone-300'
                }`}
              >
                {t.firstWordClue}
              </button>
              <button
                onClick={() => handleDifficultyChange('blanks')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  revealDifficulty === 'blanks' ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#78350F] dark:text-stone-300'
                }`}
              >
                {t.fillBlanks}
              </button>
            </div>

            <button
              onClick={revealNextWord}
              className="px-3 py-1.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold shadow-sm transition-all"
            >
              {t.tapNextWord}
            </button>
            <button
              onClick={revealAllWords}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 hover:bg-[#FEF3C7] text-[#92400E] dark:text-stone-200 border border-[#FDE68A] dark:border-stone-700 font-semibold"
            >
              {t.revealAll}
            </button>
            <button
              onClick={hideAllWords}
              className="p-1.5 rounded-full bg-white dark:bg-stone-800 hover:bg-[#FEF3C7] text-[#92400E] dark:text-stone-300 border border-[#FDE68A] dark:border-stone-700"
              title={t.resetBlur}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN QURAN CANVAS DISPLAY */}
      {/* ========================================================================= */}

      {/* SUB-VIEW 1: AUTHENTIC FLOWING MUSHAF PAGE (Default Standard Madinah Layout) */}
      {viewMode === 'mushaf_page' && mushafDisplayType === 'flowing' && (
        <div className="relative rounded-3xl bg-[#FFFDF7] dark:bg-stone-900 border-2 border-[#D97706]/30 dark:border-amber-700/40 shadow-xl p-6 sm:p-10 text-[#0F172A] dark:text-stone-100 overflow-hidden">
          
          {/* Authentic Islamic Geometric Border Ornament */}
          <div className="absolute inset-2 sm:inset-3 border border-[#D97706]/20 dark:border-amber-600/25 rounded-2xl pointer-events-none"></div>
          <div className="absolute inset-3 sm:inset-4 border border-[#065F46]/20 dark:border-emerald-600/25 rounded-xl pointer-events-none"></div>

          {/* Mushaf Page Header Bar (Surah Name Right, Page Number Center, Juz Left) */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D97706]/20 dark:border-stone-800 relative z-10 text-xs font-bold text-[#065F46] dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800">
                {pageSurahs.map((s) => s.name).join(' • ') || currentSurahMeta.name}
              </span>
            </div>

            <div className="text-center font-mono font-bold text-sm text-[#D97706] dark:text-amber-400">
              — {isAr ? toArabicDigits(currentPage) : currentPage} —
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300">
                {isAr ? currentJuzObj.nameAr : currentJuzObj.nameEn}
              </span>
            </div>
          </div>

          {/* Loading Spinner */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#065F46] border-t-transparent animate-spin"></div>
              <p className="text-xs text-[#64748B] dark:text-stone-400 font-medium">{t.loading}</p>
            </div>
          ) : ayahs.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-stone-200">
                {isAr ? 'لم يتم تحميل آيات هذه الصفحة' : 'Could not load verses for this page'}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchPage(currentPage).then((d) => {
                    setAyahs(d);
                    setLoading(false);
                  });
                }}
                className="px-4 py-2 rounded-2xl bg-[#065F46] text-white text-xs font-bold shadow-sm"
              >
                {t.retryLoading}
              </button>
            </div>
          ) : (
            /* Flowing Uthmani Verses Organized by Surah */
            <div className="space-y-8 relative z-10" dir="rtl">
              {surahGroups.map((group, gIdx) => {
                return (
                  <div key={gIdx} className="space-y-5">
                    
                    {/* Surah Header Cartouche Banner (Only when a new Surah starts on this page) */}
                    {group.isNewSurahStart && (
                      <div className="my-6 text-center">
                        <div className="inline-block relative px-8 py-3 rounded-2xl bg-gradient-to-r from-[#FDF8E2] via-[#FEF3C7] to-[#FDF8E2] dark:from-stone-800 dark:via-stone-750 dark:to-stone-800 border-2 border-[#D97706]/40 dark:border-amber-600/50 shadow-md">
                          <div className="flex items-center justify-center gap-3 text-[#78350F] dark:text-amber-200 font-bold text-sm sm:text-base">
                            <span className="text-[#D97706]">۞</span>
                            <span className="font-scheherazade text-lg sm:text-xl">
                              سُورَةُ {group.surahMeta.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-stone-900/70 border border-amber-300 dark:border-amber-700/50">
                              {group.surahMeta.revelationType === 'Meccan' ? (isAr ? 'مكّية' : 'Meccan') : (isAr ? 'مدنيّة' : 'Medinan')} • {isAr ? toArabicDigits(group.surahMeta.numberOfAyahs) : group.surahMeta.numberOfAyahs} {isAr ? 'آيات' : 'verses'}
                            </span>
                            <span className="text-[#D97706]">۞</span>
                          </div>
                        </div>

                        {/* Centered Calligraphic Bismillah (except Surah 9 At-Tawba) */}
                        {group.surahMeta.number !== 9 && (
                          <div className="mt-4 mb-2">
                            <span className={`text-2xl sm:text-3xl text-[#065F46] dark:text-emerald-300 ${selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'}`}>
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Continuous Justified Flowing Ayahs */}
                    <div 
                      className={`text-justify leading-loose tracking-wide text-[#0F172A] dark:text-stone-100 ${
                        selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
                      }`}
                      style={{ fontSize: `${fontSize}px`, lineHeight: 2.3 }}
                    >
                      {group.ayahs.map(({ ayah, indexInPage }) => {
                        const isPlayingThis = playingAyahIndex === indexInPage && isPlaying;
                        const isSelectedThis = selectedAyahIndex === indexInPage;
                        const cleanText = cleanAyahArabicText(ayah);
                        const words = cleanText.split(/\s+/);
                        const revealedSet = revealedWords[indexInPage] || new Set();

                        return (
                          <span
                            key={ayah.number}
                            className={`transition-all duration-200 inline ${
                              isPlayingThis
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 rounded-xl px-1.5 py-0.5 shadow-sm text-[#065F46] dark:text-emerald-200 ring-2 ring-emerald-400'
                                : isSelectedThis
                                ? 'bg-amber-100 dark:bg-amber-950/70 rounded-xl px-1 py-0.5 ring-1 ring-amber-400'
                                : 'hover:bg-emerald-50/70 dark:hover:bg-stone-800/60 rounded px-0.5'
                            }`}
                          >
                            {/* Word Spans with Active Recall */}
                            {words.map((word, wIdx) => {
                              const isRevealed = !memorizationMode || revealedSet.has(wIdx);
                              return (
                                <span
                                  key={wIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (memorizationMode) {
                                      toggleWordReveal(indexInPage, wIdx);
                                    } else {
                                      setSelectedAyahIndex(indexInPage);
                                    }
                                  }}
                                  className={`inline-block mx-0.5 px-0.5 rounded cursor-pointer transition-all ${
                                    !isRevealed
                                      ? 'word-blurred bg-[#CBD5E1] dark:bg-stone-800 text-transparent select-none'
                                      : 'word-revealed hover:text-[#065F46] dark:hover:text-emerald-300'
                                  }`}
                                >
                                  {word}
                                </span>
                              );
                            })}

                            {/* Ornate Golden Ayah End Symbol ۝ with Verse Number and Tafsir Trigger */}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAyahIndex(indexInPage);
                                handleOpenTafsir(ayah);
                              }}
                              className="inline-flex items-center justify-center mx-1 px-1 py-0.5 text-[#D97706] dark:text-amber-400 cursor-pointer select-none text-base font-serif hover:scale-110 active:scale-95 transition-transform group/ayah relative"
                              title={`${t.ayah} ${ayah.numberInSurah} - ${t.hoverForTafsir}`}
                            >
                              ۝<span className="text-xs font-mono font-bold mx-0.5 text-[#065F46] dark:text-emerald-300">{toArabicDigits(ayah.numberInSurah)}</span>
                            </span>
                          </span>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Ayah Quick-Action Drawer (When an Ayah is selected or active) */}
          {selectedAyahIndex !== null && ayahs[selectedAyahIndex] && (
            <div className="mt-8 pt-4 border-t-2 border-[#D97706]/30 dark:border-stone-800 bg-white/90 dark:bg-stone-950/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in slide-in-from-bottom-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#065F46] dark:text-emerald-300">
                  <span>سورة {ayahs[selectedAyahIndex].surahName}</span>
                  <span>•</span>
                  <span>{t.ayah} {isAr ? toArabicDigits(ayahs[selectedAyahIndex].numberInSurah) : ayahs[selectedAyahIndex].numberInSurah}</span>
                </div>
                {showTranslation && ayahs[selectedAyahIndex].translation && (
                  <p className="text-xs text-[#475569] dark:text-stone-300 font-sans line-clamp-2" dir="ltr">
                    {ayahs[selectedAyahIndex].translation}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Concise Tafsir Trigger Button */}
                <button
                  onClick={() => handleOpenTafsir(ayahs[selectedAyahIndex])}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 border border-amber-300 dark:border-amber-700 text-[#92400E] dark:text-amber-300 text-xs font-bold transition-all shadow-sm"
                  title={t.viewAyahTafsir}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{t.viewAyahTafsir}</span>
                </button>

                {/* Quick Audio Play Button */}
                <button
                  onClick={() => playAyahIndex(selectedAyahIndex)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.quickAudioPlay}</span>
                </button>

                <button
                  onClick={() => setSelectedAyahIndex(null)}
                  className="p-1.5 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 text-[#64748B] hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Page Footer Navigation */}
          <div className="mt-8 pt-4 border-t border-[#D97706]/20 dark:border-stone-800 flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-medium"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'الصفحة السابقة' : 'Previous Page'}</span>
            </button>

            <span className="font-mono text-[#065F46] dark:text-emerald-400 font-bold text-sm">
              — {toArabicDigits(currentPage)} —
            </span>

            <button
              disabled={currentPage >= 604}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-medium"
            >
              <span>{isAr ? 'الصفحة التالية' : 'Next Page'}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      )}

      {/* SUB-VIEW 2: SCANNED MADINAH MUSHAF (HD Photographic Scan View) */}
      {viewMode === 'mushaf_page' && mushafDisplayType === 'scanned' && (
        <div className="relative rounded-3xl bg-[#FFFDF7] dark:bg-stone-900 border-2 border-[#D97706]/30 dark:border-amber-700/40 shadow-xl p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Scanned Header Controls */}
          <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-stone-800 text-xs">
            <span className="font-bold text-[#065F46] dark:text-emerald-300">
              {isAr ? `مصحف المدينة المنورة - صفحة ${toArabicDigits(currentPage)}` : `Madinah Mushaf HD - Page ${currentPage}`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setImageZoomLevel((prev) => Math.max(75, prev - 15))}
                className="p-1.5 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] font-bold text-[#64748B]">{imageZoomLevel}%</span>
              <button
                onClick={() => setImageZoomLevel((prev) => Math.min(150, prev + 15))}
                className="p-1.5 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setImageZoomLevel(100)}
                className="p-1.5 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High-Resolution Mushaf Image Container */}
          <div className="w-full overflow-x-auto flex justify-center py-2">
            <img
              src={getMushafPageImageUrl(currentPage)}
              alt={`Quran Page ${currentPage}`}
              style={{ width: `${imageZoomLevel}%`, maxWidth: '900px' }}
              className="rounded-2xl shadow-lg border border-amber-200 dark:border-stone-800 select-none transition-all duration-200"
              loading="eager"
            />
          </div>

          {/* Bottom Flip Buttons */}
          <div className="w-full mt-6 pt-4 border-t border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white disabled:opacity-30 font-bold shadow-sm"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'الصفحة السابقة' : 'Previous Page'}</span>
            </button>

            <span className="font-mono text-[#065F46] dark:text-emerald-400 font-bold text-sm">
              — {toArabicDigits(currentPage)} —
            </span>

            <button
              disabled={currentPage >= 604}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white disabled:opacity-30 font-bold shadow-sm"
            >
              <span>{isAr ? 'الصفحة التالية' : 'Next Page'}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      )}

      {/* SUB-VIEW 3: AYAH LIST / CARDS VIEW OR FULL SURAH CONTINUOUS VIEW */}
      {((viewMode === 'mushaf_page' && mushafDisplayType === 'cards') || viewMode === 'surah_view') && (
        <div className="relative rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 shadow-sm p-6 sm:p-10 text-[#0F172A] dark:text-stone-100 overflow-hidden">
          
          {/* Page / Surah Header Banner */}
          <div className="text-center mb-8 pb-4 border-b border-[#E2E8F0] dark:border-stone-800 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700/50 text-[#065F46] dark:text-emerald-300 text-xs font-bold mb-2">
              <span>سورة {currentSurahMeta.name}</span>
              <span>•</span>
              <span>{currentSurahMeta.englishName}</span>
              <span>•</span>
              <span>{isAr ? currentJuzObj.nameAr : currentJuzObj.nameEn}</span>
            </div>

            {/* Bismillah Header (except Surah At-Tawba) */}
            {selectedSurah !== 9 && (
              <div className="my-3">
                <span className={`text-2xl sm:text-3xl text-[#D97706] dark:text-amber-300 ${selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'}`}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            )}
          </div>

          {/* Loading Spinner */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#065F46] border-t-transparent animate-spin"></div>
              <p className="text-xs text-[#64748B] dark:text-stone-400 font-medium">{t.loading}</p>
            </div>
          ) : ayahs.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-stone-200">
                {isAr ? 'لم يتم تحميل آيات هذه الصفحة/السورة' : 'Could not load verses for this page/surah'}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  const load = async () => {
                    const data = viewMode === 'mushaf_page' ? await fetchPage(currentPage) : await fetchSurah(selectedSurah);
                    setAyahs(data);
                    setLoading(false);
                  };
                  load();
                }}
                className="px-4 py-2 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm"
              >
                {t.retryLoading}
              </button>
            </div>
          ) : (
            /* Ayahs Card by Card Content Area */
            <div className="space-y-6 relative z-10" dir="rtl">
              {ayahs.map((ayah, aIdx) => {
                const isPlayingThis = playingAyahIndex === aIdx && isPlaying;
                const cleanText = cleanAyahArabicText(ayah);
                const words = cleanText.split(/\s+/);
                const revealedSet = revealedWords[aIdx] || new Set();

                return (
                  <div
                    key={ayah.number}
                    className={`p-5 rounded-2xl transition-all duration-200 border ${
                      isPlayingThis
                        ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 border-[#059669] shadow-sm ring-2 ring-emerald-400'
                        : 'bg-[#FDFCF7] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800/80 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Ayah Action Row (Audio, Tafsir & Info) */}
                    <div className="flex items-center justify-between mb-3 text-xs text-[#64748B] dark:text-stone-400" dir={isAr ? 'rtl' : 'ltr'}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playAyahIndex(aIdx)}
                          className={`p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 transition-all font-semibold ${
                            isPlayingThis 
                              ? 'bg-[#065F46] text-white shadow-sm' 
                              : 'hover:bg-[#E2E8F0] dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300'
                          }`}
                          title={t.listenPage}
                        >
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span className="text-[11px] font-mono">
                            {isAr ? `${toArabicDigits(ayah.surahNumber)}:${toArabicDigits(ayah.numberInSurah)}` : `${ayah.surahNumber}:${ayah.numberInSurah}`}
                          </span>
                        </button>

                        {/* Tafsir Trigger Button */}
                        <button
                          onClick={() => handleOpenTafsir(ayah)}
                          className="p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 transition-all font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-[#92400E] dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                          title={t.viewAyahTafsir}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                          <span className="text-[11px]">{t.viewAyahTafsir}</span>
                        </button>

                        {isPlayingThis && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                            <AudioLines className="w-3.5 h-3.5" />
                            <span>{t.voicePlaying}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-[#94A3B8] font-mono">
                        {t.page} {isAr ? toArabicDigits(ayah.page) : ayah.page}
                      </span>
                    </div>

                    {/* Arabic Text with Word-by-Word Hide & Reveal */}
                    <div 
                      className={`leading-loose tracking-wide text-right text-[#0F172A] dark:text-stone-100 ${
                        selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
                      }`}
                      style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
                    >
                      {words.map((word, wIdx) => {
                        const isRevealed = !memorizationMode || revealedSet.has(wIdx);
                        return (
                          <span
                            key={wIdx}
                            onClick={() => memorizationMode && toggleWordReveal(aIdx, wIdx)}
                            className={`inline-block mx-1 px-1 rounded transition-all cursor-pointer ${
                              !isRevealed
                                ? 'word-blurred bg-[#E2E8F0] dark:bg-stone-800/90 text-[#94A3B8] select-none hover:bg-[#CBD5E1]'
                                : 'word-revealed hover:text-[#065F46] dark:hover:text-emerald-300'
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}

                      {/* Decorative Ayah End Symbol ۝ with Arabic Digits */}
                      <span className="inline-flex items-center justify-center mx-2 text-[#D97706] dark:text-amber-400 select-none text-base font-serif">
                        ۝<span className="text-xs font-mono font-bold mx-0.5 text-[#065F46] dark:text-emerald-300">{toArabicDigits(ayah.numberInSurah)}</span>
                      </span>
                    </div>

                    {/* English Translation */}
                    {showTranslation && ayah.translation && (
                      <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-stone-800 text-left text-xs sm:text-sm text-[#475569] dark:text-stone-300 font-sans leading-relaxed" dir="ltr">
                        <span className="text-[#065F46] dark:text-emerald-400 font-semibold mr-1.5">{ayah.numberInSurah}.</span>
                        {ayah.translation}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Page Footer Navigation */}
          {viewMode === 'mushaf_page' && (
            <div className="mt-8 pt-4 border-t border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-medium"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{isAr ? 'الصفحة السابقة' : 'Previous Page'}</span>
              </button>

              <span className="font-mono text-[#065F46] dark:text-emerald-400 font-bold text-sm">
                — {toArabicDigits(currentPage)} —
              </span>

              <button
                disabled={currentPage >= 604}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 disabled:opacity-30 font-medium"
              >
                <span>{isAr ? 'الصفحة التالية' : 'Next Page'}</span>
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

        </div>
      )}

      {/* Floating Dedicated Voice Player Bar (When Audio Is Active/Open) */}
      {isAudioPlayerOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-emerald-500/40 dark:border-emerald-600/40 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left: Reciter, Ayah Status & Waveform */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-[#065F46] text-white flex items-center justify-center shadow-md shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#0F172A] dark:text-stone-100">
                    {t.voicePlaying}: {playingAyahIndex !== null && ayahs[playingAyahIndex] ? `[${ayahs[playingAyahIndex].surahNumber}:${ayahs[playingAyahIndex].numberInSurah}]` : t.mushafPageMode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {t.audioContinuousOn}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-stone-400 flex items-center gap-1.5">
                  <span>{t.reciter}:</span>
                  <select
                    value={selectedReciter}
                    onChange={(e) => setSelectedReciter(e.target.value)}
                    className="bg-transparent font-medium text-[#065F46] dark:text-emerald-300 focus:outline-none"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id} className="bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-100">
                        {isAr ? r.arabicName : r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Waveform Visualizer in Player Bar */}
              <div className="hidden sm:block ml-2 mr-2">
                <AudioWaveform
                  isPlaying={isPlaying}
                  barCount={16}
                  height={28}
                  colorScheme="mixed"
                  showStatusLabel={true}
                  label={isPlaying ? (isAr ? 'نشط' : 'LIVE') : (isAr ? 'مؤقت' : 'PAUSED')}
                />
              </div>
            </div>

            {/* Middle: Controls & Continuous Infinite loop toggles */}
            <div className="flex flex-wrap items-center gap-2.5 justify-center">
              
              {/* Prev / Next Ayah Buttons */}
              <button
                disabled={playingAyahIndex === null || playingAyahIndex <= 0}
                onClick={() => playingAyahIndex !== null && playAyahIndex(playingAyahIndex - 1)}
                className="p-2 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0] disabled:opacity-30"
                title={t.prevAyah}
              >
                {isAr ? <SkipForward className="w-4 h-4" /> : <SkipBack className="w-4 h-4" />}
              </button>

              {/* Master Play/Pause */}
              <button
                onClick={togglePlayCurrent}
                className="p-3 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white shadow-md transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                disabled={playingAyahIndex === null || playingAyahIndex >= ayahs.length - 1}
                onClick={() => playingAyahIndex !== null && playAyahIndex(playingAyahIndex + 1)}
                className="p-2 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0] disabled:opacity-30"
                title={t.nextAyah}
              >
                {isAr ? <SkipBack className="w-4 h-4" /> : <SkipForward className="w-4 h-4" />}
              </button>

              {/* Repeat Mode */}
              <div className="flex items-center bg-[#F1F5F9] dark:bg-stone-800 p-0.5 rounded-xl text-xs">
                {[1, 3, 5, 999].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setRepeatCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      repeatCount === cnt ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#64748B] dark:text-stone-400 hover:text-black'
                    }`}
                  >
                    {cnt === 999 ? '∞' : `${cnt}x`}
                  </button>
                ))}
              </div>

              {/* Speed */}
              <div className="flex items-center bg-[#F1F5F9] dark:bg-stone-800 p-0.5 rounded-xl text-[11px]">
                {[0.75, 1.0, 1.25].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      playbackSpeed === spd ? 'bg-[#065F46] text-white' : 'text-[#64748B] dark:text-stone-400'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

            </div>

            {/* Right: Quick Tafsir Button & Close Voice button */}
            <div className="flex items-center gap-2">
              {playingAyahIndex !== null && ayahs[playingAyahIndex] && (
                <button
                  onClick={() => handleOpenTafsir(ayahs[playingAyahIndex])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 text-[#92400E] dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-700 transition-colors shadow-sm"
                  title={t.viewAyahTafsir}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="hidden sm:inline">{t.viewAyahTafsir}</span>
                </button>
              )}

              <button
                onClick={handleCloseAudioPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.closeVoicePlayer}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Full Quran Index Modal (114 Surahs & 30 Juz & Direct Page Jump) */}
      <QuranIndexModal
        isOpen={isIndexModalOpen}
        onClose={() => setIsIndexModalOpen(false)}
        onSelectSurah={(surahNum, startPage, mode) => {
          setSelectedSurah(surahNum);
          if (mode) {
            setViewMode(mode);
          }
          if (mode === 'mushaf_page') {
            onPageChange(startPage);
          }
        }}
        onSelectJuz={(juzNum, startPage) => {
          setViewMode('mushaf_page');
          onPageChange(startPage);
        }}
        onSelectPage={(pageNum) => {
          setViewMode('mushaf_page');
          onPageChange(pageNum);
        }}
        currentPage={currentPage}
        lang={lang}
      />

      {/* Concise Ayah Tafsir Modal (Alquran.cloud API) */}
      <AyahTafsirModal
        isOpen={isTafsirModalOpen}
        onClose={() => setIsTafsirModalOpen(false)}
        ayah={tafsirModalAyah}
        ayahList={ayahs}
        onSelectAyah={(a) => setTafsirModalAyah(a)}
        isPlayingAudio={isPlaying && playingAyahIndex !== null && ayahs[playingAyahIndex]?.number === tafsirModalAyah?.number}
        onPlayAyahAudio={(a) => {
          const idx = ayahs.findIndex((x) => x.number === a.number);
          if (idx >= 0) playAyahIndex(idx);
        }}
        lang={lang}
        selectedFont={selectedFont}
      />

    </div>
  );
};
