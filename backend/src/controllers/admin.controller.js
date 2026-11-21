const { auth, db } = require('../config/firebase');
const { ROLES } = require('../config/constants');
const { httpError, docToJson } = require('../utils/http');

const users = () => db.collection('users');

// GET /api/admin/users?role=merchant : tous les comptes, les plus récents d'abord.
async function listeUtilisateurs(req, res) {
  let query = users();
  if (req.query.role) query = query.where('role', '==', req.query.role);
  const snap = await query.get();
  const liste = snap.docs
    .map(docToJson)
    .sort((a, b) => String(b.dateInscription).localeCompare(String(a.dateInscription)));
  res.json(liste);
}

// PATCH /api/admin/users/:id  { actif: true | false }
// Suspendre = bloquer la connexion (Firebase Auth) + couper les sessions en cours.
async function changerActif(req, res) {
  const { id } = req.params;
  const { actif } = req.body;

  const doc = await users().doc(id).get();
  if (!doc.exists) throw httpError(404, 'UTILISATEUR_INTROUVABLE', 'Utilisateur introuvable.');
  if (doc.data().role === ROLES.ADMIN) {
    throw httpError(403, 'ACCES_REFUSE', 'Un compte administrateur ne peut pas être suspendu.');
  }

  await auth.updateUser(id, { disabled: !actif });
  if (!actif) await auth.revokeRefreshTokens(id);
  await users().doc(id).update({ actif });

  res.json(docToJson(await users().doc(id).get()));
}

module.exports = { listeUtilisateurs, changerActif };