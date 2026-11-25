const { initializeApp, getApps, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Two modes:
// - Local emulators (FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST set):
//   no credentials needed, only a project id.
// - Real Firebase project: credentials come from the service-account JSON
//   whose path is in GOOGLE_APPLICATION_CREDENTIALS. Never commit that file.
if (!getApps().length) {
  const usingEmulators =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;

  // Hébergeur sans fichiers (Railway, Render…) : tout le contenu du JSON de compte de service
  // peut être collé dans la variable FIREBASE_SERVICE_ACCOUNT_JSON.
  const compteDeService = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  initializeApp(
    usingEmulators
      ? { projectId: process.env.FIREBASE_PROJECT_ID || 'demo-campussave' }
      : { credential: compteDeService ? cert(JSON.parse(compteDeService)) : applicationDefault() },
  );
}

const db = getFirestore();
const auth = getAuth();

module.exports = { db, auth, FieldValue, Timestamp };