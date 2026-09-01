import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert western digits to Arabic numerals (e.g. 12 -> ١٢)
export function toArabicDigits(num: number | string): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (w) => digits[parseInt(w, 10)]);
}

// Clean Tashkeel / Harakat for flexible search and comparison
export function stripTashkeel(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Tashkeel, superscript alef, Quranic signs
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // Normalize Alef with Hamza to bare Alef
    .replace(/\u0629/g, '\u0647') // Normalize Ta Marbuta to Ha
    .replace(/\u0649/g, '\u064A') // Normalize Alef Maqsura to Ya
    .trim();
}

// Format date relative to now
export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

// Get day streak calculation
export function checkAndUpdateStreak(lastDateStr: string, currentStreak: number): { newStreak: number; updated: boolean } {
  if (!lastDateStr) {
    return { newStreak: 1, updated: true };
  }
  const lastDate = new Date(lastDateStr);
  const today = new Date();
  
  const isSameDay = 
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate();

  if (isSameDay) {
    return { newStreak: currentStreak, updated: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = 
    lastDate.getFullYear() === yesterday.getFullYear() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getDate() === yesterday.getDate();

  if (isYesterday) {
    return { newStreak: currentStreak + 1, updated: true };
  }

  // Broken streak
  return { newStreak: 1, updated: true };
}
