import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Check, 
  KeyRound, 
  Mail, 
  BookOpen, 
  Layers, 
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Users2,
  UserCheck,
  UserX,
  HelpCircle,
  Award
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { JUZ_CATALOG } from '../lib/juzData';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: (newUser: UserProfile, partnerUser?: Partial<UserProfile>) => void;
  lang: Language;
}

const AVATAR_OPTIONS = ['🟢', '🔵', '🌟', '📖', '🌙', '🕌', '🌿', '✨', '🤖', '👑'];
const COLOR_OPTIONS = ['#059669', '#0284c7', '#7c3aed', '#d97706', '#dc2626', '#0d9488'];

type PartnerMode = 'dual' | 'agent' | 'dummy' | 'solo';

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  lang,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  // Primary User (User A) State
  const [name, setName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🟢');
  const [color, setColor] = useState<string>('#059669');
  const [targetJuz, setTargetJuz] = useState<number>(30);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(3);
  
  // Partner Setup Mode Selection
  const [partnerMode, setPartnerMode] = useState<PartnerMode>('dual');

  // Dual Account Mode State (User B)
  const [partnerName, setPartnerName] = useState<string>('Brother Tariq');
  const [partnerPin, setPartnerPin] = useState<string>('5678');
  const [partnerConfirmPin, setPartnerConfirmPin] = useState<string>('5678');
  const [partnerTargetJuz, setPartnerTargetJuz] = useState<number>(30);
  const [partnerWeeklyGoal, setPartnerWeeklyGoal] = useState<number>(3);
  const [partnerAvatar, setPartnerAvatar] = useState<string>('🔵');

  // AI Agent Companion Mode State
  const [agentName, setAgentName] = useState<string>(isAr ? 'الرفيق القرآني الذكي' : 'AI Hifz Companion');
  const [agentRole, setAgentRole] = useState<'supportive_peer' | 'tajweed_mentor' | 'hifz_coach'>('supportive_peer');
  const [agentAutoApprove, setAgentAutoApprove] = useState<boolean>(true);

  // Dummy Partner Mode State
  const [dummyName, setDummyName] = useState<string>(isAr ? 'شريك قيد الانتظار' : 'Pending Partner');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال اسمك أو كنيتك' : 'Please enter your name');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setErrorMessage(isAr ? 'يجب أن يتكون رمزك السري من ٤ أرقام' : 'Your PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage(isAr ? 'تأكيد الرمز السري غير متطابق' : 'PIN confirmation does not match');
      return;
    }

    // Validation for Dual Account Mode
    if (partnerMode === 'dual') {
      if (!partnerName.trim()) {
        setErrorMessage(isAr ? 'يرجى إدخال اسم الشريك الثاني' : 'Please enter your partner’s name');
        return;
      }
      if (partnerPin.length !== 4 || !/^\d{4}$/.test(partnerPin)) {
        setErrorMessage(isAr ? 'يجب أن يتكون رمز الشريك السري من ٤ أرقام' : 'Partner PIN must be exactly 4 digits');
        return;
      }
      if (partnerPin !== partnerConfirmPin) {
        setErrorMessage(isAr ? 'تأكيد الرمز السري للشريك غير متطابق' : 'Partner PIN confirmation does not match');
        return;
      }
    }

    const selectedJuzObj = JUZ_CATALOG.find((j) => j.number === targetJuz) || JUZ_CATALOG[29];

    // Primary Registered User
    const newUserA: UserProfile = {
      id: 'user_a',
      name: name.trim(),
      pin: pin,
      email: email.trim() || undefined,
      avatar,
      color,
      weeklyGoalPages: weeklyGoal,
      currentSurah: selectedJuzObj.startSurahNumber,
      currentPage: selectedJuzObj.startPage,
      targetJuz: targetJuz,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      totalMemorizedPages: 0,
      totalReviewedPages: 0,
      isRegistered: true,
      userType: 'real_user',
    };

    let partnerProfile: Partial<UserProfile> | undefined = undefined;

    if (partnerMode === 'dual') {
      const partnerJuzObj = JUZ_CATALOG.find((j) => j.number === partnerTargetJuz) || JUZ_CATALOG[29];
      partnerProfile = {
        id: 'user_b',
        name: partnerName.trim(),
        pin: partnerPin,
        avatar: partnerAvatar,
        color: '#0284c7',
        weeklyGoalPages: partnerWeeklyGoal,
        currentSurah: partnerJuzObj.startSurahNumber,
        currentPage: partnerJuzObj.startPage,
        targetJuz: partnerTargetJuz,
        streakDays: 1,
        lastActiveDate: new Date().toISOString(),
        totalMemorizedPages: 0,
        totalReviewedPages: 0,
        isRegistered: true,
        userType: 'real_user',
      };
    } else if (partnerMode === 'agent') {
      partnerProfile = {
        id: 'user_b',
        name: agentName.trim() || (isAr ? 'الرفيق القرآني الذكي' : 'AI Hifz Companion'),
        pin: '0000',
        avatar: '🤖',
        color: '#7c3aed',
        weeklyGoalPages: weeklyGoal,
        currentSurah: selectedJuzObj.startSurahNumber,
        currentPage: selectedJuzObj.startPage,
        targetJuz: targetJuz,
        streakDays: 7,
        lastActiveDate: new Date().toISOString(),
        totalMemorizedPages: 4,
        totalReviewedPages: 8,
        isRegistered: true,
        userType: 'ai_agent',
        agentRole: agentRole,
        agentAutoApprove: agentAutoApprove,
      };
    } else if (partnerMode === 'dummy') {
      partnerProfile = {
        id: 'user_b',
        name: dummyName.trim() || (isAr ? 'شريك قيد الانتظار' : 'Pending Partner'),
        pin: '5678',
        avatar: '👤',
        color: '#94a3b8',
        weeklyGoalPages: 3,
        currentSurah: selectedJuzObj.startSurahNumber,
        currentPage: selectedJuzObj.startPage,
        targetJuz: targetJuz,
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        totalMemorizedPages: 0,
        totalReviewedPages: 0,
        isRegistered: false,
        userType: 'dummy_user',
      };
    } else if (partnerMode === 'solo') {
      partnerProfile = {
        id: 'user_b',
        name: isAr ? 'دعوة شريك' : 'Invite Partner',
        pin: '5678',
        avatar: '➕',
        color: '#94a3b8',
        weeklyGoalPages: 3,
        currentSurah: 1,
        currentPage: 1,
        targetJuz: targetJuz,
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        totalMemorizedPages: 0,
        totalReviewedPages: 0,
        isRegistered: false,
        userType: 'dummy_user',
      };
    }

    setSuccessMessage(partnerMode === 'dual' ? t.partnerCreatedSuccess : t.accountCreatedSuccess);
    
    setTimeout(() => {
      if (onRegisterSuccess) {
        onRegisterSuccess(newUserA, partnerProfile);
      }
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-stone-800 text-[#64748B] dark:text-stone-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300 flex items-center justify-center shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-stone-100">
              {t.registerTitle}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-stone-400">
              {t.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Error / Success feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: User A (Your Profile) */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/60 border border-[#E2E8F0] dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {isAr ? 'بيانات حسابك الأساسي (User A)' : 'Your Primary Profile (User A)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                {t.registeredStatus}
              </span>
            </div>

            {/* Name & Avatar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.yourName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'مثال: أبو عبد الله / زيد' : 'e.g. Brother Zayd'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 text-[#0F172A] dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#065F46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.chooseAvatar}
                </label>
                <div className="flex flex-wrap gap-1 bg-white dark:bg-stone-900 p-1.5 rounded-xl border border-[#E2E8F0] dark:border-stone-800">
                  {AVATAR_OPTIONS.slice(0, 5).map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        avatar === av ? 'bg-emerald-200 dark:bg-emerald-800 scale-110 shadow-sm' : 'hover:bg-black/5'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PIN & Confirm PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.yourPin} (4 {isAr ? 'أرقام' : 'digits'}) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 text-[#0F172A] dark:text-stone-100 text-xs sm:text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#065F46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.confirmPin} *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 text-[#0F172A] dark:text-stone-100 text-xs sm:text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#065F46]"
                />
              </div>
            </div>

            {/* Target Juz & Weekly Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.startingJuz} *
                </label>
                <select
                  value={targetJuz}
                  onChange={(e) => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 text-xs text-[#0F172A] dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#065F46]"
                >
                  {JUZ_CATALOG.map((j) => (
                    <option key={j.number} value={j.number}>
                      {isAr ? j.nameAr : j.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-stone-300 mb-1">
                  {t.weeklyCommitment} ({weeklyGoal} {t.pagesPerWeek})
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[2, 3, 4].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWeeklyGoal(g)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        weeklyGoal === g
                          ? 'bg-[#065F46] text-white border-[#065F46]'
                          : 'bg-white dark:bg-stone-900 text-[#64748B] dark:text-stone-400 border-[#E2E8F0] dark:border-stone-800'
                      }`}
                    >
                      {isAr ? `${toArabicDigits(g)} صفحة` : `${g} pgs`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Partner Setup Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E293B] dark:text-stone-200">
                {t.partnerSetupMode}
              </label>
              <span className="text-[11px] text-[#64748B] dark:text-stone-400">
                {isAr ? 'اختر كيف تريد تهيئة الشريك الثاني' : 'Select partner configuration'}
              </span>
            </div>

            {/* 4 Partner Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: Dual Account Creation */}
              <button
                type="button"
                onClick={() => setPartnerMode('dual')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  partnerMode === 'dual'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-900 dark:text-sky-100 ring-2 ring-sky-600/30 shadow-sm'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-400 hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Users2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold">{t.partnerModeDual}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-stone-400 leading-tight mt-0.5">
                    {t.partnerModeDualDesc}
                  </div>
                </div>
              </button>

              {/* Option 2: AI Study Agent Companion */}
              <button
                type="button"
                onClick={() => setPartnerMode('agent')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  partnerMode === 'agent'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 text-purple-900 dark:text-purple-100 ring-2 ring-purple-600/30 shadow-sm'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-400 hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{t.partnerModeAgent}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-extrabold">AI</span>
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-stone-400 leading-tight mt-0.5">
                    {t.partnerModeAgentDesc}
                  </div>
                </div>
              </button>

              {/* Option 3: Dummy Placeholder Partner */}
              <button
                type="button"
                onClick={() => setPartnerMode('dummy')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  partnerMode === 'dummy'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 text-amber-900 dark:text-amber-100 ring-2 ring-amber-600/30 shadow-sm'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-400 hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold">{t.partnerModeDummy}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-stone-400 leading-tight mt-0.5">
                    {t.partnerModeDummyDesc}
                  </div>
                </div>
              </button>

              {/* Option 4: Solo Account */}
              <button
                type="button"
                onClick={() => setPartnerMode('solo')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  partnerMode === 'solo'
                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-600 text-stone-900 dark:text-stone-100 ring-2 ring-stone-600/30 shadow-sm'
                    : 'bg-[#F8FAFC] dark:bg-stone-950/40 border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-400 hover:bg-[#F1F5F9]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-stone-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserX className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold">{t.partnerModeSolo}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-stone-400 leading-tight mt-0.5">
                    {t.partnerModeSoloDesc}
                  </div>
                </div>
              </button>

            </div>

            {/* Dynamic Configuration Panel for Chosen Mode */}
            {partnerMode === 'dual' && (
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200">
                  <Users2 className="w-4 h-4 text-sky-600" />
                  <span>{isAr ? 'إعداد حساب الشريك الثاني (User B)' : 'Configure Partner Profile (User B)'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                      {t.partnerName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder={isAr ? 'مثال: الأخ طارق' : 'e.g. Brother Tariq'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-sky-200 dark:border-sky-800 text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                      {t.partnerPin} (4 {isAr ? 'أرقام' : 'digits'}) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={partnerPin}
                      onChange={(e) => setPartnerPin(e.target.value)}
                      placeholder="5678"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-sky-200 dark:border-sky-800 text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                      {t.confirmPin} (الشريك) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={partnerConfirmPin}
                      onChange={(e) => setPartnerConfirmPin(e.target.value)}
                      placeholder="5678"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-sky-200 dark:border-sky-800 text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sky-900 dark:text-sky-200 mb-1">
                      {t.startingJuz} (الشريك)
                    </label>
                    <select
                      value={partnerTargetJuz}
                      onChange={(e) => setPartnerTargetJuz(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-sky-200 dark:border-sky-800 text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
                    >
                      {JUZ_CATALOG.map((j) => (
                        <option key={j.number} value={j.number}>
                          {isAr ? j.nameAr : j.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {partnerMode === 'agent' && (
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'تخصيص رفيق التحفيظ الذكي (AI Companion)' : 'Customize AI Study Agent'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      {isAr ? 'اسم الرفيق الذكي' : 'Companion Name'}
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      {t.agentRoleLabel}
                    </label>
                    <select
                      value={agentRole}
                      onChange={(e) => setAgentRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    >
                      <option value="supportive_peer">{t.agentRolePeer}</option>
                      <option value="tajweed_mentor">{t.agentRoleMentor}</option>
                      <option value="hifz_coach">{t.agentRoleCoach}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agentAutoApprove"
                    checked={agentAutoApprove}
                    onChange={(e) => setAgentAutoApprove(e.target.checked)}
                    className="accent-purple-600 w-4 h-4 rounded"
                  />
                  <label htmlFor="agentAutoApprove" className="text-xs text-purple-950 dark:text-purple-200 font-medium cursor-pointer">
                    {isAr ? 'السماح للرفيق الذكي بمراجعة التسميع والمصادقة التلقائية عند الطلب' : 'Allow AI Companion to review recitation & verify memorized pages upon request'}
                  </label>
                </div>
              </div>
            )}

            {partnerMode === 'dummy' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'شريك افتراضي مؤقت' : 'Temporary Placeholder Partner'}</span>
                </div>
                <input
                  type="text"
                  value={dummyName}
                  onChange={(e) => setDummyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 text-xs focus:outline-none"
                />
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {isAr ? 'يمكنك استبدال هذا الحساب في أي وقت عندما ينضم شريكك الفعلي ويسجل رمزه السري.' : 'You can replace this placeholder anytime once your real partner registers their account.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300 font-semibold text-xs transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.createAccountBtn}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
