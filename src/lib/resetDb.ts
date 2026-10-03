/**
 * One-time database reset & migration script for CreatorHQ
 * 
 * 1. Backs up existing data/creators.json and data/verifications.json
 * 2. Clears all legacy user accounts, creator profiles, creator cards, and verifications
 * 3. Initializes fresh system state and default Admin user
 * 4. Pushes clean state to cloudStore (Gist) to prevent stale resurrecting
 * 5. Writes data/.reset_completed lockfile
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pushCreatorsToCloudStore, pushVerificationsToCloudStore } from './cloudStore';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export async function runControlledDataReset(): Promise<{ success: boolean; message: string; details: any }> {
  const dataDir = path.join(process.cwd(), 'data');
  const backupDir = path.join(dataDir, 'backups');
  const lockFile = path.join(dataDir, '.reset_completed');

  if (fs.existsSync(lockFile)) {
    const lockInfo = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    return {
      success: true,
      message: 'Database reset was already executed previously. Controlled lock active.',
      details: lockInfo,
    };
  }

  // 1. Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const creatorsFile = path.join(dataDir, 'creators.json');
  const verificationsFile = path.join(dataDir, 'verifications.json');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup_pre_reset_${timestamp}.json`);

  const backupData: any = {
    timestamp: new Date().toISOString(),
    creators: [],
    verifications: [],
  };

  if (fs.existsSync(creatorsFile)) {
    try {
      backupData.creators = JSON.parse(fs.readFileSync(creatorsFile, 'utf8'));
    } catch (e) {}
  }

  if (fs.existsSync(verificationsFile)) {
    try {
      backupData.verifications = JSON.parse(fs.readFileSync(verificationsFile, 'utf8'));
    } catch (e) {}
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`[RESET] Backed up ${backupData.creators.length} creators and ${backupData.verifications.length} verifications to ${backupPath}`);

  // 2. Clear old creator cards and verifications
  fs.writeFileSync(creatorsFile, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(verificationsFile, JSON.stringify([], null, 2), 'utf8');

  // 3. Clear proofs directory if it exists
  const proofsDir = path.join(dataDir, 'proofs');
  if (fs.existsSync(proofsDir)) {
    try {
      fs.rmSync(proofsDir, { recursive: true, force: true });
      fs.mkdirSync(proofsDir, { recursive: true });
    } catch (e) {}
  }

  // 4. Initialize Users database with default Admin
  const usersFile = path.join(dataDir, 'users.json');
  const sessionsFile = path.join(dataDir, 'sessions.json');
  const auditLogsFile = path.join(dataDir, 'audit_logs.json');

  const adminPasscode = process.env.ADMIN_PASSCODE || 'anshu@167';
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminPasswordHash = hashPassword(adminPasscode, adminSalt);

  const adminUser = {
    id: 'usr_admin_system_001',
    email: 'admin@creatorhq.fun',
    username: 'admin',
    displayName: 'CreatorHQ Staff Admin',
    role: 'ADMIN',
    passwordHash: adminPasswordHash,
    passwordSalt: adminSalt,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(usersFile, JSON.stringify([adminUser], null, 2), 'utf8');
  fs.writeFileSync(sessionsFile, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(
    auditLogsFile,
    JSON.stringify(
      [
        {
          id: `audit_${Date.now()}`,
          action: 'DATABASE_CLEAN_RESET',
          actor: 'System Initialization',
          details: {
            backedUpCreators: backupData.creators.length,
            backedUpVerifications: backupData.verifications.length,
            backupLocation: backupPath,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      null,
      2
    ),
    'utf8'
  );

  // 5. Clean up remote cloud store (Gist)
  try {
    await pushCreatorsToCloudStore([]);
    await pushVerificationsToCloudStore([]);
    console.log('[RESET] Cloud store successfully reset to clean state.');
  } catch (err) {
    console.warn('[RESET] Cloud store sync notice during reset:', err);
  }

  // 6. Write lockfile to prevent any accidental re-execution
  const lockData = {
    status: 'COMPLETED',
    resetAt: new Date().toISOString(),
    backupFile: backupPath,
    adminInitialized: 'admin@creatorhq.fun',
  };
  fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2), 'utf8');

  return {
    success: true,
    message: 'CreatorHQ database successfully reset to clean fresh state with backup preserved.',
    details: lockData,
  };
}

if (require.main === module) {
  runControlledDataReset()
    .then((res) => {
      console.log('Reset result:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Reset error:', err);
      process.exit(1);
    });
}
