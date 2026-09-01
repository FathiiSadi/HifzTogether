import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Sparkles, 
  Headphones, 
  Send, 
  CheckCircle2, 
  Clock, 
  X, 
  Heart, 
  BookOpen, 
  ChevronRight, 
  Smile, 
  Flame, 
  ShieldCheck 
} from 'lucide-react';
import { UserProfile, Language, ActivityItem, SharedReflectionNote, PageProgressRecord } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { PartnerPresenceBadge, isUserOnlineAndActive } from './PartnerPresenceBadge';

interface PartnerMessageBannerProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  lang: Language;
  activities: ActivityItem[];
  reflectionNotes: SharedReflectionNote[];
  pageProgress: Record<string, PageProgressRecord>;
  onSendEncouragement: (message: string) => void;
  onNavigateToReader: (pageNum: number) => void;
  onApproveMemorization?: (pageKey: string, comment?: string) => void;
}

export const PartnerMessageBanner: React.FC<PartnerMessageBannerProps> = ({
  currentUser,
  otherUser,
  lang,
  activities,
  reflectionNotes,
  pageProgress,
  onSendEncouragement,
  onNavigateToReader,
  onApproveMemorization,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  // Find latest message or item from the partner
  const latestPartnerActivity = activities.find(
    (a) => a.userId === otherUser.id && (a.type === 'encouragement' || a.type === 'check_in' || a.type === 'reflection')
  );

  const latestPartnerReflection = reflectionNotes
    .filter((n) => n.userId === otherUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  // Find if partner has pending memorization waiting for review
  const pendingPartnerPageKey = Object.keys(pageProgress).find((key) => {
    const p = pageProgress[key];
    return p && p.userId === otherUser.id && p.status === 'pending_approval';
  });
  const pendingPartnerPage = pendingPartnerPageKey ? pageProgress[pendingPartnerPageKey] : null;

  if (isDismissed) return null;

  // Pre-prepared quick replies
  const quickReplies = isAr 
    ? [
        'بارك الله فيك وتقبل منك! 🌿',
        'ما شاء الله، واصل ثبتك الله! ✨',
        'سأراجع معك الصفحة قريباً إن شاء الله 📖',
        'جزاك الله خيراً يا أخي 🤲'
      ]
    : [
        'Barakallahu feek! Keep going! 🌿',
        'Masha’Allah, may Allah bless your Hifz! ✨',
        'I will review this page with you shortly 📖',
        'Jazakallahu Khairan brother 🤲'
      ];

  const handleSendReply = (msgToSend?: string) => {
    const text = (msgToSend || replyText).trim();
    if (!text) return;
    onSendEncouragement(text);
    setReplyText('');
    setIsReplying(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  return (
    <div 
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-[#064E3B] to-[#043d2e] dark:from-emerald-950 dark:via-stone-900 dark:to-stone-900 text-white p-5 sm:p-6 shadow-md border border-emerald-700/50 dark:border-stone-800 transition-all mb-6"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Decorative ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Partner Avatar with Real-time Presence Badge */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner font-bold text-emerald-200">
              {otherUser.avatar || '🔵'}
            </div>
            <div className="absolute -bottom-1 -end-1">
              <PartnerPresenceBadge
                user={otherUser}
                isPartner={true}
                lang={lang}
                onNavigateToPage={onNavigateToReader}
                size="sm"
                showDetailText={false}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAr ? `رسالة وتحديث من الشريك: ${otherUser.name}` : `Message & Update from Partner: ${otherUser.name}`}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/20 text-emerald-100">
                {isUserOnlineAndActive(otherUser)
                  ? (isAr ? `يتلو الآن ص ${toArabicDigits(otherUser.currentPage)}` : `Reading Page ${otherUser.currentPage}`)
                  : (isAr ? `آخر صفحة: ص ${toArabicDigits(otherUser.currentPage)}` : `Last Page: ${otherUser.currentPage}`)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              {pendingPartnerPage
                ? (isAr ? `طلب تسميع واعتماد حفظ جديد من ${otherUser.name}` : `Memorization Review Request from ${otherUser.name}`)
                : latestPartnerActivity?.message 
                  ? latestPartnerActivity.message 
                  : (isAr ? `شريكك ${otherUser.name} مستمر في الحفظ والتثبيت معاً!` : `Your partner ${otherUser.name} is reading and studying with you!`)}
            </h2>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors"
          title={isAr ? 'إخفاء الإشعار' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body: If there is a pending memorization request, display audio note / page details */}
      {pendingPartnerPage ? (
        <div className="bg-white/10 dark:bg-stone-950/60 backdrop-blur-sm rounded-2xl p-4 border border-white/15 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>{isAr ? `بانتظار استماعك واعتمادك للصفحة ${toArabicDigits(pendingPartnerPage.pageNumber)} (${pendingPartnerPage.surahName})` : `Awaiting your review for Page ${pendingPartnerPage.pageNumber} (${pendingPartnerPage.surahName})`}</span>
              </div>
              {pendingPartnerPage.audioNote && (
                <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAr ? 'سجّل الشريك تلاوته الصوتية لتسميعها' : 'Voice recitation recording attached'}</span>
                </p>
              )}
              {pendingPartnerPage.notes && (
                <p className="text-xs text-emerald-100 italic bg-white/5 p-2 rounded-xl border border-white/10 mt-1">
                  "{pendingPartnerPage.notes}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigateToReader(pendingPartnerPage.pageNumber)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                <Headphones className="w-4 h-4" />
                <span>{isAr ? 'استمع وافحص التسميع' : 'Listen & Check Recitation'}</span>
              </button>
              {onApproveMemorization && pendingPartnerPageKey && (
                <button
                  onClick={() => onApproveMemorization(pendingPartnerPageKey, isAr ? 'تم الاستماع والاعتماد، ما شاء الله' : 'Recitation verified & approved')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'اعتماد الحفظ مباشرة' : 'Approve Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : latestPartnerReflection ? (
        <div className="bg-white/10 dark:bg-stone-950/60 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 mb-3 text-xs text-emerald-100 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-white">{latestPartnerReflection.surahName} (ص {isAr ? toArabicDigits(latestPartnerReflection.pageNumber) : latestPartnerReflection.pageNumber}): </span>
            <span className="italic">"{latestPartnerReflection.reflectionText}"</span>
          </div>
        </div>
      ) : null}

      {/* Quick Reply & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          {!isReplying ? (
            <>
              <button
                onClick={() => setIsReplying(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all border border-white/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'أرسل تشجيعاً أو رداً' : 'Send Quick Reply'}</span>
              </button>

              {/* Quick 1-click pills */}
              <div className="hidden md:flex items-center gap-1.5">
                {quickReplies.slice(0, 2).map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendReply(qr)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-[11px] font-medium border border-white/15 transition-all"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAr ? `اكتب رسالة تشجيعية لـ ${otherUser.name}...` : `Write a message to ${otherUser.name}...`}
                className="px-3 py-1.5 rounded-xl bg-white/20 text-white placeholder-emerald-200 text-xs border border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-300 w-64"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply();
                }}
                autoFocus
              />
              <button
                onClick={() => handleSendReply()}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال' : 'Send'}</span>
              </button>
              <button
                onClick={() => setIsReplying(false)}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>

        {/* Partner Page Navigation Link */}
        <button
          onClick={() => onNavigateToReader(otherUser.currentPage)}
          className="text-xs text-emerald-200 hover:text-white flex items-center gap-1 font-semibold group"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          <span>{isAr ? `انتقل إلى صفحة ${otherUser.name} (ص ${toArabicDigits(otherUser.currentPage)})` : `Jump to ${otherUser.name}'s page (${otherUser.currentPage})`}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </button>
      </div>

      {sentSuccess && (
        <div className="mt-3 p-2 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-xs text-emerald-100 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{isAr ? 'تم إرسال رسالتك التشجيعية للشريك بنجاح! 🌿' : 'Encouragement sent to partner successfully! 🌿'}</span>
        </div>
      )}
    </div>
  );
};
