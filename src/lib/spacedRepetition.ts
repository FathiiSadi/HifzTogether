import { PageProgressRecord, ProgressStatus } from '../types';
import { SURAH_CATALOG } from './quranData';

// Quranic Spaced Repetition Intervals in Days (1d -> 3d -> 7d -> 14d -> 30d -> 60d)
export const SPACED_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export interface SpacedRepetitionPageStatus {
  recordId: string;
  userId: 'user_a' | 'user_b';
  pageNumber: number;
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  status: ProgressStatus;
  lastReviewDate: string; // ISO string
  daysSinceReview: number;
  stage: number; // 0 to 5 (index in SPACED_INTERVALS_DAYS)
  intervalDays: number; // current interval target in days
  daysUntilDue: number; // positive = days left, negative = days overdue
  retentionPercent: number; // 0 to 100% estimated retention
  urgency: 'overdue' | 'due_today' | 'due_soon' | 'mastered';
  reviewCount: number;
}

export interface SpacedRepetitionStats {
  overdueCount: number;
  dueTodayCount: number;
  dueSoonCount: number;
  masteredCount: number;
  totalTrackedPages: number;
  averageRetentionPercent: number;
}

/**
 * Finds the corresponding Surah metadata for a specific Mushaf page (1-604)
 */
export function getSurahForPage(pageNum: number) {
  const found = SURAH_CATALOG.find((s) => pageNum >= s.startPage && pageNum <= s.endPage);
  return found || SURAH_CATALOG[0];
}

/**
 * Calculates the Spaced Repetition metrics and retention curve for a single page progress record
 */
export function calculatePageRetention(record: PageProgressRecord): SpacedRepetitionPageStatus {
  const surahMeta = getSurahForPage(record.pageNumber);
  const reviewCount = record.reviewCount || (record.status === 'reviewed' ? 1 : 0);
  
  // Review stage capped at maximum interval index
  const stage = Math.min(reviewCount, SPACED_INTERVALS_DAYS.length - 1);
  const intervalDays = SPACED_INTERVALS_DAYS[stage];

  // Base date calculation: approvedAt > lastUpdated > now
  const baseDateStr = record.approvedAt || record.lastUpdated || new Date().toISOString();
  const baseDate = new Date(baseDateStr);
  const now = new Date();
  
  // Calculate elapsed days with decimal precision
  const elapsedMs = Math.max(0, now.getTime() - baseDate.getTime());
  const daysSinceReview = Math.floor((elapsedMs / (1000 * 60 * 60 * 24)) * 10) / 10;
  
  // Days remaining until next scheduled review
  const daysUntilDue = Math.round((intervalDays - daysSinceReview) * 10) / 10;

  // Ebbinghaus Forgetting Curve formula adapted for Hifz retention:
  // R = e^(-k * (t / S)) where S is interval strength and k = 0.85
  const ratio = daysSinceReview / Math.max(1, intervalDays);
  const rawRetention = Math.round(100 * Math.exp(-0.85 * ratio));
  const retentionPercent = Math.max(10, Math.min(100, rawRetention));

  // Determine urgency status
  let urgency: SpacedRepetitionPageStatus['urgency'];
  if (daysUntilDue < 0) {
    urgency = 'overdue';
  } else if (daysUntilDue <= 1) {
    urgency = 'due_today';
  } else if (daysUntilDue <= 2) {
    urgency = 'due_soon';
  } else {
    urgency = 'mastered';
  }

  return {
    recordId: record.id,
    userId: record.userId,
    pageNumber: record.pageNumber,
    surahNumber: record.surahNumber || surahMeta.number,
    surahNameAr: surahMeta.name,
    surahNameEn: surahMeta.englishName,
    status: record.status,
    lastReviewDate: baseDateStr,
    daysSinceReview,
    stage: stage + 1, // 1-indexed for display (Stage 1 to 6)
    intervalDays,
    daysUntilDue,
    retentionPercent,
    urgency,
    reviewCount,
  };
}

/**
 * Returns filtered and sorted Spaced Repetition queue for a user
 */
export function getSpacedRepetitionQueue(
  pageProgress: Record<string, PageProgressRecord>,
  targetUserId?: 'user_a' | 'user_b'
): {
  items: SpacedRepetitionPageStatus[];
  stats: SpacedRepetitionStats;
} {
  const records = Object.values(pageProgress || {}).filter(
    (p): p is PageProgressRecord => !!p && (p.status === 'memorized' || p.status === 'reviewed')
  );

  const filteredRecords = targetUserId 
    ? records.filter((r) => r.userId === targetUserId)
    : records;

  const items = filteredRecords.map(calculatePageRetention);

  // Sorting priority:
  // 1. Overdue pages first (most urgent, lowest retention)
  // 2. Due today
  // 3. Due soon
  // 4. Lowest retention % first
  items.sort((a, b) => {
    const urgencyWeight = { overdue: 0, due_today: 1, due_soon: 2, mastered: 3 };
    if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
      return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    }
    return a.retentionPercent - b.retentionPercent;
  });

  // Calculate aggregated metrics
  const overdueCount = items.filter((i) => i.urgency === 'overdue').length;
  const dueTodayCount = items.filter((i) => i.urgency === 'due_today').length;
  const dueSoonCount = items.filter((i) => i.urgency === 'due_soon').length;
  const masteredCount = items.filter((i) => i.urgency === 'mastered').length;
  const totalTrackedPages = items.length;

  const totalRetention = items.reduce((acc, curr) => acc + curr.retentionPercent, 0);
  const averageRetentionPercent = totalTrackedPages > 0 
    ? Math.round(totalRetention / totalTrackedPages) 
    : 100;

  return {
    items,
    stats: {
      overdueCount,
      dueTodayCount,
      dueSoonCount,
      masteredCount,
      totalTrackedPages,
      averageRetentionPercent,
    },
  };
}
