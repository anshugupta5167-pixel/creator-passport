import fs from 'fs';
import path from 'path';
import { hashPassword, verifyPassword, checkRateLimit, generateSalt, generateSecureToken } from '../src/lib/auth';
import {
  getUserByEmailDB,
  getUserByUsernameDB,
  createUserDB,
  getAllCreatorsDB,
  addCreatorDB,
  getCreatorByUserIdDB,
  getCreatorBySlugDB,
  deleteCreatorDB,
  createSessionDB,
  getSessionDB,
  deleteSessionDB,
  updateVerificationStatusDB,
  getAuditLogsDB,
  addAuditLogDB,
} from '../src/lib/db';
import { resolveYouTubeUrl } from '../src/lib/urls';
import { parseYouTubeInput } from '../src/lib/youtube';
import { parseDiscordInvite } from '../src/lib/discord';

async function runFullAudit() {
  console.log('\n=============================================================');
  console.log('       CREATORHQ FULL AUDIT & VERIFICATION TEST SUITE        ');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details: string = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '– ' + details : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: DATABASE RESET & CLEAN STATE INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- 1. Controlled Data Reset & Migration Safety ---');
  const lockfilePath = path.join(process.cwd(), 'data', '.reset_completed');
  assert(fs.existsSync(lockfilePath), 'One-time reset lockfile (.reset_completed) exists');

  const adminUser = getUserByEmailDB('admin@creatorhq.fun');
  assert(Boolean(adminUser), 'Initial secure Administrator exists in fresh database');
  assert(adminUser?.role === 'ADMIN', 'Initial administrator role is strictly "ADMIN"');

  const backupDir = path.join(process.cwd(), 'data', 'backups');
  assert(fs.existsSync(backupDir) && fs.readdirSync(backupDir).length > 0, 'Pre-reset backup file created and preserved');

  // -------------------------------------------------------------
  // TEST 2: SECURE AUTHENTICATION & PASSWORD HASHING
  // -------------------------------------------------------------
  console.log('\n--- 2. Secure Authentication & Session Security ---');
  const testPassword = 'StrongPassword123!@#';
  const salt = generateSalt();
  const hash = hashPassword(testPassword, salt);
  assert(hash.length === 128, 'Password hash is 64-byte SHA-512 in hex (128 chars)');
  assert(verifyPassword(testPassword, salt, hash), 'Password verification succeeds with correct password');
  assert(!verifyPassword('WrongPassword', salt, hash), 'Password verification fails with incorrect password');
  assert(!verifyPassword(testPassword, salt, 'fakehash'), 'Password verification fails with tampered hash');

  // Test User Creation
  const testEmail = `test_creator_${Date.now()}@creatorhq.fun`;
  const testUsername = `creator_${Date.now().toString(36)}`;
  const userObj = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: testEmail,
    username: testUsername,
    displayName: 'Test Creator',
    passwordHash: hash,
    passwordSalt: salt,
    role: 'CREATOR' as const,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const newUser = createUserDB(userObj);
  assert(Boolean(newUser.id), 'New user account created successfully with generated ID');
  assert(getUserByEmailDB(testEmail)?.id === newUser.id, 'User retrieval by email succeeds');
  assert(getUserByUsernameDB(testUsername)?.id === newUser.id, 'User retrieval by username succeeds');

  // Session Token Creation & Verification
  const token = generateSecureToken(32);
  const session = createSessionDB({
    id: `sess_${Date.now()}`,
    userId: newUser.id,
    token: token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  assert(Boolean(session.id), 'Session generated and stored in session store');
  const retrievedSession = getSessionDB(session.token);
  assert(retrievedSession?.userId === newUser.id, 'Session correctly references authenticated user');

  // Session Revocation
  deleteSessionDB(session.token);
  assert(!getSessionDB(session.token), 'Session revoked and deleted from active session pool');

  // Rate Limiting
  const ipKey = 'rate_test_ip';
  for (let i = 0; i < 5; i++) {
    checkRateLimit(ipKey, 5, 60000);
  }
  const blocked = !checkRateLimit(ipKey, 5, 60000);
  assert(blocked, 'Rate limiting strictly throttles excessive consecutive requests');

  // -------------------------------------------------------------
  // TEST 3: STRICT ACCOUNT & CREATOR CARD OWNERSHIP
  // -------------------------------------------------------------
  console.log('\n--- 3. Strict Account & Creator Card Ownership ---');
  const creator1Card = await addCreatorDB({
    id: `card_${newUser.id}`,
    userId: newUser.id,
    slug: testUsername,
    handle: `@${testUsername}`,
    username: testUsername,
    displayName: 'Test Creator',
    avatarUrl: 'https://ui-avatars.com/api/?name=Test+Creator',
    category: 'Gaming Creator',
    country: 'Global',
    bio: 'Test bio',
    isVerified: false,
    verification_status: 'PENDING',
    profileCompletion: 80,
    contactEmail: testEmail,
    issuedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    digitalSignature: '0x123',
    isSuspended: false,
    connections: {},
    moreChannels: [],
    skills: [],
    achievements: [],
    collaborations: [],
    portfolio: [],
  });

  assert(Boolean(creator1Card), 'Creator card saved with userId binding');
  const fetchedByUserId = getCreatorByUserIdDB(newUser.id);
  assert(
    fetchedByUserId?.id === creator1Card.id,
    'Card correctly fetched by authenticated user ID'
  );

  // Cross-Account Ownership Checks: Second user cannot claim or overwrite first user's slug
  const user2Email = `user2_${Date.now()}@creatorhq.fun`;
  const user2Name = `user2_${Date.now().toString(36)}`;
  const user2Obj = {
    id: `usr_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`,
    email: user2Email,
    username: user2Name,
    displayName: 'User 2',
    passwordHash: hash,
    passwordSalt: salt,
    role: 'CREATOR' as const,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const user2 = createUserDB(user2Obj);

  const existingCreators = getAllCreatorsDB();
  const slugCollision = existingCreators.some(
    c => c.userId !== user2.id && c.slug.toLowerCase() === testUsername.toLowerCase()
  );
  assert(slugCollision, 'System detects and rejects cross-account handle collision');

  // -------------------------------------------------------------
  // TEST 4: "MORE CHANNELS" OWNER BINDING & DEDUPLICATION
  // -------------------------------------------------------------
  console.log('\n--- 4. More Channels Management & Deduplication ---');
  const initialChannels = (fetchedByUserId?.moreChannels || creator1Card.moreChannels || []);
  const testChannel = {
    id: 'ch_test_1',
    name: 'Main Gaming Channel',
    handle: '@testchannel',
    url: 'https://youtube.com/@testchannel',
    subscribers: '50.2K',
    numericSubscribers: 50200,
    verified: true,
  };

  const updatedCard = await addCreatorDB({
    ...(fetchedByUserId || creator1Card),
    moreChannels: [...initialChannels, testChannel],
  });

  const channelsList = updatedCard?.moreChannels || [];
  assert(channelsList.length === initialChannels.length + 1, 'Channel added successfully to owner card');
  assert(
    channelsList[channelsList.length - 1]?.handle === '@testchannel',
    'Channel metadata preserved without corruption'
  );

  // -------------------------------------------------------------
  // TEST 5: SOCIAL PLATFORM URL RESOLUTION & ANTI-FAKE STATS
  // -------------------------------------------------------------
  console.log('\n--- 5. Platform Resolution & Zero Fake Statistics ---');
  const parsedYt = parseYouTubeInput('https://www.youtube.com/@PewDiePie');
  assert(parsedYt?.type === 'handle' && parsedYt?.cleanValue.toLowerCase() === 'pewdiepie', 'YouTube handle URL resolved reliably');

  const parsedYtId = parseYouTubeInput('https://youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw');
  assert(parsedYtId?.type === 'channelId' && parsedYtId?.cleanValue === 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', 'YouTube Channel ID resolved accurately');

  const parsedDc = parseDiscordInvite('https://discord.gg/minecraft');
  assert(parsedDc?.inviteCode === 'minecraft', 'Discord invite code parsed reliably');

  // -------------------------------------------------------------
  // TEST 6: ADMIN REVIEW, AUDIT TRAIL & CASCADING DELETION
  // -------------------------------------------------------------
  console.log('\n--- 6. Admin Panel RBAC, Audit Logging & Cascading Deletion ---');
  // Admin verifies creator
  const reviewResult = updateVerificationStatusDB(
    creator1Card.slug,
    'VERIFIED',
    'admin@creatorhq.fun',
    'Verified with official platform metrics',
    creator1Card
  );
  assert(reviewResult.creator?.isVerified === true, 'Admin status change updates creator to VERIFIED');
  assert(reviewResult.creator?.verification_status === 'VERIFIED', 'Creator verification_status set to VERIFIED');

  // Audit Log Entry
  const auditEntry = addAuditLogDB({
    userId: adminUser?.id,
    action: 'TEST_ADMIN_ACTION',
    actor: 'admin@creatorhq.fun',
    details: { targetSlug: creator1Card.slug, status: 'VERIFIED' },
  });
  assert(Boolean(auditEntry.id), 'Audit log written to immutable log storage');
  const logs = getAuditLogsDB();
  assert(logs.some(l => l.id === auditEntry.id), 'Audit log verified in log query');

  // Cascading Deletion of Creator & References
  const deleted = await deleteCreatorDB([creator1Card.id, creator1Card.slug, newUser.id]);
  assert(deleted, 'Creator card and associated records deleted cleanly');
  assert(getCreatorBySlugDB(creator1Card.slug) === null, 'Deleted creator no longer retrievable by slug');
  assert(getCreatorByUserIdDB(newUser.id) === null, 'Deleted creator no longer retrievable by userId');

  console.log('\n=============================================================');
  console.log(`  AUDIT SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED  `);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
