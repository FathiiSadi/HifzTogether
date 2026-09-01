import React from 'react';
import { 
  BookOpen, 
  Users, 
  Sparkles, 
  HelpCircle, 
  Moon, 
  Sun, 
  Lock, 
  Type, 
  CheckCircle2,
  ChevronDown,
  Layers,
  Globe,
  UserPlus
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { DEFAULT_USERS } from '../lib/firebase';

interface NavbarProps {
  activeTab: 'hub' | 'reader' | 'juz' | 'reflections' | 'quiz';
  setActiveTab: (tab: 'hub' | 'reader' | 'juz' | 'reflections' | 'quiz') => void;
  currentUser: UserProfile;
  otherUser: UserProfile;
  lang: Language;
  onToggleLanguage: () => void;
  onSwitchUser: (userId: 'user_a' | 'user_b') => void;
  onOpenPinModal: () => void;
  onOpenRegisterModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  lang,
  onToggleLanguage,
  onSwitchUser,
  onOpenPinModal,
  onOpenRegisterModal,
  darkMode,
  setDarkMode,
  selectedFont,
  setSelectedFont,
  fontSize,
  setFontSize,
}) => {
  const currentUser = rawCurrentUser || DEFAULT_USERS.user_a;
  const otherUser = rawOtherUser || DEFAULT_USERS.user_b;
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const [showFontMenu, setShowFontMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 text-[#1E293B] dark:text-stone-100 backdrop-blur-md border-b border-[#E2E8F0] dark:border-stone-800 shadow-sm transition-colors" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('hub')}>
            <div className="w-10 h-10 rounded-2xl bg-[#065F46] flex items-center justify-center shadow-sm text-amber-300">
              <span className="font-amiri text-2xl leading-none">📖</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#064E3B] dark:text-emerald-300">
                  {t.appName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-[#065F46] dark:text-emerald-300 font-bold uppercase tracking-wider">
                  {isAr ? 'حفظ وتدبر' : 'Hifz & Tadabbur'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-stone-400 font-medium hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F1F5F9] dark:bg-stone-950/60 p-1 rounded-full border border-[#E2E8F0] dark:border-stone-800">
            <button
              id="nav-tab-hub"
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'hub'
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-850'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.navHub}</span>
            </button>

            <button
              id="nav-tab-reader"
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'reader'
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-850'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.navReader}</span>
            </button>

            <button
              id="nav-tab-juz"
              onClick={() => setActiveTab('juz')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'juz'
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-850'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.navJuz}</span>
            </button>

            <button
              id="nav-tab-reflections"
              onClick={() => setActiveTab('reflections')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'reflections'
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-850'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.navReflections}</span>
            </button>

            <button
              id="nav-tab-quiz"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-850'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t.navQuiz}</span>
            </button>
          </nav>

          {/* Right Action Controls: Language Toggle, Typography, Theme, Register & User Profile */}
          <div className="flex items-center gap-2">
            
            {/* Language Selector Toggle */}
            <button
              id="btn-language-toggle"
              onClick={onToggleLanguage}
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/80 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/80 text-xs font-bold transition-all hover:bg-emerald-100"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Font / Text Settings Dropdown */}
            <div className="relative">
              <button
                id="btn-font-settings"
                onClick={() => setShowFontMenu(!showFontMenu)}
                title="Font & Typography Settings"
                className="p-2 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] dark:hover:bg-stone-700 text-[#475569] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 border border-[#E2E8F0] dark:border-stone-700 transition-colors"
              >
                <Type className="w-4 h-4" />
              </button>

              {showFontMenu && (
                <div 
                  className={`absolute mt-2 w-64 p-3 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-stone-700 z-50 text-[#1E293B] dark:text-stone-200 animate-in fade-in zoom-in-95 ${
                    isAr ? 'left-0' : 'right-0'
                  }`}
                  onMouseLeave={() => setShowFontMenu(false)}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">
                    {isAr ? 'نوع الخط العربي' : 'Arabic Typography'}
                  </p>
                  
                  {/* Font Type */}
                  <div className="space-y-1.5 mb-3">
                    <button
                      onClick={() => setSelectedFont('Amiri')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        selectedFont === 'Amiri' ? 'bg-[#ECFDF5] text-[#065F46] font-bold border border-emerald-200' : 'hover:bg-[#F8FAFC] dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="font-amiri text-base">خط الأميري (Amiri)</span>
                      {selectedFont === 'Amiri' && <CheckCircle2 className="w-4 h-4 text-[#065F46]" />}
                    </button>
                    <button
                      onClick={() => setSelectedFont('Scheherazade New')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        selectedFont === 'Scheherazade New' ? 'bg-[#ECFDF5] text-[#065F46] font-bold border border-emerald-200' : 'hover:bg-[#F8FAFC] dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="font-scheherazade text-base">شهرزاد (Scheherazade)</span>
                      {selectedFont === 'Scheherazade New' && <CheckCircle2 className="w-4 h-4 text-[#065F46]" />}
                    </button>
                  </div>

                  {/* Font Size Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-[#64748B] dark:text-stone-400 mb-1">
                      <span>{isAr ? 'حجم النص' : 'Font Size'}</span>
                      <span className="font-mono font-bold text-[#065F46] dark:text-emerald-400">{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFontSize((s) => Math.max(18, s - 2))}
                        className="px-2.5 py-1 bg-[#F1F5F9] dark:bg-stone-800 rounded-lg text-xs font-bold hover:bg-[#E2E8F0] dark:hover:bg-stone-700"
                      >
                        A-
                      </button>
                      <input
                        type="range"
                        min="18"
                        max="40"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-[#065F46]"
                      />
                      <button
                        onClick={() => setFontSize((s) => Math.min(42, s + 2))}
                        className="px-2.5 py-1 bg-[#F1F5F9] dark:bg-stone-800 rounded-lg text-xs font-bold hover:bg-[#E2E8F0] dark:hover:bg-stone-700"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={() => setDarkMode((prev) => !prev)}
              title="Toggle Theme"
              className="p-2 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] dark:hover:bg-stone-700 text-[#475569] dark:text-stone-300 hover:text-[#0F172A] dark:hover:text-stone-100 border border-[#E2E8F0] dark:border-stone-700 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#475569]" />}
            </button>

            {/* Register / New Account Button */}
            <button
              id="btn-register-account"
              onClick={onOpenRegisterModal}
              title={t.registerBtn}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D97706] hover:bg-[#b45309] text-white text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.registerBtn}</span>
            </button>

            {/* User Switcher Pill */}
            <div className="relative">
              <button
                id="btn-user-switcher"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-stone-800 hover:bg-[#E2E8F0] dark:hover:bg-stone-750 border border-[#E2E8F0] dark:border-stone-700 transition-all text-xs sm:text-sm font-semibold shadow-sm"
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.avatar || '👤'}
                </div>
                <span className="hidden sm:inline font-medium text-[#1E293B] dark:text-stone-100">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {showUserMenu && (
                <div 
                  className={`absolute mt-2 w-64 p-2 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-stone-700 z-50 text-[#1E293B] dark:text-stone-200 animate-in fade-in ${
                    isAr ? 'left-0' : 'right-0'
                  }`}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-2 py-1">
                    {t.switchPartner}
                  </p>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (currentUser.id === 'user_a') return;
                      // Switching to User A
                      if (!currentUser.isRegistered) {
                        onOpenPinModal();
                      } else if (otherUser.id === 'user_a' && otherUser.userType === 'real_user' && otherUser.isRegistered) {
                        onOpenPinModal();
                      } else {
                        onSwitchUser('user_a');
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                      currentUser.id === 'user_a'
                        ? 'bg-[#ECFDF5] dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-[#065F46] dark:text-emerald-200'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#059669] flex items-center justify-center text-xs font-bold text-white">
                      {currentUser.id === 'user_a' ? currentUser.avatar : otherUser.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                        <span>{currentUser.id === 'user_a' ? currentUser.name : otherUser.name}</span>
                        {(currentUser.id === 'user_a' ? currentUser.isRegistered : otherUser.isRegistered) ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                            {t.registeredStatus}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold">
                            {t.unregisteredStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-stone-400">
                        {t.weeklyGoal}: {currentUser.id === 'user_a' ? currentUser.weeklyGoalPages : otherUser.weeklyGoalPages} {t.pagesPerWeek}
                      </div>
                    </div>
                    {currentUser.id === 'user_a' && <CheckCircle2 className="w-4 h-4 text-[#059669]" />}
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (currentUser.id === 'user_b') return;
                      // Switching to User B
                      if (!currentUser.isRegistered) {
                        onOpenPinModal();
                      } else if (otherUser.id === 'user_b' && otherUser.userType === 'real_user' && otherUser.isRegistered) {
                        onOpenPinModal();
                      } else {
                        onSwitchUser('user_b');
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left mt-1 transition-all ${
                      currentUser.id === 'user_b'
                        ? 'bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-200'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-stone-800 text-[#475569] dark:text-stone-300'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: (currentUser.id === 'user_b' ? currentUser.color : otherUser.color) || '#0284c7' }}
                    >
                      {currentUser.id === 'user_b' ? currentUser.avatar : otherUser.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                        <span>{currentUser.id === 'user_b' ? currentUser.name : otherUser.name}</span>
                        {(currentUser.id === 'user_b' ? currentUser.userType : otherUser.userType) === 'ai_agent' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold">
                            🤖 AI
                          </span>
                        ) : (currentUser.id === 'user_b' ? currentUser.isRegistered : otherUser.isRegistered) ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold">
                            {t.registeredStatus}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                            {t.dummyPartnerBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-stone-400">
                        {t.weeklyGoal}: {currentUser.id === 'user_b' ? currentUser.weeklyGoalPages : otherUser.weeklyGoalPages} {t.pagesPerWeek}
                      </div>
                    </div>
                    {currentUser.id === 'user_b' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                  </button>

                  <div className="border-t border-[#E2E8F0] dark:border-stone-800 mt-2 pt-1.5 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPinModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#D97706] dark:text-amber-400 hover:bg-[#FEF3C7]/50 dark:hover:bg-stone-800 transition-colors font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.accountProfile}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenRegisterModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#065F46] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-800 transition-colors font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.registerBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#E2E8F0] dark:border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('hub')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-semibold ${
              activeTab === 'hub' ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#64748B] dark:text-stone-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'المتابعة' : 'Hub'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reader')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-semibold ${
              activeTab === 'reader' ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#64748B] dark:text-stone-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isAr ? 'المصحف' : 'Reader'}</span>
          </button>

          <button
            onClick={() => setActiveTab('juz')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-semibold ${
              activeTab === 'juz' ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#64748B] dark:text-stone-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'الأجزاء' : 'Juz'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reflections')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-semibold ${
              activeTab === 'reflections' ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#64748B] dark:text-stone-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'التدبر' : 'Reflect'}</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-semibold ${
              activeTab === 'quiz' ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#64748B] dark:text-stone-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{isAr ? 'اختبار' : 'Quiz'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
