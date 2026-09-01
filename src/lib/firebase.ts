import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, PageProgressRecord, ActivityItem, SharedReflectionNote, QuizResultRecord } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Clean Initial Default User A and User B
export const DEFAULT_USERS: Record<'user_a' | 'user_b', UserProfile> = {
  user_a: {
    id: 'user_a',
    name: 'Partner 1',
    avatar: '🟢',
    pin: '1234',
    color: '#059669', // Emerald
    weeklyGoalPages: 3,
    currentSurah: 1, // Al-Fatihah
    currentPage: 1,
    targetJuz: 1,
    streakDays: 0,
    lastActiveDate: new Date().toISOString(),
    totalMemorizedPages: 0,
    totalReviewedPages: 0,
    dailyReminderTime: '19:00',
    reminderEnabled: true,
    isRegistered: false,
    userType: 'real_user',
  },
  user_b: {
    id: 'user_b',
    name: 'AI Companion',
    avatar: '🤖',
    pin: '5678',
    color: '#0284c7', // Sky / Cyan
    weeklyGoalPages: 3,
    currentSurah: 1,
    currentPage: 1,
    targetJuz: 1,
    streakDays: 0,
    lastActiveDate: new Date().toISOString(),
    totalMemorizedPages: 0,
    totalReviewedPages: 0,
    dailyReminderTime: '20:30',
    reminderEnabled: true,
    isRegistered: false,
    userType: 'ai_agent',
    agentRole: 'supportive_peer',
    agentAutoApprove: true,
  },
};

// Initial activities (empty clean slate)
export const DEFAULT_ACTIVITIES: ActivityItem[] = [];

// Clean initial page progress (empty clean slate)
export function generateInitialProgress(): Record<string, PageProgressRecord> {
  return {};
}

// Service helper to save user profile
export async function saveUserProfileToFirestore(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user, { merge: true });
  } catch (err) {
    console.warn('Firestore write fallback to local storage:', err);
  }
}

// Service helper to save page progress
export async function savePageProgressToFirestore(record: PageProgressRecord): Promise<void> {
  try {
    const docRef = doc(db, 'page_progress', record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.warn('Firestore page progress write error:', err);
  }
}

// Service helper to log activity
export async function logActivityToFirestore(activity: Omit<ActivityItem, 'id'>): Promise<void> {
  try {
    const activitiesRef = collection(db, 'activities');
    await addDoc(activitiesRef, activity);
  } catch (err) {
    console.warn('Firestore activity write error:', err);
  }
}

// Service helper to log quiz result
export async function logQuizResultToFirestore(result: Omit<QuizResultRecord, 'id'>): Promise<void> {
  try {
    const quizRef = collection(db, 'quiz_results');
    await addDoc(quizRef, result);
  } catch (err) {
    console.warn('Firestore quiz result write error:', err);
  }
}

// Service helper to save reflection note
export async function saveReflectionNoteToFirestore(note: Omit<SharedReflectionNote, 'id'>): Promise<void> {
  try {
    const notesRef = collection(db, 'reflection_notes');
    await addDoc(notesRef, note);
  } catch (err) {
    console.warn('Firestore reflection note write error:', err);
  }
}
