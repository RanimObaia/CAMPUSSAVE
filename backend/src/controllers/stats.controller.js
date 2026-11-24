const { db } = require('../config/firebase');
const { ROLES, STATUT_VALIDATION, STATUT_OFFRE, STATUT_COMMANDE } = require('../config/constants');
const { docToJson } = require('../utils/http');
const { commerceDuCommercant } = require('./shops.controller');

// Une commande compte comme payée dès qu'elle est PAYEE, PRETE ou RECUPEREE.
const STATUTS_PAYES = [STATUT_COMMANDE.PAYEE, STATUT_COMMANDE.PRETE, STATUT_COMMANDE.RECUPEREE];

// Estimation utilisée pour l'impact écologique : un repas sauvé ≈ 0,4 kg de nourriture.
const KG_PAR_REPAS = 0.4;

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
    kgSauves: Math.round(repasSauves * KG_PAR_REPAS * 10) / 10,
    ecoPoints: profil.ecoPoints || 0,
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
    kgSauves: Math.round(repasSauves * KG_PAR_REPAS * 10) / 10,
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

module.exports = { etudiant, commercant, admin };
