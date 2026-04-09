/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';

// Default empty config to prevent build errors if file is missing
let firebaseConfig: any = {};
try {
  // @ts-ignore - This file might be ignored in git
  const configModule = await import('../firebase-applet-config.json');
  firebaseConfig = configModule.default || configModule;
} catch (e) {
  console.warn("Firebase config file not found, relying on environment variables.");
}

// Support environment variables for Vercel/Production
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId
};

// Initialize Firebase SDK
const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');
export const auth = getAuth();

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
  const path = 'matches';
  try {
    const docRef = await addDoc(collection(db, path), {
      type,
      status: 'WAITING',
      players: {
        [hostId]: { id: hostId, name: hostName, team: 'A', score: 0, health: 100 }
      },
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
};

export const joinMatch = async (matchId: string, userId: string, userName: string) => {
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
export const listenForSabotage = (name: string, callback: (sabotage: any) => void) => {
  const path = 'sabotages';
  const q = query(collection(db, path), where('targetName', '==', name), orderBy('timestamp', 'desc'), limit(1));
  
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const sabotage = snapshot.docs[0].data();
      // Only trigger if it's recent (within last 10 seconds)
      const sabotageTime = new Date(sabotage.timestamp).getTime();
      if (Date.now() - sabotageTime < 10000) {
        callback(sabotage);
        // Delete the sabotage doc after processing to avoid re-triggering
        deleteDoc(doc(db, 'sabotages', snapshot.docs[0].id)).catch(console.error);
      }
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
