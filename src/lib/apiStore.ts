import { CreatorProfile, VerificationSubmission, User, Session, AuditLog } from './types';
import { db as firestoreDb } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { broadcastLocalChange } from './sync';

const CREATORS_KEY = 'creatorhq_creators_list';
const VERIFICATIONS_KEY = 'creatorhq_verifications_list';
const USERS_KEY = 'creatorhq_users_list';
const SESSIONS_KEY = 'creatorhq_current_session';
const AUDIT_LOGS_KEY = 'creatorhq_audit_logs';
const TOMBSTONES_KEY = 'creatorhq_tombstones';
const INITIALIZED_KEY = 'creatorhq_initialized';

export const SEED_CREATORS_LIST: CreatorProfile[] = [
  {
    id: 'creator_itsuniqueplayz',
    passportId: 'itsuniqueplayz',
    slug: 'itsuniqueplayz',
    handle: '@itsuniqueplayz',
    username: 'itsuniqueplayz',
    displayName: 'ItsUniquePlayz',
    avatarUrl: '/alex-passport.png',
    bio: 'Professional Gaming Content Creator, Esports Streamer, and community leader.',
    category: 'Gaming Creator',
    country: 'United States',
    isVerified: true,
    verification_status: 'VERIFIED',
    isFounding: true,
    tierName: 'Founding Member Tier I',
    profileCompletion: 100,
    contactEmail: 'contact@itsuniqueplayz.com',
    issuedAt: '2026-09-15',
    lastVerifiedAt: '2026-10-01',
    digitalSignature: '0x8f294a1b0c92e741d5a38e9c6140b2f974e18320',
    isSuspended: false,
    connections: {
      youtube: {
        platform: 'YOUTUBE',
        connected: true,
        username: 'ItsUniquePlayz',
        metricLabel: 'subscribers',
        metricValue: '184K Subscribers',
        verified: true,
        profileUrl: 'https://youtube.com/@itsuniqueplayz',
        channelId: 'UC_unique_playz_gaming',
        rawCount: 184000,
        lastSynced: '2026-10-01',
        syncStatus: 'VERIFIED',
      },
      discord: {
        platform: 'DISCORD',
        connected: true,
        username: 'Playz Squad',
        metricLabel: 'members',
        metricValue: '12.4K Members',
        verified: true,
        profileUrl: 'https://discord.gg/uniqueplayz',
        guildId: '984019283746192837',
        rawCount: 12400,
        lastSynced: '2026-10-01',
        syncStatus: 'VERIFIED',
      },
    },
    skills: ['Competitive FPS', 'YouTube Strategy', 'Discord Community Growth', 'Live Streaming'],
    achievements: [
      { id: 'ach_1', name: 'Founding Member Tier I', slug: 'founding-member', description: 'Early network adopter and founding identity holder.', badgeIcon: 'award', unlockedAt: '2026-09-15' },
      { id: 'ach_2', name: 'Dual Verified Authority', slug: 'dual-verified', description: 'Simultaneous YouTube Studio & Discord Guild verified authenticity.', badgeIcon: 'shield-check', unlockedAt: '2026-09-20' },
      { id: 'ach_3', name: '100K Audience Milestone', slug: '100k-club', description: 'Audited watch time exceeding 1.2M hours.', badgeIcon: 'sparkles', unlockedAt: '2026-09-28' },
    ],
    collaborations: [],
    moreChannels: [],
  },
  {
    id: 'creator_alex',
    passportId: 'alex',
    slug: 'alex',
    handle: '@alex',
    username: 'alex',
    displayName: 'Alex Rivers',
    avatarUrl: '/alex-passport.png',
    bio: 'Software Engineer & AI Tech Creator. Deep diving into next-gen development tools.',
    category: 'Tech & AI Creator',
    country: 'United States',
    isVerified: true,
    verification_status: 'VERIFIED',
    isFounding: true,
    tierName: 'Founding Member Tier I',
    profileCompletion: 95,
    contactEmail: 'alex@rivers.dev',
    issuedAt: '2026-09-18',
    lastVerifiedAt: '2026-10-02',
    digitalSignature: '0x3c78a01f52b6d8e9c4021a87b5f1903e1a6b4728',
    isSuspended: false,
    connections: {
      youtube: {
        platform: 'YOUTUBE',
        connected: true,
        username: 'AlexTech',
        metricLabel: 'subscribers',
        metricValue: '96.2K Subscribers',
        verified: true,
        profileUrl: 'https://youtube.com/@alextech',
        channelId: 'UC_alex_tech_official',
        rawCount: 96200,
        lastSynced: '2026-10-02',
        syncStatus: 'VERIFIED',
      },
      discord: {
        platform: 'DISCORD',
        connected: true,
        username: 'DevHub Discord',
        metricLabel: 'members',
        metricValue: '8.9K Members',
        verified: true,
        profileUrl: 'https://discord.gg/devhub',
        guildId: '782910293847562910',
        rawCount: 8900,
        lastSynced: '2026-10-02',
        syncStatus: 'VERIFIED',
      },
    },
    skills: ['TypeScript Systems', 'AI Agents', 'Cloud Architecture', 'DevRel'],
    achievements: [
      { id: 'ach_1', name: 'Founding Creator', slug: 'founding-creator', description: 'Early network adopter and founding identity holder.', badgeIcon: 'shield-check', unlockedAt: '2026-09-18' },
      { id: 'ach_2', name: 'Verified Creator', slug: 'verified-creator', description: 'Passed official staff audit of YouTube Studio analytics.', badgeIcon: 'check-circle-2', unlockedAt: '2026-09-22' }
    ],
    collaborations: [],
    moreChannels: [],
  }
];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export class ApiStore {
  // Persistent Tombstones (Deleted Creators Never Resurrect)
  static getTombstones(): string[] {
    return getItem<string[]>(TOMBSTONES_KEY, []);
  }

  static addTombstone(identifier: string) {
    const clean = identifier.toLowerCase().replace(/^@/, '').trim();
    const current = new Set(this.getTombstones());
    current.add(clean);
    current.add(`creator_${clean}`);
    current.add(`cr_${clean}`);
    setItem(TOMBSTONES_KEY, Array.from(current));
  }

  static isTombstoned(c: { slug?: string; username?: string; passportId?: string; id?: string }): boolean {
    const tombstones = new Set(this.getTombstones().map(t => t.toLowerCase()));
    if (tombstones.size === 0) return false;
    const s = (c.slug || '').toLowerCase().replace(/^@/, '');
    const u = (c.username || '').toLowerCase().replace(/^@/, '');
    const p = (c.passportId || '').toLowerCase().replace(/^@/, '');
    const id = (c.id || '').toLowerCase();
    return tombstones.has(s) || tombstones.has(u) || tombstones.has(p) || tombstones.has(id);
  }

  // Sync state with Firebase Firestore if accessible
  private static async syncFromFirestore() {
    if (!firestoreDb) return;
    try {
      const tombstones = new Set(this.getTombstones().map(t => t.toLowerCase()));
      const creatorsCol = collection(firestoreDb, 'creators');
      const snap = await getDocs(creatorsCol);
      if (!snap.empty) {
        const remoteCreators: CreatorProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as CreatorProfile;
          if (data && (data.slug || data.username || data.passportId)) {
            const s = (data.slug || '').toLowerCase().replace(/^@/, '');
            const u = (data.username || '').toLowerCase().replace(/^@/, '');
            const p = (data.passportId || '').toLowerCase().replace(/^@/, '');
            const id = (data.id || d.id || '').toLowerCase();
            const isDead = tombstones.has(s) || tombstones.has(u) || tombstones.has(p) || tombstones.has(id) || tombstones.has(d.id.toLowerCase());

            if (isDead) {
              // Delete permanently from remote Firestore so it never resurrects
              deleteDoc(d.ref).catch(() => {});
            } else {
              remoteCreators.push(data);
            }
          }
        });

        const localList = getItem<CreatorProfile[]>(CREATORS_KEY, []);
        const map = new Map<string, CreatorProfile>();
        // Add remote
        remoteCreators.forEach(rc => {
          const key = (rc.slug || rc.username || rc.passportId || rc.id || '').toLowerCase();
          if (key) map.set(key, rc);
        });
        // Add local (preserve latest local modifications)
        localList.forEach(lc => {
          const key = (lc.slug || lc.username || lc.passportId || lc.id || '').toLowerCase();
          if (key && !tombstones.has(key)) {
            map.set(key, { ...(map.get(key) || {}), ...lc });
          }
        });
        const merged = Array.from(map.values()).filter(c => !this.isTombstoned(c));
        setItem(CREATORS_KEY, merged);
      }

      const verifsCol = collection(firestoreDb, 'verifications');
      const vSnap = await getDocs(verifsCol);
      if (!vSnap.empty) {
        const remoteVerifs: VerificationSubmission[] = [];
        vSnap.forEach((d) => {
          const v = d.data() as VerificationSubmission;
          const s = (v.creatorSlug || '').toLowerCase().replace(/^@/, '');
          if (tombstones.has(s)) {
            deleteDoc(d.ref).catch(() => {});
          } else {
            remoteVerifs.push(v);
          }
        });
        if (remoteVerifs.length > 0) {
          setItem(VERIFICATIONS_KEY, remoteVerifs);
        }
      }
    } catch (e) {
      // Offline notice
    }
  }

  static getCreators(): CreatorProfile[] {
    const isInit = getItem<boolean>(INITIALIZED_KEY, false);
    let saved = getItem<CreatorProfile[]>(CREATORS_KEY, []);

    if (!isInit && (!saved || saved.length === 0)) {
      setItem(INITIALIZED_KEY, true);
      const filteredSeed = SEED_CREATORS_LIST.filter(c => !this.isTombstoned(c));
      setItem(CREATORS_KEY, filteredSeed);
      this.syncFromFirestore();
      return filteredSeed;
    }

    if (!saved) saved = [];

    // Trigger async sync with Firestore in background
    if (isBrowser()) {
      this.syncFromFirestore().catch(() => {});
    }

    // Always filter out any tombstoned creators
    const tombstones = new Set(this.getTombstones().map(t => t.toLowerCase()));
    if (tombstones.size > 0) {
      saved = saved.filter(c => !this.isTombstoned(c));
    }

    return saved;
  }

  static saveCreator(creator: CreatorProfile): CreatorProfile {
    const sessionUser = this.getCurrentUser();
    const rawSlug = (creator.slug || creator.username || creator.displayName || sessionUser?.username || 'creator').toLowerCase().replace(/^@/, '').trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9_-]/g, '') || 'creator';

    // Remove from tombstones if re-created
    const tombstones = this.getTombstones().filter(t => t !== cleanSlug && t !== `creator_${cleanSlug}`);
    setItem(TOMBSTONES_KEY, tombstones);
    
    const formatted: CreatorProfile = {
      ...creator,
      userId: creator.userId || sessionUser?.id,
      slug: cleanSlug,
      handle: creator.handle || `@${cleanSlug}`,
      passportId: creator.passportId || cleanSlug,
      username: creator.username ? creator.username.toLowerCase().replace(/^@/, '') : cleanSlug,
      displayName: creator.displayName || cleanSlug,
      avatarUrl: creator.avatarUrl,
      verification_status: creator.verification_status || (creator.isVerified ? 'VERIFIED' : 'PENDING'),
      connections: creator.connections || {},
      skills: creator.skills || [],
      achievements: creator.achievements || [],
      collaborations: creator.collaborations || [],
      portfolio: creator.portfolio || [],
      moreChannels: creator.moreChannels || [],
    };

    const current = this.getCreators();
    const idx = current.findIndex(c =>
      (c.slug && c.slug.toLowerCase() === cleanSlug) ||
      (c.username && c.username.toLowerCase() === cleanSlug) ||
      (c.id && c.id === formatted.id)
    );

    if (idx >= 0) {
      current[idx] = { ...current[idx], ...formatted };
    } else {
      current.unshift(formatted);
    }

    setItem(CREATORS_KEY, current);

    // Save active user card in browser
    if (isBrowser()) {
      try {
        localStorage.setItem('creatorhq_user_card', JSON.stringify(formatted));
      } catch (e) {}
    }

    // Update current session user's display name & avatar
    if (sessionUser) {
      const updatedUser: User = {
        ...sessionUser,
        displayName: formatted.displayName || sessionUser.displayName,
        avatarUrl: formatted.avatarUrl || sessionUser.avatarUrl,
      };
      this.setSession(updatedUser);
      const users = this.getUsers();
      const uIdx = users.findIndex(u => u.id === sessionUser.id || u.username === sessionUser.username || u.email === sessionUser.email);
      if (uIdx >= 0) {
        users[uIdx] = updatedUser;
        setItem(USERS_KEY, users);
      }
    }

    // Save to Firestore if connected
    if (firestoreDb) {
      try {
        const ref = doc(firestoreDb, 'creators', cleanSlug);
        setDoc(ref, JSON.parse(JSON.stringify(formatted)), { merge: true }).catch(() => {});
      } catch (e) {}
    }

    this.addAuditLog('CREATOR_SAVED', formatted.displayName, `Saved Creator Pass @${cleanSlug}`);
    return formatted;
  }

  static deleteCreator(target: string): boolean {
    const clean = target.toLowerCase().replace(/^@/, '').trim();
    
    // 1. Record in persistent tombstone registry
    this.addTombstone(clean);

    // 2. Remove from local list
    const current = getItem<CreatorProfile[]>(CREATORS_KEY, []);
    const filtered = current.filter(c => !this.isTombstoned(c));
    setItem(CREATORS_KEY, filtered);

    // 3. Remove from user active card if matching
    if (isBrowser()) {
      try {
        const saved = localStorage.getItem('creatorhq_user_card');
        if (saved) {
          const parsed = JSON.parse(saved);
          if ((parsed.slug || parsed.username || '').toLowerCase() === clean) {
            localStorage.removeItem('creatorhq_user_card');
          }
        }
      } catch (e) {}
    }

    // 4. Exhaustive Firestore cleanup across all document ID possibilities
    if (firestoreDb) {
      try {
        getDocs(collection(firestoreDb, 'creators')).then(snap => {
          snap.forEach(d => {
            const data = d.data();
            const s = (data.slug || '').toLowerCase().replace(/^@/, '');
            const u = (data.username || '').toLowerCase().replace(/^@/, '');
            const p = (data.passportId || '').toLowerCase().replace(/^@/, '');
            const id = (data.id || d.id || '').toLowerCase();
            if (s === clean || u === clean || p === clean || id === clean || d.id.toLowerCase() === clean || d.id.toLowerCase() === `creator_${clean}`) {
              deleteDoc(d.ref).catch(() => {});
            }
          });
        }).catch(() => {});
      } catch (e) {}
    }

    // 5. Clean up verifications
    const verifs = this.getVerifications();
    const remainingVerifs = verifs.filter(v => (v.creatorSlug || '').toLowerCase() !== clean);
    setItem(VERIFICATIONS_KEY, remainingVerifs);
    if (firestoreDb) {
      try {
        deleteDoc(doc(firestoreDb, 'verifications', `vrf_${clean}`)).catch(() => {});
      } catch (e) {}
    }

    this.addAuditLog('CREATOR_DELETED', 'Staff Admin', `Permanently deleted creator @${clean}`);
    try {
      broadcastLocalChange({ type: 'CREATOR_DELETED', slug: clean });
    } catch (e) {}
    return true;
  }

  static verifyCreator(target: string, isVerified: boolean): CreatorProfile | null {
    const clean = target.toLowerCase().replace(/^@/, '').trim();
    const current = this.getCreators();
    const idx = current.findIndex(c =>
      (c.slug && c.slug.toLowerCase() === clean) ||
      (c.username && c.username.toLowerCase() === clean) ||
      (c.passportId && c.passportId.toLowerCase() === clean) ||
      (c.id && c.id === target)
    );

    if (idx === -1) return null;

    const creator = current[idx];
    const status = isVerified ? 'VERIFIED' : 'PENDING';
    const updated: CreatorProfile = {
      ...creator,
      isVerified,
      verification_status: status,
      tierName: isVerified ? 'Founding Member Tier I' : 'Candidate Member',
      lastVerifiedAt: isVerified ? new Date().toISOString().split('T')[0] : creator.lastVerifiedAt,
    };

    current[idx] = updated;
    setItem(CREATORS_KEY, current);

    // Save to Firestore if connected
    if (firestoreDb) {
      try {
        const ref = doc(firestoreDb, 'creators', updated.slug);
        setDoc(ref, JSON.parse(JSON.stringify(updated)), { merge: true }).catch(() => {});
      } catch (e) {}
    }

    this.addAuditLog(
      isVerified ? 'CREATOR_VERIFIED' : 'CREATOR_REJECTED',
      'Staff Admin',
      `${isVerified ? 'Approved' : 'Rejected'} verification for @${updated.slug}`
    );

    return updated;
  }

  static getVerifications(): VerificationSubmission[] {
    return getItem<VerificationSubmission[]>(VERIFICATIONS_KEY, [
      {
        id: 'vrf_itsuniqueplayz',
        creatorSlug: 'itsuniqueplayz',
        creatorName: 'ItsUniquePlayz',
        creatorAvatar: '/alex-passport.png',
        category: 'Gaming Creator',
        status: 'VERIFIED',
        submittedAt: '2026-09-20',
        reviewedAt: '2026-09-22',
        reviewedBy: 'Staff Admin',
        connectedPlatforms: {
          youtube: { connected: true, username: 'ItsUniquePlayz', metric: '184K Subscribers' },
          discord: { connected: true, username: 'Playz Squad', metric: '12.4K Members' },
        },
      },
    ]);
  }

  static saveVerification(sub: Partial<VerificationSubmission>): VerificationSubmission {
    const list = this.getVerifications();
    const cleanSlug = (sub.creatorSlug || 'creator').toLowerCase().replace(/^@/, '');
    const newSub: VerificationSubmission = {
      id: sub.id || `vrf_${cleanSlug}`,
      creatorSlug: cleanSlug,
      creatorName: sub.creatorName || cleanSlug,
      creatorAvatar: sub.creatorAvatar,
      category: sub.category || 'Creator',
      status: sub.status || 'PENDING',
      submittedAt: sub.submittedAt || new Date().toISOString(),
      reviewedAt: sub.reviewedAt,
      reviewedBy: sub.reviewedBy,
      rejectionReason: sub.rejectionReason,
      proofDocuments: sub.proofDocuments || [],
      connectedPlatforms: sub.connectedPlatforms || {},
    };

    const idx = list.findIndex(v => v.id === newSub.id || v.creatorSlug.toLowerCase() === cleanSlug);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newSub };
    } else {
      list.unshift(newSub);
    }

    setItem(VERIFICATIONS_KEY, list);

    if (firestoreDb) {
      try {
        const ref = doc(firestoreDb, 'verifications', newSub.id);
        setDoc(ref, JSON.parse(JSON.stringify(newSub)), { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return newSub;
  }

  static getUsers(): User[] {
    return getItem<User[]>(USERS_KEY, [
      {
        id: 'usr_admin_system_001',
        email: 'admin@creatorhq.fun',
        username: 'admin',
        displayName: 'CreatorHQ Staff Admin',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'usr_itsuniqueplayz_001',
        email: 'contact@itsuniqueplayz.com',
        username: 'itsuniqueplayz',
        displayName: 'ItsUniquePlayz',
        role: 'CREATOR',
        emailVerified: true,
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);
  }

  static getCurrentUser(): User | null {
    return getItem<User | null>(SESSIONS_KEY, null);
  }

  static setSession(user: User): void {
    setItem(SESSIONS_KEY, user);
  }

  static clearSession(): void {
    if (isBrowser()) {
      localStorage.removeItem(SESSIONS_KEY);
    }
  }

  static getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(AUDIT_LOGS_KEY, [
      {
        id: 'audit_init',
        action: 'SYSTEM_INITIALIZED',
        actor: 'CreatorHQ Core',
        details: { message: 'Sovereign Verification Network Engine Active' },
        timestamp: '2026-10-01T00:00:00.000Z',
      },
    ]);
  }

  static addAuditLog(action: string, actor: string, details?: any): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      actor,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    setItem(AUDIT_LOGS_KEY, logs);
  }
}
