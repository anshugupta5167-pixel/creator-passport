import crypto from 'node:crypto';
import { Db, GridFSBucket, MongoClient } from 'mongodb';

type MongoCache = typeof globalThis & {
  __creatorHqMongoClient?: MongoClient;
  __creatorHqMongoDbPromise?: Promise<Db>;
  __creatorHqIndexesPromise?: Promise<void>;
};

const globalMongo = globalThis as MongoCache;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB is not configured. Add MONGODB_URI to the hosting environment variables.');

  if (!globalMongo.__creatorHqMongoDbPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    globalMongo.__creatorHqMongoClient = client;
    globalMongo.__creatorHqMongoDbPromise = client.connect()
      .then(async (connected) => {
        const db = connected.db(process.env.MONGODB_DB_NAME || 'creatorhq');
        if (!globalMongo.__creatorHqIndexesPromise) {
          globalMongo.__creatorHqIndexesPromise = Promise.all([
            db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
            db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true }),
            db.collection('creators').createIndex({ slug: 1 }, { unique: true, sparse: true }),
            db.collection('creators').createIndex({ userId: 1 }, { unique: true, sparse: true }),
            db.collection('verifications').createIndex({ creatorSlug: 1 }, { unique: true, sparse: true }),
            db.collection('auditLogs').createIndex({ timestamp: -1 }),
            db.collection('sessions').createIndex({ token: 1 }, { unique: true, sparse: true }),
          ]).then(() => undefined);
        }
        await globalMongo.__creatorHqIndexesPromise;
        const users = db.collection('users');
        const existingAdmin = await users.findOne({ role: 'ADMIN' });
        const adminPasscode = process.env.ADMIN_PASSCODE;
        if (!existingAdmin && adminPasscode) {
          const email = (process.env.ADMIN_EMAIL || 'admin@creatorhq.fun').toLowerCase();
          const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
          const collision = await users.findOne({ $or: [{ email }, { username }] });
          if (!collision) {
            const salt = crypto.randomBytes(16).toString('hex');
            const passwordHash = crypto.pbkdf2Sync(adminPasscode, salt, 100000, 64, 'sha512').toString('hex');
            const now = new Date().toISOString();
            try {
              await users.insertOne({
                id: 'usr_admin_system_001',
                email,
                username,
                displayName: 'CreatorHQ Staff Admin',
                role: 'ADMIN',
                passwordHash,
                passwordSalt: salt,
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
              });
            } catch (error) {
              // Several serverless instances can initialize at once. If another
              // instance seeds the admin first, treat its unique-index result as success.
              if ((error as { code?: number }).code !== 11000) throw error;
            }
          }
        }
        return db;
      })
      .catch((error) => {
        globalMongo.__creatorHqMongoDbPromise = undefined;
        globalMongo.__creatorHqMongoClient = undefined;
        globalMongo.__creatorHqIndexesPromise = undefined;
        throw error;
      });
  }

  return globalMongo.__creatorHqMongoDbPromise;
}

export async function getMongoProofBucket(): Promise<GridFSBucket> {
  const db = await getMongoDb();
  return new GridFSBucket(db, { bucketName: 'creatorProofs' });
}

export async function saveMongoProofFile(filename: string, buffer: Buffer, contentType: string): Promise<string> {
  const bucket = await getMongoProofBucket();
  await new Promise<void>((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { metadata: { contentType } });
    upload.once('error', reject);
    upload.once('finish', () => resolve());
    upload.end(buffer);
  });
  return filename;
}

export async function readMongoProofFile(filename: string): Promise<{ buffer: Buffer; contentType?: string } | null> {
  const bucket = await getMongoProofBucket();
  const file = await bucket.find({ filename }).sort({ uploadDate: -1 }).limit(1).next();
  if (!file) return null;
  const chunks: Buffer[] = [];
  const stream = bucket.openDownloadStream(file._id);
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return {
    buffer: Buffer.concat(chunks),
    contentType: typeof file.metadata?.contentType === 'string' ? file.metadata.contentType : undefined,
  };
}
