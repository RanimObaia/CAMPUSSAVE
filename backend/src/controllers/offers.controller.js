const { db, FieldValue } = require('../config/firebase');
const { ROLES, STATUT_VALIDATION, STATUT_OFFRE } = require('../config/constants');
const { httpError, docToJson, pick } = require('../utils/http');
const { commerceDuCommercant } = require('./shops.controller');

const offers = () => db.collection('offers');

// Champs que le commerçant peut remplir. statut, commerceId et les dates
// sont gérés par le serveur.
const CHAMPS_OFFRE = [
  'titre', 'description', 'categorie', 'prixInitial', 'prixReduit',
  'quantiteDisponible', 'heureDebutRecuperation', 'heureFinRecuperation', 'photoUrl',
];

// Statut affiché : une offre dont l'heure de fin est passée devient "EXPIREE".
function statutAffiche(offre) {
  if (offre.statut === STATUT_OFFRE.RETIREE) return STATUT_OFFRE.RETIREE;
  if (new Date(offre.heureFinRecuperation) <= new Date()) return STATUT_OFFRE.EXPIREE;
  return offre.statut;
}

// Statut enregistré selon le stock.
const statutSelonStock = (quantite) => (quantite > 0 ? STATUT_OFFRE.ACTIVE : STATUT_OFFRE.EPUISEE);

// Ajoute à chaque offre son statut affiché et un résumé de son commerce
// { id, nom, type, adresse, statutValidation } (le web l'affiche sur les cartes et le panier).
async function avecCommerces(liste) {
  const ids = [...new Set(liste.map((o) => o.commerceId))];
  const docs = await Promise.all(ids.map((id) => db.collection('shops').doc(id).get()));
  const parId = Object.fromEntries(docs.filter((d) => d.exists).map((d) => [d.id, d.data()]));
  return liste.map((o) => {
    const c = parId[o.commerceId];
    return {
      ...o,
      statut: statutAffiche(o),
      commerce: c
        ? { id: o.commerceId, nom: c.nom, type: c.type, adresse: c.adresse, statutValidation: c.statutValidation }
        : null,
    };
  });
}

async function lireOffre(id) {
  const doc = await offers().doc(id).get();
  if (!doc.exists) throw httpError(404, 'OFFRE_INTROUVABLE', 'Cette offre est introuvable.');
  return docToJson(doc);
}

// Le commerce du commerçant connecté ; il doit exister et être validé pour publier.
async function commerceValide(uid) {
  const commerce = await commerceDuCommercant(uid);
  if (!commerce) {
    throw httpError(403, 'COMMERCE_INTROUVABLE', "Enregistrez d'abord votre commerce dans « Mon commerce ».");
  }
  if (commerce.statutValidation !== STATUT_VALIDATION.VALIDE) {
    throw httpError(403, 'COMMERCE_NON_VALIDE', "Votre commerce doit être validé par l'administrateur avant de publier des offres.");
  }
  return commerce;
}

// Règles qui comparent deux champs (le validateur ne voit qu'un champ à la fois).
function verifierCoherence(o) {
  if (o.prixReduit >= o.prixInitial) {
    throw httpError(400, 'VALIDATION', 'Le prix réduit doit être inférieur au prix initial.');
  }
  if (new Date(o.heureFinRecuperation) <= new Date(o.heureDebutRecuperation)) {
    throw httpError(400, 'VALIDATION', "L'heure de fin doit suivre l'heure de début.");
  }
}

// GET /api/offers
//  - étudiant / visiteur : offres disponibles (ACTIVE, en stock, pas expirées, commerce validé)
//    filtres : ?q= (titre, description, nom du commerce) &categorie= &prixMax= (millimes) &commerceId=
//  - commerçant avec ?mine=true : toutes ses offres, y compris retirées et épuisées
async function lister(req, res) {
  if (req.query.mine === 'true') {
    if (req.user?.role !== ROLES.MERCHANT) {
      throw httpError(403, 'ACCES_REFUSE', 'Réservé aux commerçants.');
    }
    const commerce = await commerceDuCommercant(req.user.uid);
    if (!commerce) return res.json([]);
    const snap = await offers().where('commerceId', '==', commerce.id).get();
    const liste = await avecCommerces(snap.docs.map(docToJson));
    liste.sort((a, b) => String(b.dateCreation).localeCompare(String(a.dateCreation)));
    return res.json(liste);
  }

  let query = offers().where('statut', '==', STATUT_OFFRE.ACTIVE);
  if (req.query.categorie) query = query.where('categorie', '==', req.query.categorie);
  if (req.query.commerceId) query = query.where('commerceId', '==', req.query.commerceId);
  const snap = await query.get();

  const q = (req.query.q || '').trim().toLowerCase();
  const prixMax = req.query.prixMax ? Number(req.query.prixMax) : null;

  const liste = (await avecCommerces(snap.docs.map(docToJson))).filter(
    (o) =>
      o.statut === STATUT_OFFRE.ACTIVE &&
      o.quantiteDisponible > 0 &&
      o.commerce?.statutValidation === STATUT_VALIDATION.VALIDE &&
      (!prixMax || o.prixReduit <= prixMax) &&
      (!q ||
        o.titre.toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        o.commerce.nom.toLowerCase().includes(q)),
  );
  // Les retraits les plus proches d'abord
  liste.sort((a, b) => String(a.heureFinRecuperation).localeCompare(String(b.heureFinRecuperation)));
  res.json(liste);
}

// GET /api/offers/:id : public si le commerce est validé ; sinon réservé
// au propriétaire et à l'admin.
async function detail(req, res) {
  const [offre] = await avecCommerces([await lireOffre(req.params.id)]);
  const proprietaire =
    req.user?.role === ROLES.MERCHANT &&
    (await commerceDuCommercant(req.user.uid))?.id === offre.commerceId;
  const visible =
    proprietaire ||
    req.user?.role === ROLES.ADMIN ||
    (offre.commerce?.statutValidation === STATUT_VALIDATION.VALIDE && offre.statut !== STATUT_OFFRE.RETIREE);
  if (!visible) throw httpError(404, 'OFFRE_INTROUVABLE', 'Cette offre est introuvable.');
  res.json(offre);
}

// POST /api/offers : publier une offre (commerce validé obligatoire).
async function creer(req, res) {
  const commerce = await commerceValide(req.user.uid);
  const data = pick(req.body, CHAMPS_OFFRE);
  verifierCoherence(data);
  if (new Date(data.heureFinRecuperation) <= new Date()) {
    throw httpError(400, 'VALIDATION', "L'heure de fin du retrait est déjà passée.");
  }

  const ref = offers().doc();
  await ref.set({
    description: '',
    ...data,
    commerceId: commerce.id,
    statut: statutSelonStock(data.quantiteDisponible),
    dateCreation: FieldValue.serverTimestamp(),
  });
  const [offre] = await avecCommerces([await lireOffre(ref.id)]);
  res.status(201).json(offre);
}

// Vérifie que l'offre appartient au commerce du commerçant connecté.
async function offreDuCommercant(uid, id) {
  const offre = await lireOffre(id);
  const commerce = await commerceDuCommercant(uid);
  if (!commerce || commerce.id !== offre.commerceId) {
    throw httpError(403, 'ACCES_REFUSE', 'Cette offre ne vous appartient pas.');
  }
  return offre;
}

// PUT /api/offers/:id : modifier une de ses offres (pas une offre retirée).
async function modifier(req, res) {
  const offre = await offreDuCommercant(req.user.uid, req.params.id);
  if (offre.statut === STATUT_OFFRE.RETIREE) {
    throw httpError(409, 'OFFRE_RETIREE', 'Une offre retirée ne peut plus être modifiée.');
  }
  const changes = pick(req.body, CHAMPS_OFFRE);
  verifierCoherence({ ...offre, ...changes });

  const quantite = changes.quantiteDisponible ?? offre.quantiteDisponible;
  await offers().doc(offre.id).update({
    ...changes,
    statut: statutSelonStock(quantite),
    dateModification: FieldValue.serverTimestamp(),
  });
  const [maj] = await avecCommerces([await lireOffre(offre.id)]);
  res.json(maj);
}

// DELETE /api/offers/:id : retirer une offre. Elle n'est pas effacée
// (les anciennes commandes y font référence) : son statut passe à "RETIREE".
async function retirer(req, res) {
  const offre = await offreDuCommercant(req.user.uid, req.params.id);
  await offers().doc(offre.id).update({
    statut: STATUT_OFFRE.RETIREE,
    dateModification: FieldValue.serverTimestamp(),
  });
  res.status(204).end();
}

module.exports = { lister, detail, creer, modifier, retirer };