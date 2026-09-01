import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Trophy,
  Flame,
  Target,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Award,
  Clock,
  User,
  Users,
  Check,
  Percent,
  TrendingUp,
  BrainCircuit,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserProfile, PageProgressRecord, QuizResultRecord, ActivityItem, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { JUZ_CATALOG } from '../lib/juzData';
import { SURAH_CATALOG } from '../lib/quranData';
import { getSurahForPage } from '../lib/spacedRepetition';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  otherUser: UserProfile;
  pageProgress: Record<string, PageProgressRecord>;
  quizHistory: QuizResultRecord[];
  activities: ActivityItem[];
  lang: Language;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  otherUser,
  pageProgress = {},
  quizHistory = [],
  activities = [],
  lang,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';
  const reportRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [includePageCatalog, setIncludePageCatalog] = useState(true);
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [reportLang, setReportLang] = useState<Language>(lang);

  if (!isOpen) return null;

  const isReportAr = reportLang === 'ar';

  // Compute stats for User A
  const progressList = Object.values(pageProgress || {}) as PageProgressRecord[];
  
  const userARecords = progressList.filter((p) => p && p.userId === 'user_a');
  const userAMemorized = userARecords.filter((p) => p && p.status === 'memorized');
  const userAReviewed = userARecords.filter((p) => p && p.status === 'reviewed');
  const userAInProgress = userARecords.filter((p) => p && p.status === 'in_progress');
  const userAPending = userARecords.filter((p) => p && p.status === 'pending_approval');

  // Compute stats for User B
  const userBRecords = progressList.filter((p) => p && p.userId === 'user_b');
  const userBMemorized = userBRecords.filter((p) => p && p.status === 'memorized');
  const userBReviewed = userBRecords.filter((p) => p && p.status === 'reviewed');
  const userBInProgress = userBRecords.filter((p) => p && p.status === 'in_progress');
  const userBPending = userBRecords.filter((p) => p && p.status === 'pending_approval');

  // Quiz Stats
  const userAQuizzes = quizHistory.filter((q) => q && q.userId === 'user_a');
  const userBQuizzes = quizHistory.filter((q) => q && q.userId === 'user_b');

  const calcAvgQuiz = (quizzes: QuizResultRecord[]) => {
    if (quizzes.length === 0) return 0;
    const sum = quizzes.reduce((acc, q) => acc + (q.percentage || 0), 0);
    return Math.round(sum / quizzes.length);
  };

  const userAAvgQuiz = calcAvgQuiz(userAQuizzes);
  const userBAvgQuiz = calcAvgQuiz(userBQuizzes);

  // Target Juz details
  const currentTargetJuzNumA = currentUser.id === 'user_a' ? (currentUser.targetJuz || 30) : (otherUser.targetJuz || 30);
  const currentTargetJuzNumB = currentUser.id === 'user_b' ? (currentUser.targetJuz || 30) : (otherUser.targetJuz || 30);

  const targetJuzObjA = JUZ_CATALOG.find((j) => j.number === currentTargetJuzNumA) || JUZ_CATALOG[29];
  const targetJuzObjB = JUZ_CATALOG.find((j) => j.number === currentTargetJuzNumB) || JUZ_CATALOG[29];

  const userAObj = currentUser.id === 'user_a' ? currentUser : otherUser;
  const userBObj = currentUser.id === 'user_b' ? currentUser : otherUser;

  // Handle PDF Export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      const element = reportRef.current;
      
      // Configure html2canvas options for clean high-res vector-like snapshot
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const fileName = `HifzTogether_Progress_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.warn('PDF export fallback:', err);
      // Fallback: Trigger native browser print
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const todayDateString = new Date().toLocaleDateString(isReportAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in" dir={isReportAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-stone-800 overflow-hidden my-auto">
        
        {/* Header with action bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">
                {t.exportPdfReport}
              </h3>
              <p className="text-xs text-slate-500 dark:text-stone-400">
                {t.exportPdfSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-200 dark:bg-stone-800 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setReportLang('ar')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  reportLang === 'ar' ? 'bg-white dark:bg-stone-900 text-[#065F46] shadow-xs' : 'text-slate-600 dark:text-stone-400'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setReportLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  reportLang === 'en' ? 'bg-white dark:bg-stone-900 text-[#065F46] shadow-xs' : 'text-slate-600 dark:text-stone-400'
                }`}
              >
                English
              </button>
            </div>

            {/* Print button */}
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-200 text-xs font-bold transition-all border border-slate-200 dark:border-stone-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printReport}</span>
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#065F46] hover:bg-[#044e39] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.generatingPdf}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPdf}</span>
                </>
              )}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="px-5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-900 dark:text-emerald-200 no-print">
          <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            {isReportAr ? 'تخصيص بنود التقرير:' : 'Report Options:'}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeQuizzes}
              onChange={(e) => setIncludeQuizzes(e.target.checked)}
              className="rounded text-[#065F46] focus:ring-0"
            />
            <span>{t.includeQuizHistory}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includePageCatalog}
              onChange={(e) => setIncludePageCatalog(e.target.checked)}
              className="rounded text-[#065F46] focus:ring-0"
            />
            <span>{t.includePageCatalog}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMilestones}
              onChange={(e) => setIncludeMilestones(e.target.checked)}
              className="rounded text-[#065F46] focus:ring-0"
            />
            <span>{t.includeMilestones}</span>
          </label>
        </div>

        {/* Printable Report Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-stone-100">
          <div
            ref={reportRef}
            className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 space-y-8"
            style={{ minHeight: '800px' }}
          >
            
            {/* Header Document Section */}
            <div className="border-b-2 border-[#065F46] pb-6 text-center space-y-2">
              <div className="text-xs font-semibold text-emerald-800 tracking-wider">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#065F46] tracking-tight">
                {isReportAr ? 'تقرير إنجاز الحفظ والتثبيت القرآني المشترك' : 'HifzTogether Collaborative Quran Progress Report'}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 pt-1">
                <span><strong>{isReportAr ? 'تاريخ التقرير:' : 'Generated:'}</strong> {todayDateString}</span>
                <span>•</span>
                <span><strong>{isReportAr ? 'الشريكان:' : 'Partners:'}</strong> {userAObj.name} & {userBObj.name}</span>
                <span>•</span>
                <span><strong>{isReportAr ? 'المنظومة:' : 'Platform:'}</strong> HifzTogether (Madinah Mushaf)</span>
              </div>
            </div>

            {/* Executive Comparison Table */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#065F46] flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <Users className="w-4 h-4" />
                <span>{isReportAr ? 'المقارنة الشاملة ومؤشرات الإنجاز' : 'Dual Executive Progress Summary'}</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse" dir={isReportAr ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="p-2.5">{isReportAr ? 'المؤشر القرآني' : 'Progress Metric'}</th>
                      <th className="p-2.5 text-center bg-emerald-50 text-[#065F46] font-extrabold">
                        {userAObj.avatar} {userAObj.name}
                      </th>
                      <th className="p-2.5 text-center bg-sky-50 text-sky-800 font-extrabold">
                        {userBObj.avatar} {userBObj.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'الصفحة الحالية في المصحف' : 'Current Page'}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{isReportAr ? `ص ${toArabicDigits(userAObj.currentPage || 1)}` : `Page ${userAObj.currentPage || 1}`}</td>
                      <td className="p-2.5 text-center font-bold text-sky-700">{isReportAr ? `ص ${toArabicDigits(userBObj.currentPage || 1)}` : `Page ${userBObj.currentPage || 1}`}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'الجزء المستهدف حالياً' : 'Target Focus Juz'}</td>
                      <td className="p-2.5 text-center font-bold">{isReportAr ? targetJuzObjA.nameAr : targetJuzObjA.nameEn}</td>
                      <td className="p-2.5 text-center font-bold">{isReportAr ? targetJuzObjB.nameAr : targetJuzObjB.nameEn}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'إجمالي الصفحات المتقنة (المحفوظة)' : 'Total Pages Memorized'}</td>
                      <td className="p-2.5 text-center font-extrabold text-emerald-800 text-sm">
                        {isReportAr ? `${toArabicDigits(userAMemorized.length)} صفحة (${toArabicDigits(Math.round((userAMemorized.length / 604) * 100))}%)` : `${userAMemorized.length} pages (${Math.round((userAMemorized.length / 604) * 100)}%)`}
                      </td>
                      <td className="p-2.5 text-center font-extrabold text-sky-800 text-sm">
                        {isReportAr ? `${toArabicDigits(userBMemorized.length)} صفحة (${toArabicDigits(Math.round((userBMemorized.length / 604) * 100))}%)` : `${userBMemorized.length} pages (${Math.round((userBMemorized.length / 604) * 100)}%)`}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'جلسات المراجعة الموثقة (التكرار المتباعد)' : 'Spaced Reviews Completed'}</td>
                      <td className="p-2.5 text-center font-semibold text-amber-700">{isReportAr ? `${toArabicDigits(userAReviewed.length)} مراجعة` : `${userAReviewed.length} reviews`}</td>
                      <td className="p-2.5 text-center font-semibold text-amber-700">{isReportAr ? `${toArabicDigits(userBReviewed.length)} مراجعة` : `${userBReviewed.length} reviews`}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'صفحات قيد الحفظ والتثبيت' : 'Pages In Progress'}</td>
                      <td className="p-2.5 text-center font-semibold">{isReportAr ? `${toArabicDigits(userAInProgress.length)} صفحة` : `${userAInProgress.length} pages`}</td>
                      <td className="p-2.5 text-center font-semibold">{isReportAr ? `${toArabicDigits(userBInProgress.length)} صفحة` : `${userBInProgress.length} pages`}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'صفحات بانتظار مصادقة وتسميع الشريك' : 'Pending Partner Approvals'}</td>
                      <td className="p-2.5 text-center font-semibold text-rose-700">{isReportAr ? toArabicDigits(userAPending.length) : userAPending.length}</td>
                      <td className="p-2.5 text-center font-semibold text-rose-700">{isReportAr ? toArabicDigits(userBPending.length) : userBPending.length}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'الهدف الأسبوعي' : 'Weekly Goal Target'}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{isReportAr ? `${toArabicDigits(userAObj.weeklyGoalPages || 3)} صفحة/أسبوع` : `${userAObj.weeklyGoalPages || 3} pages/week`}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{isReportAr ? `${toArabicDigits(userBObj.weeklyGoalPages || 3)} صفحة/أسبوع` : `${userBObj.weeklyGoalPages || 3} pages/week`}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'أيام الاستمرارية المتتالية (Streak)' : 'Active Consistency Streak'}</td>
                      <td className="p-2.5 text-center font-extrabold text-amber-600">{isReportAr ? `${toArabicDigits(userAObj.streakDays || 0)} يوم متواصل 🔥` : `${userAObj.streakDays || 0} days 🔥`}</td>
                      <td className="p-2.5 text-center font-extrabold text-amber-600">{isReportAr ? `${toArabicDigits(userBObj.streakDays || 0)} يوم متواصل 🔥` : `${userBObj.streakDays || 0} days 🔥`}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800">{isReportAr ? 'متوسط نتائج الاختبارات الذاتية' : 'Average Quiz Score'}</td>
                      <td className="p-2.5 text-center font-extrabold text-emerald-700">{isReportAr ? `${toArabicDigits(userAAvgQuiz)}% (${toArabicDigits(userAQuizzes.length)} اختبار)` : `${userAAvgQuiz}% (${userAQuizzes.length} tests)`}</td>
                      <td className="p-2.5 text-center font-extrabold text-sky-700">{isReportAr ? `${toArabicDigits(userBAvgQuiz)}% (${toArabicDigits(userBQuizzes.length)} اختبار)` : `${userBAvgQuiz}% (${userBQuizzes.length} tests)`}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quiz Performance History Section */}
            {includeQuizzes && (
              <div className="space-y-3 page-break-inside-avoid">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#065F46] flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  <span>{isReportAr ? 'سجل الاختبارات الذاتية والتمكن' : 'Self-Testing & Quiz Performance Log'}</span>
                </h2>

                {quizHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    {isReportAr ? 'لم يتم إجراء اختبارات ذاتية بعد في هذا السجل.' : 'No quiz tests completed yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-900 block">{userAObj.name}:</span>
                        <div className="text-slate-600 mt-1">
                          {isReportAr 
                            ? `تم إنجاز ${toArabicDigits(userAQuizzes.length)} اختبار بمعدل دقة ${toArabicDigits(userAAvgQuiz)}%`
                            : `${userAQuizzes.length} quizzes taken with ${userAAvgQuiz}% accuracy`}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
                        <span className="font-bold text-sky-900 block">{userBObj.name}:</span>
                        <div className="text-slate-600 mt-1">
                          {isReportAr 
                            ? `تم إنجاز ${toArabicDigits(userBQuizzes.length)} اختبار بمعدل دقة ${toArabicDigits(userBAvgQuiz)}%`
                            : `${userBQuizzes.length} quizzes taken with ${userBAvgQuiz}% accuracy`}
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse" dir={isReportAr ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2">{isReportAr ? 'التاريخ' : 'Date'}</th>
                          <th className="p-2">{isReportAr ? 'الحافظ' : 'User'}</th>
                          <th className="p-2">{isReportAr ? 'نوع الاختبار' : 'Quiz Type'}</th>
                          <th className="p-2">{isReportAr ? 'النطاق' : 'Scope'}</th>
                          <th className="p-2 text-center">{isReportAr ? 'النتيجة' : 'Score'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quizHistory.slice(0, 8).map((q) => {
                          const typeLabel = q.quizType === 'what_comes_next' 
                            ? (isReportAr ? 'ما الآية التالية؟' : 'What Comes Next') 
                            : q.quizType === 'fill_in_blank' 
                            ? (isReportAr ? 'أكمل الفراغ' : 'Fill in Blank') 
                            : (isReportAr ? 'ترتيب الآيات' : 'Order Verses');
                          
                          return (
                            <tr key={q.id}>
                              <td className="p-2 text-slate-500">{new Date(q.timestamp).toLocaleDateString(isReportAr ? 'ar-SA' : 'en-US')}</td>
                              <td className="p-2 font-bold text-slate-800">{q.userName}</td>
                              <td className="p-2 text-slate-700">{typeLabel}</td>
                              <td className="p-2 text-slate-600">{q.scopeDescription}</td>
                              <td className="p-2 text-center font-extrabold text-[#065F46]">
                                {isReportAr ? `${toArabicDigits(q.score)}/${toArabicDigits(q.totalQuestions)} (${toArabicDigits(q.percentage)}%)` : `${q.score}/${q.totalQuestions} (${q.percentage}%)`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Memorized Pages Catalog Section */}
            {includePageCatalog && (
              <div className="space-y-3 page-break-inside-avoid">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#065F46] flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{isReportAr ? 'قائمة الصفحات والسور المحفوظة بالتفصيل' : 'Memorized Pages & Surahs Catalog'}</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User A Catalog */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center justify-between">
                      <span>{userAObj.name} ({isReportAr ? `${toArabicDigits(userAMemorized.length)} صفحة` : `${userAMemorized.length} pages`})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold">
                        {isReportAr ? 'حفظ متقن' : 'Verified'}
                      </span>
                    </div>

                    {userAMemorized.length === 0 ? (
                      <p className="text-slate-500 italic">{isReportAr ? 'لم تسجل صفحات بعد' : 'No pages marked yet'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {userAMemorized.map((p) => {
                          const surah = getSurahForPage(p.pageNumber);
                          return (
                            <span
                              key={p.id}
                              className="px-2 py-1 rounded-md bg-white border border-emerald-200 text-emerald-900 font-mono text-[11px] font-semibold"
                            >
                              {isReportAr ? `ص ${toArabicDigits(p.pageNumber)} (${surah.name})` : `p. ${p.pageNumber} (${surah.englishName})`}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* User B Catalog */}
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 text-xs space-y-2">
                    <div className="font-bold text-sky-900 flex items-center justify-between">
                      <span>{userBObj.name} ({isReportAr ? `${toArabicDigits(userBMemorized.length)} صفحة` : `${userBMemorized.length} pages`})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-extrabold">
                        {isReportAr ? 'حفظ متقن' : 'Verified'}
                      </span>
                    </div>

                    {userBMemorized.length === 0 ? (
                      <p className="text-slate-500 italic">{isReportAr ? 'لم تسجل صفحات بعد' : 'No pages marked yet'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {userBMemorized.map((p) => {
                          const surah = getSurahForPage(p.pageNumber);
                          return (
                            <span
                              key={p.id}
                              className="px-2 py-1 rounded-md bg-white border border-sky-200 text-sky-900 font-mono text-[11px] font-semibold"
                            >
                              {isReportAr ? `ص ${toArabicDigits(p.pageNumber)} (${surah.name})` : `p. ${p.pageNumber} (${surah.englishName})`}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Partnership Milestones & Achievements */}
            {includeMilestones && (
              <div className="space-y-3 page-break-inside-avoid">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#065F46] flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <Award className="w-4 h-4" />
                  <span>{isReportAr ? 'الأوسمة والإنجازات المشتركة' : 'Partnership Achievements & Badges'}</span>
                </h2>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-lg mb-1">🛡️</div>
                    <div className="font-bold text-amber-900">{isReportAr ? 'حراس سورة الملك' : 'Al-Mulk Guardians'}</div>
                    <div className="text-[10px] text-amber-800/80">{isReportAr ? 'تثبيت ص ٥٦٢ و ٥٦٣' : 'Pages 562 & 563'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-lg mb-1">🔥</div>
                    <div className="font-bold text-emerald-900">{isReportAr ? 'وسام الاستمرارية' : 'Consistency Badge'}</div>
                    <div className="text-[10px] text-emerald-800/80">{isReportAr ? 'التزام يومي متواصل' : 'Daily streak active'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                    <div className="text-lg mb-1">🤝</div>
                    <div className="font-bold text-sky-900">{isReportAr ? 'المدارسة التشاركية' : 'Dual Accountability'}</div>
                    <div className="text-[10px] text-sky-800/80">{isReportAr ? 'تسميع ومراجعة متبادلة' : 'Peer verifications'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Official Report Footer Signature */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">
                  {isReportAr ? 'نظام HifzTogether - منصة التحفيظ والتدبر التشاركي' : 'HifzTogether Collaborative Memorization Engine'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isReportAr ? 'نسأل الله أن يجعلنا وإياكم من أهل القرآن وخاصته' : 'May Allah accept our memorization and make us of the Quranic companions'}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                  {isReportAr ? 'تقرير موثق ✓' : 'VERIFIED REPORT ✓'}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
