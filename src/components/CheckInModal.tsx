import React, { useState } from 'react';
import { X, CheckCircle, Clock, BookOpen, Sparkles, MessageSquare } from 'lucide-react';
import { UserProfile, ProgressStatus, Language } from '../types';
import { SURAH_CATALOG } from '../lib/quranData';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { DEFAULT_USERS } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  lang: Language;
  initialPage?: number;
  onSaveCheckIn: (pageNum: number, surahNum: number, status: ProgressStatus, notes?: string) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  currentUser: rawCurrentUser,
  lang,
  initialPage = 562,
  onSaveCheckIn,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const [pageNum, setPageNum] = useState<number>(initialPage);
  const [status, setStatus] = useState<ProgressStatus>('memorized');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Approximate surah from page
  const foundSurah = SURAH_CATALOG.find((s) => pageNum >= s.startPage && pageNum <= s.endPage) || SURAH_CATALOG[66];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckIn(pageNum, foundSurah.number, status, notes.trim());
    if (status === 'memorized') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#065f46'],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-[#E2E8F0] dark:border-stone-800 shadow-xl p-6 sm:p-8 text-[#1E293B] dark:text-stone-100 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#64748B] dark:text-stone-400 hover:text-[#0F172A] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-[#065F46]">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-white">
              {t.checkInNow}
            </h3>
          </div>
          <p className="text-xs text-[#64748B] dark:text-stone-400">
            {isAr ? 'تسجيل إنجاز الحفظ والمراجعة لـ ' : 'Logging progress for '}
            <span className="font-semibold text-[#065F46] dark:text-emerald-400">{currentUser.name}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Page Number Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {t.page} (1 - 604):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="604"
                value={pageNum}
                onChange={(e) => setPageNum(Number(e.target.value))}
                className="w-28 px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-[#1E293B] dark:text-stone-100 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#065F46]"
              />
              <div className="flex-1 text-xs text-[#475569] dark:text-stone-300 bg-[#F8FAFC] dark:bg-stone-950/60 px-3 py-2.5 rounded-2xl border border-[#E2E8F0] dark:border-stone-800">
                {t.surah}: <span className="font-bold text-[#065F46] dark:text-amber-300">{foundSurah.name} ({foundSurah.englishName})</span>
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {isAr ? 'حالة الإنجاز' : 'Completion Status'}:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                  status === 'in_progress'
                    ? 'bg-sky-50 border-sky-500 text-sky-700 ring-1 ring-sky-400'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B] dark:text-stone-400 hover:border-sky-300'
                }`}
              >
                {t.inProgress}
              </button>

              <button
                type="button"
                onClick={() => setStatus('memorized')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                  status === 'memorized'
                    ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] ring-1 ring-[#059669]'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B] dark:text-stone-400 hover:border-emerald-300'
                }`}
              >
                {t.memorized} ✓
              </button>

              <button
                type="button"
                onClick={() => setStatus('reviewed')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                  status === 'reviewed'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B] dark:text-stone-400 hover:border-amber-300'
                }`}
              >
                {t.reviewed} ↺
              </button>
            </div>
            {status === 'memorized' && (
              <p className="text-[11px] text-[#065F46] dark:text-emerald-300 mt-2 bg-[#ECFDF5] dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'سيتم إرسال الصفحة للاستماع واعتماد الحفظ من شريكك القرآني.' : 'This page will be sent for your study partner to listen and approve.'}</span>
              </p>
            )}
          </div>

          {/* Notes for Partner */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1.5">
              {isAr ? 'ملاحظات وتأملات للشريك (اختياري):' : 'Partner Notes / Reflection (Optional):'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'مثال: تم إتقان أحكام التجويد للآيات ١-١٠ وجاهز للتسميع معاً غداً!' : 'e.g., Mastered verses 1-10; ready for partner testing tomorrow!'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs text-[#1E293B] dark:text-stone-200 placeholder-[#94A3B8] dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#FCD34D]" />
            <span>{isAr ? 'حفظ ومزامنة مع مركز المتابعة' : 'Save & Sync to Shared Hub'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
