export type Language = 'en' | 'ar';

export interface UserProfile {
  id: 'user_a' | 'user_b';
  name: string;
  avatar: string;
  pin: string;
  email?: string;
  color: string;
  weeklyGoalPages: number; // 2 to 4
  currentSurah: number; // 1-114
  currentPage: number; // 1-604
  targetJuz?: number; // 1-30
  streakDays: number;
  lastActiveDate: string;
  totalMemorizedPages: number;
  totalReviewedPages: number;
  dailyReminderTime?: string; // e.g. "19:00"
  reminderEnabled?: boolean;
  snoozedUntil?: string; // ISO string when snoozed
  isRegistered?: boolean; // True when user formally created/registered account
  userType?: 'real_user' | 'ai_agent' | 'dummy_user'; // Real human, AI study agent companion, or temporary dummy
  agentRole?: 'hifz_coach' | 'tajweed_mentor' | 'supportive_peer';
  agentPersonality?: string;
  agentAutoApprove?: boolean;
  isOnline?: boolean;
  lastPageActiveAt?: string;
}

export interface JuzMeta {
  number: number; // 1-30
  nameAr: string; // e.g. "الجزء الثلاثون (عم)"
  nameEn: string; // e.g. "Juz 30 (Amma)"
  shortNameAr: string; // e.g. "عم"
  startPage: number;
  endPage: number;
  startSurahNumber: number;
  startAyahNumber: number;
  surahsIncluded: string[]; // Arabic or English Surah names
  surahsIncludedEn: string[];
  totalAyahs: number;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'pending_approval' | 'memorized' | 'reviewed';

export interface PageProgressRecord {
  id: string; // `${userId}_page_${pageNum}`
  userId: 'user_a' | 'user_b';
  pageNumber: number;
  surahNumber: number;
  status: ProgressStatus;
  lastUpdated: string;
  notes?: string;
  reviewCount?: number;
  requestedBy?: 'user_a' | 'user_b';
  requestedByName?: string;
  requestedAt?: string;
  approvedBy?: 'user_a' | 'user_b';
  approvedByName?: string;
  approvedAt?: string;
  revisionNotes?: string;
}

export interface ActivityItem {
  id: string;
  userId: 'user_a' | 'user_b';
  userName: string;
  type: 'memorized_page' | 'reviewed_page' | 'pending_approval' | 'approved_memorization' | 'completed_goal' | 'quiz_passed' | 'encouragement' | 'reflection_note';
  pageNumber?: number;
  surahName?: string;
  quizScore?: number;
  message: string;
  timestamp: string;
}

export interface SurahMeta {
  number: number;
  name: string; // Arabic: "الفاتحة"
  englishName: string; // "Al-Faatiha"
  englishNameTranslation: string; // "The Opening"
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  startPage: number;
  endPage: number;
}

export interface Ayah {
  number: number; // Global ayah number (1-6236)
  numberInSurah: number; // 1 to numberOfAyahs
  text: string; // Uthmani Arabic text
  translation?: string; // English translation
  audioUrl?: string; // Recitation audio URL
  page: number; // Page in Mushaf (1-604)
  juz: number; // 1-30
  surahNumber: number;
  surahName?: string;
  tafsir?: string;
}

export interface AyahTafsir {
  ayahNumber: number; // Global number (1-6236)
  numberInSurah: number;
  surahNumber: number;
  surahNameAr?: string;
  surahNameEn?: string;
  textAr: string;
  tafsirAr: string; // Authentic concise Tafseer Al-Muyassar (التفسير الميسر)
  tafsirEn?: string; // English meaning & translation
  sourceNameAr?: string;
  sourceNameEn?: string;
}

export interface ReflectionCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  description?: string; // legacy support
  iconName: string;
  color: string;
  accent: string;
}

export interface ReflectionItem {
  id: string;
  categoryId: string;
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  ayahNumber: number;
  ayahTextAr: string;
  ayahTranslationEn: string;
  ayahMeaningAr?: string; // معاني المفردات وشرح الآية بالعربية
  contextAndTakeawayAr: string; // التدبر والدرس الإيماني والعملي بالعربية
  contextAndTakeawayEn: string; // Heart Takeaway & Life Reflection in English
  tafsirSummaryAr: string; // خلاصة التفسير الميسر / السعدي / ابن كثير بالعربية
  tafsirSummaryEn: string; // Tafsir Summary in English
  tafsirSourceAr?: string; // e.g. "تفسير السعدي"
  tafsirSourceEn?: string; // e.g. "Tafsir Al-Sa'di"
  audioUrl?: string;
  tagsAr: string[];
  tagsEn: string[];
  tags?: string[]; // legacy compatibility
  contextAndTakeaway?: string; // legacy compatibility
  tafsirSummary?: string; // legacy compatibility
}

export interface SharedReflectionNote {
  id: string;
  reflectionId: string;
  userId: 'user_a' | 'user_b';
  userName: string;
  noteText: string;
  timestamp: string;
}

export type QuizType = 'what_comes_next' | 'fill_in_blank' | 'order_verses';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  promptTextAr: string;
  promptTextEn?: string;
  audioUrl?: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  correctIndex?: number;
  explanation?: string;
  missingWordIndex?: number;
  wordsWithBlank?: string[];
  fullAyahText?: string;
  scrambledVerses?: { id: number; text: string }[];
}

export interface QuizResultRecord {
  id: string;
  userId: 'user_a' | 'user_b';
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  quizType: QuizType;
  scopeDescription: string;
  timestamp: string;
}

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  subfolder: string;
  serverKey: string;
}
