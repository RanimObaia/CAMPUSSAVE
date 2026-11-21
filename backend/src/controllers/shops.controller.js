const { db, FieldValue } = require('../config/firebase');
const { ROLES, STATUT_VALIDATION } = require('../config/constants');
const { httpError, docToJson, pick } = require('../utils/http');

const shops = () => db.collection('shops');

// Champs que le commerçant peut remplir lui-même.
// statutValidation, idCommercant et les dates sont gérés par le serveur.
const CHAMPS_COMMERCE = [
  'nom', 'type', 'adresse', 'latitude', 'longitude',
  'horairesOuverture', 'description', 'telephone',
];

const parDateDecroissante = (a, b) => String(b.dateCreation).localeCompare(String(a.dateCreation));

async function lireCommerce(id) {
  const doc = await shops().doc(id).get();
  if (!doc.exists) throw httpError(404, 'COMMERCE_INTROUVABLE', 'Commerce introuvable.');
  return docToJson(doc);
}

async function commerceDuCommercant(uid) {
  const snap = await shops().where('idCommercant', '==', uid).limit(1).get();
  return snap.empty ? null : docToJson(snap.docs[0]);
}

// GET /api/shops : liste publique, uniquement les commerces validés.
// Filtre facultatif : ?type=CAFETERIA
async function listePublique(req, res) {
  let query = shops().where('statutValidation', '==', STATUT_VALIDATION.VALIDE);
  if (req.query.type) query = query.where('type', '==', req.query.type);
  const snap = await query.get();
  res.json(snap.docs.map(docToJson).sort((a, b) => a.nom.localeCompare(b.nom)));
}

// GET /api/shops/mine : le commerce du commerçant connecté.
async function monCommerce(req, res) {
  const commerce = await commerceDuCommercant(req.user.uid);
  if (!commerce) {
    throw httpError(404, 'COMMERCE_INTROUVABLE', "Vous n'avez pas encore enregistré de commerce.");
  }
  res.json(commerce);
}

// GET /api/shops/:id : un commerce validé est public ; sinon seuls
// son propriétaire et l'admin peuvent le voir.
async function detail(req, res) {
  const commerce = await lireCommerce(req.params.id);
  const autorise =
    commerce.statutValidation === STATUT_VALIDATION.VALIDE ||
    req.user?.role === ROLES.ADMIN ||
    req.user?.uid === commerce.idCommercant;
  if (!autorise) throw httpError(404, 'COMMERCE_INTROUVABLE', 'Commerce introuvable.');
  res.json(commerce);
}

// POST /api/shops : un commerçant enregistre son commerce (un seul par compte).
// Il part "EN_ATTENTE" jusqu'à la décision de l'admin.
async function creer(req, res) {
  if (await commerceDuCommercant(req.user.uid)) {
    throw httpError(409, 'COMMERCE_EXISTE_DEJA', 'Vous avez déjà un commerce. Modifiez-le plutôt.');
  }
  const ref = shops().doc();
  await ref.set({
    ...pick(req.body, CHAMPS_COMMERCE),
    idCommercant: req.user.uid,
    statutValidation: STATUT_VALIDATION.EN_ATTENTE,
    dateCreation: FieldValue.serverTimestamp(),
  });
  res.status(201).json(await lireCommerce(ref.id));
}

// PUT /api/shops/:id : le propriétaire modifie son commerce.
// Un commerce refusé repasse "EN_ATTENTE" pour être revu par l'admin.
async function modifier(req, res) {
  const commerce = await lireCommerce(req.params.id);
  if (commerce.idCommercant !== req.user.uid) {
    throw httpError(403, 'ACCES_REFUSE', "Ce commerce ne vous appartient pas.");
  }
  const changes = pick(req.body, CHAMPS_COMMERCE);
  if (commerce.statutValidation === STATUT_VALIDATION.REFUSE) {
    Object.assign(changes, { statutValidation: STATUT_VALIDATION.EN_ATTENTE, motifRefus: FieldValue.delete() });
  }
  await shops().doc(commerce.id).update({ ...changes, dateModification: FieldValue.serverTimestamp() });
  res.json(await lireCommerce(commerce.id));
}

// GET /api/admin/shops?statut=EN_ATTENTE : tous les commerces, pour l'admin.
async function listeAdmin(req, res) {
  let query = shops();
  if (req.query.statut) query = query.where('statutValidation', '==', req.query.statut);
  const snap = await query.get();
  res.json(snap.docs.map(docToJson).sort(parDateDecroissante));
}

// PATCH /api/admin/shops/:id/validate  { decision: "VALIDE" | "REFUSE", motif? }
async function valider(req, res) {
  const commerce = await lireCommerce(req.params.id);
  const { decision, motif } = req.body;
  const changes = {
    statutValidation: decision,
    dateDecision: FieldValue.serverTimestamp(),
    motifRefus: decision === STATUT_VALIDATION.REFUSE && motif ? motif : FieldValue.delete(),
  };
  await shops().doc(commerce.id).update(changes);
  res.json(await lireCommerce(commerce.id));
}

module.exports = { listePublique, monCommerce, detail, creer, modifier, listeAdmin, valider };