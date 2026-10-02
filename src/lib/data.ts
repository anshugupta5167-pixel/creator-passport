// In-Memory Store & Provider for Creator Passport (Client-Safe)
import { CreatorProfile, VerificationSubmission } from './types';

// Zero demo creators - strictly populated only when creators mint/create their pass
const SEED_CREATORS: CreatorProfile[] = [];

// In-memory store
let creatorsStore: CreatorProfile[] = [];

// Verification queue state (live submissions only)
export interface VerificationQueueItem {
  id: string;
  creatorSlug: string;
  creatorName: string;
  platform: 'DISCORD' | 'YOUTUBE' | 'IDENTITY';
  accountUsername: string;
  metricAudience: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  proofUrl: string;
}

let verificationQueue: VerificationQueueItem[] = [];

// Audit logs
export interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARN' | 'BLOCKED';
}

let auditLogs: AuditLogItem[] = [];

// Helper functions
export function getAllCreators(): CreatorProfile[] {
  return creatorsStore;
}

export function getCreatorBySlug(slug: string): CreatorProfile | null {
  const clean = slug.replace(/^@/, '').toLowerCase().trim();
  return creatorsStore.find(c =>
    (c.slug && c.slug.toLowerCase() === clean) ||
    c.username.toLowerCase() === clean
  ) || null;
}

export function getCreatorByPassportId(passportId: string): CreatorProfile | null {
  const clean = passportId.replace(/^@/, '').toLowerCase().trim();
  return creatorsStore.find(c =>
    (c.slug && c.slug.toLowerCase() === clean) ||
    c.username.toLowerCase() === clean ||
    (c.passportId && c.passportId.toLowerCase() === clean)
  ) || null;
}

export function getCreatorByUsername(username: string): CreatorProfile | null {
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  return creatorsStore.find(c => c.username.toLowerCase() === clean) || null;
}

export function getCreatorByDiscordId(discordId: string): CreatorProfile | null {
  const all = getAllCreators();
  const match = all.find(c => 
    c.connections?.discord?.username?.includes(discordId) || 
    c.id.includes(discordId)
  );
  return match || all[0] || null;
}

export function saveCreatorProfile(creator: CreatorProfile): CreatorProfile {
  // Ensure slug is set
  if (!creator.slug) {
    creator.slug = (creator.username || creator.displayName || 'creator').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  const existingIdx = creatorsStore.findIndex(c =>
    (c.slug && c.slug.toLowerCase() === creator.slug.toLowerCase()) ||
    c.username.toLowerCase() === creator.username.toLowerCase()
  );

  if (existingIdx >= 0) {
    creatorsStore[existingIdx] = creator;
  } else {
    creatorsStore.unshift(creator);
  }

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    action: "CREATOR_PASS_MINTED",
    actor: creator.displayName,
    target: `@${creator.slug} (${creator.displayName})`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: "SUCCESS"
  });

  return creator;
}

export function deleteCreatorProfile(identifier: string): boolean {
  const norm = identifier.trim().toLowerCase().replace(/^@/, '');
  const idx = creatorsStore.findIndex(c =>
    (c.slug && c.slug.toLowerCase() === norm) ||
    c.username.toLowerCase() === norm ||
    c.id === identifier
  );
  if (idx >= 0) {
    creatorsStore.splice(idx, 1);
  }
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    action: "CREATOR_PASS_DELETED",
    actor: "Admin/Staff",
    target: `@${norm}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: "WARN"
  });
  return true;
}

export function updateCreatorProfile(identifier: string, updates: Partial<CreatorProfile>): CreatorProfile | null {
  const all = getAllCreators();
  const clean = identifier.replace(/^@/, '').toLowerCase().trim();
  const index = all.findIndex(c =>
    (c.slug && c.slug.toLowerCase() === clean) ||
    c.username.toLowerCase() === clean
  );
  if (index === -1) return null;

  all[index] = {
    ...all[index],
    ...updates,
    connections: {
      ...all[index].connections,
      ...(updates.connections || {})
    }
  };

  saveCreatorProfile(all[index]);
  return all[index];
}

export function togglePlatformConnection(identifier: string, platformKey: 'youtube' | 'discord' | 'twitch' | 'x' | 'github', connected: boolean): CreatorProfile | null {
  const creator = getCreatorBySlug(identifier) || getCreatorByPassportId(identifier);
  if (!creator) return null;

  const currentPlatform = creator.connections[platformKey];
  if (currentPlatform) {
    currentPlatform.connected = connected;
    currentPlatform.verified = connected;
    currentPlatform.lastSynced = new Date().toISOString().split('T')[0];
  } else if (connected) {
    creator.connections[platformKey] = {
      platform: platformKey.toUpperCase() as any,
      connected: true,
      username: `${creator.username}_${platformKey}`,
      metricLabel: 'followers',
      metricValue: '0',
      verified: true,
      lastSynced: new Date().toISOString().split('T')[0]
    };
  }

  saveCreatorProfile(creator);
  return creator;
}

export function suspendCreator(identifier: string, isSuspended: boolean, reason?: string): CreatorProfile | null {
  const all = getAllCreators();
  const clean = identifier.replace(/^@/, '').toLowerCase().trim();
  const index = all.findIndex(c =>
    (c.slug && c.slug.toLowerCase() === clean) ||
    c.username.toLowerCase() === clean
  );
  if (index === -1) return null;

  all[index].isSuspended = isSuspended;
  all[index].suspensionReason = isSuspended ? (reason || 'Fraudulent account report under administrative review') : undefined;

  saveCreatorProfile(all[index]);
  return all[index];
}

export function getVerificationQueue() {
  return verificationQueue;
}

export function approveVerification(id: string) {
  const item = verificationQueue.find(v => v.id === id);
  if (item) {
    item.status = 'VERIFIED';
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      action: "VERIFICATION_APPROVED",
      actor: "Admin",
      target: `@${item.creatorSlug} (${item.platform})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: "SUCCESS"
    });
  }
  return item;
}

export function rejectVerification(id: string) {
  const item = verificationQueue.find(v => v.id === id);
  if (item) {
    item.status = 'REJECTED';
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      action: "VERIFICATION_REJECTED",
      actor: "Admin",
      target: `@${item.creatorSlug} (${item.platform})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: "WARN"
    });
  }
  return item;
}

export function getAuditLogs() {
  return auditLogs;
}

export function getAdminStats() {
  const all = getAllCreators();
  const totalPassports = all.length;
  const verifiedCreators = all.filter(c => c.isVerified && !c.isSuspended).length;
  const foundingCreators = all.filter(c => c.isFounding).length;
  const pendingVerifications = verificationQueue.filter(v => v.status === 'PENDING').length;
  const suspendedCount = all.filter(c => c.isSuspended).length;

  return {
    totalPassports,
    verifiedCreators,
    foundingCreators,
    pendingVerifications,
    suspendedCount,
    botStatus: {
      status: 'ONLINE',
      uptime: '99.98%',
      latencyMs: 22,
      guildCount: 418,
      commandsProcessedToday: 1420
    }
  };
}

// ==========================================
// PASSPORT APPLICATIONS & STAFF APPROVAL WORKFLOW
// ==========================================
export interface PassportApplication {
  id: string;
  applicantName: string;
  applicantHandle: string;
  category: string;
  platform: 'YOUTUBE' | 'DISCORD';
  claimedMetrics: string;
  profileUrl: string;
  proofScreenshotUrl: string;
  proofDetails: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  assignedSlug?: string;
  rejectionReason?: string;
}

let applicationsStore: PassportApplication[] = [];

export function getPassportApplications(): PassportApplication[] {
  return applicationsStore;
}

export function submitPassportApplication(data: Omit<PassportApplication, 'id' | 'status' | 'submittedAt'>): PassportApplication {
  const newApp: PassportApplication = {
    ...data,
    id: `app_${Date.now()}`,
    status: 'PENDING_REVIEW',
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  applicationsStore.unshift(newApp);

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    action: "APPLICATION_SUBMITTED",
    actor: data.applicantName,
    target: `${data.applicantHandle} (${data.platform})`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: "WARN"
  });

  return newApp;
}

export function approvePassportApplication(id: string): { application: PassportApplication; newCreator: CreatorProfile } | null {
  const app = applicationsStore.find(a => a.id === id);
  if (!app) return null;

  const cleanSlug = app.applicantHandle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');

  app.status = 'APPROVED';
  app.assignedSlug = cleanSlug;

  const newCreator: CreatorProfile = {
    id: `cr_${Date.now()}`,
    slug: cleanSlug,
    handle: `@${cleanSlug}`,
    username: cleanSlug,
    passportId: cleanSlug,
    displayName: app.applicantName,
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
    category: app.category,
    country: "Global",
    bio: `Verified creator across ${app.platform}. Holding authenticated proof of ${app.claimedMetrics}.`,
    isVerified: true,
    verification_status: 'VERIFIED',
    isFounding: creatorsStore.length < 500,
    tierName: "Verified Creator Tier I",
    profileCompletion: 95,
    contactEmail: `${cleanSlug}.mgmt@gmail.com`,
    issuedAt: new Date().toISOString().split('T')[0],
    lastVerifiedAt: new Date().toISOString().split('T')[0],
    digitalSignature: `0x${Math.random().toString(16).substring(2, 42)}`,
    isSuspended: false,
    connections: {
      youtube: {
        platform: 'YOUTUBE',
        connected: app.platform === 'YOUTUBE',
        username: app.applicantName,
        metricLabel: 'subscribers',
        metricValue: app.claimedMetrics.split(' ')[0] || '0',
        verified: true,
        profileUrl: app.profileUrl,
        lastSynced: new Date().toISOString().split('T')[0]
      },
      discord: {
        platform: 'DISCORD',
        connected: app.platform === 'DISCORD',
        username: `${app.applicantHandle}#0001`,
        metricLabel: 'members',
        metricValue: app.platform === 'DISCORD' ? app.claimedMetrics.split(' ')[0] : '0',
        verified: true,
        profileUrl: app.profileUrl,
        lastSynced: new Date().toISOString().split('T')[0]
      }
    },
    skills: [app.category, "Verified Content", "Community Leadership"],
    achievements: [],
    collaborations: [],
    portfolio: []
  };

  saveCreatorProfile(newCreator);

  return { application: app, newCreator };
}

export function rejectPassportApplication(id: string, reason: string): PassportApplication | null {
  const app = applicationsStore.find(a => a.id === id);
  if (!app) return null;

  app.status = 'REJECTED';
  app.rejectionReason = reason;

  auditLogs.unshift({
    id: `log_${Date.now()}`,
    action: "APPLICATION_REJECTED",
    actor: "Staff Admin",
    target: `${app.applicantName} (${reason})`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: "WARN"
  });

  return app;
}
