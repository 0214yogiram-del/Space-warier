import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface GameUser {
  userId: string;
  displayName: string;
  email: string | null;
  isAnonymous: boolean;
  highScore: number;
  coins: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_USER_KEY = 'sw_current_user_profile';

export const getStoredLocalUser = (): GameUser => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaultGuestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  const defaultUser: GameUser = {
    userId: defaultGuestId,
    displayName: 'Commander Ace',
    email: null,
    isAnonymous: true,
    highScore: 0,
    coins: 0,
    level: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalUser(defaultUser);
  return defaultUser;
};

export const saveLocalUser = (user: GameUser): void => {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } catch {}
};

export const authState = {
  currentUser: getStoredLocalUser(),
  firebaseUser: null as FirebaseUser | null,
  isAuthenticated: false,
  listeners: [] as ((user: GameUser) => void)[],
};

export const notifyAuthListeners = () => {
  authState.listeners.forEach((fn) => fn(authState.currentUser));
};

export const subscribeAuth = (cb: (user: GameUser) => void) => {
  authState.listeners.push(cb);
  cb(authState.currentUser);
  return () => {
    authState.listeners = authState.listeners.filter((fn) => fn !== cb);
  };
};

// Helper to safely execute Firestore calls with fallback timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs))
  ]);
};

// Initialize Firebase Auth Listener
if (auth) {
  onAuthStateChanged(auth, async (fbUser) => {
    authState.firebaseUser = fbUser;
    if (fbUser) {
      authState.isAuthenticated = true;
      let cloudProfile: Partial<GameUser> = {};
      if (db) {
        try {
          const userDoc = await withTimeout(getDoc(doc(db, 'users', fbUser.uid)), 2500);
          if (userDoc && userDoc.exists()) {
            cloudProfile = userDoc.data() as Partial<GameUser>;
          }
        } catch (e) {
          console.log('[Auth] Operating in local/offline profile mode');
        }
      }

      const existing = authState.currentUser;
      const updated: GameUser = {
        userId: fbUser.uid,
        displayName: fbUser.displayName || cloudProfile.displayName || existing.displayName || 'Space Ace',
        email: fbUser.email || null,
        isAnonymous: fbUser.isAnonymous,
        highScore: Math.max(existing.highScore || 0, cloudProfile.highScore || 0),
        coins: Math.max(existing.coins || 0, cloudProfile.coins || 0),
        level: Math.max(existing.level || 1, cloudProfile.level || 1),
        createdAt: cloudProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      authState.currentUser = updated;
      saveLocalUser(updated);
      syncUserToFirestore(updated).catch(() => {});
      notifyAuthListeners();
    }
  });
}

export const syncUserToFirestore = async (user: GameUser): Promise<void> => {
  saveLocalUser(user);
  if (!db || !auth || !auth.currentUser) return;
  try {
    const userRef = doc(db, 'users', user.userId);
    await withTimeout(setDoc(userRef, {
      userId: user.userId,
      displayName: user.displayName,
      email: user.email || '',
      highScore: user.highScore,
      coins: user.coins,
      level: user.level,
      updatedAt: new Date().toISOString(),
      createdAt: user.createdAt,
    }, { merge: true }), 3000);
  } catch (err) {
    // Graceful offline fallback
  }
};

export const loginAsGuest = async (customName?: string): Promise<GameUser> => {
  const current = authState.currentUser;
  const newName = customName?.trim() || current.displayName || 'Guest Fighter';
  
  if (auth) {
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: newName }).catch(() => {});
      }
    } catch {
      // Local fallback
    }
  }

  const updated: GameUser = {
    ...current,
    displayName: newName,
    isAnonymous: true,
    updatedAt: new Date().toISOString(),
  };
  authState.currentUser = updated;
  saveLocalUser(updated);
  notifyAuthListeners();
  return updated;
};

export const loginWithEmail = async (email: string, pass: string): Promise<GameUser> => {
  if (!auth) throw new Error('Firebase Auth not available');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  const updated: GameUser = {
    ...authState.currentUser,
    userId: user.uid,
    displayName: user.displayName || email.split('@')[0],
    email: user.email,
    isAnonymous: false,
    updatedAt: new Date().toISOString(),
  };
  authState.currentUser = updated;
  saveLocalUser(updated);
  notifyAuthListeners();
  return updated;
};

export const registerWithEmail = async (email: string, pass: string, displayName: string): Promise<GameUser> => {
  if (!auth) throw new Error('Firebase Auth not available');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  if (displayName) {
    await updateProfile(user, { displayName });
  }
  const updated: GameUser = {
    userId: user.uid,
    displayName: displayName || email.split('@')[0],
    email: user.email,
    isAnonymous: false,
    highScore: authState.currentUser.highScore || 0,
    coins: authState.currentUser.coins || 0,
    level: authState.currentUser.level || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  authState.currentUser = updated;
  await syncUserToFirestore(updated);
  notifyAuthListeners();
  return updated;
};

export const loginWithGoogle = async (): Promise<GameUser> => {
  if (!auth) throw new Error('Firebase Auth not available');
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;
  const updated: GameUser = {
    ...authState.currentUser,
    userId: user.uid,
    displayName: user.displayName || 'Google Pilot',
    email: user.email,
    isAnonymous: false,
    updatedAt: new Date().toISOString(),
  };
  authState.currentUser = updated;
  await syncUserToFirestore(updated);
  notifyAuthListeners();
  return updated;
};

export const logoutPlayer = async (): Promise<void> => {
  if (auth && auth.currentUser) {
    await signOut(auth).catch(() => {});
  }
  const guestUser = getStoredLocalUser();
  guestUser.userId = 'guest_' + Math.random().toString(36).substring(2, 9);
  guestUser.email = null;
  guestUser.isAnonymous = true;
  authState.currentUser = guestUser;
  saveLocalUser(guestUser);
  notifyAuthListeners();
};
