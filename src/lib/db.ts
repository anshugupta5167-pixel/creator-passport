import { CreatorProfile, VerificationSubmission, User, Session, AuditLog } from './types';
import { ApiStore } from './apiStore';

export function getAllCreatorsDB(): CreatorProfile[] {
  return ApiStore.getCreators();
}

export async function getAllCreatorsDBAsync(): Promise<CreatorProfile[]> {
  return ApiStore.getCreators();
}

export function getCreatorByIdDB(target: string): CreatorProfile | null {
  const clean = (target || '').toLowerCase().replace(/^@/, '').trim();
  const all = ApiStore.getCreators();
  return all.find(c =>
    (c.slug && c.slug.toLowerCase() === clean) ||
    (c.username && c.username.toLowerCase() === clean) ||
    (c.passportId && c.passportId.toLowerCase() === clean) ||
    (c.handle && c.handle.toLowerCase().replace(/^@/, '') === clean) ||
    (c.id && c.id.toLowerCase() === clean)
  ) || null;
}

export async function getCreatorByIdDBAsync(target: string): Promise<CreatorProfile | null> {
  return getCreatorByIdDB(target);
}

export function getCreatorBySlugDB(slug: string): CreatorProfile | null {
  return getCreatorByIdDB(slug);
}

export function getCreatorByUsernameDB(username: string): CreatorProfile | null {
  return getCreatorByIdDB(username);
}

export function getCreatorByUserIdDB(userId: string): CreatorProfile | null {
  if (!userId) return null;
  const all = ApiStore.getCreators();
  return all.find(c => c.userId === userId) || null;
}

export async function addCreatorDB(creator: CreatorProfile): Promise<CreatorProfile> {
  return ApiStore.saveCreator(creator);
}

export async function deleteCreatorDB(targets: string[]): Promise<boolean> {
  let changed = false;
  for (const t of targets) {
    if (ApiStore.deleteCreator(t)) {
      changed = true;
    }
  }
  return changed;
}

export async function deleteCreatorByUserIdDB(userId: string): Promise<boolean> {
  if (!userId) return false;
  return deleteCreatorDB([userId]);
}

export function getAllVerificationsDB(): VerificationSubmission[] {
  return ApiStore.getVerifications();
}

export async function getAllVerificationsDBAsync(): Promise<VerificationSubmission[]> {
  return ApiStore.getVerifications();
}

export function getVerificationByIdDB(id: string): VerificationSubmission | null {
  const all = ApiStore.getVerifications();
  return all.find(v => v.id === id || v.creatorSlug.toLowerCase() === id.toLowerCase()) || null;
}

export async function submitVerificationPersistentDB(submission: any): Promise<VerificationSubmission> {
  return ApiStore.saveVerification(submission);
}

export async function persistVerificationDB(submission: VerificationSubmission | null): Promise<void> {
  if (submission) {
    ApiStore.saveVerification(submission);
  }
}

export async function updateVerificationStatusDB(
  id: string,
  status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW' | 'PENDING',
  reviewedBy?: string,
  rejectionReason?: string
): Promise<VerificationSubmission | null> {
  const isApproved = status === 'VERIFIED';
  ApiStore.verifyCreator(id, isApproved);
  const updatedVerifs = ApiStore.getVerifications();
  return updatedVerifs.find(v => v.id === id || v.creatorSlug.toLowerCase() === id.toLowerCase()) || null;
}

export function getAuditLogsDB(): AuditLog[] {
  return ApiStore.getAuditLogs();
}

export async function getAuditLogsPersistentDB(): Promise<AuditLog[]> {
  return ApiStore.getAuditLogs();
}

export function addAuditLogDB(log: { userId?: string | null; action: string; actor: string; details?: any }): AuditLog {
  ApiStore.addAuditLog(log.action, log.actor, log.details);
  return {
    id: `audit_${Date.now()}`,
    userId: log.userId || null,
    action: log.action,
    actor: log.actor,
    details: log.details,
    timestamp: new Date().toISOString(),
  };
}

export async function addAuditLogPersistentDB(log: { userId?: string | null; action: string; actor: string; details?: any }): Promise<AuditLog> {
  return addAuditLogDB(log);
}

export function getUsersDB(): User[] {
  return ApiStore.getUsers();
}

export async function getUserByIdPersistentDB(id: string): Promise<User | null> {
  const users = ApiStore.getUsers();
  return users.find(u => u.id === id) || null;
}

export async function getUserByEmailPersistentDB(email: string): Promise<User | null> {
  const clean = (email || '').toLowerCase().trim();
  const users = ApiStore.getUsers();
  return users.find(u => u.email.toLowerCase() === clean) || null;
}

export async function getUserByUsernamePersistentDB(username: string): Promise<User | null> {
  const clean = (username || '').toLowerCase().replace(/^@/, '').trim();
  const users = ApiStore.getUsers();
  return users.find(u => u.username.toLowerCase() === clean) || null;
}

export function createSessionDB(session: Session): Session {
  return session;
}

export function deleteSessionDB(_token: string): boolean {
  ApiStore.clearSession();
  return true;
}

export function getSessionByTokenDB(token: string): Session | null {
  const user = ApiStore.getCurrentUser();
  if (user) {
    return {
      id: token,
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  return null;
}
