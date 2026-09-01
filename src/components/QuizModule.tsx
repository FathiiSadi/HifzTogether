import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Play, 
  Volume2, 
  ArrowRight, 
  Award,
  Layers,
  Clock,
  ListOrdered,
  FileQuestion
} from 'lucide-react';
import { QuizQuestion, QuizResultRecord, QuizType, UserProfile, Language } from '../types';
import { SURAH_CATALOG } from '../lib/quranData';
import { fetchSurah, getAyahAudioUrl } from '../services/quranApi';
import { stripTashkeel, toArabicDigits, formatTimeAgo } from '../lib/utils';
import { getTranslation } from '../lib/i18n';
import { DEFAULT_USERS } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface QuizModuleProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  quizHistory: QuizResultRecord[];
  lang: Language;
  onLogQuizScore: (result: Omit<QuizResultRecord, 'id'>) => void;
  selectedFont: string;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  quizHistory = [],
  lang,
  onLogQuizScore,
  selectedFont,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // Quiz Setup state
  const [selectedSurah, setSelectedSurah] = useState<number>(67); // Surah Al-Mulk default
  const [quizType, setQuizType] = useState<QuizType>('what_comes_next');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active Quiz State
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Audio Hint
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingHint, setIsPlayingHint] = useState<boolean>(false);

  // Generate Questions from Surah text
  const startQuiz = async () => {
    setLoading(true);
    const surahAyahs = await fetchSurah(selectedSurah);
    const surahMeta = SURAH_CATALOG.find((s) => s.number === selectedSurah) || SURAH_CATALOG[66];

    if (!surahAyahs || surahAyahs.length < 3) {
      setLoading(false);
      return;
    }

    const generated: QuizQuestion[] = [];
    const count = Math.min(questionCount, surahAyahs.length - 1);

    // Pick unique random indices
    const indices: number[] = [];
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * (surahAyahs.length - 1));
      if (!indices.includes(idx)) indices.push(idx);
    }

    indices.forEach((idx, qIdx) => {
      const currentAyah = surahAyahs[idx];
      const nextAyah = surahAyahs[idx + 1];

      if (quizType === 'what_comes_next') {
        // Create 4 distinct options (1 correct + 3 distractors)
        const distractors: string[] = [];
        const otherAyahs = surahAyahs.filter((_, i) => i !== idx + 1);
        while (distractors.length < 3 && otherAyahs.length > 0) {
          const randDist = otherAyahs[Math.floor(Math.random() * otherAyahs.length)].text;
          if (!distractors.includes(randDist) && randDist !== nextAyah.text) {
            distractors.push(randDist);
          }
        }

        // Shuffle options
        const allOptions = [nextAyah.text, ...distractors].sort(() => Math.random() - 0.5);

        generated.push({
          id: `q-${qIdx}`,
          type: 'what_comes_next',
          surahNumber: selectedSurah,
          surahName: surahMeta.name,
          ayahNumber: currentAyah.numberInSurah,
          promptTextAr: currentAyah.text,
          promptTextEn: currentAyah.translation,
          audioUrl: getAyahAudioUrl(currentAyah.number),
          options: allOptions,
          correctAnswer: nextAyah.text,
          explanation: isAr 
            ? `الآية الصحيحة التالية هي رقم ${toArabicDigits(nextAyah.numberInSurah)}: "${nextAyah.text}"`
            : `The correct subsequent ayah is verse ${nextAyah.numberInSurah}: "${nextAyah.translation}"`,
          fullAyahText: nextAyah.text,
        });
      } else if (quizType === 'fill_in_blank') {
        // Pick a key word from currentAyah to blank out
        const words = currentAyah.text.trim().split(/\s+/);
        const blankIndex = words.length > 3 ? Math.floor(words.length / 2) : 0;
        const targetWord = words[blankIndex];

        // Pick distractors from other words in the Surah
        const allSurahWords = surahAyahs.flatMap((a) => a.text.trim().split(/\s+/)).filter((w) => w !== targetWord && w.length >= 3);
        const distWord1 = allSurahWords[Math.floor(Math.random() * allSurahWords.length)] || 'عَلِيمٌ';
        const distWord2 = allSurahWords[Math.floor(Math.random() * allSurahWords.length)] || 'قَدِيرٌ';
        const distWord3 = allSurahWords[Math.floor(Math.random() * allSurahWords.length)] || 'غَفُورٌ';

        const blankOptions = [targetWord, distWord1, distWord2, distWord3].sort(() => Math.random() - 0.5);
        const wordsWithBlank = words.map((w, i) => (i === blankIndex ? '_______' : w));

        generated.push({
          id: `q-${qIdx}`,
          type: 'fill_in_blank',
          surahNumber: selectedSurah,
          surahName: surahMeta.name,
          ayahNumber: currentAyah.numberInSurah,
          promptTextAr: wordsWithBlank.join(' '),
          promptTextEn: currentAyah.translation,
          audioUrl: getAyahAudioUrl(currentAyah.number),
          options: blankOptions,
          correctAnswer: targetWord,
          missingWordIndex: blankIndex,
          fullAyahText: currentAyah.text,
          explanation: isAr
            ? `الكلمة الناقصة في الآية ${toArabicDigits(currentAyah.numberInSurah)} هي: "${targetWord}".`
            : `The missing word in verse ${currentAyah.numberInSurah} is "${targetWord}".`,
        });
      }
    });

    setQuestions(generated);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizFinished(false);
    setQuizActive(true);
    setLoading(false);
  };

  const handleSelectAnswer = (ans: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(ans);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;
    const currentQ = questions[currentQIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    if (isCorrect) {
      setScore((s) => s + 1);
    }
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finish Quiz
      setQuizFinished(true);
      const total = questions.length;
      const finalScore = score + (selectedAnswer === questions[currentQIndex].correctAnswer ? 1 : 0);
      const percentage = Math.round((finalScore / total) * 100);

      const surahMeta = SURAH_CATALOG.find((s) => s.number === selectedSurah);
      onLogQuizScore({
        userId: currentUser.id,
        userName: currentUser.name,
        score: finalScore,
        totalQuestions: total,
        percentage,
        quizType,
        scopeDescription: `${isAr ? 'سورة' : 'Surah'} ${surahMeta?.name || 'الملك'} (${quizType === 'what_comes_next' ? (isAr ? 'ما الآية التالية؟' : 'What comes next') : (isAr ? 'أكمل الفراغ' : 'Fill in the blank')})`,
        timestamp: new Date().toISOString(),
      });

      if (percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#059669', '#3b82f6'],
        });
      }
    }
  };

  const playAudioPrompt = (url?: string) => {
    if (!url) return;
    if (isPlayingHint) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingHint(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => setIsPlayingHint(true)).catch((e) => console.warn(e));
      }
    }
  };

  const currentQ = questions[currentQIndex];

  return (
    <div className="space-y-8 animate-in fade-in pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      <audio ref={audioRef} onEnded={() => setIsPlayingHint(false)} />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] p-6 sm:p-8 text-white border border-[#043d2e] shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-[#FCD34D]" />
            <span>{isAr ? 'منظومة الاختبار والتسميع التفاعلية' : 'Weekly Hifz Self-Test & Retention Engine'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.quizTitle}
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            {t.quizSubtitle}
          </p>
        </div>
      </div>

      {!quizActive ? (
        /* Quiz Configuration Form & History */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Setup Config Card (2 Cols) */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-stone-100 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-[#065F46] dark:text-emerald-400" />
              <span>{isAr ? 'تحديد نطاق ونمط الاختبار' : 'Configure Self-Test Range & Mode'}</span>
            </h3>

            {/* Select Surah Scope */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-2">
                {isAr ? 'اختر السورة للاختبار:' : 'Select Surah to Test:'}
              </label>
              <select
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] dark:bg-stone-950 text-[#1E293B] dark:text-stone-100 text-sm font-medium px-4 py-3 rounded-2xl border border-[#E2E8F0] dark:border-stone-800 focus:ring-1 focus:ring-[#065F46] focus:outline-none"
              >
                {SURAH_CATALOG.map((s) => (
                  <option key={s.number} value={s.number}>
                    {isAr ? `${toArabicDigits(s.number)}. سورة ${s.name} - ${toArabicDigits(s.numberOfAyahs)} آية (ص ${toArabicDigits(s.startPage)}-${toArabicDigits(s.endPage)})` : `${s.number}. ${s.name} (${s.englishName}) - ${s.numberOfAyahs} Ayahs (Pages ${s.startPage}-${s.endPage})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-2">
                {isAr ? 'نمط التحدي:' : 'Challenge Mode:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuizType('what_comes_next')}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    quizType === 'what_comes_next'
                      ? 'bg-[#ECFDF5] border-[#059669] ring-1 ring-[#059669] text-[#065F46]'
                      : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B] dark:text-stone-400 hover:border-emerald-300'
                  }`}
                >
                  <div className="font-bold text-sm text-[#1E293B] dark:text-stone-100 mb-1">{t.whatComesNext}</div>
                  <div className="text-xs text-[#64748B] dark:text-stone-400">{t.whatComesNextDesc}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizType('fill_in_blank')}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    quizType === 'fill_in_blank'
                      ? 'bg-[#ECFDF5] border-[#059669] ring-1 ring-[#059669] text-[#065F46]'
                      : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B] dark:text-stone-400 hover:border-emerald-300'
                  }`}
                >
                  <div className="font-bold text-sm text-[#1E293B] dark:text-stone-100 mb-1">{t.fillInBlank}</div>
                  <div className="text-xs text-[#64748B] dark:text-stone-400">{t.fillInBlankDesc}</div>
                </button>
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-2">
                {isAr ? 'عدد الأسئلة:' : 'Number of Questions:'}
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 10].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      questionCount === cnt
                        ? 'bg-[#065F46] text-white shadow-sm'
                        : 'bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {isAr ? `${toArabicDigits(cnt)} أسئلة` : `${cnt} Questions`}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startQuiz}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-extrabold text-base shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              {loading ? (
                <span>{isAr ? 'جاري تجهيز الآيات القرآنية...' : 'Preparing Quran Verses...'}</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-[#FCD34D]" />
                  <span>{t.startQuiz}</span>
                </>
              )}
            </button>
          </div>

          {/* Shared Leaderboard & Past Results (1 Col) */}
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E293B] dark:text-stone-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D97706]" />
                <span>{isAr ? 'سجل نتائج الأخوين' : 'Partner Score Log'}</span>
              </h3>
              <span className="text-[10px] text-[#94A3B8]">{isAr ? 'محدث ومحفوظ' : 'Collaborative'}</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {quizHistory.length === 0 ? (
                <div className="text-center py-10 text-[#94A3B8] text-xs">
                  {isAr ? 'لم يتم إجراء اختبارات بعد. ابدأ اختبارك الأول الآن!' : 'No tests taken yet. Start a quiz to log your first score!'}
                </div>
              ) : (
                quizHistory.map((res) => (
                  <div
                    key={res.id}
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                      res.userId === 'user_a'
                        ? 'bg-[#ECFDF5] border-emerald-200 text-[#1E293B]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#1E293B] dark:text-stone-100 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${res.userId === 'user_a' ? 'bg-[#059669]' : 'bg-sky-500'}`}></span>
                        <span>{res.userName}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-stone-400 mt-0.5">{res.scopeDescription}</div>
                      <div className="text-[10px] text-[#94A3B8] mt-1">{formatTimeAgo(res.timestamp)}</div>
                    </div>

                    <div className="text-right" dir="ltr">
                      <div className={`text-base font-extrabold ${res.percentage >= 80 ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#D97706]'}`}>
                        {res.percentage}%
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-stone-400">{res.score} / {res.totalQuestions}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : quizFinished ? (
        /* Quiz Finished Summary */
        <div className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-8 text-center space-y-6 shadow-sm animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
            🏆
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1E293B] dark:text-white">
              {score / questions.length >= 0.8 ? (isAr ? 'ما شاء الله! تثبيت متقن ومبارك' : 'MashaAllah! Outstanding Retention') : (isAr ? 'جهد مبارك! واصل المراجعة والتكرار' : 'Good Effort! Keep Reviewing')}
            </h2>
            <p className="text-[#64748B] dark:text-stone-300 text-sm">
              {isAr ? (
                <>
                  أحرزت <span className="font-bold text-[#065F46] dark:text-emerald-400">{toArabicDigits(score)}</span> من أصل <span className="font-bold text-[#1E293B] dark:text-stone-200">{toArabicDigits(questions.length)}</span> ({toArabicDigits(Math.round((score / questions.length) * 100))}%) في سورة {SURAH_CATALOG.find((s) => s.number === selectedSurah)?.name}.
                </>
              ) : (
                <>
                  You scored <span className="font-bold text-[#065F46] dark:text-emerald-400">{score}</span> out of <span className="font-bold text-[#1E293B] dark:text-stone-200">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%) on Surah {SURAH_CATALOG.find((s) => s.number === selectedSurah)?.name}.
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-xs text-[#065F46]">
            {isAr ? '✓ تم حفظ النتيجة ومزامنتها في لوحة المتابعة المشتركة ليراها أخوك!' : '✓ Your score has been synced to the shared partnership dashboard for your partner to see!'}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setQuizActive(false)}
              className="px-6 py-3 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-sm shadow-sm transition-all"
            >
              {isAr ? 'العودة للاختبارات' : 'Back to Quiz Setup'}
            </button>
            <button
              onClick={startQuiz}
              className="px-6 py-3 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 border border-[#E2E8F0] dark:border-stone-700 font-semibold text-sm transition-all"
            >
              {isAr ? 'إعادة الاختبار' : 'Retake Test'}
            </button>
          </div>
        </div>
      ) : (
        /* Active Quiz Question Card */
        <div className="max-w-3xl mx-auto rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-6">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400 pb-4 border-b border-[#E2E8F0] dark:border-stone-800">
            <span className="font-bold text-[#065F46] dark:text-emerald-400">
              {isAr ? `السؤال ${toArabicDigits(currentQIndex + 1)} من ${toArabicDigits(questions.length)}` : `Question ${currentQIndex + 1} of ${questions.length}`}
            </span>
            <span className="font-mono text-[#1E293B] dark:text-stone-300 font-bold">
              {isAr ? `سورة ${currentQ?.surahName} (الآية ${toArabicDigits(currentQ?.ayahNumber)})` : `Surah ${currentQ?.surahName} (Ayah ${currentQ?.ayahNumber})`}
            </span>
            <button
              onClick={() => playAudioPrompt(currentQ?.audioUrl)}
              className="flex items-center gap-1 text-[#D97706] hover:underline font-bold"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingHint ? (isAr ? 'جاري التشغيل...' : 'Playing...') : (isAr ? 'تلميح صوتي' : 'Audio Clue')}</span>
            </button>
          </div>

          {/* Prompt Box */}
          <div className="p-6 rounded-2xl bg-[#FDFCF7] dark:bg-stone-950/80 border border-[#E2E8F0] dark:border-stone-800 text-center space-y-3">
            <span className="text-xs font-bold text-[#065F46] dark:text-emerald-400 uppercase tracking-wider">
              {currentQ?.type === 'what_comes_next' ? (isAr ? 'استحضر واقرأ الآية التالية لهذه الآية الكريمة:' : 'Recite / Identify what follows this Ayah:') : (isAr ? 'حدد الكلمة الناقصة في هذه الآية المباركة:' : 'Identify the missing keyword in this Ayah:')}
            </span>

            <div
              className={`text-xl sm:text-2xl text-[#0F172A] dark:text-amber-200 leading-relaxed ${
                selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
              }`}
              dir="rtl"
            >
              {currentQ?.promptTextAr}
            </div>

            {currentQ?.promptTextEn && (
              <p className="text-xs text-[#64748B] dark:text-stone-400 italic">"{currentQ.promptTextEn}"</p>
            )}
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-3" dir="rtl">
            {currentQ?.options?.map((opt, oIdx) => {
              const isSelected = selectedAnswer === opt;
              let btnStyle = 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#1E293B] dark:text-stone-200 hover:border-emerald-400';

              if (isAnswerSubmitted) {
                if (opt === currentQ.correctAnswer) {
                  btnStyle = 'bg-[#ECFDF5] border-[#059669] text-[#065F46] font-bold ring-1 ring-emerald-400';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                }
              } else if (isSelected) {
                btnStyle = 'bg-[#ECFDF5] border-[#059669] text-[#065F46] ring-1 ring-[#059669] font-bold';
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div
                    className={`text-base sm:text-lg flex-1 ${
                      selectedFont === 'Scheherazade New' ? 'font-scheherazade' : 'font-amiri'
                    }`}
                  >
                    {opt}
                  </div>

                  <div className="shrink-0" dir="ltr">
                    {isAnswerSubmitted && opt === currentQ.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                    )}
                    {isAnswerSubmitted && isSelected && opt !== currentQ.correctAnswer && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-stone-950 border border-[#FDE68A] dark:border-stone-800 text-xs text-[#92400E] dark:text-stone-300 space-y-1 animate-in fade-in">
              <span className="font-bold text-[#B45309]">{isAr ? 'الإيضاح:' : 'Explanation:'}</span>
              <p className="leading-relaxed">{currentQ?.explanation}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between">
            <button
              onClick={() => setQuizActive(false)}
              className="text-xs text-[#64748B] hover:text-[#0F172A]"
            >
              {isAr ? 'إنهاء الاختبار' : 'Exit Quiz'}
            </button>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="px-6 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-all"
              >
                {isAr ? 'تأكيد الإجابة' : 'Submit Answer'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>{currentQIndex < questions.length - 1 ? (isAr ? 'الآية التالية' : 'Next Ayah') : (isAr ? 'إنهاء وحفظ النتيجة' : 'Complete Quiz')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
