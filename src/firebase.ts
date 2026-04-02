import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
  const path = `leaderboard`;
  try {
    await addDoc(collection(db, path), {
      userId,
      name,
      score,
      timestamp: new Date().toISOString()
    });
    
    // Also update user's high score
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentHighScore = userDoc.data().highScore || 0;
      if (score > currentHighScore) {
        await setDoc(userRef, { highScore: score, lastPlayed: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getLeaderboard = (callback: (entries: any[]) => void) => {
  const path = 'leaderboard';
  const q = query(collection(db, path), orderBy('score', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

export const listenForSabotages = (name: string, callback: (sabotage: any) => void) => {
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
