/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';

// Support environment variables for Vercel/Production
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID
};

// Initialize Firebase SDK safely
let app: any;
let db: any;
let auth: any;

// Helper to check if config is usable
const isConfigValid = (c: any) => 
  !!c.apiKey && 
  c.apiKey !== 'undefined' && 
  c.apiKey !== 'null' && 
  c.apiKey.length > 10 &&
  !c.apiKey.includes('TODO') &&
  !c.apiKey.includes('YOUR_');

let finalConfig = { ...config };

// If env vars are missing, we'll try to initialize with a mock and let the UI handle it.
// In AI Studio, the set_up_firebase tool usually provides the config.
// If you are seeing "invalid-api-key", ensure your environment variables are set.

if (isConfigValid(finalConfig)) {
  try {
    app = initializeApp(finalConfig);
    db = getFirestore(app, finalConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    app = null;
  }
}

if (!app) {
  // Provide mock objects that won't crash the app on load, but will fail gracefully on use
  db = { 
    type: 'mock',
    _databaseId: { projectId: 'mock', database: 'mock' }
  };
  auth = {
    type: 'mock',
    onAuthStateChanged: (cb: any) => {
      setTimeout(() => cb(null), 0);
      return () => {};
    },
    currentUser: null
  };
}

export { db, auth };

// --- Types ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// --- Error Handler ---

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Connection Test ---

async function testConnection() {
  if (!app || db.type === 'mock') return;
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// --- Auth Helpers ---

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
  }
};

export const signIn = async (email: string, password: string) => {
  if (auth.type === 'mock') return { user: null, error: 'Firebase not initialized' };
  try {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Auth Error:', error);
    return { user: null, error: error.code || error.message };
  }
};

// --- Firestore Helpers ---

export const saveHighScore = async (userId: string, name: string, score: number) => {
  if (db.type === 'mock') return;
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentHighScore = userDoc.data().highScore || 0;
      if (score > currentHighScore) {
        await setDoc(userRef, { name, highScore: score, lastPlayed: new Date().toISOString() }, { merge: true });
      }
    } else {
      await setDoc(userRef, { name, highScore: score, lastPlayed: new Date().toISOString() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getLeaderboard = (callback: (entries: any[]) => void) => {
  if (db.type === 'mock') return () => {};
  const path = 'users';
  const q = query(collection(db, path), orderBy('highScore', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), score: doc.data().highScore }));
    callback(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const sendSabotage = async (targetName: string, type: 'BLUR' | 'INVERT' | 'SPEED_UP' | 'SHAKE' | 'DARKNESS' | 'MIRROR', duration: number = 15000) => {
  if (db.type === 'mock') return;
  const path = 'sabotages';
  try {
    await addDoc(collection(db, path), {
      targetName,
      type,
      duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export interface MatchPlayer {
  id: string;
  name: string;
  team: 'A' | 'B';
  score: number;
  health: number;
}

export interface Match {
  id: string;
  type: '1v1' | '2v2';
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Record<string, MatchPlayer>;
  createdAt: string;
}

export const createMatch = async (type: '1v1' | '2v2', hostId: string, hostName: string) => {
  if (db.type === 'mock') return null;
  const path = 'matches';
  
  // Generate a short 6-character alphanumeric ID
  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  try {
    const matchRef = doc(db, 'matches', shortId);
    await setDoc(matchRef, {
      type,
      status: 'WAITING',
      players: {
        [hostId]: { id: hostId, name: hostName, team: 'A', score: 0, health: 100 }
      },
      createdAt: new Date().toISOString()
    });
    return shortId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const joinMatch = async (matchId: string, userId: string, userName: string) => {
  if (db.type === 'mock') return false;
  const path = `matches/${matchId}`;
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    if (matchDoc.exists()) {
      const matchData = matchDoc.data() as Match;
      if (matchData.status !== 'WAITING') return false;
      
      const maxPlayers = matchData.type === '1v1' ? 2 : 4;
      const playersList = Object.values(matchData.players || {});
      if (playersList.length >= maxPlayers) return false;

      // Assign team
      const teamACount = playersList.filter(p => p.team === 'A').length;
      const teamBCount = playersList.filter(p => p.team === 'B').length;
      const team = teamACount <= teamBCount ? 'A' : 'B';

      await setDoc(matchRef, { 
        players: {
          [userId]: { id: userId, name: userName, team, score: 0, health: 100 }
        },
        status: playersList.length + 1 === maxPlayers ? 'PLAYING' : 'WAITING'
      }, { merge: true });
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const listenToMatch = (matchId: string, callback: (match: Match | null) => void) => {
  if (db.type === 'mock') return () => {};
  const path = `matches/${matchId}`;
  return onSnapshot(doc(db, 'matches', matchId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Match);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const updateMatchPlayer = async (matchId: string, userId: string, updates: Partial<MatchPlayer>) => {
  if (db.type === 'mock') return;
  const path = `matches/${matchId}`;
  try {
    const matchRef = doc(db, 'matches', matchId);
    const updatePayload: any = {};
    for (const [key, value] of Object.entries(updates)) {
      updatePayload[`players.${userId}.${key}`] = value;
    }
    // Use setDoc with merge to avoid needing updateDoc which fails if doc doesn't exist
    await setDoc(matchRef, { players: { [userId]: updates } }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
