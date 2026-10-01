// CreatorHQ Firebase Configuration & Firestore Bridge
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { CreatorProfile } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalDevelopment-CreatorHQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "creatorhq-network.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "creatorhq-network",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "creatorhq-network.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "89201928374",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:89201928374:web:01928471928",
};

// Initialize Firebase App safely (singleton)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = getFirestore(firebaseApp);
} catch (e) {
  console.warn('[Firebase] Firestore initialization notice:', e);
}

export const db = firestoreInstance;

/**
 * Save creator profile to Firebase Firestore (if online & configured)
 */
export async function syncCreatorToFirebase(creator: CreatorProfile): Promise<boolean> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return false;
  }
  const docId = creator.passportId || creator.id;
  if (!docId) return false;
  try {
    const creatorRef = doc(db, 'creators', docId);
    await setDoc(creatorRef, creator, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Firestore sync skipped (offline or credentials pending):', err);
    return false;
  }
}

/**
 * Delete creator from Firebase Firestore
 */
export async function deleteCreatorFromFirebase(passportId: string): Promise<boolean> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return false;
  }
  try {
    const creatorRef = doc(db, 'creators', passportId);
    await deleteDoc(creatorRef);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch all creators from Firebase Firestore
 */
export async function fetchCreatorsFromFirebase(): Promise<CreatorProfile[]> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return [];
  }
  try {
    const creatorsCol = collection(db, 'creators');
    const snapshot = await getDocs(creatorsCol);
    const list: CreatorProfile[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CreatorProfile);
    });
    return list;
  } catch (err) {
    return [];
  }
}
