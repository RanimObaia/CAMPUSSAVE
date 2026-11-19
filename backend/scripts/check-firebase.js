require('dotenv').config();
const { db, auth } = require('../src/config/firebase');

(async () => {
  const ref = db.collection('_check').doc('ping');
  await ref.set({ at: new Date().toISOString() });
  const snap = await ref.get();
  await ref.delete();
  const users = await auth.listUsers(1);
  console.log('✅ Firestore OK:', snap.data());
  console.log('✅ Authentication OK:', users.users.length, 'utilisateur(s) trouvé(s)');
  process.exit(0);
})().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});