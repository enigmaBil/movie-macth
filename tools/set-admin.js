/**
 * Usage: node tools/set-admin.js <userEmail>
 * Requires: set environment variable GOOGLE_APPLICATION_CREDENTIALS to a service account JSON
 * This script will locate the user by email using Firebase Auth and then set their Firestore document
 * role to 'admin' and isActive true.
 */
const admin = require('firebase-admin');

if (!process.argv[2]) {
  console.error('Usage: node tools/set-admin.js <userEmail>');
  process.exit(1);
}

const email = process.argv[2];

admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

async function run() {
  try {
    const user = await auth.getUserByEmail(email);
    console.log('Found user:', user.uid);

    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({ role: 'admin', isActive: true }, { merge: true });
    console.log(`User ${email} promoted to admin.`);
  } catch (e) {
    console.error('Error:', e);
    process.exit(2);
  }
}

run();
