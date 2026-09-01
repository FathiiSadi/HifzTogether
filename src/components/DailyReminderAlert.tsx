import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Sparkles, 
  Volume2, 
  X, 
  Check, 
  Calendar,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';

interface DailyReminderAlertProps {
  currentUser: UserProfile;
  otherUser?: UserProfile;
  lang: Language;
  onOpenCheckIn: () => void;
  onUpdateReminderSettings?: (newTime: string, enabled: boolean) => void;
}

export const DailyReminderAlert: React.FC<DailyReminderAlertProps> = ({
  currentUser,
  otherUser,
  lang,
  onOpenCheckIn,
  onUpdateReminderSettings,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';
  const partnerName = otherUser?.name || (isAr ? 'شريكك' : 'Your partner');

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderTimeInput, setReminderTimeInput] = useState(currentUser.dailyReminderTime || '19:00');
  const [reminderEnabled, setReminderEnabled] = useState(currentUser.reminderEnabled ?? true);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showTestToast, setShowTestToast] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser.dailyReminderTime) {
      setReminderTimeInput(currentUser.dailyReminderTime);
    }
    if (currentUser.reminderEnabled !== undefined) {
      setReminderEnabled(currentUser.reminderEnabled);
    }
  }, [currentUser.dailyReminderTime, currentUser.reminderEnabled]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Chime generator
  const playAlertChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Note 1 (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);

      // Note 2 (G#5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 1.2);

      // Note 3 (B5)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(987.77, ctx.currentTime + 0.35);
      gain3.gain.setValueAtTime(0, ctx.currentTime + 0.35);
      gain3.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ctx.currentTime + 0.35);
      osc3.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Determine if checked in today
  const lastActive = currentUser.lastActiveDate ? new Date(currentUser.lastActiveDate) : null;
  const isToday = lastActive 
    ? lastActive.getFullYear() === currentTime.getFullYear() &&
      lastActive.getMonth() === currentTime.getMonth() &&
      lastActive.getDate() === currentTime.getDate()
    : false;

  // Determine if reminder time has passed today
  const targetReminderTime = currentUser.dailyReminderTime || '19:00';
  const [targetHour, targetMinute] = targetReminderTime.split(':').map(Number);
  
  const targetDate = new Date(currentTime);
  targetDate.setHours(targetHour || 19, targetMinute || 0, 0, 0);

  const isPastReminderTime = currentTime.getTime() >= targetDate.getTime();
  const isSnoozed = snoozeUntil ? currentTime.getTime() < snoozeUntil : false;

  // Check if we should trigger browser notification
  useEffect(() => {
    if (reminderEnabled && isPastReminderTime && !isToday && !isSnoozed) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notifKey = `hifz_notif_${currentTime.toDateString()}`;
        if (!sessionStorage.getItem(notifKey)) {
          sessionStorage.setItem(notifKey, 'sent');
          try {
            new Notification(
              isAr ? 'تنبيه ورد القرآن اليومي 📖' : 'Daily Quran Hifz Reminder 📖',
              {
                body: isAr 
                  ? `حان وقت وردك المحدد (${targetReminderTime}). شريكك ${partnerName} بانتظار إنجازك اليوم!`
                  : `It's past your set reminder time (${targetReminderTime}). Keep up the momentum with ${partnerName}!`,
                icon: '/favicon.ico',
              }
            );
            playAlertChime();
          } catch (e) {
            console.warn('Notification error:', e);
          }
        }
      }
    }
  }, [currentTime, reminderEnabled, isPastReminderTime, isToday, isSnoozed, targetReminderTime, partnerName, isAr]);

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification(
            isAr ? 'تم تفعيل التنبيهات بنجاح 🌟' : 'Hifz Notifications Enabled 🌟',
            {
              body: isAr 
                ? `سنقوم بتذكيرك يومياً في تمام الساعة ${targetReminderTime} بورد الحفظ والتثبيت.`
                : `We will nudge you daily at ${targetReminderTime} for your Quran session.`,
            }
          );
          playAlertChime();
        }
      } catch (e) {
        console.warn('Notification request error:', e);
      }
    }
  };

  const handleSnooze = () => {
    const oneHourLater = Date.now() + 60 * 60 * 1000;
    setSnoozeUntil(oneHourLater);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateReminderSettings) {
      onUpdateReminderSettings(reminderTimeInput, reminderEnabled);
    }
    setIsModalOpen(false);
  };

  const handleTestAlert = () => {
    playAlertChime();
    setShowTestToast(true);
    setTimeout(() => setShowTestToast(false), 4000);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(
          isAr ? 'تجربة تنبيه ورد الحفظ 🔔' : 'Test Hifz Session Alert 🔔',
          {
            body: isAr 
              ? `هكذا سيصلك التنبيه اليومي في الساعة ${reminderTimeInput} لتسجيل وردك مع شريكك.`
              : `This is how your daily reminder will nudge you at ${reminderTimeInput} to stay consistent with your partner.`,
          }
        );
      } catch (e) {
        console.warn('Test notification error:', e);
      }
    }
  };

  const presets = [
    { labelAr: 'بعد صلاة الفجر', labelEn: 'After Fajr', time: '06:00' },
    { labelAr: 'بعد صلاة العصر', labelEn: 'After Asr', time: '16:30' },
    { labelAr: 'بعد صلاة المغرب', labelEn: 'After Maghrib', time: '18:45' },
    { labelAr: 'بعد صلاة العشاء', labelEn: 'After Isha', time: '20:30' },
    { labelAr: 'قبل النوم', labelEn: 'Before Sleep', time: '22:00' },
  ];

  // Helper formatting for 12h display
  const format12h = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
    const h12 = h % 12 || 12;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return isAr ? `${toArabicDigits(h12)}:${toArabicDigits(mStr)} ${period}` : `${h12}:${mStr} ${period}`;
  };

  return (
    <>
      {/* Test Toast Popup */}
      {showTestToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-amber-500 text-slate-950 shadow-xl border border-amber-400 font-bold text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>
              {isAr ? 'تنبيه تجريبي: حان موعد ورد الحفظ اليومي!' : 'Test Nudge: Time for your daily Hifz session!'}
            </span>
          </div>
        </div>
      )}

      {/* Case 1: Checked In Today - Celebratory Status */}
      {isToday ? (
        <div className="rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-[#059669] dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#065F46] dark:text-emerald-200">
                  {t.todayDone}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] dark:bg-emerald-900 text-[#059669] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  <Flame className="w-3 h-3 text-[#D97706]" />
                  <span>{currentUser.streakDays} {t.days}</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-stone-400 mt-0.5">
                {isAr 
                  ? `تم توثيق إنجاز اليوم بنجاح • وقت التذكير القادم: ${format12h(targetReminderTime)}`
                  : `Today's check-in verified • Next scheduled reminder: ${format12h(targetReminderTime)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-850 hover:bg-[#F1F5F9] dark:hover:bg-stone-800 text-[#334155] dark:text-stone-300 text-xs font-semibold border border-[#E2E8F0] dark:border-stone-700 shadow-sm transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{t.changeReminderTime}</span>
            </button>
          </div>
        </div>
      ) : isPastReminderTime && !isSnoozed && reminderEnabled ? (
        /* Case 2: Past Reminder Time & Not Checked In - Active Nudge Alert */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/50 dark:via-stone-900 dark:to-amber-950/50 border-2 border-amber-400/80 dark:border-amber-500/60 p-4 sm:p-5 shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <BellRing className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    {isAr ? 'تنبيه الورد اليومي' : 'Daily Action Needed'}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                    {t.reminderTimePassed} ({format12h(targetReminderTime)})
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed max-w-xl">
                  {isAr 
                    ? `لم تقم بتسجيل ورد الحفظ أو المراجعة الخاص بك اليوم! شريكك ${partnerName} يواصل التزامه، لا تفوّت حلقة التسميع اليومية.`
                    : `You haven't checked in your Quran session today. Brother ${partnerName} is keeping up the pace! Complete your revision now.`}
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                id="btn-alert-checkin"
                onClick={onOpenCheckIn}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-xs sm:text-sm shadow-md transition-all transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{t.logTodayProgress}</span>
              </button>

              <button
                onClick={handleSnooze}
                className="px-3 py-2.5 rounded-xl bg-white dark:bg-stone-850 hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-900 dark:text-amber-200 font-semibold text-xs border border-amber-200 dark:border-stone-700 transition-all"
              >
                {t.snooze1Hour}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2.5 rounded-xl bg-white dark:bg-stone-850 hover:bg-[#F1F5F9] dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-700"
                title={t.setReminderTime}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Case 3: Reminder scheduled for later today */
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F8FAFC] dark:bg-stone-850 border border-[#E2E8F0] dark:border-stone-750 text-[#059669] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0F172A] dark:text-stone-100">
                  {isAr ? 'موعد التذكير بالورد اليومي' : 'Scheduled Daily Session'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ECFDF5] dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {format12h(targetReminderTime)}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-stone-400 mt-0.5">
                {isAr 
                  ? 'سيصلك تنبيه لطيف عند حلول الوقت لتسجيل ما حفظته أو راجعته اليوم.'
                  : 'You will receive an active alert at this time to log today’s pages.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onOpenCheckIn}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.checkInNow}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-xl bg-[#F1F5F9] dark:bg-stone-850 hover:bg-[#E2E8F0] dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-750 transition-all"
              title={t.setReminderTime}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 shadow-2xl p-6 sm:p-7 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 left-5 rtl:left-auto rtl:right-5 p-2 rounded-full text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-[#F1F5F9] dark:hover:bg-stone-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-stone-100">
                  {t.setReminderTime}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-stone-400">
                  {isAr 
                    ? 'حدد موعداً يومياً يناسبك لتنبيهك وإبقائك على وتيرة منتظمة في الحفظ.'
                    : 'Configure your daily Hifz session notification and alert time.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Daily Nudge Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-stone-200">
                    {reminderEnabled ? t.reminderActive : t.reminderDisabled}
                  </span>
                  <p className="text-[11px] text-[#64748B] dark:text-stone-400">
                    {isAr ? 'إظهار شريط التنبيه وإرسال الإشعارات عند حلول الموعد' : 'Show dashboard alert and trigger notifications when time arrives'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#065F46]"></div>
                </label>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300">
                  {t.reminderTime} (24h):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={reminderTimeInput}
                    onChange={(e) => setReminderTimeInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-lg font-bold text-[#0F172A] dark:text-stone-100 focus:ring-2 focus:ring-[#065F46] focus:outline-none"
                  />
                  <span className="text-xs font-semibold px-3 py-3 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {format12h(reminderTimeInput)}
                  </span>
                </div>
              </div>

              {/* Islamic Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400">
                  {isAr ? 'أوقات مقترحة بعد الصلوات الخمس:' : 'Suggested Prayer-Time Slots:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.time}
                      type="button"
                      onClick={() => setReminderTimeInput(p.time)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-start transition-all flex flex-col ${
                        reminderTimeInput === p.time
                          ? 'bg-[#065F46] text-white border-[#065F46] shadow-sm'
                          : 'bg-[#F8FAFC] dark:bg-stone-850 text-[#334155] dark:text-stone-300 hover:bg-[#F1F5F9] dark:hover:bg-stone-800 border-[#E2E8F0] dark:border-stone-750'
                      }`}
                    >
                      <span className="font-bold">{isAr ? p.labelAr : p.labelEn}</span>
                      <span className="text-[11px] opacity-80">{p.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browser Notification Permission Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-950 dark:text-amber-200">
                      {notificationPermission === 'granted' ? t.browserNotifEnabled : t.enableBrowserNotif}
                    </div>
                    <div className="text-[11px] text-amber-800/80 dark:text-amber-300/70">
                      {isAr ? 'لتلقي تنبيه نافذ على جهازك مع صوت هادئ' : 'Receive audio chime & system popups on your device'}
                    </div>
                  </div>
                </div>

                {notificationPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestNotification}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                  >
                    {isAr ? 'تفعيل' : 'Allow'}
                  </button>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-[#059669] dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 me-1" />
                    {isAr ? 'مفعلة' : 'Active'}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-stone-800 gap-3">
                <button
                  type="button"
                  onClick={handleTestAlert}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#334155] dark:text-stone-200 text-xs font-semibold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.testAlert}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-transparent hover:bg-[#F1F5F9] dark:hover:bg-stone-800 text-[#64748B] dark:text-stone-400 text-xs font-semibold transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-md transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};
