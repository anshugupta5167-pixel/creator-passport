import fs from 'fs';
import path from 'path';
import os from 'os';
import { CreatorProfile, VerificationSubmission, ProofDocument, VerificationStatus } from './types';
import { 
  syncCreatorToFirebase, 
  fetchCreatorsFromFirebase, 
  deleteCreatorFromFirebase,
  syncVerificationToFirebase,
  fetchVerificationsFromFirebase 
} from './firebase';
import { 
  fetchFromCloudStore, 
  pushCreatorsToCloudStore, 
  pushVerificationsToCloudStore 
} from './cloudStore';
import { resolveYouTubeUrl, resolveDiscordUrl, resolveInstagramUrl } from './urls';
import { notifySubscribers } from './events';

// Seed directory bundled with project (read-only in Vercel lambdas)
const SEED_DIR = path.join(process.cwd(), 'data');
const SEED_DB_FILE = path.join(SEED_DIR, 'creators.json');
const SEED_VERIFICATION_FILE = path.join(SEED_DIR, 'verifications.json');

// In-memory cache for ultra-fast access
let memoryCreators: CreatorProfile[] = [];
let memoryVerifications: VerificationSubmission[] = [];
let isLoaded = false;

// Check if running on Vercel / serverless environment
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
      proofsDir: path.join(tmpDataDir, 'proofs'),
      isTmp: true,
    };
  }

  return {
    dataDir: SEED_DIR,
    dbFile: SEED_DB_FILE,
    verificationFile: SEED_VERIFICATION_FILE,
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

    if (!fs.existsSync(paths.dbFile)) {
      if (paths.isTmp && fs.existsSync(SEED_DB_FILE)) {
        try {
          fs.copyFileSync(SEED_DB_FILE, paths.dbFile);
        } catch (e) {
          fs.writeFileSync(paths.dbFile, JSON.stringify([], null, 2), 'utf8');
        }
      } else {
        fs.writeFileSync(paths.dbFile, JSON.stringify([], null, 2), 'utf8');
      }
    }

    if (!fs.existsSync(paths.verificationFile)) {
      if (paths.isTmp && fs.existsSync(SEED_VERIFICATION_FILE)) {
        try {
          fs.copyFileSync(SEED_VERIFICATION_FILE, paths.verificationFile);
        } catch (e) {
          fs.writeFileSync(paths.verificationFile, JSON.stringify([], null, 2), 'utf8');
        }
      } else {
        fs.writeFileSync(paths.verificationFile, JSON.stringify([], null, 2), 'utf8');
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
// CREATOR DATABASE
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
      memoryCreators.push({
        ...c,
        connections: c.connections || {},
      });
      changed = true;
    } else {
      memoryCreators[idx] = {
        ...memoryCreators[idx],
        ...c,
        connections: {
          ...memoryCreators[idx].connections,
          ...(c.connections || {}),
        },
      };
    }
  }
  return changed;
}

export function loadCreatorsFromDisk(): CreatorProfile[] {
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
        return {
          ...c,
          slug,
          handle: c.handle || `@${slug}`,
          passportId: c.passportId || slug,
          verification_status: c.verification_status || (c.isVerified ? 'VERIFIED' : 'PENDING'),
          connections: c.connections || {},
        };
      });

      if (memoryCreators.length === 0) {
        memoryCreators = diskList;
      } else {
        mergeIncomingCreators(diskList);
      }
      isLoaded = true;
    }
  } catch (err) {
    console.error('[DB] Error loading creators from disk:', err);
  }

  // Non-blocking background sync with live cloud store
  fetchFromCloudStore()
    .then((cloud) => {
      if (cloud.creators && cloud.creators.length > 0) {
        if (mergeIncomingCreators(cloud.creators)) {
          try {
            const paths = getWritablePaths();
            fs.writeFileSync(paths.dbFile, JSON.stringify(memoryCreators, null, 2), 'utf8');
          } catch (e) {}
        }
      }
    })
    .catch(() => {});

  return memoryCreators;
}

export function saveCreatorsToDisk(creators: CreatorProfile[]): boolean {
  memoryCreators = creators.map((c) => ({
    ...c,
    connections: c.connections || {},
  }));
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.dbFile, JSON.stringify(memoryCreators, null, 2), 'utf8');

    // Also attempt writing to local seed file if writable (local development)
    if (!paths.isTmp || fs.existsSync(SEED_DB_FILE)) {
      try {
        fs.writeFileSync(SEED_DB_FILE, JSON.stringify(memoryCreators, null, 2), 'utf8');
      } catch (e) {
        // Read-only filesystem on Vercel is expected and handled
      }
    }
  } catch (err) {
    console.error('[DB] Error saving creators to disk:', err);
  }

  // Instantly push to persistent cloud database so all Vercel instances stay in sync
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
  try {
    const cloud = await fetchFromCloudStore();
    if (cloud.creators && cloud.creators.length > 0) {
      mergeIncomingCreators(cloud.creators);
    }
  } catch (e) {}
  return getAllCreatorsDB();
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

    return (
      cSlug === clean ||
      cHandle === clean ||
      cUser === clean ||
      cPass === clean ||
      cId === raw
    );
  });
  if (!found) return null;
  return { ...found, connections: found.connections || {} };
}

export async function getCreatorByIdDBAsync(target: string): Promise<CreatorProfile | null> {
  const local = getCreatorByIdDB(target);
  if (local) return local;

  try {
    const cloud = await fetchFromCloudStore();
    if (cloud.creators && cloud.creators.length > 0) {
      mergeIncomingCreators(cloud.creators);
      return getCreatorByIdDB(target);
    }
  } catch (e) {}

  return null;
}

export function getCreatorByUsernameDB(username: string): CreatorProfile | null {
  return getCreatorByIdDB(username);
}

export function normalizeIp(ip?: string | null): string {
  if (!ip) return '';
  let clean = ip.trim().toLowerCase();
  if (clean.startsWith('::ffff:')) {
    clean = clean.replace('::ffff:', '');
  }
  return clean;
}

export function isSameIp(ip1?: string | null, ip2?: string | null): boolean {
  const norm1 = normalizeIp(ip1);
  const norm2 = normalizeIp(ip2);
  if (!norm1 || !norm2) return false;
  const isLoopback1 = norm1 === '127.0.0.1' || norm1 === '::1' || norm1 === 'localhost';
  const isLoopback2 = norm2 === '127.0.0.1' || norm2 === '::1' || norm2 === 'localhost';
  if (isLoopback1 || isLoopback2) return false;
  if (norm1 === norm2) return true;
  return false;
}

export function getCreatorByIpDB(ip: string): CreatorProfile | null {
  if (!ip) return null;
  const all = getAllCreatorsDB();
  return (
    all.find((c) => {
      return isSameIp(c.registeredIp, ip) || isSameIp(c.clientIp, ip);
    }) || null
  );
}

export async function getCreatorByIpDBAsync(ip: string): Promise<CreatorProfile | null> {
  if (!ip) return null;
  const all = await getAllCreatorsDBAsync();
  return (
    all.find((c) => {
      return isSameIp(c.registeredIp, ip) || isSameIp(c.clientIp, ip);
    }) || null
  );
}

export async function addCreatorDB(creator: CreatorProfile): Promise<CreatorProfile> {
  const current = getAllCreatorsDB();

  // Normalize slug, handle, and niche — use slug as the primary identifier
  const rawSlug = (creator.slug || creator.username || 'creator').toLowerCase().replace(/^@/, '').trim();
  const cleanSlug = rawSlug.replace(/[^a-z0-9_-]/g, '') || 'creator';
  creator.slug = cleanSlug;
  creator.username = creator.username ? creator.username.toLowerCase().replace(/^@/, '') : cleanSlug;
  creator.handle = creator.handle || `@${cleanSlug}`;
  // Store slug as passportId for backwards compat — but never display it as CP-xxx
  creator.passportId = cleanSlug;
  creator.niche = creator.niche || creator.category || 'Creator';
  creator.category = creator.niche;
  if (!creator.id || creator.id === 'user_my_pass') {
    creator.id = `creator_${cleanSlug}`;
  }

  const existingIdx = current.findIndex(
    (c) =>
      (c.slug && c.slug.toLowerCase() === cleanSlug) ||
      (c.username && c.username.toLowerCase() === creator.username.toLowerCase()) ||
      (c.id && c.id !== 'user_my_pass' && creator.id !== 'user_my_pass' && c.id.toLowerCase() === creator.id.toLowerCase())
  );

  let updatedList: CreatorProfile[];
  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const merged: CreatorProfile = {
      ...existing,
      ...creator,
      id: existing.id || `creator_${cleanSlug}`,
      slug: cleanSlug,
      handle: `@${cleanSlug}`,
      passportId: cleanSlug,
      registeredIp: existing.registeredIp || creator.registeredIp,
      digitalSignature: existing.digitalSignature || creator.digitalSignature,
      category: creator.category || existing.category,
      niche: creator.niche || existing.niche || creator.category,
      verification_status: creator.verification_status || existing.verification_status,
      proofDocuments: creator.proofDocuments || existing.proofDocuments || [],
      connections: {
        ...existing.connections,
        ...creator.connections,
        youtube: {
          platform: 'YOUTUBE' as const,
          connected: true,
          metricLabel: 'subscribers',
          verified: true,
          ...existing.connections?.youtube,
          ...creator.connections?.youtube,
          username: creator.connections?.youtube?.username || existing.connections?.youtube?.username || creator.username || 'creator',
          channelId: (creator.connections?.youtube?.profileUrl && creator.connections.youtube.profileUrl !== existing.connections?.youtube?.profileUrl)
            ? (creator.connections.youtube.channelId || '')
            : (creator.connections?.youtube?.channelId || existing.connections?.youtube?.channelId || ''),
          metricValue: creator.connections?.youtube?.metricValue || existing.connections?.youtube?.metricValue || '0',
          rawCount: creator.connections?.youtube?.rawCount ?? existing.connections?.youtube?.rawCount,
          profileUrl: resolveYouTubeUrl(
            creator.connections?.youtube?.profileUrl || existing.connections?.youtube?.profileUrl,
            creator.connections?.youtube?.username || existing.connections?.youtube?.username,
            creator.connections?.youtube?.channelId || existing.connections?.youtube?.channelId,
            creator.username || existing.username
          ),
        },
        discord: {
          platform: 'DISCORD' as const,
          connected: true,
          metricLabel: 'members',
          verified: true,
          ...existing.connections?.discord,
          ...creator.connections?.discord,
          username: creator.connections?.discord?.username || existing.connections?.discord?.username || creator.displayName || 'community',
          guildId: (creator.connections?.discord?.profileUrl && creator.connections.discord.profileUrl !== existing.connections?.discord?.profileUrl)
            ? (creator.connections.discord.guildId || '')
            : (creator.connections?.discord?.guildId || existing.connections?.discord?.guildId || ''),
          metricValue: creator.connections?.discord?.metricValue || existing.connections?.discord?.metricValue || '0',
          rawCount: creator.connections?.discord?.rawCount ?? existing.connections?.discord?.rawCount,
          profileUrl: resolveDiscordUrl(
            creator.connections?.discord?.profileUrl || existing.connections?.discord?.profileUrl,
            creator.connections?.discord?.guildName || creator.connections?.discord?.username || existing.connections?.discord?.guildName,
            creator.connections?.discord?.guildId || existing.connections?.discord?.guildId,
            creator.username || existing.username
          ),
        },
        ...(creator.connections?.instagram ? {
          instagram: {
            ...existing.connections?.instagram,
            ...creator.connections.instagram,
            platform: 'INSTAGRAM' as const,
            connected: true,
            metricLabel: 'followers',
            verified: true,
            metricValue: creator.connections.instagram.metricValue || existing.connections?.instagram?.metricValue || '',
            username: creator.connections.instagram.username || existing.connections?.instagram?.username || creator.username || '',
            profileUrl: resolveInstagramUrl(
              creator.connections.instagram.profileUrl || existing.connections?.instagram?.profileUrl,
              creator.connections.instagram.username || existing.connections?.instagram?.username,
              creator.username || existing.username
            ),
          }
        } : (existing.connections?.instagram ? { instagram: existing.connections.instagram } : {})),
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

  // Automatically sync creator proof and verification entry to verifications database
  try {
    syncCreatorToVerificationDB(existingIdx >= 0 ? current[existingIdx] : creator);
  } catch (e) {}

  // Sync to Firebase in background
  try {
    await syncCreatorToFirebase(creator);
  } catch (e) {
    // Non-blocking
  }

  const savedRecord = existingIdx >= 0 ? current[existingIdx] : creator;
  try {
    notifySubscribers({
      type: existingIdx >= 0 ? 'CREATOR_UPDATED' : 'CREATOR_CREATED',
      slug: savedRecord.slug,
      status: savedRecord.verification_status,
      isVerified: savedRecord.isVerified,
      creator: savedRecord,
    });
  } catch (e) {}

  return savedRecord;
}

export function clearAllCreatorsDB(): boolean {
  saveCreatorsToDisk([]);
  memoryCreators = [];
  return true;
}

export async function deleteCreatorDB(target: string | string[]): Promise<boolean> {
  const rawList = Array.isArray(target) ? target : [target];
  const targets = rawList
    .filter(Boolean)
    .map((t) => t.trim().toUpperCase().replace(/^@/, ''));

  if (targets.includes('ALL') || targets.includes('CLEAR')) {
    return clearAllCreatorsDB();
  }

  const current = getAllCreatorsDB();
  const filtered = current.filter((c) => {
    const cSlug = (c.slug || '').toUpperCase();
    const cPass = (c.passportId || '').toUpperCase();
    const cHandle = (c.handle || '').toUpperCase().replace(/^@/, '');
    const cId = (c.id || '').toUpperCase();
    const cUser = (c.username || '').toUpperCase();
    const cName = (c.displayName || '').toUpperCase();

    const matchesAny = targets.some(
      (t) =>
        t === cSlug ||
        t === cPass ||
        t === cHandle ||
        t === cId ||
        t === cUser ||
        t === cName ||
        isSameIp(c.registeredIp, t) ||
        isSameIp(c.clientIp, t)
    );

    return !matchesAny;
  });

  saveCreatorsToDisk(filtered);

  try {
    loadVerificationsFromDisk();
    const filteredVerifs = memoryVerifications.filter((v) => {
      const vSlug = (v.creatorSlug || '').toUpperCase();
      return !targets.includes(vSlug);
    });
    saveVerificationsToDisk(filteredVerifs);
  } catch (e) {}

  for (const t of targets) {
    try {
      await deleteCreatorFromFirebase(t);
    } catch (e) {}
    try {
      notifySubscribers({
        type: 'CREATOR_DELETED',
        slug: t.toLowerCase(),
      });
    } catch (e) {}
  }
  return true;
}

// ==========================================
// VERIFICATION SYSTEM
// ==========================================

function mergeIncomingVerifications(incoming: VerificationSubmission[]): boolean {
  let changed = false;
  for (const v of incoming) {
    const cleanId = (v.id || '').toLowerCase().trim();
    const cleanSlug = (v.creatorSlug || '').toLowerCase().replace(/^@/, '').trim();
    if (!cleanId && !cleanSlug) continue;
    const idx = memoryVerifications.findIndex(
      (m) => (m.id || '').toLowerCase().trim() === cleanId || (m.creatorSlug || '').toLowerCase().replace(/^@/, '').trim() === cleanSlug
    );
    if (idx === -1) {
      memoryVerifications.push(v);
      changed = true;
    } else {
      memoryVerifications[idx] = {
        ...memoryVerifications[idx],
        ...v,
      };
    }
  }
  return changed;
}

function loadVerificationsFromDisk(): VerificationSubmission[] {
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
      const parsed: VerificationSubmission[] = JSON.parse(content || '[]');
      if (memoryVerifications.length === 0) {
        memoryVerifications = parsed;
      } else {
        mergeIncomingVerifications(parsed);
      }
    }
  } catch (err) {
    console.error('[DB] Error loading verifications:', err);
  }

  // Non-blocking background sync with live cloud store
  fetchFromCloudStore()
    .then((cloud) => {
      if (cloud.verifications && cloud.verifications.length > 0) {
        if (mergeIncomingVerifications(cloud.verifications)) {
          try {
            const paths = getWritablePaths();
            fs.writeFileSync(paths.verificationFile, JSON.stringify(memoryVerifications, null, 2), 'utf8');
          } catch (e) {}
        }
      }
    })
    .catch(() => {});

  return memoryVerifications;
}

function saveVerificationsToDisk(items: VerificationSubmission[]): boolean {
  memoryVerifications = items;
  try {
    ensureDataFile();
    const paths = getWritablePaths();
    fs.writeFileSync(paths.verificationFile, JSON.stringify(items, null, 2), 'utf8');

    if (!paths.isTmp || fs.existsSync(SEED_VERIFICATION_FILE)) {
      try {
        fs.writeFileSync(SEED_VERIFICATION_FILE, JSON.stringify(items, null, 2), 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.error('[DB] Error saving verifications:', err);
  }

  // Push to cloud store immediately
  pushVerificationsToCloudStore(memoryVerifications).catch(() => {});
  return true;
}

/**
 * Syncs a creator profile's proof screenshot and channels into the verification database
 */
export function syncCreatorToVerificationDB(creator: CreatorProfile): VerificationSubmission | null {
  try {
    const slug = (creator.slug || creator.username || '').toLowerCase().replace(/^@/, '').trim();
    if (!slug) return null;

    loadVerificationsFromDisk();
    const all = memoryVerifications;

    // Collect proof documents
    const proofs: ProofDocument[] = [];
    if (creator.connections?.youtube?.proofScreenshot) {
      proofs.push({
        id: `proof_yt_${creator.id || slug}`,
        url: creator.connections.youtube.proofScreenshot,
        filename: 'youtube_studio_proof.png',
        mimeType: 'image/png',
        platform: 'YOUTUBE',
        uploadedAt: creator.issuedAt || new Date().toISOString(),
        notes: `YouTube Channel Proof for ${creator.displayName} (${creator.connections?.youtube?.metricValue || 'Metrics'})`,
      });
    }
    if (creator.connections?.discord?.proofScreenshot) {
      proofs.push({
        id: `proof_dc_${creator.id || slug}`,
        url: creator.connections.discord.proofScreenshot,
        filename: 'discord_server_proof.png',
        mimeType: 'image/png',
        platform: 'DISCORD',
        uploadedAt: creator.issuedAt || new Date().toISOString(),
        notes: `Discord Community Proof for ${creator.displayName} (${creator.connections?.discord?.metricValue || 'Metrics'})`,
      });
    }
    if (Array.isArray(creator.proofDocuments)) {
      for (const doc of creator.proofDocuments) {
        if (!proofs.some((p) => p.url === doc.url)) {
          proofs.push(doc);
        }
      }
    }

    const idx = all.findIndex(
      (v) =>
        (v.creatorSlug || '').toLowerCase() === slug ||
        (v.id || '').toLowerCase() === `vrf_${slug}` ||
        (v.creatorHandle || '').toLowerCase().replace(/^@/, '') === slug
    );
    const existing = idx >= 0 ? all[idx] : null;

    let currentStatus: VerificationStatus = 'PENDING';
    if (creator.isVerified || existing?.status === 'VERIFIED' || creator.verification_status === 'VERIFIED') {
      currentStatus = 'VERIFIED';
    } else if (creator.verification_status === 'REJECTED' || existing?.status === 'REJECTED') {
      currentStatus = 'REJECTED';
    } else if (creator.verification_status === 'UNDER_REVIEW' || existing?.status === 'UNDER_REVIEW') {
      currentStatus = 'UNDER_REVIEW';
    } else if (existing?.status) {
      currentStatus = existing.status;
    }

    const submission: VerificationSubmission = {
      id: existing?.id || `vrf_${Date.now()}_${slug}`,
      creatorSlug: slug,
      creatorName: creator.displayName,
      creatorHandle: `@${slug}`,
      creatorAvatar: creator.avatarUrl,
      category: creator.category || 'Creator',
      platforms: ['YOUTUBE', 'DISCORD'],
      connectedPlatforms: creator.connections || {},
      proofDocuments: proofs.length > 0 ? proofs : (existing?.proofDocuments || []),
      status: currentStatus,
      submittedAt: existing?.submittedAt || creator.issuedAt || new Date().toISOString(),
      rejectionReason: creator.rejectionReason || existing?.rejectionReason,
      reviewedAt: existing?.reviewedAt,
      reviewedBy: existing?.reviewedBy,
    };

    if (idx >= 0) {
      all[idx] = submission;
    } else {
      all.unshift(submission);
    }

    saveVerificationsToDisk(all);
    return submission;
  } catch (err) {
    console.error('[DB] Error syncing creator to verifications:', err);
    return null;
  }
}

export function getAllVerificationsDB(): VerificationSubmission[] {
  loadVerificationsFromDisk();

  // Auto-sync: Ensure every creator from creators.json is represented in verification reviews and kept in sync
  try {
    const creators = getAllCreatorsDB();
    let hasChanges = false;
    for (const c of creators) {
      const slug = (c.slug || c.username || '').toLowerCase().replace(/^@/, '').trim();
      if (!slug) continue;
      const vIdx = memoryVerifications.findIndex((v) => (v.creatorSlug || '').toLowerCase() === slug);
      if (vIdx === -1) {
        syncCreatorToVerificationDB(c);
        hasChanges = true;
      } else {
        const v = memoryVerifications[vIdx];
        const cStatus = c.verification_status || (c.isVerified ? 'VERIFIED' : 'PENDING');
        if (v.status !== cStatus) {
          v.status = cStatus;
          hasChanges = true;
        }
      }
    }
    if (hasChanges) {
      saveVerificationsToDisk(memoryVerifications);
    }
  } catch (e) {}

  return memoryVerifications;
}

export async function getAllVerificationsDBAsync(): Promise<VerificationSubmission[]> {
  try {
    const cloud = await fetchFromCloudStore();
    if (cloud.verifications && cloud.verifications.length > 0) {
      mergeIncomingVerifications(cloud.verifications);
    }
  } catch (e) {}
  return getAllVerificationsDB();
}

export function getVerificationByIdDB(id: string): VerificationSubmission | null {
  const all = getAllVerificationsDB();
  const cleanId = id.trim().toLowerCase();
  const cleanSlug = cleanId.replace(/^vrf_creator_/, '').replace(/^vrf_/, '');
  return all.find((v) => v.id.toLowerCase() === cleanId || v.creatorSlug.toLowerCase() === cleanSlug) || null;
}

export function getVerificationsBySlugDB(slug: string): VerificationSubmission[] {
  const all = getAllVerificationsDB();
  const clean = slug.replace(/^@/, '').toLowerCase().trim();
  return all.filter((v) => v.creatorSlug.toLowerCase() === clean);
}

export function submitVerificationDB(submission: Omit<VerificationSubmission, 'id' | 'status' | 'submittedAt'>): VerificationSubmission {
  const all = getAllVerificationsDB();
  
  const newSubmission: VerificationSubmission = {
    ...submission,
    id: `vrf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  };

  all.unshift(newSubmission);
  saveVerificationsToDisk(all);

  try {
    syncVerificationToFirebase(newSubmission);
  } catch (e) {}

  // Update the creator's verification_status
  const creator = getCreatorBySlugDB(submission.creatorSlug);
  if (creator) {
    creator.verification_status = 'PENDING';
    const allCreators = getAllCreatorsDB();
    const idx = allCreators.findIndex((c) => c.slug === creator.slug);
    if (idx >= 0) {
      allCreators[idx] = creator;
      saveCreatorsToDisk(allCreators);
    }
  }

  return newSubmission;
}

export function updateVerificationStatusDB(
  idOrSlug: string,
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED',
  reviewedBy?: string,
  rejectionReason?: string,
  extraCreatorData?: Partial<CreatorProfile>
): { verification: VerificationSubmission | null; creator: CreatorProfile | null } {
  loadCreatorsFromDisk();
  loadVerificationsFromDisk();

  const cleanTarget = (idOrSlug || '').trim().toLowerCase();
  const rawClean = cleanTarget
    .replace(/^@/, '')
    .replace(/^vrf_/, '')
    .replace(/^creator_/, '');

  // Extract possible slug from timestamped id e.g. vrf_1741234567890_someuser
  let timestampExtractedSlug = '';
  const parts = cleanTarget.split('_');
  if (parts.length >= 3 && parts[0] === 'vrf') {
    timestampExtractedSlug = parts.slice(2).join('_');
  }

  const candidateKeys = [
    cleanTarget,
    rawClean,
    timestampExtractedSlug,
    extraCreatorData?.slug?.toLowerCase(),
    extraCreatorData?.username?.toLowerCase(),
    extraCreatorData?.passportId?.toLowerCase(),
    extraCreatorData?.id?.toLowerCase(),
    extraCreatorData?.displayName?.toLowerCase(),
  ].filter(Boolean) as string[];

  // 1. Resolve verification submission
  const allVerifs = getAllVerificationsDB();
  let vIdx = allVerifs.findIndex((v) => {
    const vId = (v.id || '').toLowerCase();
    const vSlug = (v.creatorSlug || '').toLowerCase();
    const vHandle = (v.creatorHandle || '').toLowerCase().replace(/^@/, '');
    const vName = (v.creatorName || '').toLowerCase();

    return candidateKeys.some(
      (k) =>
        vId === k ||
        vSlug === k ||
        vHandle === k ||
        vName === k ||
        vId.endsWith(`_${k}`) ||
        vId.replace(/^vrf_/, '') === k
    );
  });

  let canonicalSlug =
    (vIdx >= 0 ? allVerifs[vIdx].creatorSlug : null) ||
    timestampExtractedSlug ||
    extraCreatorData?.slug ||
    extraCreatorData?.username ||
    rawClean ||
    'creator';
  canonicalSlug = canonicalSlug.toLowerCase().replace(/^@/, '');

  // 2. Find and update the creator in creators.json
  const allCreators = getAllCreatorsDB();
  let cIdx = allCreators.findIndex((c) => {
    const s = (c.slug || '').toLowerCase();
    const u = (c.username || '').toLowerCase();
    const p = (c.passportId || '').toLowerCase();
    const h = (c.handle || '').toLowerCase().replace(/^@/, '');
    const id = (c.id || '').toLowerCase();
    const name = (c.displayName || '').toLowerCase();

    return candidateKeys.concat([canonicalSlug]).some(
      (k) =>
        s === k ||
        u === k ||
        p === k ||
        h === k ||
        id === k ||
        id === `creator_${k}` ||
        id.replace(/^creator_/, '') === k ||
        name === k ||
        name.replace(/[^a-z0-9]/g, '') === k.replace(/[^a-z0-9]/g, '')
    );
  });

  let updatedCreator: CreatorProfile | null = null;
  const isVerified = status === 'VERIFIED';

  if (cIdx >= 0) {
    allCreators[cIdx] = {
      ...allCreators[cIdx],
      isVerified,
      verification_status: status,
      tierName: isVerified
        ? (allCreators[cIdx].tierName && allCreators[cIdx].tierName !== 'Candidate Member'
            ? allCreators[cIdx].tierName
            : 'Founding Member Tier I')
        : 'Candidate Member',
      lastVerifiedAt: isVerified ? new Date().toISOString().split('T')[0] : allCreators[cIdx].lastVerifiedAt,
      rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Proof inconclusive') : undefined,
    };
    updatedCreator = allCreators[cIdx];
    saveCreatorsToDisk(allCreators);

    try {
      syncCreatorToFirebase(updatedCreator);
    } catch (e) {}
  } else if (extraCreatorData && (extraCreatorData.displayName || extraCreatorData.username || extraCreatorData.slug)) {
    // If not found in creators array, synthesize/upsert it directly
    const synthesized: CreatorProfile = {
      id: extraCreatorData.id || `creator_${canonicalSlug}`,
      passportId: extraCreatorData.passportId || canonicalSlug,
      slug: extraCreatorData.slug || canonicalSlug,
      handle: extraCreatorData.handle || `@${canonicalSlug}`,
      username: extraCreatorData.username || canonicalSlug,
      displayName: extraCreatorData.displayName || canonicalSlug,
      avatarUrl: extraCreatorData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: extraCreatorData.bio || 'Creator on CreatorHQ',
      category: extraCreatorData.category || 'Creator',
      country: extraCreatorData.country || 'Global',
      location: extraCreatorData.location || 'Global',
      contactEmail: extraCreatorData.contactEmail || `${canonicalSlug}@creatorhq.fun`,
      issuedAt: extraCreatorData.issuedAt || new Date().toISOString(),
      lastVerifiedAt: (isVerified ? new Date().toISOString().split('T')[0] : extraCreatorData.lastVerifiedAt) || new Date().toISOString().split('T')[0],
      digitalSignature: extraCreatorData.digitalSignature || `0x${Date.now().toString(16)}`,
      isSuspended: extraCreatorData.isSuspended ?? false,
      isVerified,
      verification_status: status,
      tierName: isVerified ? 'Founding Member Tier I' : 'Candidate Member',
      profileCompletion: extraCreatorData.profileCompletion ?? 100,
      skills: extraCreatorData.skills || ['Content Creator'],
      achievements: extraCreatorData.achievements || [],
      collaborations: extraCreatorData.collaborations || [],
      portfolio: extraCreatorData.portfolio || [],
      connections: (extraCreatorData.connections as any) || {},
      ...extraCreatorData,
    };
    allCreators.push(synthesized);
    saveCreatorsToDisk(allCreators);
    updatedCreator = synthesized;
    cIdx = allCreators.length - 1;
  } else if (vIdx >= 0) {
    // Reconstruct creator from existing verification record
    const v = allVerifs[vIdx];
    const synthesized: CreatorProfile = {
      id: `creator_${v.creatorSlug || canonicalSlug}`,
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
      tierName: isVerified ? 'Founding Member Tier I' : 'Candidate Member',
      profileCompletion: 100,
      skills: ['Content Creator'],
      achievements: [],
      collaborations: [],
      portfolio: [],
      connections: (v.connectedPlatforms as any) || {},
    };
    allCreators.push(synthesized);
    saveCreatorsToDisk(allCreators);
    updatedCreator = synthesized;
    cIdx = allCreators.length - 1;
  }

  // 3. Update the corresponding verification in verifications.json
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

  // 4. Notify real-time SSE stream across all clients
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

  // Sync both to Firebase in background
  try {
    if (updatedCreator) syncCreatorToFirebase(updatedCreator);
    if (updatedSubmission) syncVerificationToFirebase(updatedSubmission);
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

    // Strip base64 prefix if present
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
}
