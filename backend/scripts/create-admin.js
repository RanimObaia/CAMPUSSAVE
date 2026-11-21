// Donne le rôle "admin" à un compte.
//
//   Compte existant :  node scripts/create-admin.js ranimobaia@gmail.com
//   Nouveau compte  :  node scripts/create-admin.js admin@campussave.tn motDePasse Nom Prenom
//
// Ensuite, la personne doit se déconnecter puis se reconnecter
// pour que son nouveau rôle soit dans son jeton.
require('dotenv').config();
const { auth, db, FieldValue } = require('../src/config/firebase');

const [email, motDePasse, nom = 'Admin', prenom = 'CampusSave'] = process.argv.slice(2);

(async () => {
  if (!email) {
    console.log('Usage : node scripts/create-admin.js <email> [motDePasse Nom Prenom]');
    process.exit(1);
  }

  let compte;
  try {
    compte = await auth.getUserByEmail(email.toLowerCase());
    console.log(`Compte trouvé : ${compte.email}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    if (!motDePasse || motDePasse.length < 6) {
      throw new Error("Ce compte n'existe pas : donne aussi un mot de passe (6 caractères min.).");
    }
    compte = await auth.createUser({ email: email.toLowerCase(), password: motDePasse, displayName: `${prenom} ${nom}` });
    console.log(`Compte créé : ${compte.email}`);
  }

  await auth.setCustomUserClaims(compte.uid, { role: 'admin' });

  const ref = db.collection('users').doc(compte.uid);
  const existant = await ref.get();
  if (existant.exists) {
    // Les champs propres aux étudiants n'ont plus de sens pour un admin.
    await ref.update({
      role: 'admin', actif: true,
      ecoPoints: FieldValue.delete(), etablissement: FieldValue.delete(), numeroEtudiant: FieldValue.delete(),
    });
  } else {
    await ref.set({ nom, prenom, email: compte.email, role: 'admin', actif: true, dateInscription: FieldValue.serverTimestamp() });
  }

  console.log(`✅ ${compte.email} est maintenant administrateur.`);
  console.log('   Déconnecte-toi puis reconnecte-toi pour que le rôle soit pris en compte.');
  process.exit(0);
})().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});