import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  CheckCircle, 
  BookMarked, 
  Send, 
  Sparkles, 
  ArrowRight, 
  PlusCircle,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  Compass,
  Lock,
  Headphones,
  ShieldCheck,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { UserProfile, PageProgressRecord, ActivityItem, Language, SharedReflectionNote, QuizResultRecord } from '../types';
import { SURAH_CATALOG } from '../lib/quranData';
import { JUZ_CATALOG } from '../lib/juzData';
import { formatTimeAgo, toArabicDigits } from '../lib/utils';
import { getTranslation } from '../lib/i18n';
import { DEFAULT_USERS } from '../lib/firebase';
import { DailyReminderAlert } from './DailyReminderAlert';
import { ProgressChart } from './ProgressChart';
import { SpacedRepetitionSection } from './SpacedRepetitionSection';
import { PartnerPresenceBadge, isUserOnlineAndActive } from './PartnerPresenceBadge';
import { PartnerMessageBanner } from './PartnerMessageBanner';
import { PrayerTimesWidget } from './PrayerTimesWidget';
import { ProgressReportModal } from './ProgressReportModal';
import confetti from 'canvas-confetti';

interface AccountabilityHubProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  pageProgress: Record<string, PageProgressRecord>;
  activities: ActivityItem[];
  reflectionNotes?: SharedReflectionNote[];
  quizHistory?: QuizResultRecord[];
  lang: Language;
  onOpenCheckIn: (pageNum?: number) => void;
  onUpdateWeeklyGoal: (userId: 'user_a' | 'user_b', newGoal: number) => void;
  onSendEncouragement: (message: string) => void;
  onNavigateToReader: (pageNum: number) => void;
  onNavigateToJuz: () => void;
  onNavigateToReflections?: () => void;
  onSwitchUser: (userId: 'user_a' | 'user_b') => void;
  onOpenPinModal?: () => void;
  onOpenRegisterModal?: () => void;
  onApproveMemorization?: (recordId: string) => void;
  onRequestRevision?: (recordId: string, notes?: string) => void;
  onUpdateReminderSettings?: (newTime: string, enabled: boolean) => void;
  onQuickReviewPage?: (userId: 'user_a' | 'user_b', pageNumber: number) => void;
}

export const AccountabilityHub: React.FC<AccountabilityHubProps> = ({
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  pageProgress = {},
  activities = [],
  reflectionNotes = [],
  quizHistory = [],
  lang,
  onOpenCheckIn,
  onUpdateWeeklyGoal,
  onSendEncouragement,
  onNavigateToReader,
  onNavigateToJuz,
  onNavigateToReflections,
  onSwitchUser,
  onOpenPinModal,
  onOpenRegisterModal,
  onApproveMemorization,
  onRequestRevision,
  onUpdateReminderSettings,
  onQuickReviewPage,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';
  const [duaInput, setDuaInput] = useState('');
  const [revisionNoteInput, setRevisionNoteInput] = useState<Record<string, string>>({});
  const [activeRevisionPromptId, setActiveRevisionPromptId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Compute stats for User A
  const progressList = Object.values(pageProgress || {}) as PageProgressRecord[];
  const userARecords = progressList.filter((p) => p && p.userId === 'user_a');
  const userAMemorized = userARecords.filter((p) => p && p.status === 'memorized').length;
  const userAReviewed = userARecords.filter((p) => p && p.status === 'reviewed').length;
  const userAInProgress = userARecords.filter((p) => p && p.status === 'in_progress').length;
  const userAPending = userARecords.filter((p) => p && p.status === 'pending_approval').length;
  const userAThisWeek = userAMemorized;

  // Compute stats for User B
  const userBRecords = progressList.filter((p) => p && p.userId === 'user_b');
  const userBMemorized = userBRecords.filter((p) => p && p.status === 'memorized').length;
  const userBReviewed = userBRecords.filter((p) => p && p.status === 'reviewed').length;
  const userBInProgress = userBRecords.filter((p) => p && p.status === 'in_progress').length;
  const userBPending = userBRecords.filter((p) => p && p.status === 'pending_approval').length;
  const userBThisWeek = userBMemorized;

  // Pending Approvals
  const pendingRequestsForMe = progressList.filter(
    (p) => p && p.status === 'pending_approval' && p.userId !== currentUser.id
  );
  const myPendingRequests = progressList.filter(
    (p) => p && p.status === 'pending_approval' && p.userId === currentUser.id
  );

  // Target Juz details
  const currentTargetJuzNum = currentUser.targetJuz || 30;
  const targetJuzObj = JUZ_CATALOG.find((j) => j.number === currentTargetJuzNum) || JUZ_CATALOG[29];

  const handleApprove = (recordId: string) => {
    if (onApproveMemorization) {
      onApproveMemorization(recordId);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#059669', '#F59E0B'],
      });
    }
  };

  const handleReject = (recordId: string) => {
    const note = revisionNoteInput[recordId];
    if (onRequestRevision) {
      onRequestRevision(recordId, note);
    }
    setActiveRevisionPromptId(null);
  };

  const handleSendDua = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duaInput.trim()) return;
    onSendEncouragement(duaInput.trim());
    setDuaInput('');
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#f59e0b', '#065f46'],
    });
  };

  const quickDuas = isAr ? [
    'بارك الله فيك يا أخي! 🌿',
    'ما شاء الله! الله يثبت حفظك 🌟',
    'جزاك الله خيراً، جاهز للتسميع معاً؟ 📖',
    'اللهم اجعل القرآن ربيع قلوبنا 🤍',
  ] : [
    'May Allah bless your Hifz, brother! 🌿',
    'MashaAllah! Keep up the consistency 🌟',
    'JazakAllah Khair, ready to test each other? 📖',
    'May the Quran be the spring of our hearts 🤍',
  ];

  const currentSurahMeta = SURAH_CATALOG.find((s) => s.number === currentUser.currentSurah) || SURAH_CATALOG[66];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Partner Message & Recitation Update Banner (at the beginning) */}
      <PartnerMessageBanner
        currentUser={currentUser}
        otherUser={otherUser}
        lang={lang}
        activities={activities}
        reflectionNotes={reflectionNotes}
        pageProgress={pageProgress}
        onSendEncouragement={onSendEncouragement}
        onNavigateToReader={onNavigateToReader}
        onApproveMemorization={onApproveMemorization}
      />

      {/* Daily Reminder Nudge Notification Banner */}
      <DailyReminderAlert
        currentUser={currentUser}
        otherUser={otherUser}
        lang={lang}
        onOpenCheckIn={() => onOpenCheckIn(currentUser.currentPage)}
        onUpdateReminderSettings={onUpdateReminderSettings}
      />

      {/* Top Banner / Shared Purpose */}
      <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] p-6 sm:p-8 text-white border border-[#043d2e] shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#FCD34D]" />
              <span>{isAr ? 'الميثاق القرآني التشاركي بين الأخوين' : 'Two-Partner Shared Hifz Pact'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t.partnerDashboard}
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              {t.partnerSubtitle}
            </p>
          </div>

          {/* Quick Check-in & Action CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-quick-checkin"
              onClick={() => onOpenCheckIn(currentUser.currentPage)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm shadow-md transition-all transform active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.checkInNow}</span>
            </button>

            <button
              onClick={onNavigateToJuz}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>{t.selectTargetJuz}</span>
            </button>

            <button
              id="btn-export-pdf-report"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>{t.exportPdfReport}</span>
            </button>
          </div>
        </div>

        {/* Real-time Learning Together Status Strip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Current user */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-white">
              <span className="text-base">{currentUser.avatar}</span>
              <span className="font-bold">{currentUser.name}</span>
              <span className="text-emerald-200">({t.page} {isAr ? toArabicDigits(currentUser.currentPage) : currentUser.currentPage})</span>
            </div>

            {/* Live Pulse Beam (only shown if both are active, or general indicator) */}
            {isUserOnlineAndActive(otherUser) && (
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs px-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="font-semibold text-emerald-200">{t.learningTogether}</span>
              </div>
            )}

            {/* Partner user */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs text-white shadow-sm transition-all ${
              isUserOnlineAndActive(otherUser)
                ? 'bg-emerald-950/70 border border-emerald-400/40'
                : 'bg-white/10 border border-white/15 opacity-80'
            }`}>
              <div className="relative flex items-center">
                <span className="text-base">{otherUser.avatar}</span>
                {isUserOnlineAndActive(otherUser) && (
                  <span className="absolute -bottom-1 -end-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-1 ring-white"></span>
                  </span>
                )}
              </div>
              <span className="font-bold">{otherUser.name}</span>
              {isUserOnlineAndActive(otherUser) ? (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isAr ? `يتلو الآن ص ${toArabicDigits(otherUser.currentPage)}` : `Reading Page ${otherUser.currentPage}`}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-emerald-200/80 font-medium border border-white/10 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>{isAr ? `آخر صفحة: ص ${toArabicDigits(otherUser.currentPage)} (غير متصل)` : `Page ${otherUser.currentPage} (Offline)`}</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToReader(otherUser.currentPage)}
            className="text-xs text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20 transition-all font-semibold flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isAr ? `انتقل لصفحة ${otherUser.name} (ص ${toArabicDigits(otherUser.currentPage)})` : `Go to ${otherUser.name}'s page (${otherUser.currentPage})`}</span>
          </button>
        </div>
      </div>

      {/* Partner Memorization Approval & Verification Section */}
      <div className="space-y-4">
        {pendingRequestsForMe.length > 0 && (
          <div className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-5 sm:p-6 shadow-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                    <span>{t.pendingPartnerApprovals}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold">
                      {isAr ? toArabicDigits(pendingRequestsForMe.length) : pendingRequestsForMe.length}
                    </span>
                  </h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                    {t.partnerAwaitingApprovalDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequestsForMe.map((req) => {
                const isPromptOpen = activeRevisionPromptId === req.id;
                return (
                  <div 
                    key={req.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/50 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t.page} {isAr ? toArabicDigits(req.pageNumber) : req.pageNumber}</span>
                        </span>
                        <span className="text-[11px] text-[#94A3B8] font-medium">
                          {req.requestedAt ? formatTimeAgo(req.requestedAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-stone-100">
                        {req.requestedByName || otherUser.name} {isAr ? 'طلب اعتماد حفظ وتسميع هذه الصفحة' : 'requested memorization approval for this page'}
                      </p>
                      {req.notes && (
                        <p className="text-xs text-[#64748B] dark:text-stone-400 mt-1 italic bg-[#F8FAFC] dark:bg-stone-950/60 p-2 rounded-xl border border-[#E2E8F0] dark:border-stone-800">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {isPromptOpen ? (
                      <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-stone-800">
                        <input
                          type="text"
                          value={revisionNoteInput[req.id] || ''}
                          onChange={(e) => setRevisionNoteInput((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder={t.revisionNotePlaceholder}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#CBD5E1] dark:border-stone-700 text-[#1E293B] dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all"
                          >
                            {t.confirmRevisionRequest}
                          </button>
                          <button
                            onClick={() => setActiveRevisionPromptId(null)}
                            className="px-3 py-2 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 text-xs font-semibold"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E8F0] dark:border-stone-800/60">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-sm transition-all transform active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t.approveMemorization}</span>
                        </button>
                        <button
                          onClick={() => setActiveRevisionPromptId(req.id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-[#475569] dark:text-stone-300 hover:text-amber-800 text-xs font-semibold transition-all"
                        >
                          <span>{t.requestRevision}</span>
                        </button>
                        <button
                          onClick={() => onNavigateToReader(req.pageNumber)}
                          className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-stone-950 hover:bg-[#E2E8F0] dark:hover:bg-stone-800 text-[#64748B] dark:text-stone-400 text-xs"
                          title={t.viewInReader}
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Own Pending Submissions Banner */}
        {myPendingRequests.length > 0 && (
          <div className="rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
              <span className="font-bold text-[#065F46] dark:text-emerald-300">
                {isAr 
                  ? `لديك ${toArabicDigits(myPendingRequests.length)} صفحات بانتظار استماع واعتماد شريكك (${otherUser.name}):`
                  : `You have ${myPendingRequests.length} page(s) awaiting approval from your partner (${otherUser.name}):`}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {myPendingRequests.map((req) => (
                  <span 
                    key={req.id} 
                    onClick={() => onNavigateToReader(req.pageNumber)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 font-bold text-[#065F46] dark:text-emerald-200 cursor-pointer hover:underline"
                  >
                    {t.page} {isAr ? toArabicDigits(req.pageNumber) : req.pageNumber}
                  </span>
                ))}
              </div>
            </div>

            {otherUser.userType === 'ai_agent' ? (
              <button
                onClick={() => {
                  myPendingRequests.forEach((req) => handleApprove(req.id));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🤖 {t.askAgentToVerify}</span>
              </button>
            ) : (
              <span className="text-[#059669] dark:text-emerald-400 font-semibold shrink-0">
                {t.waitingForPartner}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Target Focused Juz Banner Card */}
      <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
            {isAr ? toArabicDigits(targetJuzObj.number) : targetJuzObj.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#065F46] dark:text-emerald-400">
                {t.targetJuzHeading}:
              </span>
              <span className="font-bold text-base text-[#0F172A] dark:text-stone-100">
                {isAr ? targetJuzObj.nameAr : targetJuzObj.nameEn}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-stone-400">
              {isAr ? `الصفحات من ${toArabicDigits(targetJuzObj.startPage)} إلى ${toArabicDigits(targetJuzObj.endPage)}` : `Pages ${targetJuzObj.startPage} to ${targetJuzObj.endPage}`}
              <span> • </span>
              {isAr ? `${toArabicDigits(targetJuzObj.totalAyahs)} آية` : `${targetJuzObj.totalAyahs} total verses`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateToReader(targetJuzObj.startPage)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.viewInReader}</span>
          </button>

          <button
            onClick={onNavigateToJuz}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#1E293B] dark:text-stone-200 text-xs font-semibold border border-[#E2E8F0] dark:border-stone-700 transition-all"
          >
            {t.allJuzProgress}
          </button>
        </div>
      </div>

      {/* Local Prayer Times & Daily Salah-Anchored Hifz Planner (Aladhan API) */}
      <PrayerTimesWidget
        lang={lang}
        currentUser={currentUser}
        onNavigateToReader={onNavigateToReader}
        onNavigateToReflections={onNavigateToReflections}
      />

      {/* Dual User Side-by-Side Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User A Card */}
        {(() => {
          const userAObj = currentUser.id === 'user_a' ? currentUser : otherUser;
          const isUserACurrent = currentUser.id === 'user_a';
          return (
            <div className={`relative rounded-3xl p-6 transition-all border ${
              isUserACurrent
                ? 'bg-white dark:bg-stone-900 text-[#1E293B] dark:text-stone-100 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-white dark:bg-stone-900/60 text-[#1E293B] dark:text-stone-200 border-[#E2E8F0] dark:border-stone-800 shadow-sm'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center text-xl shadow-inner font-bold text-[#065F46] dark:text-emerald-300">
                      {userAObj.avatar || '🟢'}
                    </div>
                    {/* Small Presence Status Indicator Dot on Avatar */}
                    <div className="absolute -bottom-1 -end-1">
                      <PartnerPresenceBadge
                        user={userAObj}
                        isPartner={!isUserACurrent}
                        lang={lang}
                        onNavigateToPage={onNavigateToReader}
                        size="sm"
                        showDetailText={false}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-stone-100">
                        {userAObj.name}
                      </h3>
                      {isUserACurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] dark:bg-emerald-900/90 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                          {isAr ? 'الحساب الحالي' : 'Active Profile'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{isAr ? 'حساب مقفل' : 'Protected Account'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-stone-400 mt-0.5">
                      {t.page} {isAr ? toArabicDigits(userAObj.currentPage || 562) : (userAObj.currentPage || 562)}
                    </p>
                  </div>
                </div>

                {!isUserACurrent ? (
                  <button
                    onClick={() => {
                      if (onOpenPinModal) {
                        onOpenPinModal();
                      } else {
                        onSwitchUser('user_a');
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 border border-slate-300 dark:border-stone-700 font-semibold flex items-center gap-1.5"
                    title={isAr ? 'يتطلب إدخال الرمز السري للتبديل' : 'Requires PIN to switch'}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isAr ? 'تبديل الحساب (PIN)' : 'Switch (PIN)'}</span>
                  </button>
                ) : (
                  currentUser.isRegistered ? (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isAr ? 'محمي بالرمز' : 'PIN Secured'}
                    </span>
                  ) : null
                )}
              </div>

          {/* Goal & Streak Meters */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800/80">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400 mb-1.5">
                <span className="flex items-center gap-1 font-semibold"><Target className="w-3.5 h-3.5 text-[#059669]" /> {t.weeklyGoal}</span>
                <span className="font-bold text-[#0F172A] dark:text-stone-200">
                  {isAr ? `${toArabicDigits(userAObj.weeklyGoalPages || 3)} ${t.pagesPerWeek}` : `${userAObj.weeklyGoalPages || 3} ${t.pagesPerWeek}`}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] dark:bg-stone-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[#059669] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (userAThisWeek / (userAObj.weeklyGoalPages || 3)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] mt-2 text-[#64748B] dark:text-stone-400">
                <span>{isAr ? `${toArabicDigits(userAThisWeek)} تم إنجازها` : `${userAThisWeek} completed`}</span>
                <span className="text-[#059669] font-bold">{Math.round((userAThisWeek / (userAObj.weeklyGoalPages || 3)) * 100)}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800/80">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400 mb-1.5">
                <span className="flex items-center gap-1 font-semibold"><Flame className="w-3.5 h-3.5 text-[#D97706]" /> {t.activeStreak}</span>
                <span className="font-bold text-[#D97706]">
                  {isAr ? `${toArabicDigits(userAObj.streakDays || 0)} ${t.days}` : `${userAObj.streakDays || 0} ${t.days}`}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-stone-400 mt-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#059669] inline-block"></span>
                <span>{isAr ? 'حفظ نشط اليوم' : 'Active revision today'}</span>
              </div>
            </div>
          </div>

              {/* Goal adjustment control if current user ONLY */}
              {isUserACurrent ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 mb-4">
                  <span className="text-xs text-[#065F46] dark:text-emerald-200 font-bold">{t.adjustGoal} (2 - 4 {t.pages}):</span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4].map((g) => (
                      <button
                        key={g}
                        onClick={() => onUpdateWeeklyGoal('user_a', g)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          userAObj.weeklyGoalPages === g
                            ? 'bg-[#065F46] text-white shadow-sm ring-2 ring-emerald-300'
                            : 'bg-white dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {isAr ? toArabicDigits(g) : g}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Exclusive Check Memorization Action for Partner */
                <div className="mb-4 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-sky-900 dark:text-sky-200">
                    <span className="font-bold block">{isAr ? 'مهمتك التشاركية مع الأخ:' : 'Shared Partner Duty:'}</span>
                    <span className="text-[11px] text-sky-700 dark:text-sky-300">
                      {isAr ? 'الاستماع لتسميعه وتثبيت ضبط صفحاته' : 'Listen to his recitation & verify accuracy'}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateToReader(userAObj.currentPage || 562)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{isAr ? `فحص وتسميع ص ${toArabicDigits(userAObj.currentPage || 562)}` : `Check Hifz p. ${userAObj.currentPage || 562}`}</span>
                  </button>
                </div>
              )}

              {/* Breakdown Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-[#059669] text-base">{isAr ? toArabicDigits(userAMemorized) : userAMemorized}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.memorized}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-amber-600 text-base">{isAr ? toArabicDigits(userAPending) : userAPending}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-amber-600/80">{isAr ? 'قيد الاعتماد' : 'Pending'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-[#D97706] text-base">{isAr ? toArabicDigits(userAReviewed) : userAReviewed}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.reviewed}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-sky-600 dark:text-sky-400 text-base">{isAr ? toArabicDigits(userAInProgress) : userAInProgress}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.inProgress}</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* User B Card */}
        {(() => {
          const userBObj = currentUser.id === 'user_b' ? currentUser : otherUser;
          const isUserBCurrent = currentUser.id === 'user_b';
          return (
            <div className={`relative rounded-3xl p-6 transition-all border ${
              isUserBCurrent
                ? 'bg-white dark:bg-stone-900 text-[#1E293B] dark:text-stone-100 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                : 'bg-white dark:bg-stone-900/60 text-[#1E293B] dark:text-stone-200 border-[#E2E8F0] dark:border-stone-800 shadow-sm'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-500/40 flex items-center justify-center text-xl shadow-inner font-bold text-sky-600 dark:text-sky-300">
                      {userBObj.avatar || '🔵'}
                    </div>
                    {/* Small Presence Status Indicator Dot on Avatar */}
                    <div className="absolute -bottom-1 -end-1">
                      <PartnerPresenceBadge
                        user={userBObj}
                        isPartner={!isUserBCurrent}
                        lang={lang}
                        onNavigateToPage={onNavigateToReader}
                        size="sm"
                        showDetailText={false}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-stone-100">
                        {userBObj.name}
                      </h3>
                      {isUserBCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-900/90 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
                          {isAr ? 'الحساب الحالي' : 'Active Profile'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{isAr ? 'حساب مقفل' : 'Protected Account'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-stone-400 mt-0.5">
                      {t.page} {isAr ? toArabicDigits(userBObj.currentPage || 1) : (userBObj.currentPage || 1)}
                    </p>
                  </div>
                </div>

                {!isUserBCurrent ? (
                  <button
                    onClick={() => {
                      if (onOpenPinModal) {
                        onOpenPinModal();
                      } else {
                        onSwitchUser('user_b');
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 border border-slate-300 dark:border-stone-700 font-semibold flex items-center gap-1.5"
                    title={isAr ? 'يتطلب إدخال الرمز السري للتبديل' : 'Requires PIN to switch'}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isAr ? 'تبديل الحساب (PIN)' : 'Switch (PIN)'}</span>
                  </button>
                ) : (
                  currentUser.isRegistered ? (
                    <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isAr ? 'محمي بالرمز' : 'PIN Secured'}
                    </span>
                  ) : null
                )}
              </div>

              {/* Goal & Streak Meters */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800/80">
                  <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400 mb-1.5">
                    <span className="flex items-center gap-1 font-semibold"><Target className="w-3.5 h-3.5 text-sky-600" /> {t.weeklyGoal}</span>
                    <span className="font-bold text-[#0F172A] dark:text-stone-200">
                      {isAr ? `${toArabicDigits(userBObj.weeklyGoalPages || 3)} ${t.pagesPerWeek}` : `${userBObj.weeklyGoalPages || 3} ${t.pagesPerWeek}`}
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] dark:bg-stone-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-sky-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (userBThisWeek / (userBObj.weeklyGoalPages || 3)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] mt-2 text-[#64748B] dark:text-stone-400">
                    <span>{isAr ? `${toArabicDigits(userBThisWeek)} تم إنجازها` : `${userBThisWeek} completed`}</span>
                    <span className="text-sky-600 font-bold">{Math.round((userBThisWeek / (userBObj.weeklyGoalPages || 3)) * 100)}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800/80">
                  <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-stone-400 mb-1.5">
                    <span className="flex items-center gap-1 font-semibold"><Flame className="w-3.5 h-3.5 text-[#D97706]" /> {t.activeStreak}</span>
                    <span className="font-bold text-[#D97706]">
                      {isAr ? `${toArabicDigits(userBObj.streakDays || 0)} ${t.days}` : `${userBObj.streakDays || 0} ${t.days}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-stone-400 mt-2.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600 inline-block animate-pulse"></span>
                    <span>{isAr ? 'حفظ نشط' : 'Active revision'}</span>
                  </div>
                </div>
              </div>

              {/* Goal adjustment control if current user ONLY */}
              {isUserBCurrent ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 mb-4">
                  <span className="text-xs text-sky-800 dark:text-sky-200 font-bold">{t.adjustGoal} (2 - 4 {t.pages}):</span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4].map((g) => (
                      <button
                        key={g}
                        onClick={() => onUpdateWeeklyGoal('user_b', g)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          userBObj.weeklyGoalPages === g
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                            : 'bg-white dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {isAr ? toArabicDigits(g) : g}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Exclusive Check Memorization Action for Partner */
                <div className="mb-4 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-sky-900 dark:text-sky-200">
                    <span className="font-bold block">{isAr ? 'مهمتك التشاركية مع الأخ:' : 'Shared Partner Duty:'}</span>
                    <span className="text-[11px] text-sky-700 dark:text-sky-300">
                      {isAr ? 'الاستماع لتسميعه وتثبيت ضبط صفحاته' : 'Listen to his recitation & verify accuracy'}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateToReader(userBObj.currentPage || 1)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{isAr ? `فحص وتسميع ص ${toArabicDigits(userBObj.currentPage || 1)}` : `Check Hifz p. ${userBObj.currentPage || 1}`}</span>
                  </button>
                </div>
              )}

              {/* Breakdown Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-sky-600 text-base">{isAr ? toArabicDigits(userBMemorized) : userBMemorized}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.memorized}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-amber-600 text-base">{isAr ? toArabicDigits(userBPending) : userBPending}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-amber-600/80">{isAr ? 'قيد الاعتماد' : 'Pending'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-[#D97706] text-base">{isAr ? toArabicDigits(userBReviewed) : userBReviewed}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.reviewed}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
                  <div className="font-extrabold text-[#059669] text-base">{isAr ? toArabicDigits(userBInProgress) : userBInProgress}</div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-[#94A3B8]">{t.inProgress}</div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Spaced Repetition & Retention Engine (Ebbinghaus Curve for Hifz) */}
      <SpacedRepetitionSection
        lang={lang}
        currentUser={currentUser}
        otherUser={otherUser}
        pageProgress={pageProgress}
        onQuickReview={(userId, pageNumber) => {
          if (onQuickReviewPage) {
            onQuickReviewPage(userId, pageNumber);
          } else {
            onOpenCheckIn(pageNumber);
          }
        }}
        onNavigateToReader={onNavigateToReader}
      />

      {/* Progress Over Time - Week-by-Week Recharts Visualization */}
      <ProgressChart
        currentUser={currentUser}
        otherUser={otherUser}
        pageProgress={pageProgress}
        activities={activities}
        lang={lang}
      />

      {/* Shared Live Activities & Encouragements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Brotherly Message Form & Feed (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#065F46] dark:text-emerald-400" />
              <span>{t.activeActivityFeed}</span>
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {isAr ? 'مباشر وتشاركي' : 'Live Synced'}
            </span>
          </div>

          {/* Quick Dua reactions */}
          <div className="mb-4">
            <p className="text-xs text-[#64748B] dark:text-stone-400 mb-2">{t.sendEncouragement}:</p>
            <div className="flex flex-wrap gap-2">
              {quickDuas.map((dua, i) => (
                <button
                  key={i}
                  onClick={() => onSendEncouragement(dua)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-850 hover:bg-[#ECFDF5] dark:hover:bg-emerald-950/60 text-[#334155] dark:text-stone-300 hover:text-[#065F46] dark:hover:text-emerald-300 border border-[#E2E8F0] dark:border-stone-750 text-xs transition-all font-medium"
                >
                  {dua}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Form */}
          <form onSubmit={handleSendDua} className="flex gap-2 mb-6">
            <input
              type="text"
              value={duaInput}
              onChange={(e) => setDuaInput(e.target.value)}
              placeholder={t.encouragementPlaceholder}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-[#1E293B] dark:text-stone-200 placeholder-[#94A3B8] text-xs focus:outline-none focus:ring-1 focus:ring-[#065F46]"
            />
            <button
              type="submit"
              disabled={!duaInput.trim()}
              className="px-5 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.send}</span>
            </button>
          </form>

          {/* Recent Activity List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.map((act) => {
              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                    act.type === 'encouragement'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                      : act.userId === 'user_a'
                      ? 'bg-[#F8FAFC] dark:bg-emerald-950/20 border-[#E2E8F0] dark:border-emerald-800/30 text-[#1E293B] dark:text-stone-200'
                      : 'bg-[#F8FAFC] dark:bg-sky-950/20 border-[#E2E8F0] dark:border-sky-800/30 text-[#1E293B] dark:text-stone-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    act.userId === 'user_a' ? 'bg-[#059669] text-white' : 'bg-sky-600 text-white'
                  }`}>
                    {act.userId === 'user_a' ? 'A' : 'B'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[#0F172A] dark:text-stone-100">{act.userName}</span>
                      <span className="text-[10px] text-[#94A3B8]">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <p className="text-[#475569] dark:text-stone-300 leading-relaxed">{act.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges & Achievements (1 Col) */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D97706]" />
            <h3 className="text-base font-bold text-[#0F172A] dark:text-stone-100">
              {isAr ? 'أوسمة الإنجاز والتثبيت' : 'Partnership Badges'}
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center text-lg">
                🛡️
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {isAr ? 'حراس سورة الملك' : 'Surah Al-Mulk Guardians'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-stone-400">
                  {isAr ? 'أتم الشريكان حفظ وتثبيت سورة الملك' : 'Both partners memorized Page 562 & 563'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-lg">
                🔥
              </div>
              <div>
                <div className="text-xs font-bold text-[#065F46] dark:text-emerald-300">
                  {isAr ? 'وسام الاستمرارية ٥ أيام' : '5-Day Consistency Streak'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-stone-400">
                  {isAr ? 'مراجعة وتسجيل يومي متواصل' : 'Active daily check-ins without missing a day'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800 flex items-center gap-3 opacity-80">
              <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-stone-800 border border-[#CBD5E1] dark:border-stone-700 flex items-center justify-center text-lg">
                🏆
              </div>
              <div>
                <div className="text-xs font-bold text-[#334155] dark:text-stone-300">
                  {isAr ? 'ختم جزء عم' : 'Juz \'Amma Completion'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-stone-500">
                  {isAr ? 'حفظ ٢٣ صفحة من جزء عم الـ ٣٠' : 'Memorize all 23 pages of Juz 30'}
                </div>
              </div>
            </div>

            {/* Quick Export PDF Report Trigger Banner */}
            <div className="pt-2 border-t border-slate-100 dark:border-stone-800">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 text-[#065F46] dark:text-emerald-300 font-bold text-xs shadow-xs transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>{t.exportPdfReport}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Progress Report PDF Modal */}
      <ProgressReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        otherUser={otherUser}
        pageProgress={pageProgress}
        quizHistory={quizHistory}
        activities={activities}
        lang={lang}
      />

    </div>
  );
};
