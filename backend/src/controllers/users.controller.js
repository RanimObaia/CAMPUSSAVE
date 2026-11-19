const { db } = require('../config/firebase');
const { httpError, docToJson, pick } = require('../utils/http');

const CHAMPS_MODIFIABLES = ['nom', 'prenom', 'telephone', 'etablissement', 'numeroEtudiant', 'fcmToken'];

async function lireProfil(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) throw httpError(404, 'PROFIL_INTROUVABLE', 'Profil introuvable.');
  return docToJson(doc);
}

// GET /api/users/me : le profil de la personne connectée.
async function getMe(req, res) {
  res.json(await lireProfil(req.user.uid));
}

// PUT /api/users/me : modifier son profil (pas son rôle, ni son e-mail).
async function updateMe(req, res) {
  const changes = pick(req.body, CHAMPS_MODIFIABLES);
  if (Object.keys(changes).length) {
    await lireProfil(req.user.uid); // 404 si le profil n'existe pas
    await db.collection('users').doc(req.user.uid).update(changes);
  }
  res.json(await lireProfil(req.user.uid));
}

module.exports = { getMe, updateMe };
