// CreatorHQ Firebase Configuration & Firestore Bridge
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { CreatorProfile, VerificationSubmission } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalDevelopment-CreatorHQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "creatorhq-network.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "creatorhq-network",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "creatorhq-network.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "89201928374",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:89201928374:web:01928471928",
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

export function isFirebaseConfigured(): boolean {
  return Boolean(
    db && (
      Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
      Boolean(process.env.FIREBASE_PROJECT_ID) ||
      Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
    )
  );
}

/**
 * Save creator profile to Firebase Firestore (if online & configured)
 */
export async function syncCreatorToFirebase(creator: CreatorProfile): Promise<boolean> {
  if (!db) return false;
  const docId = (creator.passportId || creator.slug || creator.username || creator.id || '').toLowerCase().replace(/^@/, '');
  if (!docId) return false;
  try {
    const creatorRef = doc(db, 'creators', docId);
    await setDoc(creatorRef, JSON.parse(JSON.stringify(creator)), { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Firestore sync notice:', err);
    return false;
  }
}

/**
 * Delete creator from Firebase Firestore
 */
export async function deleteCreatorFromFirebase(passportId: string): Promise<boolean> {
  if (!db) return false;
  const docId = passportId.toLowerCase().replace(/^@/, '');
  try {
    const creatorRef = doc(db, 'creators', docId);
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
  if (!db) return [];
  try {
    const creatorsCol = collection(db, 'creators');
    const snapshot = await getDocs(creatorsCol);
    const list: CreatorProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as CreatorProfile;
      if (data && (data.passportId || data.username || data.slug || data.displayName)) {
        list.push({
          ...data,
          connections: data.connections || {},
        });
      }
    });
    return list;
  } catch (err) {
    return [];
  }
}

/**
 * Save verification submission to Firebase Firestore
 */
export async function syncVerificationToFirebase(submission: VerificationSubmission): Promise<boolean> {
  if (!db) return false;
  const docId = submission.id || `vrf_${submission.creatorSlug}`;
  if (!docId) return false;
  try {
    const vrfRef = doc(db, 'verifications', docId);
    await setDoc(vrfRef, JSON.parse(JSON.stringify(submission)), { merge: true });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch all verification submissions from Firebase Firestore
 */
export async function fetchVerificationsFromFirebase(): Promise<VerificationSubmission[]> {
  if (!db) return [];
  try {
    const vrfCol = collection(db, 'verifications');
    const snapshot = await getDocs(vrfCol);
    const list: VerificationSubmission[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as VerificationSubmission;
      if (data && data.creatorSlug) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    return [];
  }
}

/**
 * Delete verification submission from Firebase Firestore
 */
export async function deleteVerificationFromFirebase(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    const vrfRef = doc(db, 'verifications', id);
    await deleteDoc(vrfRef);
    return true;
  } catch (err) {
    return false;
  }
}
