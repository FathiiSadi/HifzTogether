import React, { useState } from 'react';
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
  ChevronRight, 
  Layers, 
  Globe, 
  UserPlus, 
  Headphones, 
  Menu, 
  X, 
  ShieldCheck, 
  Radio, 
  Eye, 
  BookMarked,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';
import { DEFAULT_USERS } from '../lib/firebase';
import { PartnerPresenceBadge, isUserOnlineAndActive } from './PartnerPresenceBadge';

interface SidebarProps {
  activeTab: 'hub' | 'reader' | 'juz' | 'reflections' | 'quiz';
  setActiveTab: (tab: 'hub' | 'reader' | 'juz' | 'reflections' | 'quiz') => void;
  currentUser: UserProfile;
  otherUser: UserProfile;
  lang: Language;
  onToggleLanguage: () => void;
  onSwitchUser: (userId: 'user_a' | 'user_b') => void;
  onOpenPinModal: () => void;
  onOpenRegisterModal: () => void;
  onNavigateToReaderPage?: (pageNum: number) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser: rawCurrentUser,
  otherUser: rawOtherUser,
  lang,
  onToggleLanguage,
  onSwitchUser,
  onOpenPinModal,
  onOpenRegisterModal,
  onNavigateToReaderPage,
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

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [showFontMenu, setShowFontMenu] = useState<boolean>(false);

  const fontOptions = [
    { id: 'Amiri', name: 'خط الأميري', enName: 'Amiri' },
    { id: 'Scheherazade New', name: 'خط شهرزاد', enName: 'Scheherazade' },
    { id: 'Noto Naskh Arabic', name: 'خط النسخ', enName: 'Noto Naskh' },
    { id: 'Traditional Arabic', name: 'الخط التقليدي', enName: 'Traditional' },
  ];

  const navItems = [
    {
      id: 'hub' as const,
      label: t.navHub,
      icon: Users,
      badge: isAr ? 'الميثاق' : 'Hub',
      desc: isAr ? 'التقدم ومتابعة الشريك' : 'Progress & Partner Hub',
    },
    {
      id: 'reader' as const,
      label: t.navReader,
      icon: BookOpen,
      badge: `${t.page} ${isAr ? toArabicDigits(currentUser.currentPage) : currentUser.currentPage}`,
      desc: isAr ? 'تلاوة، تفسير، وتسميع' : 'Read, Tafsir & Recite',
    },
    {
      id: 'juz' as const,
      label: t.navJuz,
      icon: Layers,
      badge: isAr ? '٣٠ جزء' : '30 Juz',
      desc: isAr ? 'فهرس الأجزاء والسور' : 'Juz Catalog & Index',
    },
    {
      id: 'reflections' as const,
      label: t.navReflections,
      icon: Sparkles,
      badge: isAr ? 'تشارك' : 'Share',
      desc: isAr ? 'الخواطر والتدبر المشترك' : 'Reflections & Tadabbur',
    },
    {
      id: 'quiz' as const,
      label: t.navQuiz,
      icon: HelpCircle,
      badge: isAr ? 'تثبيت' : 'Quiz',
      desc: isAr ? 'اختبار الحفظ والضبط' : 'Retention & Quizzes',
    },
  ];

  const handleNavClick = (tabId: 'hub' | 'reader' | 'juz' | 'reflections' | 'quiz') => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar with Hamburger */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-slate-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('hub')}>
          <div className="w-9 h-9 rounded-2xl bg-[#065F46] flex items-center justify-center text-amber-300 shadow-sm">
            <span className="font-amiri text-xl leading-none">📖</span>
          </div>
          <div>
            <span className="font-bold text-sm text-[#064E3B] dark:text-emerald-300">
              {t.appName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-stone-400 block -mt-0.5">
              {currentUser.name} ({t.page} {isAr ? toArabicDigits(currentUser.currentPage) : currentUser.currentPage})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme toggle on mobile */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Hamburger toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-[#065F46] text-white shadow-sm"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 z-50 lg:static lg:z-auto w-72 flex-shrink-0 bg-white dark:bg-stone-900 border-e border-slate-200 dark:border-stone-800 flex flex-col justify-between shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0'
            : isAr
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Branding Section */}
        <div className="p-5 border-b border-slate-100 dark:border-stone-800/80">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavClick('hub')}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#065F46] to-[#044e39] flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform">
                <span className="font-amiri text-2xl leading-none">📖</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base text-[#064E3B] dark:text-emerald-300 tracking-tight">
                    {t.appName}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 font-medium">
                  {isAr ? 'منصة التسميع والتدبر التشاركية' : 'Two-Partner Quran Memorization'}
                </p>
              </div>
            </div>

            {/* Close on mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Logged-in User Pill */}
          <div className="mt-4 p-3 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#065F46] text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                {currentUser.avatar || '🟢'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#064E3B] dark:text-emerald-200 truncate">
                    {currentUser.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400">
                  {t.page} {isAr ? toArabicDigits(currentUser.currentPage) : currentUser.currentPage} • {currentUser.isRegistered ? (isAr ? 'حسابك مسجل' : 'Registered') : (isAr ? 'حساب نشط' : 'Active')}
                </p>
              </div>
            </div>

            {/* Lock / PIN Security button */}
            <button
              onClick={onOpenPinModal}
              className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700/60 text-[#065F46] dark:text-emerald-300 hover:bg-emerald-50 transition-colors shadow-xs"
              title={isAr ? 'الأمان وإعدادات الحساب' : 'Account PIN & Security'}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List & Partner Box */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          
          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500">
              {isAr ? 'القائمة الرئيسية' : 'Navigation'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#065F46] text-white shadow-sm ring-1 ring-[#065F46]'
                      : 'text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-stone-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Partner Status & Exclusive Memorization Check Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-950/60 border border-slate-200 dark:border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-stone-300">
                  {isAr ? 'حساب الشريك محمي' : 'Partner Protected'}
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                {isAr ? '🔒 مقفل' : '🔒 Locked'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 border border-sky-300/50 flex items-center justify-center text-sm font-bold text-sky-700 dark:text-sky-300">
                  {otherUser.avatar || '🔵'}
                </div>
                <div className="absolute -bottom-1 -end-1">
                  <PartnerPresenceBadge
                    user={otherUser}
                    isPartner={true}
                    lang={lang}
                    size="sm"
                    showDetailText={false}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-800 dark:text-stone-200 truncate">
                  {otherUser.name}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-stone-400">
                  {t.page} {isAr ? toArabicDigits(otherUser.currentPage) : otherUser.currentPage} • {isUserOnlineAndActive(otherUser) ? (isAr ? 'نشط الآن' : 'Active Now') : (isAr ? 'غير متصل' : 'Offline')}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-stone-400 leading-snug">
              {isAr 
                ? 'لا يمكنك تعديل حساب الشريك، ومصرح لك فقط بفحص وتسميع حفظه.' 
                : 'Partner account is private. You are only authorized to check and verify their recitation.'}
            </p>

            {/* Exclusive Check Memorization Action */}
            <button
              onClick={() => {
                if (onNavigateToReaderPage) {
                  onNavigateToReaderPage(otherUser.currentPage);
                } else {
                  setActiveTab('reader');
                }
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isAr ? `فحص وتسميع ${otherUser.name}` : `Check ${otherUser.name}'s Hifz`}</span>
            </button>
          </div>

          {/* Quick Registration CTA if not registered */}
          {!currentUser.isRegistered && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-bold text-xs">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'سجّل اسمك ورمزك السري' : 'Register your PIN'}</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300 leading-tight">
                {isAr ? 'احفظ تقدمك واقفل حسابك لمنع التعديل غير المصرح به.' : 'Save your progress and lock your account.'}
              </p>
              <button
                onClick={() => {
                  onOpenRegisterModal();
                  setIsMobileOpen(false);
                }}
                className="w-full py-1.5 rounded-xl bg-[#065F46] hover:bg-[#044e39] text-white text-xs font-bold shadow-xs transition-all"
              >
                {isAr ? 'تسجيل الحساب الآن' : 'Register Now'}
              </button>
            </div>
          )}

        </div>

        {/* Bottom Preferences / Controls Toolbar */}
        <div className="p-4 border-t border-slate-200 dark:border-stone-800 bg-slate-50/70 dark:bg-stone-900/90 space-y-3">
          
          {/* Quick Font Customizer Drawer Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowFontMenu(!showFontMenu)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-stone-300 hover:bg-slate-50 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />
                <span>{isAr ? `الخط: ${selectedFont}` : `Font: ${selectedFont}`}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFontMenu ? 'rotate-180' : ''}`} />
            </button>

            {showFontMenu && (
              <div className="absolute bottom-full mb-2 start-0 end-0 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-xl p-3 space-y-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'اختر خط المصحف' : 'Select Quran Font'}
                </div>
                <div className="space-y-1">
                  {fontOptions.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => {
                        setSelectedFont(font.id);
                        setShowFontMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedFont === font.id
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="font-amiri">{font.name}</span>
                      {selectedFont === font.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />}
                    </button>
                  ))}
                </div>

                {/* Font Size controls */}
                <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-stone-400 font-semibold">{isAr ? 'حجم الخط' : 'Font Size'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFontSize(Math.max(18, fontSize - 2))}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 font-bold text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-700 dark:text-stone-300 w-6 text-center">
                      {isAr ? toArabicDigits(fontSize) : fontSize}
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 font-bold text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme & Language Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                darkMode
                  ? 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-750'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'الوضع النهاري' : 'Light Mode'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>{isAr ? 'الوضع الليلي' : 'Dark Mode'}</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-stone-300 hover:bg-slate-100 transition-all shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
          </div>

        </div>

      </aside>
    </>
  );
};
