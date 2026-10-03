import crypto from 'crypto';

type ServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

type FirestoreValue = Record<string, unknown>;
type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const account = JSON.parse(raw) as ServiceAccount;
    if (!account.client_email || !account.private_key) return null;
    return { ...account, private_key: account.private_key.replace(/\\n/g, '\n') };
  } catch {
    return null;
  }
}

export function isFirebaseAdminStoreConfigured(): boolean {
  const account = getServiceAccount();
  return Boolean(account && (account.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
}

function getProjectId(account: ServiceAccount): string {
  const projectId = account.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase project ID is not configured.');
  return projectId;
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const account = getServiceAccount();
  if (!account) throw new Error('Firebase server credentials are not configured.');

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), account.private_key).toString('base64url');
  const assertion = `${signingInput}.${signature}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Firebase server authentication failed. Check the service account in Vercel.');
  const tokenData = await response.json() as { access_token?: string; expires_in?: number };
  if (!tokenData.access_token) throw new Error('Firebase server authentication returned no access token.');
  cachedAccessToken = {
    value: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  return cachedAccessToken.value;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item !== undefined) fields[key] = toFirestoreValue(item);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const arrayValue = value.arrayValue as { values?: FirestoreValue[] };
    return (arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    const mapValue = value.mapValue as { fields?: Record<string, FirestoreValue> };
    return fromFirestoreFields(mapValue.fields || {});
  }
  return undefined;
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function documentUrl(collection: string, id?: string): string {
  const account = getServiceAccount();
  if (!account) throw new Error('Firebase server credentials are not configured.');
  const projectId = getProjectId(account);
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  return id ? `${base}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}` : `${base}/${encodeURIComponent(collection)}`;
}

async function firestoreRequest(url: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
}

export async function readFirestoreDocument<T>(collection: string, id: string): Promise<T | null> {
  const response = await firestoreRequest(documentUrl(collection, id));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firebase read failed for ${collection}.`);
  const document = await response.json() as FirestoreDocument;
  return fromFirestoreFields(document.fields || {}) as T;
}

export async function listFirestoreDocuments<T>(collection: string): Promise<T[]> {
  const results: T[] = [];
  let pageToken = '';
  do {
    const url = new URL(documentUrl(collection));
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await firestoreRequest(url.toString());
    if (!response.ok) throw new Error(`Firebase list failed for ${collection}.`);
    const page = await response.json() as { documents?: FirestoreDocument[]; nextPageToken?: string };
    for (const document of page.documents || []) {
      results.push(fromFirestoreFields(document.fields || {}) as T);
    }
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return results;
}

export async function findFirestoreDocument<T>(collection: string, field: string, value: string): Promise<T | null> {
  const collectionUrl = documentUrl(collection);
  const url = `${collectionUrl.slice(0, collectionUrl.lastIndexOf('/'))}:runQuery`;
  const response = await firestoreRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: toFirestoreValue(value),
          },
        },
        limit: 1,
      },
    }),
  });
  if (!response.ok) throw new Error(`Firebase lookup failed for ${collection}.`);
  const rows = await response.json() as Array<{ document?: FirestoreDocument }>;
  const document = rows.find((row) => row.document)?.document;
  return document ? fromFirestoreFields(document.fields || {}) as T : null;
}

export async function writeFirestoreDocument(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
  const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]));
  const response = await firestoreRequest(documentUrl(collection, id), {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Firebase write failed for ${collection}.`);
}

export async function deleteFirestoreDocument(collection: string, id: string): Promise<boolean> {
  const response = await firestoreRequest(documentUrl(collection, id), { method: 'DELETE' });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Firebase delete failed for ${collection}.`);
  return true;
}
