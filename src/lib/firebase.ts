// CreatorHQ Firebase Firestore Configuration & Data Store
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CreatorProfile,
  VerificationSubmission,
  User,
  Session,
  AuditLog,
} from './types';

// Initialize Firebase App safely (singleton)
export const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const db: Firestore = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(firebaseApp);

export function isFirebaseConfigured(): boolean {
  return Boolean(
    db &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('Dummy')
  );
}

// Helper to remove undefined fields which Firestore rejects
function sanitizeForFirestore<T>(data: T): Record<string, any> {
  const json = JSON.stringify(data, (key, value) => (value === undefined ? null : value));
  return JSON.parse(json);
}

// ==========================================
// CREATORS FIRESTORE OPERATIONS
// ==========================================

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
    console.warn('[Firebase] fetchCreatorsFromFirebase error:', err);
    return [];
  }
}

export async function syncCreatorToFirebase(creator: CreatorProfile): Promise<boolean> {
  if (!db) return false;
  const docId = (creator.slug || creator.username || creator.passportId || creator.id || '')
    .toLowerCase()
    .replace(/^@/, '')
    .trim();
  if (!docId) return false;

  try {
    const creatorRef = doc(db, 'creators', docId);
    await setDoc(creatorRef, sanitizeForFirestore(creator), { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] syncCreatorToFirebase error:', err);
    return false;
  }
}

export async function deleteCreatorFromFirebase(target: string): Promise<boolean> {
  if (!db) return false;
  const cleanId = target.toLowerCase().replace(/^@/, '').trim();
  try {
    // Delete primary doc
    const creatorRef = doc(db, 'creators', cleanId);
    await deleteDoc(creatorRef);

    // Also look up any other docs that might match slug or username
    try {
      const q = query(collection(db, 'creators'), where('slug', '==', cleanId));
      const snap = await getDocs(q);
      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {}

    return true;
  } catch (err) {
    console.warn('[Firebase] deleteCreatorFromFirebase error:', err);
    return false;
  }
}

// ==========================================
// VERIFICATIONS FIRESTORE OPERATIONS
// ==========================================

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
    console.warn('[Firebase] fetchVerificationsFromFirebase error:', err);
    return [];
  }
}

export async function syncVerificationToFirebase(submission: VerificationSubmission): Promise<boolean> {
  if (!db) return false;
  const docId = submission.id || `vrf_${submission.creatorSlug.toLowerCase().replace(/^@/, '')}`;
  try {
    const vrfRef = doc(db, 'verifications', docId);
    await setDoc(vrfRef, sanitizeForFirestore(submission), { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] syncVerificationToFirebase error:', err);
    return false;
  }
}

export async function deleteVerificationFromFirebase(idOrSlug: string): Promise<boolean> {
  if (!db) return false;
  const clean = idOrSlug.toLowerCase().replace(/^@/, '').trim();
  try {
    await deleteDoc(doc(db, 'verifications', clean));
    await deleteDoc(doc(db, 'verifications', `vrf_${clean}`));

    // Also clean by creatorSlug query
    const q = query(collection(db, 'verifications'), where('creatorSlug', '==', clean));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    return true;
  } catch (err) {
    return false;
  }
}

// ==========================================
// USERS FIRESTORE OPERATIONS
// ==========================================

export async function fetchUsersFromFirebase(): Promise<User[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach((d) => {
      const u = d.data() as User;
      if (u && u.id) list.push(u);
    });
    return list;
  } catch (e) {
    return [];
  }
}

export async function getUserByIdFromFirebase(id: string): Promise<User | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', id));
    if (snap.exists()) return snap.data() as User;

    const q = query(collection(db, 'users'), where('id', '==', id), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) return querySnap.docs[0].data() as User;
    return null;
  } catch (e) {
    return null;
  }
}

export async function getUserByEmailFromFirebase(email: string): Promise<User | null> {
  if (!db || !email) return null;
  const clean = email.toLowerCase().trim();
  try {
    const q = query(collection(db, 'users'), where('email', '==', clean), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as User;
    return null;
  } catch (e) {
    return null;
  }
}

export async function getUserByUsernameFromFirebase(username: string): Promise<User | null> {
  if (!db || !username) return null;
  const clean = username.toLowerCase().replace(/^@/, '').trim();
  try {
    const q = query(collection(db, 'users'), where('username', '==', clean), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as User;
    return null;
  } catch (e) {
    return null;
  }
}

export async function saveUserToFirebase(user: User): Promise<boolean> {
  if (!db || !user.id) return false;
  try {
    await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
    return true;
  } catch (e) {
    console.warn('[Firebase] saveUserToFirebase error:', e);
    return false;
  }
}

export async function deleteUserFromFirebase(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'users', id));
    return true;
  } catch (e) {
    return false;
  }
}

// ==========================================
// SESSIONS FIRESTORE OPERATIONS
// ==========================================

export async function getSessionFromFirebase(token: string): Promise<Session | null> {
  if (!db || !token) return null;
  try {
    const snap = await getDoc(doc(db, 'sessions', token));
    if (snap.exists()) return snap.data() as Session;

    const q = query(collection(db, 'sessions'), where('token', '==', token), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) return querySnap.docs[0].data() as Session;
    return null;
  } catch (e) {
    return null;
  }
}

export async function saveSessionToFirebase(session: Session): Promise<boolean> {
  if (!db || !session.token) return false;
  try {
    await setDoc(doc(db, 'sessions', session.token), sanitizeForFirestore(session), { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

export async function deleteSessionFromFirebase(token: string): Promise<boolean> {
  if (!db || !token) return false;
  try {
    await deleteDoc(doc(db, 'sessions', token));
    return true;
  } catch (e) {
    return false;
  }
}

// ==========================================
// AUDIT LOGS FIRESTORE OPERATIONS
// ==========================================

export async function fetchAuditLogsFromFirebase(): Promise<AuditLog[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(200));
    const snap = await getDocs(q);
    const list: AuditLog[] = [];
    snap.forEach((d) => {
      const item = d.data() as AuditLog;
      if (item && item.action) list.push(item);
    });
    return list;
  } catch (e) {
    // If index isn't ready, fallback to simple fetch
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      const list: AuditLog[] = [];
      snap.forEach((d) => {
        const item = d.data() as AuditLog;
        if (item && item.action) list.push(item);
      });
      return list.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 200);
    } catch (err) {
      return [];
    }
  }
}

export async function addAuditLogToFirebase(log: AuditLog): Promise<boolean> {
  if (!db || !log.id) return false;
  try {
    await setDoc(doc(db, 'auditLogs', log.id), sanitizeForFirestore(log), { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}
