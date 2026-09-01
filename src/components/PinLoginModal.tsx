import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  User, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  UserPlus, 
  Bot, 
  UserCheck, 
  CheckCircle2 
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { DEFAULT_USERS } from '../lib/firebase';

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Record<'user_a' | 'user_b', UserProfile>;
  activeUserId: 'user_a' | 'user_b';
  lang: Language;
  onLoginSuccess: (userId: 'user_a' | 'user_b') => void;
  onUpdateProfile: (userId: 'user_a' | 'user_b', updates: Partial<UserProfile>) => void;
  onOpenRegisterModal?: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUserId,
  lang,
  onLoginSuccess,
  onUpdateProfile,
  onOpenRegisterModal,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const safeUsers = {
    user_a: users?.user_a || DEFAULT_USERS.user_a,
    user_b: users?.user_b || DEFAULT_USERS.user_b,
  };

  const currentUser = safeUsers[activeUserId] || safeUsers.user_a;
  const isCurrentRegistered = currentUser.isRegistered ?? false;

  const [selectedUser, setSelectedUser] = useState<'user_a' | 'user_b'>(
    activeUserId === 'user_a' ? 'user_b' : 'user_a'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(safeUsers[selectedUser]?.name || '');
  const [goalInput, setGoalInput] = useState<number>(safeUsers[selectedUser]?.weeklyGoalPages || 3);

  useEffect(() => {
    if (isOpen) {
      const otherId = activeUserId === 'user_a' ? 'user_b' : 'user_a';
      setSelectedUser(otherId);
      const current = safeUsers[otherId] || safeUsers.user_a;
      setNameInput(current.name);
      setGoalInput(current.weeklyGoalPages);
      setPinInput('');
      setErrorMsg('');
      setIsEditing(false);
    }
  }, [isOpen, activeUserId]);

  if (!isOpen) return null;

  const targetUser = safeUsers[selectedUser] || safeUsers.user_a;
  const isTargetAgent = targetUser.userType === 'ai_agent';
  const isTargetDummy = targetUser.userType === 'dummy_user';
  const isTargetReal = !isTargetAgent && !isTargetDummy;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();

    // Condition 1: Current active user MUST be registered to switch
    if (!isCurrentRegistered) {
      setErrorMsg(t.mustRegisterToSwitch);
      return;
    }

    // Condition 2: If switching to AI agent or dummy, allow switch
    if (isTargetAgent || isTargetDummy) {
      onLoginSuccess(selectedUser);
      setErrorMsg('');
      setPinInput('');
      onClose();
      return;
    }

    // Condition 3: Real registered user requires 4-digit PIN
    if (pinInput === targetUser.pin) {
      onLoginSuccess(selectedUser);
      setErrorMsg('');
      setPinInput('');
      onClose();
    } else {
      setErrorMsg(t.invalidPin);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(selectedUser, {
      name: nameInput.trim() || targetUser.name,
      weeklyGoalPages: goalInput,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-[#E2E8F0] dark:border-stone-800 shadow-2xl p-6 sm:p-8 text-[#1E293B] dark:text-stone-100 space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#64748B] dark:text-stone-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/80 border border-[#FDE68A] dark:border-amber-800 flex items-center justify-center text-[#D97706] dark:text-amber-300">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-white">
              {t.accountProfile}
            </h3>
          </div>
          <p className="text-xs text-[#64748B] dark:text-stone-400">
            {isAr ? 'التحقق من الرمز السري والانتقال الآمن بين حسابات الحفظ.' : 'Secure PIN verification for partner profile switching.'}
          </p>
        </div>

        {/* Unregistered Active User Warning Notice */}
        {!isCurrentRegistered && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                {t.mustRegisterToSwitch}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRegisterModal) onOpenRegisterModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.registerNowPrompt}</span>
              </button>
            </div>
          </div>
        )}

        {/* User Selection Toggle */}
        <div className="grid grid-cols-2 gap-3">
          {/* User A Card */}
          <button
            type="button"
            onClick={() => {
              setSelectedUser('user_a');
              setNameInput(safeUsers.user_a.name);
              setGoalInput(safeUsers.user_a.weeklyGoalPages);
              setErrorMsg('');
            }}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
              selectedUser === 'user_a'
                ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 border-[#059669] text-[#065F46] dark:text-emerald-300 ring-2 ring-[#059669]/30'
                : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#065F46] flex items-center justify-center font-bold text-white text-xs shrink-0">
              {safeUsers.user_a.avatar || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate text-[#1E293B] dark:text-stone-100">{safeUsers.user_a.name}</div>
              <div className="text-[10px] text-[#64748B] dark:text-stone-400">
                {safeUsers.user_a.isRegistered ? t.registeredStatus : t.unregisteredStatus}
              </div>
            </div>
          </button>

          {/* User B Card */}
          <button
            type="button"
            onClick={() => {
              setSelectedUser('user_b');
              setNameInput(safeUsers.user_b.name);
              setGoalInput(safeUsers.user_b.weeklyGoalPages);
              setErrorMsg('');
            }}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
              selectedUser === 'user_b'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-800 dark:text-sky-300 ring-2 ring-sky-600/30'
                : 'bg-[#F8FAFC] dark:bg-stone-950/60 border-[#E2E8F0] dark:border-stone-800 text-[#64748B]'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
              style={{ backgroundColor: safeUsers.user_b.color || '#0284c7' }}
            >
              {safeUsers.user_b.avatar || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate text-[#1E293B] dark:text-stone-100">{safeUsers.user_b.name}</div>
              <div className="text-[10px] text-[#64748B] dark:text-stone-400">
                {safeUsers.user_b.userType === 'ai_agent' 
                  ? t.aiAgentBadge 
                  : (safeUsers.user_b.isRegistered ? t.registeredStatus : t.dummyPartnerBadge)}
              </div>
            </div>
          </button>
        </div>

        {!isEditing ? (
          /* Verification Form */
          <form onSubmit={handleVerifyPin} className="space-y-4">
            
            {/* If target is AI Agent or Dummy */}
            {isTargetAgent && (
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-200">
                <Bot className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">{safeUsers.user_b.name} ({t.aiAgentBadge})</div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-300">
                    {isAr ? 'الرفيق الذكي جاهز للاختبار والتسميع والتفاعل الفوري.' : 'AI Study Companion is ready for interactive review and check-ins.'}
                  </div>
                </div>
              </div>
            )}

            {isTargetDummy && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{isAr ? 'حساب تجريبي في انتظار تسجيل شريكك' : 'Pending partner profile'}</span>
                </div>
                {onOpenRegisterModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegisterModal();
                    }}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline"
                  >
                    {isAr ? 'تسجيل الشريك' : 'Register Partner'}
                  </button>
                )}
              </div>
            )}

            {/* PIN Input (for Real registered profile) */}
            {isTargetReal && (
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  {t.enterPinToSwitch} <span className="text-[#0F172A] dark:text-stone-100 font-bold">{targetUser.name}</span>:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-[#1E293B] dark:text-stone-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#065F46]"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!isCurrentRegistered}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                  isCurrentRegistered
                    ? 'bg-[#065F46] hover:bg-[#044e39] text-white cursor-pointer'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isTargetAgent 
                    ? (isAr ? `تفعيل ${targetUser.name}` : `Switch to ${targetUser.name}`)
                    : `${t.switchToUser} ${targetUser.name}`}
                </span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#065F46] dark:text-emerald-400 hover:underline font-semibold"
              >
                {isAr ? 'تعديل اسم الحساب والهدف الأسبوعي' : 'Edit Profile Name & Goal Target'}
              </button>
            </div>
          </form>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1">
                {t.yourName}:
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs text-[#1E293B] dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#065F46]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-stone-400 uppercase tracking-wider mb-1">
                {t.weeklyGoal} ({t.pagesPerWeek}):
              </label>
              <div className="flex items-center gap-2">
                {[2, 3, 4].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoalInput(g)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      goalInput === g
                        ? 'bg-[#065F46] text-white'
                        : 'bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-[#475569] dark:text-stone-300 hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {isAr ? `${toArabicDigits(g)} صفحات` : `${g} Pages/wk`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-sm transition-all"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-3 rounded-2xl bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] text-[#475569] dark:text-stone-300 border border-[#E2E8F0] dark:border-stone-700 text-xs font-medium"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
