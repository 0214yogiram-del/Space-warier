import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { authState, syncUserToFirestore } from './auth';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  level: number;
  updatedAt: string;
}

const LOCAL_LEADERBOARD_KEY = 'sw_local_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'bot_1', displayName: 'Captain Nova', score: 98500, level: 10, updatedAt: new Date().toISOString() },
  { userId: 'bot_2', displayName: 'StarVanguard', score: 74200, level: 8, updatedAt: new Date().toISOString() },
  { userId: 'bot_3', displayName: 'Hyperion7', score: 58900, level: 7, updatedAt: new Date().toISOString() },
  { userId: 'bot_4', displayName: 'CyberPhantom', score: 43500, level: 5, updatedAt: new Date().toISOString() },
  { userId: 'bot_5', displayName: 'NebulaSniper', score: 32100, level: 4, updatedAt: new Date().toISOString() },
  { userId: 'bot_6', displayName: 'SolarStriker', score: 21800, level: 3, updatedAt: new Date().toISOString() },
  { userId: 'bot_7', displayName: 'GalacticRookie', score: 12400, level: 2, updatedAt: new Date().toISOString() },
];

export const getLocalLeaderboard = (): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveLocalLeaderboard(DEFAULT_LEADERBOARD);
  return DEFAULT_LEADERBOARD;
};

export const saveLocalLeaderboard = (entries: LeaderboardEntry[]) => {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {}
};

// Helper to safely execute Firestore calls with fallback timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs))
  ]);
};

export const submitScoreToLeaderboard = async (score: number, level: number, earnedCoins: number): Promise<boolean> => {
  const user = authState.currentUser;
  
  // Update user stats
  user.coins += earnedCoins;
  if (score > user.highScore) {
    user.highScore = score;
  }
  if (level > user.level) {
    user.level = level;
  }
  user.updatedAt = new Date().toISOString();
  syncUserToFirestore(user).catch(() => {});

  // Update local leaderboard
  const list = getLocalLeaderboard();
  const existingIdx = list.findIndex(e => e.userId === user.userId);
  const entry: LeaderboardEntry = {
    userId: user.userId,
    displayName: user.displayName,
    score: Math.max(score, existingIdx >= 0 ? list[existingIdx].score : 0),
    level: Math.max(level, existingIdx >= 0 ? list[existingIdx].level : 1),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = entry;
  } else {
    list.push(entry);
  }
  list.sort((a, b) => b.score - a.score);
  saveLocalLeaderboard(list);

  // Sync to Firestore if available
  if (db) {
    try {
      const leaderRef = doc(db, 'leaderboard', user.userId);
      await withTimeout(setDoc(leaderRef, entry, { merge: true }), 3000);
      return true;
    } catch (e) {
      // Graceful offline fallback
    }
  }
  return true;
};

export const fetchLeaderboard = async (limitCount: number = 20): Promise<LeaderboardEntry[]> => {
  if (db) {
    try {
      const q = query(
        collection(db, 'leaderboard'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
      const snap = await withTimeout(getDocs(q), 2500);
      if (snap && !snap.empty) {
        const cloudEntries = snap.docs.map(d => d.data() as LeaderboardEntry);
        saveLocalLeaderboard(cloudEntries);
        return cloudEntries;
      }
    } catch (e) {
      // Fallback seamlessly to local archives
    }
  }
  return getLocalLeaderboard().slice(0, limitCount);
};

export const subscribeLeaderboard = (callback: (entries: LeaderboardEntry[]) => void, limitCount: number = 20) => {
  // Trigger initial with local
  callback(getLocalLeaderboard().slice(0, limitCount));

  if (db) {
    try {
      const q = query(
        collection(db, 'leaderboard'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
      return onSnapshot(q, (snap) => {
        const cloudEntries = snap.docs.map(d => d.data() as LeaderboardEntry);
        if (cloudEntries.length > 0) {
          saveLocalLeaderboard(cloudEntries);
          callback(cloudEntries);
        }
      }, (err) => {
        console.warn('Leaderboard subscription error:', err);
      });
    } catch (e) {
      console.warn('Leaderboard snapshot setup failed:', e);
    }
  }
  return () => {};
};
