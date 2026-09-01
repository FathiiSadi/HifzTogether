/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  PageProgressRecord, 
  ActivityItem, 
  SharedReflectionNote, 
  QuizResultRecord, 
  ProgressStatus,
  Language
} from './types';
import { 
  DEFAULT_USERS, 
  DEFAULT_ACTIVITIES, 
  generateInitialProgress,
  db,
  saveUserProfileToFirestore,
  savePageProgressToFirestore,
  logActivityToFirestore,
  logQuizResultToFirestore,
  saveReflectionNoteToFirestore
} from './lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Sidebar } from './components/Sidebar';
import { AccountabilityHub } from './components/AccountabilityHub';
import { QuranReader } from './components/QuranReader';
import { JuzSelector } from './components/JuzSelector';
import { ReflectionsHub } from './components/ReflectionsHub';
import { QuizModule } from './components/QuizModule';
import { CheckInModal } from './components/CheckInModal';
import { PinLoginModal } from './components/PinLoginModal';
import { RegisterModal } from './components/RegisterModal';
import { JUZ_CATALOG } from './lib/juzData';
import { getSurahForPage } from './lib/spacedRepetition';
import { registerServiceWorker } from './lib/offlineService';
import confetti from 'canvas-confetti';

export default function App() {
  // Language & Direction State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('hifz_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar'; // Default Arabic as requested by user
  });

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'hub' | 'reader' | 'juz' | 'reflections' | 'quiz'>('hub');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hifz_theme');
      return saved === 'dark';
    } catch {
      return false;
    }
  });
  const [selectedFont, setSelectedFont] = useState<string>('Amiri');
  const [fontSize, setFontSize] = useState<number>(26);

  // Automatic cleanup of old dump data
  const [activeUserId, setActiveUserId] = useState<'user_a' | 'user_b'>('user_a');
  
  // Clean initialization check
  const [users, setUsers] = useState<Record<'user_a' | 'user_b', UserProfile>>(() => {
    try {
      const cleanCheck = localStorage.getItem('hifz_cleaned_dump_data_v4');
      if (!cleanCheck) {
        localStorage.removeItem('hifz_users');
        localStorage.removeItem('hifz_page_progress');
        localStorage.removeItem('hifz_activities');
        localStorage.removeItem('hifz_reflection_notes');
        localStorage.removeItem('hifz_quiz_history');
        localStorage.setItem('hifz_cleaned_dump_data_v4', 'true');
        return DEFAULT_USERS;
      }
      const saved = localStorage.getItem('hifz_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            user_a: { ...DEFAULT_USERS.user_a, ...(parsed.user_a || {}) },
            user_b: { ...DEFAULT_USERS.user_b, ...(parsed.user_b || {}) },
          };
        }
      }
    } catch (e) {
      console.warn('Error parsing stored users:', e);
    }
    return DEFAULT_USERS;
  });

  // Current Reader Page (Madinah Mushaf 1-604)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Page Progress Records
  const [pageProgress, setPageProgress] = useState<Record<string, PageProgressRecord>>(() => {
    try {
      const saved = localStorage.getItem('hifz_page_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading page progress:', e);
    }
    return generateInitialProgress();
  });

  // Activity Feed
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('hifz_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading activities:', e);
    }
    return DEFAULT_ACTIVITIES;
  });

  // Shared Reflection Notes
  const [reflectionNotes, setReflectionNotes] = useState<SharedReflectionNote[]>(() => {
    try {
      const saved = localStorage.getItem('hifz_reflection_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading reflection notes:', e);
    }
    return [];
  });

  // Shared Quiz Score History
  const [quizHistory, setQuizHistory] = useState<QuizResultRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hifz_quiz_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading quiz history:', e);
    }
    return [];
  });

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [checkInInitialPage, setCheckInInitialPage] = useState<number>(1);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('hifz_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('hifz_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hifz_page_progress', JSON.stringify(pageProgress));
  }, [pageProgress]);

  useEffect(() => {
    localStorage.setItem('hifz_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('hifz_reflection_notes', JSON.stringify(reflectionNotes));
  }, [reflectionNotes]);

  useEffect(() => {
    localStorage.setItem('hifz_quiz_history', JSON.stringify(quizHistory));
  }, [quizHistory]);

  // Dark mode class toggle & persistence
  useEffect(() => {
    localStorage.setItem('hifz_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Service Worker Registration & Online Presence Heartbeat
  useEffect(() => {
    // 1. Register service worker for offline Juz caching
    registerServiceWorker();

    // 2. Active presence heartbeat for current user
    const sendHeartbeat = () => {
      const nowIso = new Date().toISOString();
      const currentUserObj = users[activeUserId];
      if (currentUserObj) {
        saveUserProfileToFirestore({
          ...currentUserObj,
          isOnline: true,
          lastPageActiveAt: nowIso,
          lastActiveDate: nowIso,
        }).catch((err) => console.warn('Presence heartbeat fallback:', err));
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 90000); // Heartbeat every 90 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeUserId]);

  // Real-time Firestore Listeners (Dual Collaborative Sync)
  useEffect(() => {
    try {
      // Listen to users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          setUsers((prev) => {
            const updated = { ...prev };
            snapshot.forEach((doc) => {
              const data = doc.data() as Partial<UserProfile>;
              const uid = (data.id || doc.id) as 'user_a' | 'user_b';
              if (uid === 'user_a' || uid === 'user_b') {
                updated[uid] = {
                  ...DEFAULT_USERS[uid],
                  ...(updated[uid] || {}),
                  ...data,
                  id: uid,
                };
              }
            });
            return updated;
          });
        }
      }, (err) => console.warn('Firestore users listener error:', err));

      // Listen to activities
      const unsubActivities = onSnapshot(
        query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(30)),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ActivityItem[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as ActivityItem;
              list.push({ ...data, id: doc.id || data.id || `act-${Date.now()}` });
            });
            setActivities(list);
          }
        },
        (err) => console.warn('Firestore activities listener error:', err)
      );

      // Listen to page progress
      const unsubProgress = onSnapshot(collection(db, 'page_progress'), (snapshot) => {
        if (!snapshot.empty) {
          setPageProgress((prev) => {
            const updated = { ...prev };
            snapshot.forEach((doc) => {
              const data = doc.data() as PageProgressRecord;
              if (doc.id) {
                updated[doc.id] = { ...data, id: doc.id || data.id };
              }
            });
            return updated;
          });
        }
      }, (err) => console.warn('Firestore page_progress listener error:', err));

      return () => {
        unsubUsers();
        unsubActivities();
        unsubProgress();
      };
    } catch (e) {
      console.warn('Firestore listeners initialization fallback:', e);
    }
  }, []);

  const currentUser: UserProfile = (users && users[activeUserId])
    ? users[activeUserId]
    : (DEFAULT_USERS[activeUserId] || DEFAULT_USERS.user_a);

  const otherUserId: 'user_a' | 'user_b' = activeUserId === 'user_a' ? 'user_b' : 'user_a';
  const otherUser: UserProfile = (users && users[otherUserId])
    ? users[otherUserId]
    : (DEFAULT_USERS[otherUserId] || DEFAULT_USERS.user_b);

  // Language Toggle
  const handleToggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Handlers
  const handleSwitchUser = (newUserId: 'user_a' | 'user_b') => {
    setActiveUserId(newUserId);
  };

  const handleUpdateWeeklyGoal = (userId: 'user_a' | 'user_b', newGoal: number) => {
    const updatedUser = { ...users[userId], weeklyGoalPages: newGoal };
    setUsers((prev) => ({ ...prev, [userId]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId,
      userName: updatedUser.name,
      type: 'completed_goal',
      message: lang === 'ar' 
        ? `تم تعديل الهدف الأسبوعي إلى ${newGoal} صفحات أسبوعياً.`
        : `Adjusted weekly Hifz commitment to ${newGoal} pages/week.`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleUpdateProfile = (userId: 'user_a' | 'user_b', updates: Partial<UserProfile>) => {
    const updatedUser = { ...users[userId], ...updates };
    setUsers((prev) => ({ ...prev, [userId]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);
  };

  const handleRegisterUser = (newUserA: UserProfile, partnerUser?: Partial<UserProfile>) => {
    const mergedUserA: UserProfile = {
      ...users.user_a,
      ...newUserA,
      id: 'user_a',
      isRegistered: true,
      userType: 'real_user',
    };

    let mergedUserB: UserProfile = users.user_b;
    if (partnerUser) {
      mergedUserB = {
        ...users.user_b,
        ...partnerUser,
        id: 'user_b',
      };
    }

    const updatedUsers = {
      user_a: mergedUserA,
      user_b: mergedUserB,
    };

    setUsers(updatedUsers);
    setActiveUserId('user_a');
    saveUserProfileToFirestore(mergedUserA);
    if (partnerUser) {
      saveUserProfileToFirestore(mergedUserB);
    }

    // If starting page provided, navigate to it
    if (mergedUserA.currentPage) {
      setCurrentPage(mergedUserA.currentPage);
    }

    const isDual = partnerUser && partnerUser.userType === 'real_user' && partnerUser.isRegistered;
    const isAgent = partnerUser && partnerUser.userType === 'ai_agent';

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: 'user_a',
      userName: mergedUserA.name,
      type: 'encouragement',
      message: lang === 'ar'
        ? (isDual
            ? `تم تسجيل حسابين للشراكة القرآنية (${mergedUserA.name} و ${mergedUserB.name}) في حفظ الجزء ${mergedUserA.targetJuz || 30}!`
            : isAgent
            ? `انضم ${mergedUserA.name} للشراكة القرآنية مع الرفيق الذكي 🤖!`
            : `انضم ${mergedUserA.name} للشراكة القرآنية في حفظ الجزء ${mergedUserA.targetJuz || 30}!`)
        : (isDual
            ? `Registered two partner accounts (${mergedUserA.name} & ${mergedUserB.name}) for Juz ${mergedUserA.targetJuz || 30}!`
            : isAgent
            ? `Activated ${mergedUserA.name} with AI Quran Study Companion 🤖!`
            : `${mergedUserA.name} joined the Hifz partnership memorizing Juz ${mergedUserA.targetJuz || 30}!`),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleOpenCheckIn = (pageNum?: number) => {
    setCheckInInitialPage(pageNum || currentPage);
    setIsCheckInModalOpen(true);
  };

  const handleSaveCheckIn = (
    pageNum: number, 
    surahNum: number, 
    status: ProgressStatus, 
    notes?: string
  ) => {
    const recordId = `${currentUser.id}_page_${pageNum}`;
    
    // If user marks as memorized, transition to pending_approval for study partner verification
    const effectiveStatus: ProgressStatus = status === 'memorized' ? 'pending_approval' : status;

    const existingRecord = pageProgress[recordId];
    const newRecord: PageProgressRecord = {
      id: recordId,
      userId: currentUser.id,
      pageNumber: pageNum,
      surahNumber: surahNum,
      status: effectiveStatus,
      lastUpdated: new Date().toISOString(),
      notes: notes || existingRecord?.notes,
      reviewCount: (existingRecord?.reviewCount || 0) + (status === 'reviewed' ? 1 : 0),
      ...(effectiveStatus === 'pending_approval' ? {
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedAt: new Date().toISOString(),
        revisionNotes: undefined,
      } : {}),
    };

    setPageProgress((prev) => ({ ...prev, [recordId]: newRecord }));
    savePageProgressToFirestore(newRecord);

    // Update user stats
    const updatedUser = {
      ...currentUser,
      currentPage: pageNum,
      currentSurah: surahNum,
      lastActiveDate: new Date().toISOString(),
      totalReviewedPages: status === 'reviewed' ? (currentUser.totalReviewedPages || 0) + 1 : currentUser.totalReviewedPages,
    };
    setUsers((prev) => ({ ...prev, [currentUser.id]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);

    // Log Collaborative Activity
    let activityType: ActivityItem['type'] = 'reviewed_page';
    let activityMessage = '';

    if (effectiveStatus === 'pending_approval') {
      activityType = 'pending_approval';
      activityMessage = lang === 'ar'
        ? `أتم حفظ الصفحة ${pageNum} وقدمها للاستماع واعتماد شريكه ${otherUser.name}.`
        : `Completed memorizing Page ${pageNum} and requested verification from study partner ${otherUser.name}.`;
    } else if (status === 'reviewed') {
      activityType = 'reviewed_page';
      activityMessage = lang === 'ar'
        ? `راجع وثبّت الصفحة ${pageNum}${notes ? ` ("${notes}")` : ''}.`
        : `Reviewed Page ${pageNum}${notes ? ` ("${notes}")` : ''}.`;
    } else {
      activityMessage = lang === 'ar'
        ? `يعمل الآن على حفظ وتكرار الصفحة ${pageNum}.`
        : `Currently practicing and memorizing Page ${pageNum}.`;
    }

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: activityType,
      pageNumber: pageNum,
      message: activityMessage,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleApproveMemorization = (recordId: string) => {
    const record = pageProgress[recordId];
    if (!record) return;

    const targetUserId = record.userId;
    const targetUserObj = users[targetUserId] || DEFAULT_USERS[targetUserId];

    const updatedRecord: PageProgressRecord = {
      ...record,
      status: 'memorized',
      lastUpdated: new Date().toISOString(),
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      approvedAt: new Date().toISOString(),
      revisionNotes: undefined,
    };

    setPageProgress((prev) => ({ ...prev, [recordId]: updatedRecord }));
    savePageProgressToFirestore(updatedRecord);

    // Increment memorized count for target user
    const updatedTargetUser: UserProfile = {
      ...targetUserObj,
      totalMemorizedPages: (targetUserObj.totalMemorizedPages || 0) + 1,
      streakDays: Math.max(1, (targetUserObj.streakDays || 0) + 1),
      lastActiveDate: new Date().toISOString(),
    };
    setUsers((prev) => ({ ...prev, [targetUserId]: updatedTargetUser }));
    saveUserProfileToFirestore(updatedTargetUser);

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'approved_memorization',
      pageNumber: record.pageNumber,
      message: lang === 'ar'
        ? `صادق ${currentUser.name} على إتقان وحفظ الصفحة ${record.pageNumber} لشريكه ${targetUserObj.name}! بارك الله فيكما 🎉`
        : `${currentUser.name} verified and approved ${targetUserObj.name}'s memorization of Page ${record.pageNumber}! 🎉`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleRejectOrRequestRevision = (recordId: string, revisionNotes?: string) => {
    const record = pageProgress[recordId];
    if (!record) return;

    const targetUserId = record.userId;
    const targetUserObj = users[targetUserId] || DEFAULT_USERS[targetUserId];

    const updatedRecord: PageProgressRecord = {
      ...record,
      status: 'in_progress',
      lastUpdated: new Date().toISOString(),
      revisionNotes: revisionNotes || (lang === 'ar' ? 'تحتاج إلى تكرار وتثبيت إضافي' : 'Needs further practice'),
    };

    setPageProgress((prev) => ({ ...prev, [recordId]: updatedRecord }));
    savePageProgressToFirestore(updatedRecord);

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'reviewed_page',
      pageNumber: record.pageNumber,
      message: lang === 'ar'
        ? `طلب ${currentUser.name} من شريكه ${targetUserObj.name} إعادة تثبيت الصفحة ${record.pageNumber}${revisionNotes ? ` (ملاحظة: ${revisionNotes})` : '.'}`
        : `${currentUser.name} requested practice revision for Page ${record.pageNumber} from ${targetUserObj.name}${revisionNotes ? ` (Note: ${revisionNotes})` : '.'}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleSendEncouragement = (message: string) => {
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'encouragement',
      message: message,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleQuickReviewPage = (targetUserId: 'user_a' | 'user_b', pageNumber: number) => {
    const recordId = `${targetUserId}_page_${pageNumber}`;
    const existing = pageProgress[recordId];
    const surahMeta = getSurahForPage(pageNumber);
    const actingUser = users[targetUserId] || DEFAULT_USERS[targetUserId];

    const updatedRecord: PageProgressRecord = {
      id: recordId,
      userId: targetUserId,
      pageNumber,
      surahNumber: existing?.surahNumber || surahMeta.number,
      status: 'reviewed',
      lastUpdated: new Date().toISOString(),
      approvedAt: existing?.approvedAt || new Date().toISOString(),
      reviewCount: (existing?.reviewCount || 0) + 1,
      notes: existing?.notes,
    };

    setPageProgress((prev) => ({ ...prev, [recordId]: updatedRecord }));
    savePageProgressToFirestore(updatedRecord);

    // Update target user's total reviewed count and streak
    const updatedUser: UserProfile = {
      ...actingUser,
      totalReviewedPages: (actingUser.totalReviewedPages || 0) + 1,
      lastActiveDate: new Date().toISOString(),
    };
    setUsers((prev) => ({ ...prev, [targetUserId]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);

    // Trigger celebratory particle burst
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#10B981', '#34D399', '#D97706', '#F59E0B']
      });
    } catch {
      // ignore
    }

    // Collaborative activity feed
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: targetUserId,
      userName: actingUser.name,
      type: 'reviewed_page',
      pageNumber,
      message: lang === 'ar'
        ? `قام ${actingUser.name} بمراجعة وتثبيت الصفحة ${pageNumber} (سورة ${surahMeta.name}) وفق جدول التكرار المتباعد 🔄`
        : `${actingUser.name} reviewed and strengthened Page ${pageNumber} (Surah ${surahMeta.englishName}) via Spaced Repetition 🔄`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleAddReflectionNote = (reflectionId: string, text: string) => {
    const newNote: SharedReflectionNote = {
      id: `rn-${Date.now()}`,
      reflectionId,
      userId: currentUser.id,
      userName: currentUser.name,
      noteText: text,
      timestamp: new Date().toISOString(),
    };
    setReflectionNotes((prev) => [newNote, ...prev]);
    saveReflectionNoteToFirestore(newNote);

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'reflection_note',
      message: lang === 'ar'
        ? `شارك خاطرة وتدبراً إيمانياً جديداً مع شريكه.`
        : `Shared a Tadabbur reflection note for the partnership.`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handleLogQuizScore = (result: Omit<QuizResultRecord, 'id'>) => {
    const fullResult: QuizResultRecord = {
      id: `qres-${Date.now()}`,
      ...result,
    };
    setQuizHistory((prev) => [fullResult, ...prev]);
    logQuizResultToFirestore(result);

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'quiz_passed',
      quizScore: result.percentage,
      message: lang === 'ar'
        ? `أتم اختبار ${result.scopeDescription} بنتيجة ${result.percentage}% (${result.score}/${result.totalQuestions})!`
        : `Completed ${result.scopeDescription} test with score ${result.percentage}% (${result.score}/${result.totalQuestions})!`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
    logActivityToFirestore(newActivity);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const updatedUser: UserProfile = {
      ...currentUser,
      currentPage: newPage,
      lastPageActiveAt: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      isOnline: true,
    };
    setUsers((prev) => ({ ...prev, [currentUser.id]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);
  };

  const handleNavigateToReader = (pageNum: number) => {
    handlePageChange(pageNum);
    setActiveTab('reader');
  };

  const handleNavigateToSurahPage = (pageNum: number, surahNumber: number) => {
    handlePageChange(pageNum);
    setActiveTab('reader');
  };

  const handleSelectJuz = (juzNumber: number, startPage: number) => {
    const updatedUser = {
      ...currentUser,
      targetJuz: juzNumber,
      currentPage: startPage,
      lastPageActiveAt: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      isOnline: true,
    };
    setUsers((prev) => ({ ...prev, [currentUser.id]: updatedUser }));
    saveUserProfileToFirestore(updatedUser);
    setCurrentPage(startPage);
    setActiveTab('reader');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-stone-950 text-slate-900 dark:text-stone-100 flex flex-col lg:flex-row font-sans transition-colors duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        otherUser={otherUser}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        onSwitchUser={handleSwitchUser}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onNavigateToReaderPage={handleNavigateToReader}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedFont={selectedFont}
        setSelectedFont={setSelectedFont}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'hub' && (
            <AccountabilityHub
              currentUser={currentUser}
              otherUser={otherUser}
              pageProgress={pageProgress}
              activities={activities}
              reflectionNotes={reflectionNotes}
              quizHistory={quizHistory}
              lang={lang}
              onOpenCheckIn={handleOpenCheckIn}
              onUpdateWeeklyGoal={handleUpdateWeeklyGoal}
              onSendEncouragement={handleSendEncouragement}
              onNavigateToReader={handleNavigateToReader}
              onNavigateToJuz={() => setActiveTab('juz')}
              onNavigateToReflections={() => setActiveTab('reflections')}
              onSwitchUser={handleSwitchUser}
              onOpenPinModal={() => setIsPinModalOpen(true)}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onApproveMemorization={handleApproveMemorization}
              onRequestRevision={handleRejectOrRequestRevision}
              onQuickReviewPage={handleQuickReviewPage}
              onUpdateReminderSettings={(newTime, enabled) => {
                handleUpdateProfile(currentUser.id, {
                  dailyReminderTime: newTime,
                  reminderEnabled: enabled,
                });
              }}
            />
          )}

          {activeTab === 'reader' && (
            <QuranReader
              currentPage={currentPage}
              onPageChange={handlePageChange}
              currentUser={currentUser}
              otherUser={otherUser}
              pageProgress={pageProgress}
              lang={lang}
              onMarkPageProgress={(pageNum, st) => handleSaveCheckIn(pageNum, currentUser.currentSurah, st)}
              onApproveMemorization={handleApproveMemorization}
              onRequestRevision={handleRejectOrRequestRevision}
              selectedFont={selectedFont}
              fontSize={fontSize}
            />
          )}

          {activeTab === 'juz' && (
            <JuzSelector
              currentUser={currentUser}
              otherUser={otherUser}
              pageProgress={pageProgress}
              lang={lang}
              onSelectJuzForMemorization={(juz) => handleSelectJuz(juz.number, juz.startPage)}
              onSelectJuz={handleSelectJuz}
              onSetTargetJuz={(juzNum) => {
                const targetJuz = JUZ_CATALOG.find((j) => j.number === juzNum);
                if (targetJuz) {
                  handleSelectJuz(juzNum, targetJuz.startPage);
                }
              }}
            />
          )}

          {activeTab === 'reflections' && (
            <ReflectionsHub
              currentUser={currentUser}
              otherUser={otherUser}
              reflectionNotes={reflectionNotes}
              lang={lang}
              onAddReflectionNote={handleAddReflectionNote}
              onNavigateToSurahPage={handleNavigateToSurahPage}
              selectedFont={selectedFont}
              fontSize={fontSize}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizModule
              currentUser={currentUser}
              otherUser={otherUser}
              quizHistory={quizHistory}
              lang={lang}
              onLogQuizScore={handleLogQuizScore}
              selectedFont={selectedFont}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/60 py-5 text-center text-xs text-slate-500 dark:text-stone-400 mt-auto">
          <p className="flex items-center justify-center gap-2 font-medium flex-wrap px-4">
            <span className="font-bold text-[#065F46] dark:text-emerald-400">
              {lang === 'ar' ? 'حفظ معاً (HifzTogether)' : 'HifzTogether'}
            </span>
            <span>•</span>
            <span className="font-amiri text-sm text-amber-700 dark:text-amber-300">اللهم اجعلنا من أهل القرآن وخاصته</span>
            <span>•</span>
            <span>{lang === 'ar' ? 'منصة التسميع والتثبيت والتدبر التشاركية' : 'Two-Partner Quran Memorization & Reflection'}</span>
          </p>
        </footer>
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        currentUser={currentUser}
        lang={lang}
        initialPage={checkInInitialPage}
        onSaveCheckIn={handleSaveCheckIn}
      />

      <PinLoginModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        users={users}
        activeUserId={activeUserId}
        lang={lang}
        onLoginSuccess={handleSwitchUser}
        onUpdateProfile={handleUpdateProfile}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        lang={lang}
        onRegisterSuccess={handleRegisterUser}
      />

    </div>
  );
}
