import fs from 'fs';
import path from 'path';
import os from 'os';
import { 
  CreatorProfile, 
  VerificationSubmission, 
  ProofDocument, 
  VerificationStatus,
  User,
  Session,
  AuditLog
} from './types';
import { 
  syncCreatorToFirebase, 
  deleteCreatorFromFirebase,
  syncVerificationToFirebase,
} from './firebase';
import { 
  fetchFromCloudStore, 
  pushCreatorsToCloudStore, 
  pushVerificationsToCloudStore 
} from './cloudStore';
import { resolveYouTubeUrl, resolveDiscordUrl, resolveInstagramUrl } from './urls';
import { notifySubscribers } from './events';

// Data directory
const SEED_DIR = path.join(process.cwd(), 'data');
const SEED_DB_FILE = path.join(SEED_DIR, 'creators.json');
const SEED_VERIFICATION_FILE = path.join(SEED_DIR, 'verifications.json');
const SEED_USERS_FILE = path.join(SEED_DIR, 'users.json');
const SEED_SESSIONS_FILE = path.join(SEED_DIR, 'sessions.json');
const SEED_AUDIT_LOGS_FILE = path.join(SEED_DIR, 'audit_logs.json');

// In-memory caches for high-performance sub-millisecond access
let memoryCreators: CreatorProfile[] = [];
let memoryVerifications: VerificationSubmission[] = [];
let memoryUsers: User[] = [];
let memorySessions: Session[] = [];
let memoryAuditLogs: AuditLog[] = [];
let isLoaded = false;
let areVerificationsLoaded = false;

function canonicalVerificationStatus(creator: Partial<CreatorProfile>): VerificationStatus {
  const status = creator.verification_status;
  if (status === 'VERIFIED' || status === 'REJECTED' || status === 'UNDER_REVIEW' || status === 'PENDING' || status === 'UNVERIFIED') {
    return status;
  }
  return creator.isVerified ? 'VERIFIED' : 'PENDING';
}

function normalizeCreatorVerification<T extends CreatorProfile>(creator: T): T {
  const status = canonicalVerificationStatus(creator);
  return { ...creator, verification_status: status, isVerified: status === 'VERIFIED' };
}

function mergeIncomingVerifications(incoming: VerificationSubmission[]): void {
  for (const verification of incoming) {
    const idx = memoryVerifications.findIndex(
      (item) => item.id === verification.id || item.creatorSlug.toLowerCase() === verification.creatorSlug.toLowerCase()
    );
    if (idx < 0) {
      memoryVerifications.push(verification);
      continue;
    }
    const existing = memoryVerifications[idx];
    const existingReviewTime = existing.reviewedAt ? Date.parse(existing.reviewedAt) : 0;
    const incomingReviewTime = verification.reviewedAt ? Date.parse(verification.reviewedAt) : 0;
    if (incomingReviewTime >= existingReviewTime) {
      memoryVerifications[idx] = { ...existing, ...verification };
    }
  }
}

function applyReviewedVerificationStatuses(): void {
  for (const verification of memoryVerifications) {
    if (!verification.reviewedAt) continue;
    const reviewedAt = Date.parse(verification.reviewedAt);
    const creatorIndex = memoryCreators.findIndex((creator) =>
      creator.slug.toLowerCase() === verification.creatorSlug.toLowerCase() ||
      creator.username.toLowerCase() === verification.creatorSlug.toLowerCase() ||
      (!!verification.creatorId && creator.id === verification.creatorId) ||
      (!!verification.userId && creator.userId === verification.userId)
    );
    if (creatorIndex < 0) continue;

    const creator = memoryCreators[creatorIndex];
    const currentReviewAt = creator.verificationReviewedAt ? Date.parse(creator.verificationReviewedAt) : 0;
    if (reviewedAt > currentReviewAt) {
      memoryCreators[creatorIndex] = normalizeCreatorVerification({
        ...creator,
        verification_status: verification.status,
        isVerified: verification.status === 'VERIFIED',
        verificationReviewedAt: verification.reviewedAt,
        rejectionReason: verification.status === 'REJECTED' ? verification.rejectionReason : undefined,
      });
    }
  }
}

export function getWritablePaths() {
  const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.AWS_LAMBDA_FUNCTION_NAME || 
    process.env.NOW_REGION
  );

  if (isServerless) {
    const tmpDataDir = path.join(os.tmpdir(), 'creator-passport-data');
    return {
      dataDir: tmpDataDir,
      dbFile: path.join(tmpDataDir, 'creators.json'),
      verificationFile: path.join(tmpDataDir, 'verifications.json'),
      usersFile: path.join(tmpDataDir, 'users.json'),
      sessionsFile: path.join(tmpDataDir, 'sessions.json'),
      auditLogsFile: path.join(tmpDataDir, 'audit_logs.json'),
      proofsDir: path.join(tmpDataDir, 'proofs'),
      isTmp: true,
    };
  }

  return {
    dataDir: SEED_DIR,
    dbFile: SEED_DB_FILE,
    verificationFile: SEED_VERIFICATION_FILE,
    usersFile: SEED_USERS_FILE,
    sessionsFile: SEED_SESSIONS_FILE,
    auditLogsFile: SEED_AUDIT_LOGS_FILE,
    proofsDir: path.join(SEED_DIR, 'proofs'),
    isTmp: false,
  };
}

function ensureDataFile() {
  try {
    const paths = getWritablePaths();
    if (!fs.existsSync(paths.dataDir)) {
      fs.mkdirSync(paths.dataDir, { recursive: true });
    }

    const filesToInit: Array<{ file: string; seed: string; defaultVal: any }> = [
      { file: paths.dbFile, seed: SEED_DB_FILE, defaultVal: [] },
      { file: paths.verificationFile, seed: SEED_VERIFICATION_FILE, defaultVal: [] },
      { file: paths.usersFile, seed: SEED_USERS_FILE, defaultVal: [] },
      { file: paths.sessionsFile, seed: SEED_SESSIONS_FILE, defaultVal: [] },
      { file: paths.auditLogsFile, seed: SEED_AUDIT_LOGS_FILE, defaultVal: [] },
    ];

    for (const item of filesToInit) {
      if (!fs.existsSync(item.file)) {
        if (paths.isTmp && fs.existsSync(item.seed)) {
          try {
            fs.copyFileSync(item.seed, item.file);
          } catch (e) {
            fs.writeFileSync(item.file, JSON.stringify(item.defaultVal, null, 2), 'utf8');
          }
        } else {
          fs.writeFileSync(item.file, JSON.stringify(item.defaultVal, null, 2), 'utf8');
        }
      }
    }

    if (!fs.existsSync(paths.proofsDir)) {
      fs.mkdirSync(paths.proofsDir, { recursive: true });
    }
  } catch (err) {
    console.error('[DB] Error ensuring data directory/file:', err);
  }
}

// ==========================================
// USER ACCOUNTS
// ==========================================

export function getUsersDB(): User[] {
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    let content = '';
    if (fs.existsSync(paths.usersFile)) {
      content = fs.readFileSync(paths.usersFile, 'utf8');
    } else if (fs.existsSync(SEED_USERS_FILE)) {
      content = fs.readFileSync(SEED_USERS_FILE, 'utf8');
    }
    if (content) {
      memoryUsers = JSON.parse(content || '[]');
    }
  } catch (err) {
    console.error('[DB] Error loading users:', err);
  }
  return memoryUsers;
}

export function saveUsersDB(users: User[]): boolean {
  memoryUsers = users;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.usersFile, JSON.stringify(users, null, 2), 'utf8');
    if (!paths.isTmp || fs.existsSync(SEED_USERS_FILE)) {
      try {
        fs.writeFileSync(SEED_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.error('[DB] Error saving users:', err);
    return false;
  }
}

export function getUserByIdDB(id: string): User | null {
  const users = getUsersDB();
  return users.find((u) => u.id === id) || null;
}

export function getUserByEmailDB(email: string): User | null {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  const users = getUsersDB();
  return users.find((u) => u.email.toLowerCase() === clean) || null;
}

export function getUserByUsernameDB(username: string): User | null {
  if (!username) return null;
  const clean = username.toLowerCase().replace(/^@/, '').trim();
  const users = getUsersDB();
  return users.find((u) => u.username.toLowerCase() === clean) || null;
}

export function createUserDB(user: User): User {
  const users = getUsersDB();
  // Ensure uniqueness
  const emailTaken = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (emailTaken) {
    throw new Error('An account with this email address already exists.');
  }
  const userTaken = users.some((u) => u.username.toLowerCase() === user.username.toLowerCase());
  if (userTaken) {
    throw new Error('This username is already taken. Please choose another.');
  }

  const updated = [...users, user];
  saveUsersDB(updated);
  return user;
}

export function updateUserDB(id: string, updates: Partial<User>): User | null {
  const users = getUsersDB();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const current = users[idx];
  const updatedUser: User = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  users[idx] = updatedUser;
  saveUsersDB(users);
  return updatedUser;
}

export async function deleteUserDB(id: string): Promise<boolean> {
  const users = getUsersDB();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length !== users.length) {
    saveUsersDB(filtered);
    deleteUserSessionsDB(id);
    await deleteCreatorByUserIdDB(id);
    return true;
  }
  return false;
}

// ==========================================
// SECURE SESSIONS
// ==========================================

export function getSessionsDB(): Session[] {
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    let content = '';
    if (fs.existsSync(paths.sessionsFile)) {
      content = fs.readFileSync(paths.sessionsFile, 'utf8');
    } else if (fs.existsSync(SEED_SESSIONS_FILE)) {
      content = fs.readFileSync(SEED_SESSIONS_FILE, 'utf8');
    }
    if (content) {
      memorySessions = JSON.parse(content || '[]');
    }
  } catch (err) {
    console.error('[DB] Error loading sessions:', err);
  }
  return memorySessions;
}

export function saveSessionsDB(sessions: Session[]): boolean {
  memorySessions = sessions;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.sessionsFile, JSON.stringify(sessions, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DB] Error saving sessions:', err);
    return false;
  }
}

export function getSessionByTokenDB(token: string): Session | null {
  if (!token) return null;
  const sessions = getSessionsDB();
  return sessions.find((s) => s && (s.token === token || s.id === token)) || null;
}

export const getSessionDB = getSessionByTokenDB;

export function createSessionDB(session: Session): Session {
  const sessions = getSessionsDB();
  // Filter out expired sessions
  const now = Date.now();
  const valid = sessions.filter((s) => s && s.expiresAt && new Date(s.expiresAt).getTime() > now);
  valid.push(session);
  saveSessionsDB(valid);
  return session;
}

export function deleteSessionDB(token: string): boolean {
  const sessions = getSessionsDB();
  const filtered = sessions.filter((s) => s && s.token !== token && s.id !== token);
  saveSessionsDB(filtered);
  return true;
}

export function deleteUserSessionsDB(userId: string): boolean {
  const sessions = getSessionsDB();
  const filtered = sessions.filter((s) => s.userId !== userId);
  saveSessionsDB(filtered);
  return true;
}

// ==========================================
// AUDIT LOGS
// ==========================================

export function getAuditLogsDB(): AuditLog[] {
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    let content = '';
    if (fs.existsSync(paths.auditLogsFile)) {
      content = fs.readFileSync(paths.auditLogsFile, 'utf8');
    } else if (fs.existsSync(SEED_AUDIT_LOGS_FILE)) {
      content = fs.readFileSync(SEED_AUDIT_LOGS_FILE, 'utf8');
    }
    if (content) {
      memoryAuditLogs = JSON.parse(content || '[]');
    }
  } catch (e) {}
  return memoryAuditLogs;
}

export function addAuditLogDB(log: { userId?: string | null; action: string; actor: string; details?: any }): AuditLog {
  const logs = getAuditLogsDB();
  const entry: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: log.userId || null,
    action: log.action,
    actor: log.actor,
    details: log.details || null,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  try {
    const paths = getWritablePaths();
    fs.writeFileSync(paths.auditLogsFile, JSON.stringify(logs.slice(0, 500), null, 2), 'utf8');
  } catch (e) {}
  return entry;
}

// ==========================================
// CREATOR PROFILES & CARDS
// ==========================================

function mergeIncomingCreators(incoming: CreatorProfile[]): boolean {
  let changed = false;
  for (const c of incoming) {
    const clean = (c.slug || c.username || c.passportId || '').toLowerCase().replace(/^@/, '').trim();
    if (!clean) continue;
    const idx = memoryCreators.findIndex(
      (m) => (m.slug || m.username || m.passportId || '').toLowerCase().replace(/^@/, '').trim() === clean
    );
    if (idx === -1) {
      memoryCreators.push(normalizeCreatorVerification({
        ...c,
        connections: c.connections || {},
      }));
      changed = true;
    } else {
      memoryCreators[idx] = normalizeCreatorVerification({
        ...memoryCreators[idx],
        ...c,
        connections: {
          ...memoryCreators[idx].connections,
          ...(c.connections || {}),
        },
      });
    }
  }
  return changed;
}

export function loadCreatorsFromDisk(): CreatorProfile[] {
  if (isLoaded) return memoryCreators;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    let content = '';

    if (fs.existsSync(paths.dbFile)) {
      content = fs.readFileSync(paths.dbFile, 'utf8');
    } else if (fs.existsSync(SEED_DB_FILE)) {
      content = fs.readFileSync(SEED_DB_FILE, 'utf8');
    }

    if (content) {
      const parsed: CreatorProfile[] = JSON.parse(content || '[]');
      const diskList = parsed.map((c) => {
        const slug = (c.slug || c.passportId || c.username || 'creator')
          .toLowerCase()
          .replace(/^@/, '')
          .trim();
        return normalizeCreatorVerification({
          ...c,
          slug,
          handle: c.handle || `@${slug}`,
          passportId: c.passportId || slug,
          verification_status: c.verification_status || (c.isVerified ? 'VERIFIED' : 'PENDING'),
          connections: c.connections || {},
        });
      });

      memoryCreators = diskList;
      isLoaded = true;
    }
  } catch (err) {
    console.error('[DB] Error loading creators from disk:', err);
  }

  return memoryCreators;
}

export function saveCreatorsToDisk(creators: CreatorProfile[]): boolean {
  memoryCreators = creators.map((c) => normalizeCreatorVerification({
    ...c,
    connections: c.connections || {},
  }));
  isLoaded = true;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.dbFile, JSON.stringify(memoryCreators, null, 2), 'utf8');

    if (!paths.isTmp || fs.existsSync(SEED_DB_FILE)) {
      try {
        fs.writeFileSync(SEED_DB_FILE, JSON.stringify(memoryCreators, null, 2), 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.error('[DB] Error saving creators to disk:', err);
  }

  // Sync to persistent cloud database in background
  pushCreatorsToCloudStore(memoryCreators).catch((err) => {
    console.warn('[DB] Cloud sync notice:', err);
  });

  return true;
}

export function getAllCreatorsDB(): CreatorProfile[] {
  loadCreatorsFromDisk();
  return memoryCreators.map((c) => ({
    ...c,
    connections: c.connections || {},
  }));
}

export async function getAllCreatorsDBAsync(): Promise<CreatorProfile[]> {
  getAllCreatorsDB();
  try {
    const cloud = await fetchFromCloudStore();
    if (cloud.hasCreatorSnapshot) {
      if (cloud.creators.length > 0) {
        mergeIncomingCreators(cloud.creators);
      } else {
        memoryCreators = [];
      }
    }
    mergeIncomingVerifications(cloud.verifications || []);
    applyReviewedVerificationStatuses();
  } catch (e) {}
  return memoryCreators.map((c) => ({ ...c, connections: c.connections || {} }));
}

export function getCreatorByUserIdDB(userId: string): CreatorProfile | null {
  if (!userId) return null;
  const all = getAllCreatorsDB();
  const found = all.find((c) => c.userId === userId);
  if (!found) return null;
  return { ...found, connections: found.connections || {} };
}

export function getCreatorBySlugDB(slug: string): CreatorProfile | null {
  const all = getAllCreatorsDB();
  const clean = slug.replace(/^@/, '').toLowerCase().trim();
  const found = all.find((c) => 
    (c.slug && c.slug.toLowerCase() === clean) || 
    (c.username && c.username.toLowerCase() === clean) ||
    (c.passportId && c.passportId.toLowerCase() === clean) ||
    (c.handle && c.handle.toLowerCase().replace(/^@/, '') === clean) ||
    (c.id && c.id.toLowerCase() === clean)
  );
  if (!found) return null;
  return { ...found, connections: found.connections || {} };
}

export function getCreatorByIdDB(target: string): CreatorProfile | null {
  const all = getAllCreatorsDB();
  const raw = target.trim().toLowerCase();
  const clean = raw.replace(/^@/, '');

  const found = all.find((c) => {
    const cSlug = (c.slug || '').toLowerCase();
    const cHandle = (c.handle || '').toLowerCase().replace(/^@/, '');
    const cUser = (c.username || '').toLowerCase();
    const cPass = (c.passportId || '').toLowerCase();
    const cId = (c.id || '').toLowerCase();
    const cUserId = (c.userId || '').toLowerCase();

    return (
      cSlug === clean ||
      cHandle === clean ||
      cUser === clean ||
      cPass === clean ||
      cId === raw ||
      cUserId === raw
    );
  });
  if (!found) return null;
  return { ...found, connections: found.connections || {} };
}

export async function getCreatorByIdDBAsync(target: string): Promise<CreatorProfile | null> {
  getAllCreatorsDB();

  try {
    const cloud = await fetchFromCloudStore();
    if (cloud.creators && cloud.creators.length > 0) {
      mergeIncomingCreators(cloud.creators);
      return getCreatorByIdDB(target);
    }
  } catch (e) {}

  return getCreatorByIdDB(target);
}

export function getCreatorByUsernameDB(username: string): CreatorProfile | null {
  return getCreatorByIdDB(username);
}

export async function addCreatorDB(creator: CreatorProfile): Promise<CreatorProfile> {
  const current = getAllCreatorsDB();

  // Normalize slug, handle, and niche — use slug as the primary identifier
  const rawSlug = (creator.slug || creator.username || 'creator').toLowerCase().replace(/^@/, '').trim();
  const cleanSlug = rawSlug.replace(/[^a-z0-9_-]/g, '') || 'creator';
  creator.slug = cleanSlug;
  creator.username = creator.username ? creator.username.toLowerCase().replace(/^@/, '') : cleanSlug;
  creator.handle = creator.handle || `@${cleanSlug}`;
  creator.passportId = cleanSlug;
  creator.niche = creator.niche || creator.category || 'Creator';
  creator.category = creator.niche;
  if (!creator.id || creator.id === 'user_my_pass') {
    creator.id = `creator_${cleanSlug}`;
  }

  // Find existing by userId or slug
  const existingIdx = current.findIndex(
    (c) =>
      (creator.userId && c.userId && c.userId === creator.userId) ||
      (c.slug && c.slug.toLowerCase() === cleanSlug) ||
      (c.username && c.username.toLowerCase() === creator.username.toLowerCase()) ||
      (c.id && creator.id && c.id.toLowerCase() === creator.id.toLowerCase())
  );

  let updatedList: CreatorProfile[];
  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const merged: CreatorProfile = {
      ...existing,
      ...creator,
      id: existing.id || `creator_${cleanSlug}`,
      userId: existing.userId || creator.userId,
      slug: cleanSlug,
      handle: `@${cleanSlug}`,
      passportId: cleanSlug,
      digitalSignature: existing.digitalSignature || creator.digitalSignature,
      category: creator.category || existing.category,
      niche: creator.niche || existing.niche || creator.category,
      verification_status: creator.verification_status || existing.verification_status || (creator.isVerified || existing.isVerified ? 'VERIFIED' : 'PENDING'),
      isVerified: (creator.verification_status || existing.verification_status || (creator.isVerified || existing.isVerified ? 'VERIFIED' : 'PENDING')) === 'VERIFIED',
      proofDocuments: creator.proofDocuments || existing.proofDocuments || [],
      connections: {
        ...existing.connections,
        ...creator.connections,
      },
      moreChannels: Array.isArray(creator.moreChannels)
        ? creator.moreChannels
        : existing.moreChannels || [],
      quickInfo: creator.quickInfo || existing.quickInfo,
    };
    current[existingIdx] = merged;
    updatedList = [...current];
  } else {
    updatedList = [creator, ...current];
  }

  saveCreatorsToDisk(updatedList);

  // Automatically sync creator proof and verification entry
  try {
    syncCreatorToVerificationDB(existingIdx >= 0 ? current[existingIdx] : creator);
  } catch (e) {}

  // Sync to Firebase in background
  try {
    syncCreatorToFirebase(existingIdx >= 0 ? current[existingIdx] : creator);
  } catch (e) {}

  return existingIdx >= 0 ? memoryCreators[existingIdx] : memoryCreators[0];
}

export async function deleteCreatorDB(targets: string[]): Promise<boolean> {
  const current = await getAllCreatorsDBAsync();
  const cleanTargets = targets.map((t) => t.trim().toLowerCase().replace(/^@/, ''));

  const remaining = current.filter((c) => {
    const cSlug = (c.slug || '').toLowerCase();
    const cHandle = (c.handle || '').toLowerCase().replace(/^@/, '');
    const cUser = (c.username || '').toLowerCase();
    const cPass = (c.passportId || '').toLowerCase();
    const cId = (c.id || '').toLowerCase();
    const cUserId = (c.userId || '').toLowerCase();

    const matches = cleanTargets.some(
      (t) =>
        t === cSlug ||
        t === cHandle ||
        t === cUser ||
        t === cPass ||
        t === cId ||
        t === cUserId
    );
    return !matches;
  });

  const changed = remaining.length !== current.length;
  if (changed) {
    saveCreatorsToDisk(remaining);
    const cloudSaved = await pushCreatorsToCloudStore(remaining);
    if (process.env.VERCEL && !cloudSaved && current.length > 0) {
      throw new Error('Creator was removed locally, but cloud storage could not save the deletion. Configure GITHUB_DATA_TOKEN or Firebase sync to keep it deleted.');
    }

    // Also clean up related verifications and proofs
    for (const t of cleanTargets) {
      await deleteVerificationByCreatorSlugDB(t);
      try {
        await deleteCreatorFromFirebase(t);
      } catch (e) {}
    }
  }

  return changed;
}

export async function deleteCreatorByUserIdDB(userId: string): Promise<boolean> {
  if (!userId) return false;
  return deleteCreatorDB([userId]);
}

// ==========================================
// VERIFICATION SUBMISSIONS DATABASE
// ==========================================

export function loadVerificationsFromDisk(): VerificationSubmission[] {
  if (areVerificationsLoaded) return memoryVerifications;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    let content = '';

    if (fs.existsSync(paths.verificationFile)) {
      content = fs.readFileSync(paths.verificationFile, 'utf8');
    } else if (fs.existsSync(SEED_VERIFICATION_FILE)) {
      content = fs.readFileSync(SEED_VERIFICATION_FILE, 'utf8');
    }

    if (content) {
      memoryVerifications = JSON.parse(content || '[]');
      areVerificationsLoaded = true;
    }
  } catch (err) {
    console.error('[DB] Error loading verifications from disk:', err);
  }

  return memoryVerifications;
}

export function saveVerificationsToDisk(submissions: VerificationSubmission[]): boolean {
  memoryVerifications = submissions;
  areVerificationsLoaded = true;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.verificationFile, JSON.stringify(submissions, null, 2), 'utf8');

    if (!paths.isTmp || fs.existsSync(SEED_VERIFICATION_FILE)) {
      try {
        fs.writeFileSync(SEED_VERIFICATION_FILE, JSON.stringify(submissions, null, 2), 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.error('[DB] Error saving verifications to disk:', err);
  }

  pushVerificationsToCloudStore(submissions).catch((err) => {
    console.warn('[DB] Cloud sync notice (verifications):', err);
  });

  return true;
}

export function getAllVerificationsDB(): VerificationSubmission[] {
  loadVerificationsFromDisk();
  return memoryVerifications;
}

export async function getAllVerificationsDBAsync(): Promise<VerificationSubmission[]> {
  getAllVerificationsDB();
  try {
    const cloud = await fetchFromCloudStore();
    mergeIncomingVerifications(cloud.verifications || []);
    applyReviewedVerificationStatuses();
  } catch (e) {}
  return memoryVerifications;
}

export function submitVerificationDB(submission: any): VerificationSubmission {
  const all = getAllVerificationsDB();
  const sub: VerificationSubmission = {
    ...submission,
    id: submission.id || `vrf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: submission.status || 'PENDING',
    submittedAt: submission.submittedAt || new Date().toISOString(),
    proofDocuments: submission.proofDocuments || [],
  };
  all.unshift(sub);
  saveVerificationsToDisk(all);
  return sub;
}


export function getVerificationByIdDB(target: string): VerificationSubmission | null {
  const all = getAllVerificationsDB();
  const clean = target.trim().toLowerCase().replace(/^@/, '');
  return (
    all.find(
      (v) =>
        v.id.toLowerCase() === clean ||
        v.creatorSlug.toLowerCase() === clean ||
        v.creatorHandle.toLowerCase().replace(/^@/, '') === clean ||
        (v.creatorId && v.creatorId.toLowerCase() === clean) ||
        (v.userId && v.userId.toLowerCase() === clean)
    ) || null
  );
}

export async function deleteVerificationByCreatorSlugDB(slug: string): Promise<boolean> {
  const clean = slug.toLowerCase().replace(/^@/, '').trim();
  const all = await getAllVerificationsDBAsync();
  const filtered = all.filter((v) => v.creatorSlug.toLowerCase() !== clean);
  if (filtered.length !== all.length) {
    saveVerificationsToDisk(filtered);
    const cloudSaved = await pushVerificationsToCloudStore(filtered);
    if (process.env.VERCEL && !cloudSaved && all.length > 0) {
      throw new Error('Verification data was removed locally, but cloud storage could not save the deletion. Configure GITHUB_DATA_TOKEN or Firebase sync to keep it deleted.');
    }
    return true;
  }
  return false;
}

export function addVerificationDB(submission: VerificationSubmission): VerificationSubmission {
  const all = getAllVerificationsDB();
  const cleanSlug = submission.creatorSlug.toLowerCase().replace(/^@/, '');
  submission.creatorSlug = cleanSlug;
  submission.id = submission.id || `vrf_${cleanSlug}`;

  const idx = all.findIndex(
    (v) => v.id === submission.id || v.creatorSlug.toLowerCase() === cleanSlug
  );

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...submission };
  } else {
    all.unshift(submission);
  }

  saveVerificationsToDisk(all);

  try {
    syncVerificationToFirebase(submission);
  } catch (e) {}

  return submission;
}

export function syncCreatorToVerificationDB(creator: CreatorProfile): VerificationSubmission | null {
  if (!creator) return null;
  const cleanSlug = (creator.slug || creator.username || '').toLowerCase().replace(/^@/, '').trim();
  if (!cleanSlug) return null;

  const allVerifs = getAllVerificationsDB();
  const existingIdx = allVerifs.findIndex((v) => v.creatorSlug.toLowerCase() === cleanSlug);

  const existingSub = existingIdx >= 0 ? allVerifs[existingIdx] : null;

  const submission: VerificationSubmission = {
    id: existingSub?.id || `vrf_${cleanSlug}`,
    creatorId: creator.id,
    userId: creator.userId,
    creatorSlug: cleanSlug,
    creatorName: creator.displayName || cleanSlug,
    creatorHandle: creator.handle || `@${cleanSlug}`,
    creatorAvatar: creator.avatarUrl,
    category: creator.category || creator.niche || 'Creator',
    platforms: Object.keys(creator.connections || {}).filter(
      (k) => (creator.connections as any)[k]?.connected
    ),
    connectedPlatforms: {
      youtube: creator.connections?.youtube?.connected
        ? {
            connected: true,
            metricValue: creator.connections.youtube.metricValue,
            username: creator.connections.youtube.username,
            proofScreenshot: creator.connections.youtube.proofScreenshot,
          }
        : undefined,
      discord: creator.connections?.discord?.connected
        ? {
            connected: true,
            metricValue: creator.connections.discord.metricValue,
            username: creator.connections.discord.username,
            proofScreenshot: creator.connections.discord.proofScreenshot,
          }
        : undefined,
      instagram: creator.connections?.instagram?.connected
        ? {
            connected: true,
            username: creator.connections.instagram.username,
          }
        : undefined,
    },
    proofDocuments: creator.proofDocuments || existingSub?.proofDocuments || [],
    status: creator.verification_status || existingSub?.status || 'PENDING',
    submittedAt: existingSub?.submittedAt || creator.issuedAt || new Date().toISOString(),
    reviewedAt: existingSub?.reviewedAt,
    reviewedBy: existingSub?.reviewedBy,
    rejectionReason: creator.rejectionReason || existingSub?.rejectionReason,
  };

  if (existingIdx >= 0) {
    allVerifs[existingIdx] = submission;
  } else {
    allVerifs.unshift(submission);
  }

  saveVerificationsToDisk(allVerifs);
  return submission;
}

export function updateVerificationStatusDB(
  targetIdentifier: string,
  status: VerificationStatus,
  reviewedBy: string = 'Admin',
  rejectionReason?: string,
  extraCreatorInfo?: Partial<CreatorProfile>
): { verification: VerificationSubmission | null; creator: CreatorProfile | null } {
  if (!targetIdentifier) {
    return { verification: null, creator: null };
  }
  const clean = targetIdentifier.trim().toLowerCase().replace(/^@/, '');
  const allVerifs = getAllVerificationsDB();
  const allCreators = getAllCreatorsDB();

  const vIdx = allVerifs.findIndex(
    (v) =>
      v.id.toLowerCase() === clean ||
      v.creatorSlug.toLowerCase() === clean ||
      v.creatorHandle.toLowerCase().replace(/^@/, '') === clean ||
      (v.creatorId && v.creatorId.toLowerCase() === clean) ||
      (v.userId && v.userId.toLowerCase() === clean)
  );

  const submission = vIdx >= 0 ? allVerifs[vIdx] : null;
  const aliases = new Set([clean]);
  if (submission) {
    [submission.creatorSlug, submission.creatorHandle, submission.creatorId, submission.userId]
      .filter(Boolean)
      .forEach((value) => aliases.add(String(value).toLowerCase().replace(/^@/, '')));
  }

  let cIdx = allCreators.findIndex(
    (c) =>
      aliases.has(c.id.toLowerCase()) ||
      aliases.has((c.slug || '').toLowerCase().replace(/^@/, '')) ||
      aliases.has((c.username || '').toLowerCase().replace(/^@/, '')) ||
      aliases.has((c.passportId || '').toLowerCase().replace(/^@/, '')) ||
      aliases.has((c.handle || '').toLowerCase().replace(/^@/, '')) ||
      aliases.has((c.userId || '').toLowerCase())
  );

  const canonicalSlug =
    (cIdx >= 0 ? allCreators[cIdx].slug : null) ||
    (submission ? submission.creatorSlug : null) ||
    clean;

  const isVerified = status === 'VERIFIED';
  let updatedCreator: CreatorProfile | null = null;

  if (cIdx >= 0) {
    if (extraCreatorInfo) {
      allCreators[cIdx] = { ...allCreators[cIdx], ...extraCreatorInfo };
    }
    allCreators[cIdx].verification_status = status;
    allCreators[cIdx].isVerified = isVerified;
    allCreators[cIdx].verificationReviewedAt = new Date().toISOString();
    if (isVerified) allCreators[cIdx].lastVerifiedAt = new Date().toISOString().split('T')[0];
    if (status === 'REJECTED') {
      allCreators[cIdx].rejectionReason = rejectionReason || 'Proof inconclusive';
    } else {
      allCreators[cIdx].rejectionReason = undefined;
    }
    saveCreatorsToDisk(allCreators);
    updatedCreator = allCreators[cIdx];
  } else if (vIdx >= 0) {
    const v = submission!;
    const synthesized: CreatorProfile = {
      id: v.creatorId || `creator_${canonicalSlug}`,
      userId: v.userId || `usr_${canonicalSlug}`,
      passportId: v.creatorSlug || canonicalSlug,
      slug: v.creatorSlug || canonicalSlug,
      handle: v.creatorHandle || `@${canonicalSlug}`,
      username: v.creatorSlug || canonicalSlug,
      displayName: v.creatorName || canonicalSlug,
      avatarUrl: v.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Creator on CreatorHQ',
      category: v.category || 'Creator',
      country: 'Global',
      location: 'Global',
      contactEmail: `${canonicalSlug}@creatorhq.fun`,
      issuedAt: v.submittedAt || new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString().split('T')[0],
      digitalSignature: `0x${Date.now().toString(16)}`,
      isSuspended: false,
      isVerified,
      verification_status: status,
      verificationReviewedAt: new Date().toISOString(),
      tierName: isVerified ? 'Founding Member Tier I' : 'Candidate Member',
      profileCompletion: 100,
      skills: ['Content Creator'],
      achievements: [],
      collaborations: [],
      portfolio: [],
      connections: (v.connectedPlatforms as any) || {},
    };
    allCreators.unshift(synthesized);
    saveCreatorsToDisk(allCreators);
    updatedCreator = synthesized;
  }

  let updatedSubmission: VerificationSubmission | null = null;
  if (vIdx >= 0) {
    allVerifs[vIdx].status = status;
    allVerifs[vIdx].reviewedAt = new Date().toISOString();
    allVerifs[vIdx].reviewedBy = reviewedBy || 'Admin';
    if (status === 'REJECTED') {
      allVerifs[vIdx].rejectionReason = rejectionReason || 'Proof inconclusive';
    } else {
      allVerifs[vIdx].rejectionReason = undefined;
    }
    saveVerificationsToDisk(allVerifs);
    updatedSubmission = allVerifs[vIdx];
  } else if (updatedCreator) {
    const newSub = syncCreatorToVerificationDB(updatedCreator);
    if (newSub) {
      newSub.status = status;
      newSub.reviewedAt = new Date().toISOString();
      newSub.reviewedBy = reviewedBy || 'Admin';
      if (status === 'REJECTED') {
        newSub.rejectionReason = rejectionReason || 'Proof inconclusive';
      }
      saveVerificationsToDisk(memoryVerifications);
      updatedSubmission = newSub;
    }
  }

  // Notify real-time SSE stream
  try {
    notifySubscribers({
      type: 'VERIFICATION_UPDATED',
      slug: updatedCreator?.slug || canonicalSlug,
      status: status,
      isVerified,
      creator: updatedCreator,
      verification: updatedSubmission,
    });
  } catch (e) {}

  return { verification: updatedSubmission, creator: updatedCreator };
}

// ==========================================
// PROOF DOCUMENT STORAGE
// ==========================================

export function saveProofDocumentDB(
  creatorSlug: string,
  filename: string,
  base64Data: string,
  mimeType: string = 'image/png',
  platform?: string,
  notes?: string
): ProofDocument | null {
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    const creatorProofsDir = path.join(paths.proofsDir, creatorSlug);
    if (!fs.existsSync(creatorProofsDir)) {
      fs.mkdirSync(creatorProofsDir, { recursive: true });
    }

    const docId = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ext = filename.split('.').pop() || 'png';
    const storedFilename = `${docId}.${ext}`;
    const storagePath = path.join(creatorProofsDir, storedFilename);

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(storagePath, buffer);

    const doc: ProofDocument = {
      id: docId,
      url: `/api/verification/proof/${creatorSlug}/${storedFilename}`,
      filename: filename,
      mimeType,
      fileSizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      platform,
      notes,
    };

    return doc;
  } catch (err) {
    console.error('[DB] Error saving proof document:', err);
    return null;
  }
}

export function getProofFilePath(creatorSlug: string, storedFilename: string): string | null {
  const paths = getWritablePaths();
  const filePath = path.join(paths.proofsDir, creatorSlug, storedFilename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  const seedPath = path.join(SEED_DIR, 'proofs', creatorSlug, storedFilename);
  if (fs.existsSync(seedPath)) {
    return seedPath;
  }
  return null;
}

// Initial load on server start
if (typeof window === 'undefined') {
  loadCreatorsFromDisk();
  loadVerificationsFromDisk();
  getUsersDB();
  getSessionsDB();
}
