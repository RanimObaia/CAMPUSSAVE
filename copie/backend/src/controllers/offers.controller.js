const { db, FieldValue } = require('../config/firebase');
const { ROLES, STATUT_VALIDATION, STATUT_OFFRE } = require('../config/constants');
const { notifier } = require('../services/notifications');
const { httpError, docToJson, pick } = require('../utils/http');
const { commerceDuCommercant } = require('./shops.controller');

const offers = () => db.collection('offers');

// Champs que le commerçant peut remplir. statut, commerceId et les dates
// sont gérés par le serveur.
const CHAMPS_OFFRE = [
  'titre', 'description', 'categorie', 'prixInitial', 'prixReduit',
  'quantiteDisponible', 'heureDebutRecuperation', 'heureFinRecuperation', 'photoUrl',
  'regimes', // préférences alimentaires : VEGETARIEN, SANS_GLUTEN…
  'recurrente', // true : republiée automatiquement chaque jour aux mêmes heures
];

// Campus ESSECT (Montfleury, Tunis) : point de départ des distances si l'étudiant
// ne partage pas sa position.
const ESSECT = { lat: 36.7907, lng: 10.1786 };

// Distance à vol d'oiseau en kilomètres (formule de haversine)
function distanceKm(a, b) {
  if (a?.lat == null || b?.lat == null) return null;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Heure (0-23) à Tunis
const heureTunis = (date) =>
  Number(new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', hour12: false }).format(new Date(date)));

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
        ? {
          id: o.commerceId, nom: c.nom, type: c.type, adresse: c.adresse, statutValidation: c.statutValidation,
          latitude: c.latitude ?? null, longitude: c.longitude ?? null,
          noteMoyenne: c.noteMoyenne ?? null, nbAvis: c.nbAvis || 0, horairesOuverture: c.horairesOuverture || null,
        }
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
//              &typeCommerce= &regime= (VEGETARIEN…) &creneau= (maintenant | midi | soir)
//              &lat= &lng= (position de l'étudiant, sinon l'ESSECT) &distanceMax= (km)
//              &tri= (fin | distance | prix | note | remise)
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

  const position = req.query.lat && req.query.lng
    ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
    : ESSECT;
  const distanceMax = req.query.distanceMax ? Number(req.query.distanceMax) : null;
  const maintenant = Date.now();

  const liste = (await avecCommerces(snap.docs.map(docToJson)))
    .map((o) => ({
      ...o,
      distanceKm: distanceKm(position, { lat: o.commerce?.latitude, lng: o.commerce?.longitude }),
    }))
    .filter(
      (o) =>
        o.statut === STATUT_OFFRE.ACTIVE &&
        o.quantiteDisponible > 0 &&
        o.commerce?.statutValidation === STATUT_VALIDATION.VALIDE &&
        (!prixMax || o.prixReduit <= prixMax) &&
        (!req.query.typeCommerce || o.commerce.type === req.query.typeCommerce) &&
        (!req.query.regime || (o.regimes || []).includes(req.query.regime)) &&
        (!distanceMax || (o.distanceKm != null && o.distanceKm <= distanceMax)) &&
        correspondCreneau(o, req.query.creneau, maintenant) &&
        (!q ||
          o.titre.toLowerCase().includes(q) ||
          (o.description || '').toLowerCase().includes(q) ||
          o.commerce.nom.toLowerCase().includes(q)),
    );
  trier(liste, req.query.tri);
  res.json(liste);
}

// Créneau de retrait : "maintenant" (retrait possible dans l'heure), "midi" (11 h-15 h), "soir" (après 17 h)
function correspondCreneau(o, creneau, maintenant) {
  if (!creneau) return true;
  const debut = new Date(o.heureDebutRecuperation).getTime();
  if (creneau === 'maintenant') return debut <= maintenant + 3600e3;
  const h = heureTunis(o.heureDebutRecuperation);
  if (creneau === 'midi') return h >= 11 && h < 15;
  if (creneau === 'soir') return h >= 17;
  return true;
}

const remise = (o) => 1 - o.prixReduit / o.prixInitial;
const TRIS = {
  fin: (a, b) => String(a.heureFinRecuperation).localeCompare(String(b.heureFinRecuperation)),
  distance: (a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9),
  prix: (a, b) => a.prixReduit - b.prixReduit,
  note: (a, b) => (b.commerce?.noteMoyenne || 0) - (a.commerce?.noteMoyenne || 0),
  remise: (a, b) => remise(b) - remise(a),
};
// Par défaut : les retraits qui se terminent le plus tôt d'abord
function trier(liste, tri) {
  liste.sort(TRIS[tri] || TRIS.fin);
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
    regimes: [],
    recurrente: false,
    ...data,
    quantiteInitiale: data.quantiteDisponible,
    commerceId: commerce.id,
    statut: statutSelonStock(data.quantiteDisponible),
    dateCreation: FieldValue.serverTimestamp(),
  });
  const [offre] = await avecCommerces([await lireOffre(ref.id)]);
  res.status(201).json(offre);
  prevenirFavoris(offre); // sans attendre : la publication ne dépend pas des notifications
}

// Alerte « Nouvelle offre » aux étudiants qui ont ce commerce en favori
async function prevenirFavoris(offre) {
  try {
    if (offre.statut !== STATUT_OFFRE.ACTIVE) return;
    const fans = await db.collection('users').where('favoris', 'array-contains', offre.commerceId).get();
    await Promise.all(fans.docs.map((d) => notifier(
      d.id,
      `${offre.commerce?.nom || 'Un favori'} a publié une offre`,
      `${offre.titre} à ${(offre.prixReduit / 1000).toFixed(3).replace('.', ',')} DT. Réserve vite !`,
      { offreId: offre.id, type: 'OFFRE_FAVORI' },
    )));
  } catch (err) {
    console.error('Alerte favoris impossible :', err.message);
  }
}

// Même offre, aux mêmes heures, le jour suivant la date donnée (ou aujourd'hui si c'est encore possible)
function prochainCreneau(offre, apres = Date.now()) {
  const debut = new Date(offre.heureDebutRecuperation);
  const fin = new Date(offre.heureFinRecuperation);
  const duree = fin - debut;
  const jour = 24 * 3600e3;
  let nouveauDebut = debut.getTime();
  while (nouveauDebut + duree <= apres) nouveauDebut += jour;
  return { heureDebutRecuperation: new Date(nouveauDebut).toISOString(), heureFinRecuperation: new Date(nouveauDebut + duree).toISOString() };
}

// Copie d'une offre pour son prochain créneau ; l'ancienne n'est plus récurrente
async function republierOffre(offre, quantite) {
  const ref = offers().doc();
  const { id, statut, dateCreation, dateModification, commerce, distanceKm: _d, ...reste } = offre;
  const q = quantite ?? offre.quantiteInitiale ?? offre.quantiteDisponible;
  await ref.set({
    ...reste,
    ...prochainCreneau(offre),
    quantiteDisponible: q,
    quantiteInitiale: q,
    statut: statutSelonStock(q),
    offreOrigine: id,
    dateCreation: FieldValue.serverTimestamp(),
  });
  if (offre.recurrente) await offers().doc(id).update({ recurrente: false });
  const [nouvelle] = await avecCommerces([await lireOffre(ref.id)]);
  prevenirFavoris(nouvelle);
  return nouvelle;
}

// POST /api/offers/:id/republier  { quantiteDisponible? } : publier à nouveau en un clic
async function republier(req, res) {
  await commerceValide(req.user.uid);
  const offre = await offreDuCommercant(req.user.uid, req.params.id);
  const q = req.body.quantiteDisponible;
  res.status(201).json(await republierOffre(offre, q == null ? undefined : Number(q)));
}

// Tâche automatique : les offres récurrentes dont le créneau est passé sont republiées
async function republierRecurrentes() {
  const snap = await offers().where('recurrente', '==', true).get();
  let n = 0;
  for (const d of snap.docs) {
    const o = docToJson(d);
    if (o.statut === STATUT_OFFRE.RETIREE) continue;
    if (new Date(o.heureFinRecuperation).getTime() > Date.now()) continue;
    await republierOffre(o);
    n += 1;
  }
  return n;
}

// GET /api/admin/offers : toutes les offres (modération)
async function listeAdmin(req, res) {
  const snap = await offers().get();
  const liste = await avecCommerces(snap.docs.map(docToJson));
  liste.sort((a, b) => String(b.dateCreation).localeCompare(String(a.dateCreation)));
  res.json(liste);
}

// PATCH /api/admin/offers/:id/retirer  { motif } : l'admin retire une offre non conforme
async function retirerAdmin(req, res) {
  const offre = await lireOffre(req.params.id);
  await offers().doc(offre.id).update({
    statut: STATUT_OFFRE.RETIREE,
    retireeParAdmin: true,
    motifRetrait: req.body.motif || null,
    dateModification: FieldValue.serverTimestamp(),
  });
  const shop = (await db.collection('shops').doc(offre.commerceId).get()).data();
  if (shop?.idCommercant) {
    notifier(shop.idCommercant, 'Offre retirée par la modération', `« ${offre.titre} » : ${req.body.motif || 'non conforme aux règles de CampusSave.'}`, { offreId: offre.id, type: 'MODERATION' });
  }
  const [maj] = await avecCommerces([await lireOffre(offre.id)]);
  res.json(maj);
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

module.exports = {
  lister, detail, creer, modifier, retirer, republier, republierRecurrentes, listeAdmin, retirerAdmin,
  distanceKm, prochainCreneau,
};