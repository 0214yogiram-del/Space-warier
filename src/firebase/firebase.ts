import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

// Default demo / local fallback config
const defaultConfig: FirebaseConfig = {
  apiKey: "AIzaSyDemoKeyForLocalTestingOnly12345",
  authDomain: "space-warrior-arcade.firebaseapp.com",
  projectId: "space-warrior-arcade",
  storageBucket: "space-warrior-arcade.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

try {
  // Try loading runtime configuration if available
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(defaultConfig);
  }
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
} catch (err) {
  console.warn('Firebase initializing in local storage fallback mode:', err);
}

export { app, auth, db, isFirebaseConfigured };
