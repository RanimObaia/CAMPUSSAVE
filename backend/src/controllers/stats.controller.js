const { db } = require('../config/firebase');
const { ROLES, STATUT_VALIDATION, STATUT_OFFRE, STATUT_COMMANDE, KG_PAR_REPAS, CO2_PAR_REPAS } = require('../config/constants');
const { docToJson } = require('../utils/http');
const { commerceDuCommercant } = require('./shops.controller');
const { calculerStatsAdmin } = require('../services/statsAdmin');

// Une commande compte comme payée dès qu'elle est PAYEE, PRETE ou RECUPEREE.
const STATUTS_PAYES = [STATUT_COMMANDE.PAYEE, STATUT_COMMANDE.PRETE, STATUT_COMMANDE.RECUPEREE];

const arrondi = (x) => Math.round(x * 10) / 10;

// Niveaux de l'étudiant selon ses repas sauvés (affichés sur son tableau de bord)
const NIVEAUX = [
  { min: 0, nom: 'Graine' },
  { min: 3, nom: 'Pousse' },
  { min: 10, nom: 'Arbre' },
  { min: 25, nom: 'Forêt' },
];
function niveau(repas) {
  const i = NIVEAUX.findLastIndex((n) => repas >= n.min);
  const suivant = NIVEAUX[i + 1];
  return { nom: NIVEAUX[i].nom, repasPourSuivant: suivant ? suivant.min - repas : 0, suivant: suivant?.nom || null };
}

// "AAAA-MM-JJ" à l'heure de Tunis : "aujourd'hui" et "ce mois-ci" se comptent en heure locale.
const jourTunis = (date) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Tunis' }).format(new Date(date));

const nbRepas = (commandes) =>
  commandes.reduce((total, c) => total + c.lignes.reduce((n, l) => n + l.quantite, 0), 0);

const somme = (liste, champ) => liste.reduce((total, x) => total + (x[champ] || 0), 0);

async function commandesPayees(champ, valeur) {
  const snap = await db.collection('orders').where(champ, '==', valeur).get();
  return snap.docs.map(docToJson).filter((c) => STATUTS_PAYES.includes(c.statut));
}

// GET /api/stats/student
// { commandes, depenses, economies, repasSauves, kgSauves, ecoPoints }
async function etudiant(req, res) {
  const payees = await commandesPayees('idEtudiant', req.user.uid);
  const lignes = payees.flatMap((c) => c.lignes);
  const repasSauves = nbRepas(payees);
  const profil = (await db.collection('users').doc(req.user.uid).get()).data() || {};

  res.json({
    commandes: payees.length,
    depenses: somme(payees, 'montantTotal'),
    economies: lignes.reduce(
      (total, l) => total + ((l.prixInitial || l.prixUnitaire) - l.prixUnitaire) * l.quantite,
      0,
    ),
    repasSauves,
    kgSauves: arrondi(repasSauves * KG_PAR_REPAS),
    co2Evite: arrondi(repasSauves * CO2_PAR_REPAS),
    ecoPoints: profil.ecoPoints || 0,
    niveau: niveau(repasSauves),
  });
}

// GET /api/stats/merchant (son commerce seulement)
// { offresActives, commandesDuJour, chiffreAffaires (du jour), repasSauves (récupérés ce mois-ci), kgSauves }
async function commercant(req, res) {
  const commerce = await commerceDuCommercant(req.user.uid);
  if (!commerce) {
    return res.json({ offresActives: 0, commandesDuJour: 0, chiffreAffaires: 0, repasSauves: 0, kgSauves: 0 });
  }

  const offresSnap = await db.collection('offers').where('commerceId', '==', commerce.id).get();
  const maintenant = Date.now();
  // Une offre expirée reste "ACTIVE" en base : on vérifie aussi l'heure de fin.
  const offresActives = offresSnap.docs
    .map((d) => d.data())
    .filter(
      (o) =>
        o.statut === STATUT_OFFRE.ACTIVE &&
        o.quantiteDisponible > 0 &&
        new Date(o.heureFinRecuperation).getTime() > maintenant,
    ).length;

  const payees = await commandesPayees('commerceId', commerce.id);
  const aujourdhui = jourTunis(maintenant);
  const duJour = payees.filter((c) => c.dateCommande && jourTunis(c.dateCommande) === aujourdhui);
  const recupereesDuMois = payees.filter(
    (c) =>
      c.statut === STATUT_COMMANDE.RECUPEREE &&
      c.dateCommande &&
      jourTunis(c.dateCommande).slice(0, 7) === aujourdhui.slice(0, 7),
  );
  const repasSauves = nbRepas(recupereesDuMois);

  res.json({
    offresActives,
    commandesDuJour: duJour.length,
    chiffreAffaires: somme(duJour, 'montantTotal'),
    repasSauves,
    kgSauves: arrondi(repasSauves * KG_PAR_REPAS),
  });
}

// GET /api/stats/admin
// { utilisateurs (étudiants + commerçants), commercesValides, commercesEnAttente,
//   commandes (payées), paiements (réussis), volume (millimes), repasSauves }
async function admin(req, res) {
  const [users, shops, orders] = await Promise.all([
    db.collection('users').get(),
    db.collection('shops').get(),
    db.collection('orders').get(),
  ]);
  const commerces = shops.docs.map((d) => d.data());
  const payees = orders.docs.map(docToJson).filter((c) => STATUTS_PAYES.includes(c.statut));

  res.json({
    utilisateurs: users.docs.filter((d) => d.data().role !== ROLES.ADMIN).length,
    commercesValides: commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.VALIDE).length,
    commercesEnAttente: commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.EN_ATTENTE).length,
    commandes: payees.length,
    paiements: payees.length,
    volume: somme(payees, 'montantTotal'),
    repasSauves: nbRepas(payees),
  });
}

// GET /api/stats/public (sans connexion) : les compteurs de la page d'accueil
async function publiques(req, res) {
  const [users, shops, orders] = await Promise.all([
    db.collection('users').where('role', '==', ROLES.STUDENT).get(),
    db.collection('shops').where('statutValidation', '==', STATUT_VALIDATION.VALIDE).get(),
    db.collection('orders').get(),
  ]);
  const payees = orders.docs.map(docToJson).filter((c) => STATUTS_PAYES.includes(c.statut));
  const repasSauves = nbRepas(payees);
  res.json({
    repasSauves,
    commerces: shops.size ?? shops.docs.length,
    etudiants: users.size ?? users.docs.length,
    co2Evite: arrondi(repasSauves * CO2_PAR_REPAS),
    economies: payees.flatMap((c) => c.lignes).reduce((t, l) => t + ((l.prixInitial || l.prixUnitaire) - l.prixUnitaire) * l.quantite, 0),
  });
}

// GET /api/stats/merchant/detail : statistiques complètes du commerçant
// { repasSauves, chiffreAffaires, commandes, tauxRetrait (%), noteMoyenne, nbAvis, co2Evite,
//   parJour: [{ jour: 'AAAA-MM-JJ', commandes, chiffreAffaires }] sur 14 jours, topOffres }
async function commercantDetail(req, res) {
  const commerce = await commerceDuCommercant(req.user.uid);
  if (!commerce) return res.json({ repasSauves: 0, chiffreAffaires: 0, commandes: 0, tauxRetrait: 0, noteMoyenne: null, nbAvis: 0, co2Evite: 0, parJour: [], topOffres: [] });
  const payees = await commandesPayees('commerceId', commerce.id);
  const recuperees = payees.filter((c) => c.statut === STATUT_COMMANDE.RECUPEREE);
  const repasSauves = nbRepas(recuperees);

  const jours = [];
  for (let i = 13; i >= 0; i -= 1) jours.push(jourTunis(Date.now() - i * 24 * 3600e3));
  const parJour = jours.map((jour) => {
    const duJour = payees.filter((c) => c.dateCommande && jourTunis(c.dateCommande) === jour);
    return { jour, commandes: duJour.length, chiffreAffaires: somme(duJour, 'montantTotal') };
  });

  const ventes = new Map();
  for (const c of payees) for (const l of c.lignes) ventes.set(l.titre, (ventes.get(l.titre) || 0) + l.quantite);
  const topOffres = [...ventes].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([titre, quantite]) => ({ titre, quantite }));

  // Retrait : parmi les commandes dont le créneau est terminé, combien ont été récupérées
  const terminees = payees.filter((c) => c.heureFinRecuperation && new Date(c.heureFinRecuperation).getTime() < Date.now());
  const tauxRetrait = terminees.length
    ? Math.round((terminees.filter((c) => c.statut === STATUT_COMMANDE.RECUPEREE).length / terminees.length) * 100)
    : 100;

  res.json({
    repasSauves,
    chiffreAffaires: somme(payees, 'montantTotal'),
    commandes: payees.length,
    tauxRetrait,
    noteMoyenne: commerce.noteMoyenne ?? null,
    nbAvis: commerce.nbAvis || 0,
    co2Evite: arrondi(repasSauves * CO2_PAR_REPAS),
    parJour,
    topOffres,
  });
}

// GET /api/stats/admin/detail : tableau de bord complet de l'administrateur
// (répartitions pour les camemberts, 14 jours, meilleurs commerces, dernières commandes, éléments à traiter)
async function adminDetail(req, res) {
  const lire = async (nom) => (await db.collection(nom).get()).docs.map(docToJson);
  const [utilisateurs, commerces, commandes, offres, signalements] = await Promise.all(
    ['users', 'shops', 'orders', 'offers', 'reports'].map(lire),
  );
  res.json(calculerStatsAdmin({ utilisateurs, commerces, commandes, offres, signalements }));
}

module.exports = { etudiant, commercant, admin, adminDetail, publiques, commercantDetail, niveau };
