import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function cleanCollection(colName) {
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`Found ${snap.size} documents in ${colName}`);
    for (const doc of snap.docs) {
      await deleteDoc(doc.ref);
      console.log(`Deleted ${colName}/${doc.id}`);
    }
  } catch (err) {
    console.error(`Error cleaning ${colName}:`, err.message);
  }
}

async function run() {
  console.log('Starting Firebase Firestore complete data purge...');
  await cleanCollection('creators');
  await cleanCollection('verifications');
  await cleanCollection('auditLogs');
  await cleanCollection('sessions');

  // Also clean local server JSON files
  fs.writeFileSync('./data/creators.json', JSON.stringify([], null, 2));
  fs.writeFileSync('./data/verifications.json', JSON.stringify([], null, 2));
  fs.writeFileSync('./data/tombstones.json', JSON.stringify([], null, 2));
  fs.writeFileSync('./data/audit_logs.json', JSON.stringify([], null, 2));

  console.log('✅ All old data successfully purged from Firebase Firestore and local server storage.');
  process.exit(0);
}

run();
