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
import { fetchFromCloudStore } from './cloudStore';
import { desc, eq, inArray } from 'drizzle-orm';
import { db as pg } from '../../db';
import { creators as creatorsTable, verifications as verificationsTable, appMeta } from '../../db/schema';
import {
  deleteFirestoreDocument,
  findFirestoreDocument,
  isFirebaseAdminStoreConfigured,
  listFirestoreDocuments,
  readFirestoreDocument,
  writeFirestoreDocument,
} from './firebaseAdminStore';
import { resolveYouTubeUrl, resolveDiscordUrl, resolveInstagramUrl } from './urls';
import { notifySubscribers } from './events';

// Data directory
const SEED_DIR = path.join(process.cwd(), 'data');
const SEED_DB_FILE = path.join(SEED_DIR, 'creators.json');
const SEED_VERIFICATION_FILE = path.join(SEED_DIR, 'verifications.json');
const SEED_USERS_FILE = path.join(SEED_DIR, 'users.json');
const SEED_SESSIONS_FILE = path.join(SEED_DIR, 'sessions.json');
const SEED_AUDIT_LOGS_FILE = path.join(SEED_DIR, 'audit_logs.json');

// In-memory caches (users/sessions only; creators & verifications are read from Netlify Database)
let memoryUsers: User[] = [];
let memorySessions: Session[] = [];
let memoryAuditLogs: AuditLog[] = [];

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

export async function getUserByIdPersistentDB(id: string): Promise<User | null> {
  const localUser = getUserByIdDB(id);
  if (!isFirebaseAdminStoreConfigured()) return process.env.VERCEL && localUser?.role !== 'ADMIN' ? null : localUser;

  const remoteUser = await readFirestoreDocument<User>('users', id);
  if (remoteUser) return remoteUser;
  return process.env.VERCEL && localUser?.role !== 'ADMIN' ? null : localUser;
}

export async function getUserByEmailPersistentDB(email: string): Promise<User | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (isFirebaseAdminStoreConfigured()) {
    const remoteUser = await findFirestoreDocument<User>('users', 'email', cleanEmail);
    if (remoteUser) return remoteUser;
  }
  const localUser = getUserByEmailDB(cleanEmail);
  return process.env.VERCEL && localUser?.role !== 'ADMIN' ? null : localUser;
}

export async function getUserByUsernamePersistentDB(username: string): Promise<User | null> {
  const cleanUsername = username.toLowerCase().replace(/^@/, '').trim();
  if (isFirebaseAdminStoreConfigured()) {
    const remoteUser = await findFirestoreDocument<User>('users', 'username', cleanUsername);
    if (remoteUser) return remoteUser;
  }
  const localUser = getUserByUsernameDB(cleanUsername);
  return process.env.VERCEL && localUser?.role !== 'ADMIN' ? null : localUser;
}

export async function getUserByResetTokenPersistentDB(token: string): Promise<User | null> {
  if (isFirebaseAdminStoreConfigured()) {
    return findFirestoreDocument<User>('users', 'resetToken', token);
  }
  return getUsersDB().find((user) => user.resetToken === token) || null;
}

export async function createUserPersistentDB(user: User): Promise<User> {
  if (process.env.VERCEL && !isFirebaseAdminStoreConfigured()) {
    throw new Error('Creator account storage is not configured. Add Firebase Admin service-account credentials in Vercel before signing up.');
  }
  createUserDB(user);
  if (isFirebaseAdminStoreConfigured()) {
    await writeFirestoreDocument('users', user.id, user as unknown as Record<string, unknown>);
  }
  return user;
}

export async function updateUserPersistentDB(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUserByIdPersistentDB(id);
  if (!user) return null;
  const updated: User = { ...user, ...updates, updatedAt: new Date().toISOString() };
  if (isFirebaseAdminStoreConfigured()) {
    await writeFirestoreDocument('users', id, updated as unknown as Record<string, unknown>);
  } else if (process.env.VERCEL && updated.role !== 'ADMIN') {
    throw new Error('Creator account storage is not configured.');
  }
  updateUserDB(id, updates);
  return updated;
}

export async function deleteUserPersistentDB(id: string): Promise<boolean> {
  if (isFirebaseAdminStoreConfigured()) await deleteFirestoreDocument('users', id);
  else if (process.env.VERCEL && getUserByIdDB(id)?.role !== 'ADMIN') {
    throw new Error('Creator account storage is not configured.');
  }
  return deleteUserDB(id);
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
// CREATOR PROFILES & CARDS (Netlify Database)
// ==========================================
//
// Creators and verifications live in Postgres so every server instance sees the
// same data. There is deliberately no in-memory cache here: stale per-instance
// copies were what caused deleted creators and verification changes to revert.

const LEGACY_IMPORT_KEY = 'legacy_import_v1';
let legacyImportPromise: Promise<void> | null = null;

function cleanKey(value: string | undefined | null): string {
  return (value || '').toLowerCase().replace(/^@/, '').trim();
}

function creatorSlugOf(c: Partial<CreatorProfile>): string {
  return cleanKey(c.slug || c.passportId || c.username || '');
}

function readSeedFile<T>(file: string): T[] {
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
}

// One-time import of data saved by the previous storage (GitHub Gist / seed files),
// so existing creators are not lost when switching to the database.
async function runLegacyImport(): Promise<void> {
  const claimed = await pg
    .insert(appMeta)
    .values({ key: LEGACY_IMPORT_KEY, value: new Date().toISOString() })
    .onConflictDoNothing()
    .returning();
  if (claimed.length === 0) return;

  try {
    const cloud = await fetchFromCloudStore();
    const legacyCreators = cloud.hasCreatorSnapshot ? cloud.creators : readSeedFile<CreatorProfile>(SEED_DB_FILE);
    const legacyVerifications = cloud.verifications.length > 0
      ? cloud.verifications
      : readSeedFile<VerificationSubmission>(SEED_VERIFICATION_FILE);

    for (const c of legacyCreators) {
      const slug = creatorSlugOf(c);
      if (!slug) continue;
      await pg.insert(creatorsTable).values({ slug, data: normalizeStoredCreator(c) }).onConflictDoNothing();
    }
    for (const v of legacyVerifications) {
      const slug = cleanKey(v?.creatorSlug);
      if (!slug) continue;
      const id = v.id || `vrf_${slug}`;
      await pg
        .insert(verificationsTable)
        .values({ id, creatorSlug: slug, data: { ...v, id, creatorSlug: slug } })
        .onConflictDoNothing();
    }
  } catch (err) {
    // Allow a retry on the next request if the import could not complete
    await pg.delete(appMeta).where(eq(appMeta.key, LEGACY_IMPORT_KEY)).catch(() => {});
    throw err;
  }
}

async function ensureLegacyImport(): Promise<void> {
  if (!legacyImportPromise) {
    legacyImportPromise = runLegacyImport().catch((err) => {
      legacyImportPromise = null;
      console.warn('[DB] Legacy data import notice:', err);
    });
  }
  await legacyImportPromise;
}

function normalizeStoredCreator(c: CreatorProfile): CreatorProfile {
  const slug = creatorSlugOf(c) || 'creator';
  return normalizeCreatorVerification({
    ...c,
    slug,
    handle: c.handle || `@${slug}`,
    passportId: c.passportId || slug,
    verification_status: c.verification_status || (c.isVerified ? 'VERIFIED' : 'PENDING'),
    connections: c.connections || {},
  });
}

async function writeCreatorRow(creator: CreatorProfile): Promise<CreatorProfile> {
  const normalized = normalizeStoredCreator(creator);
  const data = JSON.parse(JSON.stringify(normalized));
  await pg
    .insert(creatorsTable)
    .values({ slug: normalized.slug, data })
    .onConflictDoUpdate({ target: creatorsTable.slug, set: { data, updatedAt: new Date() } });
  return normalized;
}

async function writeVerificationRow(submission: VerificationSubmission): Promise<VerificationSubmission> {
  const slug = cleanKey(submission.creatorSlug);
  const [existing] = await pg
    .select({ id: verificationsTable.id })
    .from(verificationsTable)
    .where(eq(verificationsTable.creatorSlug, slug))
    .limit(1);
  const id = existing?.id || submission.id || `vrf_${slug}`;
  const saved: VerificationSubmission = { ...submission, id, creatorSlug: slug };
  const data = JSON.parse(JSON.stringify(saved));
  await pg
    .insert(verificationsTable)
    .values({ id, creatorSlug: slug, data })
    .onConflictDoUpdate({ target: verificationsTable.creatorSlug, set: { data, updatedAt: new Date() } });
  return saved;
}

function matchesCreator(c: CreatorProfile, targets: string[]): boolean {
  const keys = [c.slug, c.handle, c.username, c.passportId, c.id, c.userId].map(cleanKey).filter(Boolean);
  return targets.some((t) => keys.includes(t));
}

export async function getAllCreatorsDB(): Promise<CreatorProfile[]> {
  await ensureLegacyImport();
  const rows = await pg.select().from(creatorsTable).orderBy(desc(creatorsTable.updatedAt));
  return rows.map((row) => normalizeStoredCreator(row.data as CreatorProfile));
}

export const getAllCreatorsDBAsync = getAllCreatorsDB;

export async function getCreatorByUserIdDB(userId: string): Promise<CreatorProfile | null> {
  if (!userId) return null;
  const all = await getAllCreatorsDB();
  return all.find((c) => c.userId === userId) || null;
}

export async function getCreatorBySlugDB(slug: string): Promise<CreatorProfile | null> {
  const clean = cleanKey(slug);
  const all = await getAllCreatorsDB();
  return all.find((c) =>
    cleanKey(c.slug) === clean ||
    cleanKey(c.username) === clean ||
    cleanKey(c.passportId) === clean ||
    cleanKey(c.handle) === clean ||
    cleanKey(c.id) === clean
  ) || null;
}

export async function getCreatorByIdDB(target: string): Promise<CreatorProfile | null> {
  const clean = cleanKey(target);
  if (!clean) return null;
  const all = await getAllCreatorsDB();
  return all.find((c) => matchesCreator(c, [clean])) || null;
}

export const getCreatorByIdDBAsync = getCreatorByIdDB;

export function getCreatorByUsernameDB(username: string): Promise<CreatorProfile | null> {
  return getCreatorByIdDB(username);
}

export async function addCreatorDB(creator: CreatorProfile): Promise<CreatorProfile> {
  const current = await getAllCreatorsDB();

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
  const existing = current.find(
    (c) =>
      (creator.userId && c.userId && c.userId === creator.userId) ||
      (c.slug && c.slug.toLowerCase() === cleanSlug) ||
      (c.username && c.username.toLowerCase() === creator.username.toLowerCase()) ||
      (c.id && creator.id && c.id.toLowerCase() === creator.id.toLowerCase())
  );

  let toSave: CreatorProfile;
  if (existing) {
    toSave = {
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
      // Verification state is owned by the admin review flow (updateVerificationStatusDB);
      // profile saves must never overwrite it with a stale copy.
      verification_status: canonicalVerificationStatus(existing),
      isVerified: canonicalVerificationStatus(existing) === 'VERIFIED',
      verificationReviewedAt: existing.verificationReviewedAt,
      rejectionReason: existing.rejectionReason,
      lastVerifiedAt: existing.lastVerifiedAt || creator.lastVerifiedAt,
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
    // If the slug changed, drop the row stored under the old slug
    const oldSlug = creatorSlugOf(existing);
    if (oldSlug && oldSlug !== cleanSlug) {
      await pg.delete(creatorsTable).where(eq(creatorsTable.slug, oldSlug));
    }
  } else {
    toSave = creator;
  }

  const saved = await writeCreatorRow(toSave);

  // Automatically sync creator proof and verification entry
  try {
    await syncCreatorToVerificationDB(saved);
  } catch (e) {
    console.warn('[DB] Verification sync notice:', e);
  }

  return saved;
}

export async function deleteCreatorDB(targets: string[]): Promise<boolean> {
  const cleanTargets = targets.map(cleanKey).filter(Boolean);
  if (cleanTargets.length === 0) return false;

  const current = await getAllCreatorsDB();
  const toDelete = current.filter((c) => matchesCreator(c, cleanTargets));
  if (toDelete.length === 0) return false;

  const slugs = toDelete.map((c) => c.slug);
  await pg.delete(creatorsTable).where(inArray(creatorsTable.slug, slugs));

  // Also clean up related verification entries
  await pg
    .delete(verificationsTable)
    .where(inArray(verificationsTable.creatorSlug, Array.from(new Set([...slugs, ...cleanTargets]))));

  try {
    for (const slug of slugs) {
      notifySubscribers({ type: 'CREATOR_DELETED', slug });
    }
  } catch (e) {}

  return true;
}

export async function deleteCreatorByUserIdDB(userId: string): Promise<boolean> {
  if (!userId) return false;
  return deleteCreatorDB([userId]);
}

// ==========================================
// VERIFICATION SUBMISSIONS DATABASE
// ==========================================

export async function getAllVerificationsDB(): Promise<VerificationSubmission[]> {
  await ensureLegacyImport();
  const rows = await pg.select().from(verificationsTable).orderBy(desc(verificationsTable.updatedAt));
  return rows.map((row) => row.data as VerificationSubmission);
}

export const getAllVerificationsDBAsync = getAllVerificationsDB;

export async function submitVerificationDB(submission: any): Promise<VerificationSubmission> {
  const sub: VerificationSubmission = {
    ...submission,
    id: submission.id || `vrf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: submission.status || 'PENDING',
    submittedAt: submission.submittedAt || new Date().toISOString(),
    proofDocuments: submission.proofDocuments || [],
  };
  return writeVerificationRow(sub);
}

export async function getVerificationByIdDB(target: string): Promise<VerificationSubmission | null> {
  const all = await getAllVerificationsDB();
  const clean = cleanKey(target);
  return (
    all.find(
      (v) =>
        v.id.toLowerCase() === clean ||
        cleanKey(v.creatorSlug) === clean ||
        cleanKey(v.creatorHandle) === clean ||
        (v.creatorId && v.creatorId.toLowerCase() === clean) ||
        (v.userId && v.userId.toLowerCase() === clean)
    ) || null
  );
}

export async function deleteVerificationByCreatorSlugDB(slug: string): Promise<boolean> {
  const clean = cleanKey(slug);
  const deleted = await pg
    .delete(verificationsTable)
    .where(eq(verificationsTable.creatorSlug, clean))
    .returning({ id: verificationsTable.id });
  return deleted.length > 0;
}

export async function addVerificationDB(submission: VerificationSubmission): Promise<VerificationSubmission> {
  const cleanSlug = cleanKey(submission.creatorSlug);
  const all = await getAllVerificationsDB();
  const existing = all.find((v) => v.id === submission.id || cleanKey(v.creatorSlug) === cleanSlug);
  return writeVerificationRow({
    ...(existing || {}),
    ...submission,
    creatorSlug: cleanSlug,
    id: existing?.id || submission.id || `vrf_${cleanSlug}`,
  });
}

export async function syncCreatorToVerificationDB(creator: CreatorProfile): Promise<VerificationSubmission | null> {
  if (!creator) return null;
  const cleanSlug = cleanKey(creator.slug || creator.username);
  if (!cleanSlug) return null;

  const allVerifs = await getAllVerificationsDB();
  const existingSub = allVerifs.find((v) => cleanKey(v.creatorSlug) === cleanSlug) || null;

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

  return writeVerificationRow(submission);
}

export async function updateVerificationStatusDB(
  targetIdentifier: string,
  status: VerificationStatus,
  reviewedBy: string = 'Admin',
  rejectionReason?: string,
  extraCreatorInfo?: Partial<CreatorProfile>
): Promise<{ verification: VerificationSubmission | null; creator: CreatorProfile | null }> {
  if (!targetIdentifier) {
    return { verification: null, creator: null };
  }
  const clean = cleanKey(targetIdentifier);
  const [allVerifs, allCreators] = await Promise.all([getAllVerificationsDB(), getAllCreatorsDB()]);

  const submission = allVerifs.find(
    (v) =>
      v.id.toLowerCase() === clean ||
      cleanKey(v.creatorSlug) === clean ||
      cleanKey(v.creatorHandle) === clean ||
      (v.creatorId && v.creatorId.toLowerCase() === clean) ||
      (v.userId && v.userId.toLowerCase() === clean)
  ) || null;

  const aliases = new Set([clean]);
  if (submission) {
    [submission.creatorSlug, submission.creatorHandle, submission.creatorId, submission.userId]
      .filter(Boolean)
      .forEach((value) => aliases.add(cleanKey(String(value))));
  }

  const existingCreator = allCreators.find((c) => matchesCreator(c, Array.from(aliases))) || null;

  const canonicalSlug = existingCreator?.slug || submission?.creatorSlug || clean;
  const isVerified = status === 'VERIFIED';
  const now = new Date().toISOString();
  let updatedCreator: CreatorProfile | null = null;

  if (existingCreator) {
    // Only accept non-verification profile fields from the admin's (possibly stale) copy
    const {
      verification_status: _vs,
      isVerified: _iv,
      verificationReviewedAt: _vra,
      rejectionReason: _rr,
      slug: _slug,
      passportId: _pid,
      ...safeExtra
    } = (extraCreatorInfo || {}) as Partial<CreatorProfile>;
    updatedCreator = await writeCreatorRow({
      ...existingCreator,
      ...safeExtra,
      slug: existingCreator.slug,
      passportId: existingCreator.passportId,
      verification_status: status,
      isVerified,
      verificationReviewedAt: now,
      lastVerifiedAt: isVerified ? now.split('T')[0] : existingCreator.lastVerifiedAt,
      rejectionReason: status === 'REJECTED' ? rejectionReason || 'Proof inconclusive' : undefined,
    });
  } else if (submission) {
    const v = submission;
    updatedCreator = await writeCreatorRow({
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
      issuedAt: v.submittedAt || now,
      lastVerifiedAt: now.split('T')[0],
      digitalSignature: `0x${Date.now().toString(16)}`,
      isSuspended: false,
      isVerified,
      verification_status: status,
      verificationReviewedAt: now,
      tierName: isVerified ? 'Founding Member Tier I' : 'Candidate Member',
      profileCompletion: 100,
      skills: ['Content Creator'],
      achievements: [],
      collaborations: [],
      portfolio: [],
      connections: (v.connectedPlatforms as any) || {},
    } as CreatorProfile);
  }

  let updatedSubmission: VerificationSubmission | null = null;
  if (submission) {
    updatedSubmission = await writeVerificationRow({
      ...submission,
      status,
      reviewedAt: now,
      reviewedBy: reviewedBy || 'Admin',
      rejectionReason: status === 'REJECTED' ? rejectionReason || 'Proof inconclusive' : undefined,
    });
  } else if (updatedCreator) {
    const newSub = await syncCreatorToVerificationDB(updatedCreator);
    if (newSub) {
      updatedSubmission = await writeVerificationRow({
        ...newSub,
        status,
        reviewedAt: now,
        reviewedBy: reviewedBy || 'Admin',
        rejectionReason: status === 'REJECTED' ? rejectionReason || 'Proof inconclusive' : undefined,
      });
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
  getUsersDB();
  getSessionsDB();
}
