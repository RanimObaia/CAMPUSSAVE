const { auth, db, FieldValue } = require('../config/firebase');
const { ROLES } = require('../config/constants');
const { httpError, docToJson, pick } = require('../utils/http');

// POST /api/auth/register
// Crée le compte (Firebase Authentication), lui attribue son rôle,
// puis enregistre le profil dans Firestore (collection "users").
async function register(req, res) {
  const { email, motDePasse, nom, prenom, role } = req.body;

  // 1. Le compte de connexion
  let compte;
  try {
    compte = await auth.createUser({
      email,
      password: motDePasse,
      displayName: `${prenom} ${nom}`,
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw httpError(409, 'EMAIL_DEJA_UTILISE', 'Cette adresse e-mail est déjà utilisée.');
    }
    throw err;
  }

  try {
    // 2. Le rôle, écrit dans le jeton : chaque requête saura qui est qui.
    await auth.setCustomUserClaims(compte.uid, { role });

    // 3. Le profil
    const profil = {
      ...pick(req.body, ['nom', 'prenom', 'telephone']),
      email,
      role,
      actif: true,
      dateInscription: FieldValue.serverTimestamp(),
    };
    if (role === ROLES.STUDENT) {
      Object.assign(profil, pick(req.body, ['etablissement', 'numeroEtudiant']), { ecoPoints: 0 });
    }
    await db.collection('users').doc(compte.uid).set(profil);

    const saved = await db.collection('users').doc(compte.uid).get();
    res.status(201).json(docToJson(saved));
  } catch (err) {
    // Si le profil n'a pas pu être créé, on supprime le compte
    // pour ne pas laisser un compte à moitié inscrit.
    await auth.deleteUser(compte.uid).catch(() => {});
    throw err;
  }
}

module.exports = { register };
