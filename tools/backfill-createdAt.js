/*
  Usage:
    - Install dependencies: npm install firebase-admin
    - Set environment variable GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
    - Run: node tools/backfill-createdAt.js

  The script will iterate all documents in the `movies` collection and set `createdAt` to
  the existing `createdAt` if present, or to serverTimestamp() if missing.
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function backfill() {
  console.log('Scanning movies collection for missing createdAt...');
  const moviesRef = db.collection('movies');
  const snapshot = await moviesRef.get();
  console.log(`Found ${snapshot.size} movies.`);

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!Object.prototype.hasOwnProperty.call(data, 'createdAt') || data.createdAt === null) {
      console.log(`Updating ${doc.id} - missing createdAt`);
      await doc.ref.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
      updated++;
    }
  }

  console.log(`Backfill complete. Documents updated: ${updated}`);
}

backfill().catch(err => {
  console.error('Backfill error', err);
  process.exit(1);
});
