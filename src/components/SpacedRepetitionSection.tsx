import React, { useState } from 'react';
import { 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ShieldCheck, 
  Calendar,
  Flame,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { UserProfile, PageProgressRecord, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { 
  getSpacedRepetitionQueue, 
  SpacedRepetitionPageStatus, 
  SPACED_INTERVALS_DAYS 
} from '../lib/spacedRepetition';

interface SpacedRepetitionSectionProps {
  lang: Language;
  currentUser: UserProfile;
  otherUser: UserProfile;
  pageProgress: Record<string, PageProgressRecord>;
  onQuickReview: (userId: 'user_a' | 'user_b', pageNumber: number) => void;
  onNavigateToReader: (pageNumber: number) => void;
}

export const SpacedRepetitionSection: React.FC<SpacedRepetitionSectionProps> = ({
  lang,
  currentUser,
  otherUser,
  pageProgress,
  onQuickReview,
  onNavigateToReader,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // Selected queue user (default to current user)
  const [selectedUserQueue, setSelectedUserQueue] = useState<'user_a' | 'user_b'>(currentUser.id);
  // Filter mode: 'needing' (overdue + due today/soon) | 'overdue' | 'due_today' | 'all'
  const [filterMode, setFilterMode] = useState<'needing' | 'overdue' | 'due_today' | 'all'>('needing');
  // Explainer accordion toggle
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  // Track recently reviewed page for instant UI feedback animation
  const [justReviewedPage, setJustReviewedPage] = useState<number | null>(null);

  const activeQueueUser = selectedUserQueue === currentUser.id ? currentUser : otherUser;
  const isViewingSelf = selectedUserQueue === currentUser.id;

  const { items: allQueueItems, stats } = getSpacedRepetitionQueue(pageProgress, selectedUserQueue);

  // Filter items based on active filter
  const displayedItems = allQueueItems.filter((item) => {
    if (filterMode === 'overdue') return item.urgency === 'overdue';
    if (filterMode === 'due_today') return item.urgency === 'due_today' || item.urgency === 'due_soon';
    if (filterMode === 'needing') return item.urgency === 'overdue' || item.urgency === 'due_today' || item.urgency === 'due_soon';
    return true; // 'all'
  });

  const handleReviewClick = (userId: 'user_a' | 'user_b', pageNumber: number) => {
    setJustReviewedPage(pageNumber);
    onQuickReview(userId, pageNumber);
    setTimeout(() => {
      setJustReviewedPage(null);
    }, 2000);
  };

  // Retention Bar Color logic
  const getRetentionColor = (percent: number, urgency: SpacedRepetitionPageStatus['urgency']) => {
    if (urgency === 'overdue' || percent < 60) {
      return {
        bg: 'bg-rose-500',
        track: 'bg-rose-100 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-900/60',
      };
    }
    if (urgency === 'due_today' || urgency === 'due_soon' || percent < 80) {
      return {
        bg: 'bg-amber-500',
        track: 'bg-amber-100 dark:bg-amber-950/40',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-900/60',
      };
    }
    return {
      bg: 'bg-[#059669]',
      track: 'bg-emerald-100 dark:bg-emerald-950/40',
      text: 'text-[#065F46] dark:text-emerald-400',
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/60',
    };
  };

  return (
    <div id="spaced-repetition-section" className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 md:p-8 shadow-sm space-y-6 transition-all">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] dark:border-stone-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/10 shrink-0">
            <RotateCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-stone-100">
                {t.spacedRepetitionTitle}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {isAr ? 'خوارزمية التثبيت الذكي' : 'Ebbinghaus Retention'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              {t.spacedRepetitionSubtitle}
            </p>
          </div>
        </div>

        {/* User Queue Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] dark:bg-stone-800 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSelectedUserQueue(currentUser.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedUserQueue === currentUser.id
                ? 'bg-white dark:bg-stone-900 text-[#065F46] dark:text-emerald-300 shadow-xs'
                : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
            }`}
          >
            <span>{currentUser.avatar}</span>
            <span>{currentUser.name}</span>
            {stats.overdueCount > 0 && selectedUserQueue === currentUser.id && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedUserQueue(otherUser.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedUserQueue === otherUser.id
                ? 'bg-white dark:bg-stone-900 text-[#0284c7] dark:text-sky-300 shadow-xs'
                : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
            }`}
          >
            <span>{otherUser.avatar}</span>
            <span>{otherUser.name}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* 1. Overdue Alert Metric */}
        <div className={`p-4 rounded-2xl border transition-all ${
          stats.overdueCount > 0 
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
            : 'bg-[#F8FAFC] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={stats.overdueCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-[#64748B] dark:text-stone-400'}>
              {t.needsReviewNow}
            </span>
            <AlertTriangle className={`w-4 h-4 ${stats.overdueCount > 0 ? 'text-rose-600 animate-bounce' : 'text-[#94A3B8]'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${stats.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#0F172A] dark:text-stone-200'}`}>
              {stats.overdueCount}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-stone-400">{t.pages}</span>
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-stone-500 mt-1">
            {stats.overdueCount > 0 
              ? (isAr ? 'تجاوزت الفاصل الموصى به' : 'Past interval threshold') 
              : (isAr ? 'لا توجد صفحات متأخرة' : 'Zero overdue pages')}
          </p>
        </div>

        {/* 2. Due Today / Soon Metric */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] dark:text-stone-400 mb-1.5">
            <span>{t.dueToday}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.dueTodayCount + stats.dueSoonCount}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-stone-400">{t.pages}</span>
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-stone-500 mt-1">
            {isAr ? 'مستحقة خلال ٤٨ ساعة' : 'Due in next 24-48h'}
          </p>
        </div>

        {/* 3. Solid Retention Metric */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] dark:text-stone-400 mb-1.5">
            <span>{t.solidRetention}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#059669] dark:text-emerald-400">
              {stats.masteredCount}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-stone-400">{t.pages}</span>
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-stone-500 mt-1">
            {isAr ? 'في نطاق الأمان والتثبيت' : 'Locked in safe window'}
          </p>
        </div>

        {/* 4. Average Retention Health Gauge */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
          <div className="flex items-center justify-between text-xs font-bold text-[#065F46] dark:text-emerald-400 mb-1.5">
            <span>{t.retentionHealth}</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#065F46] dark:text-emerald-300">
              {stats.averageRetentionPercent}%
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-stone-400">{isAr ? 'كفاءة' : 'Score'}</span>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-[#059669] h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.averageRetentionPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Filter Chips & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('needing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'needing'
                ? 'bg-[#065F46] text-white shadow-xs'
                : 'bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0]'
            }`}
          >
            {t.filterAllNeeding} ({stats.overdueCount + stats.dueTodayCount + stats.dueSoonCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('overdue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0]'
            }`}
          >
            <span>{t.filterOverdue}</span>
            {stats.overdueCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filterMode === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                {stats.overdueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('due_today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'due_today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0]'
            }`}
          >
            {t.filterDueToday} ({stats.dueTodayCount + stats.dueSoonCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-[#1E293B] dark:bg-stone-700 text-white shadow-xs'
                : 'bg-[#F1F5F9] dark:bg-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#E2E8F0]'
            }`}
          >
            {t.filterAll} ({stats.totalTrackedPages})
          </button>
        </div>

        {/* Tip for testing partner */}
        {!isViewingSelf && (
          <div className="text-[11px] text-[#0284c7] dark:text-sky-300 flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800">
            <Flame className="w-3.5 h-3.5" />
            <span>{t.reviewPartnerTip}</span>
          </div>
        )}
      </div>

      {/* Pages Review Queue List */}
      {displayedItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#F8FAFC] dark:bg-stone-950/40 border border-[#E2E8F0] dark:border-stone-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-xl">
            🎉
          </div>
          <div className="text-sm font-bold text-[#0F172A] dark:text-stone-200">
            {stats.totalTrackedPages === 0 ? t.noMemorizedPagesYet : t.allRetentionSafe}
          </div>
          <p className="text-xs text-[#64748B] dark:text-stone-400 max-w-md mx-auto">
            {stats.totalTrackedPages === 0
              ? (isAr 
                  ? 'عند توثيق حفظ أي صفحة جديدة، ستُدرج تلقائياً في دورة التكرار المتباعد (يوم ١، يوم ٣، أسبوع، أسبوعين، شهر).' 
                  : 'Whenever pages are memorized and approved, they automatically enter the smart review schedule.')
              : (isAr 
                  ? 'جميع الصفحات في مستويات تثبيت عالية ومجدولة في مواعيدها القادمة بنجاح.' 
                  : 'All tracked pages have strong retention scores within their designated interval windows.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map((item) => {
            const colors = getRetentionColor(item.retentionPercent, item.urgency);
            const isJustReviewed = justReviewedPage === item.pageNumber;

            return (
              <div
                key={item.recordId}
                className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  isJustReviewed
                    ? 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-400 scale-[1.02]'
                    : `${colors.border} bg-white dark:bg-stone-950/60`
                }`}
              >
                {/* Header: Page & Surah Name */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#0F172A] dark:text-stone-100">
                          {t.page} {item.pageNumber}
                        </span>
                        <span className="text-xs font-bold text-[#065F46] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                          {isAr ? `سورة ${item.surahNameAr}` : `Surah ${item.surahNameEn}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-stone-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        <span>
                          {item.daysSinceReview === 0 
                            ? t.reviewedToday 
                            : item.reviewCount > 0 
                              ? t.reviewedXDaysAgo.replace('{days}', String(item.daysSinceReview))
                              : t.memorizedXDaysAgo.replace('{days}', String(item.daysSinceReview))}
                        </span>
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${colors.badge}`}>
                      {item.urgency === 'overdue' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                      {item.urgency === 'due_today' && <Clock className="w-3 h-3" />}
                      {item.urgency === 'mastered' && <ShieldCheck className="w-3 h-3" />}
                      <span>
                        {item.urgency === 'overdue' && t.needsReviewNow}
                        {item.urgency === 'due_today' && t.dueToday}
                        {item.urgency === 'due_soon' && t.dueSoon}
                        {item.urgency === 'mastered' && t.solidRetention}
                      </span>
                    </span>
                  </div>

                  {/* Retention Strength Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#64748B] dark:text-stone-400">
                        {t.retentionScore}
                      </span>
                      <span className={`font-black ${colors.text}`}>
                        {item.retentionPercent}%
                      </span>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${colors.track}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bg}`}
                        style={{ width: `${item.retentionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Interval Stage Metadata */}
                  <div className="flex items-center justify-between text-[11px] bg-[#F8FAFC] dark:bg-stone-900/80 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-stone-800 mb-4">
                    <div>
                      <span className="text-[#94A3B8] dark:text-stone-500 block text-[10px]">
                        {t.stageIntervalLabel}
                      </span>
                      <span className="font-bold text-[#1E293B] dark:text-stone-200">
                        {t.reviewIntervalStage.replace('{stage}', String(item.stage)).replace('{days}', String(item.intervalDays))}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-[#94A3B8] dark:text-stone-500 block text-[10px]">
                        {item.daysUntilDue < 0 ? t.daysOverdueLabel : t.daysRemainingLabel}
                      </span>
                      <span className={`font-bold ${item.daysUntilDue < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#059669] dark:text-emerald-400'}`}>
                        {item.daysUntilDue < 0 
                          ? `${Math.abs(item.daysUntilDue)} ${t.days}` 
                          : `${item.daysUntilDue} ${t.days}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9] dark:border-stone-800/80">
                  {/* Read in Mushaf */}
                  <button
                    type="button"
                    onClick={() => onNavigateToReader(item.pageNumber)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] dark:bg-stone-800 dark:hover:bg-stone-700 text-[#1E293B] dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{t.viewInReader}</span>
                  </button>

                  {/* Mark Reviewed & Strengthen */}
                  <button
                    type="button"
                    onClick={() => handleReviewClick(item.userId, item.pageNumber)}
                    className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                      item.urgency === 'overdue'
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                        : 'bg-[#065F46] hover:bg-[#044e39] shadow-emerald-700/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.markReviewed}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Explainer Accordion on Spaced Repetition Science */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-stone-800 bg-[#F8FAFC] dark:bg-stone-950/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExplainerOpen(!isExplainerOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#475569] dark:text-stone-300 hover:text-[#0F172A] transition-all"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#065F46] dark:text-emerald-400" />
            <span>{t.howSpacedRepetitionWorks}</span>
          </div>
          {isExplainerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExplainerOpen && (
          <div className="px-5 pb-5 pt-1 text-xs text-[#64748B] dark:text-stone-400 space-y-3 border-t border-[#E2E8F0] dark:border-stone-800/60 leading-relaxed">
            <p>{t.spacedRepetitionExplanation}</p>
            
            {/* Timeline stages visual */}
            <div className="grid grid-cols-6 gap-2 pt-2">
              {SPACED_INTERVALS_DAYS.map((days, idx) => (
                <div key={days} className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 text-center">
                  <div className="text-[10px] text-[#94A3B8]">
                    {isAr ? `مرحلة ${idx + 1}` : `Stage ${idx + 1}`}
                  </div>
                  <div className="text-xs font-black text-[#065F46] dark:text-emerald-300">
                    {days} {isAr ? 'يوم' : 'd'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
