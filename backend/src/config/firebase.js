const admin = require('firebase-admin');

// Credentials come from the service-account JSON file whose path is in
// GOOGLE_APPLICATION_CREDENTIALS (see .env.example). Never commit that file.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

module.exports = { admin, db, auth, messaging };
