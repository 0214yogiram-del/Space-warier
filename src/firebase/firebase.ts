import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

// User-connected Firebase project configuration
export const firebaseConfig: FirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyArw204T_JhjimRhafLd7Afxr_4rkLAbbI",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "space-warier.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "space-warier",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "space-warier.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "822067596103",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:822067596103:web:cfb03b83949027d4c7da62"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);

  // Initialize Firestore with resilient auto-polling and local multi-tab cache
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true
      });
    } catch {
      db = getFirestore(app);
    }
  }

  isFirebaseConfigured = true;
  console.log('[Firebase] Successfully connected to project:', firebaseConfig.projectId);
} catch (err) {
  console.warn('Firebase initialization error, fallback mode active:', err);
}

export { app, auth, db, isFirebaseConfigured };

