const { db } = require('../config/firebase');
const { STATUT_VALIDATION } = require('../config/constants');
const { httpError, docToJson, pick } = require('../utils/http');

const CHAMPS_MODIFIABLES = ['nom', 'prenom', 'telephone', 'etablissement', 'numeroEtudiant', 'fcmToken', 'preferences'];

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
// preferences = { notifications: { favoris, rappels, commandes, emails }, langue, regimes }
async function updateMe(req, res) {
  const changes = pick(req.body, CHAMPS_MODIFIABLES);
  if (Object.keys(changes).length) {
    const actuel = await lireProfil(req.user.uid); // 404 si le profil n'existe pas
    if (changes.preferences) {
      const avant = actuel.preferences || {};
      changes.preferences = {
        ...avant,
        ...changes.preferences,
        notifications: { ...(avant.notifications || {}), ...(changes.preferences.notifications || {}) },
      };
    }
    await db.collection('users').doc(req.user.uid).update(changes);
  }
  res.json(await lireProfil(req.user.uid));
}

// GET /api/users/me/favoris : les commerces favoris, avec leur nombre d'offres disponibles
async function mesFavoris(req, res) {
  const profil = await lireProfil(req.user.uid);
  const ids = profil.favoris || [];
  const docs = await Promise.all(ids.map((id) => db.collection('shops').doc(id).get()));
  const commerces = docs
    .filter((d) => d.exists && d.data().statutValidation === STATUT_VALIDATION.VALIDE)
    .map(docToJson);
  const offresSnap = await db.collection('offers').where('statut', '==', 'ACTIVE').get();
  const maintenant = Date.now();
  const offres = offresSnap.docs.map(docToJson).filter(
    (o) => o.quantiteDisponible > 0 && new Date(o.heureFinRecuperation).getTime() > maintenant,
  );
  res.json(commerces.map((c) => ({ ...c, offresDisponibles: offres.filter((o) => o.commerceId === c.id).length })));
}

// PUT /api/users/me/favoris/:commerceId  et  DELETE /api/users/me/favoris/:commerceId
async function changerFavori(req, res, ajouter) {
  const { commerceId } = req.params;
  if (ajouter) {
    const shop = await db.collection('shops').doc(commerceId).get();
    if (!shop.exists) throw httpError(404, 'COMMERCE_INTROUVABLE', 'Commerce introuvable.');
  }
  const profil = await lireProfil(req.user.uid);
  const favoris = new Set(profil.favoris || []);
  if (ajouter) favoris.add(commerceId);
  else favoris.delete(commerceId);
  await db.collection('users').doc(req.user.uid).update({ favoris: [...favoris] });
  res.json({ favoris: [...favoris] });
}

module.exports = {
  getMe,
  updateMe,
  mesFavoris,
  ajouterFavori: (req, res) => changerFavori(req, res, true),
  retirerFavori: (req, res) => changerFavori(req, res, false),
};
