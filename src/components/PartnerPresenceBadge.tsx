import React from 'react';
import { BookOpen, Radio, Moon } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { toArabicDigits } from '../lib/utils';
import { getTranslation } from '../lib/i18n';

interface PartnerPresenceBadgeProps {
  user: UserProfile;
  isPartner?: boolean;
  lang: Language;
  onNavigateToPage?: (pageNum: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showDetailText?: boolean;
  showJoinAction?: boolean;
}

/**
 * Checks if a user is genuinely online and active right now (within 4 minutes)
 */
export function isUserOnlineAndActive(user?: UserProfile): boolean {
  if (!user) return false;
  // If explicitly flagged offline
  if (user.isOnline === false) return false;

  const now = Date.now();
  const activeTimeStr = user.lastPageActiveAt || user.lastActiveDate;
  if (!activeTimeStr) return false;

  const activeTime = new Date(activeTimeStr).getTime();
  if (isNaN(activeTime)) return false;

  const diffMinutes = (now - activeTime) / (1000 * 60);
  // Strictly considered active if within the last 4 minutes
  return diffMinutes >= 0 && diffMinutes < 4;
}

export const PartnerPresenceBadge: React.FC<PartnerPresenceBadgeProps> = ({
  user,
  isPartner = false,
  lang,
  onNavigateToPage,
  size = 'md',
  showDetailText = true,
  showJoinAction = false,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';
  
  const isOnline = isUserOnlineAndActive(user);

  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  const pingSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';

  if (!isOnline) {
    // If NOT active, do NOT show online / pulsing dot at all
    return (
      <div className="inline-flex items-center gap-1.5" dir={isAr ? 'rtl' : 'ltr'}>
        <span 
          className={`relative inline-flex rounded-full ${dotSize} bg-slate-300 dark:bg-stone-600 ring-1 ring-white dark:ring-stone-900`}
          title={isAr ? 'غير متصل حالياً' : 'Currently Offline'}
        />
        {showDetailText && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-stone-800 text-slate-500 dark:text-stone-400 border border-slate-200 dark:border-stone-700">
            <span>{isAr ? 'غير متصل' : 'Offline'}</span>
          </span>
        )}
      </div>
    );
  }

  // Active & Online presentation
  return (
    <div className="inline-flex items-center gap-2 flex-wrap" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Online / Active Status Dot with Animated Pulse Ping */}
      <div 
        className="relative flex items-center justify-center cursor-default group"
        title={isAr ? `شريكك متصل الآن (${user.name})` : `Partner is online now (${user.name})`}
      >
        <span className={`animate-ping absolute inline-flex ${pingSize} rounded-full bg-emerald-400 opacity-80`} />
        <span className={`relative inline-flex rounded-full ${dotSize} bg-emerald-500 shadow-xs ring-2 ring-white dark:ring-stone-900`} />
      </div>

      {/* Detail Chip / Status Label */}
      {showDetailText && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
            <Radio className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>
              {isAr 
                ? `متصل الآن (ص ${toArabicDigits(user.currentPage || 1)})` 
                : `Online (p. ${user.currentPage || 1})`}
            </span>
          </span>

          {/* Quick Page Jump Link */}
          {showJoinAction && onNavigateToPage && (
            <button
              onClick={() => onNavigateToPage(user.currentPage || 1)}
              className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{isAr ? `(انضم إلى ص ${toArabicDigits(user.currentPage || 1)})` : `(Join Page ${user.currentPage || 1})`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
