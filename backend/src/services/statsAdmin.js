// Calcul du tableau de bord administrateur à partir des données déjà lues en base.
// Fonction pure (aucun accès Firebase) : facile à tester. Montants en millimes.
const { ROLES, STATUT_VALIDATION, STATUT_OFFRE, STATUT_COMMANDE, STATUT_SIGNALEMENT, KG_PAR_REPAS, CO2_PAR_REPAS } = require('../config/constants');

const STATUTS_PAYES = [STATUT_COMMANDE.PAYEE, STATUT_COMMANDE.PRETE, STATUT_COMMANDE.RECUPEREE];
const JOUR_MS = 24 * 3600e3;

const arrondi = (x) => Math.round(x * 10) / 10;
const ms = (v) => (v?.toDate ? v.toDate().getTime() : new Date(v).getTime());
const jourTunis = (date) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Tunis' }).format(new Date(date));
const somme = (liste, f) => liste.reduce((t, x) => t + (f(x) || 0), 0);
const nbRepas = (commandes) => somme(commandes, (c) => somme(c.lignes || [], (l) => l.quantite));

// [{ libelle: 'A', valeur: 3 }, …] à partir d'une liste, sans les parts à zéro
function repartition(liste, cle, ordre = []) {
  const n = new Map(ordre.map((o) => [o, 0]));
  for (const x of liste) n.set(cle(x), (n.get(cle(x)) || 0) + 1);
  return [...n].filter(([, valeur]) => valeur > 0).map(([libelle, valeur]) => ({ libelle, valeur }));
}

function calculerStatsAdmin({ utilisateurs, commerces, commandes, offres, signalements, maintenant = Date.now() }) {
  const comptes = utilisateurs.filter((u) => u.role !== ROLES.ADMIN);
  const payees = commandes.filter((c) => STATUTS_PAYES.includes(c.statut));
  const nomCommerce = new Map(commerces.map((c) => [c.id, c.nom]));
  const repasSauves = nbRepas(payees);
  const volume = somme(payees, (c) => c.montantTotal);

  // Offres réellement réservables maintenant (une offre expirée reste ACTIVE en base)
  const actives = offres.filter(
    (o) => o.statut === STATUT_OFFRE.ACTIVE && o.quantiteDisponible > 0 && ms(o.heureFinRecuperation) > maintenant,
  );

  // Retrait : parmi les commandes payées dont le créneau est terminé, part des commandes récupérées
  const terminees = payees.filter((c) => c.heureFinRecuperation && ms(c.heureFinRecuperation) < maintenant);
  const tauxRetrait = terminees.length
    ? Math.round((terminees.filter((c) => c.statut === STATUT_COMMANDE.RECUPEREE).length / terminees.length) * 100)
    : null;

  // 14 derniers jours (heure de Tunis)
  const jours = Array.from({ length: 14 }, (_, i) => jourTunis(maintenant - (13 - i) * JOUR_MS));
  const parJour = jours.map((jour) => {
    const duJour = payees.filter((c) => c.dateCommande && jourTunis(ms(c.dateCommande)) === jour);
    return { jour, commandes: duJour.length, chiffreAffaires: somme(duJour, (c) => c.montantTotal) };
  });

  const topCommerces = [...new Set(payees.map((c) => c.commerceId))]
    .map((id) => {
      const siennes = payees.filter((c) => c.commerceId === id);
      return { id, nom: nomCommerce.get(id) || 'Commerce', commandes: siennes.length, chiffreAffaires: somme(siennes, (c) => c.montantTotal), repas: nbRepas(siennes) };
    })
    .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires)
    .slice(0, 5);

  const dernieresCommandes = [...commandes]
    .sort((a, b) => ms(b.dateCommande) - ms(a.dateCommande))
    .slice(0, 6)
    .map((c) => ({ id: c.id, code: c.code, commerce: nomCommerce.get(c.commerceId) || 'Commerce', montantTotal: c.montantTotal, statut: c.statut, dateCommande: c.dateCommande }));

  const enAttente = commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.EN_ATTENTE).length;
  const ouverts = signalements.filter((s) => s.statut === STATUT_SIGNALEMENT.OUVERT).length;
  const paiementsRefuses = commandes.filter((c) => c.paiement?.statut === 'ECHOUE').length;

  return {
    utilisateurs: {
      total: comptes.length,
      etudiants: comptes.filter((u) => u.role === ROLES.STUDENT).length,
      commercants: comptes.filter((u) => u.role === ROLES.MERCHANT).length,
      suspendus: comptes.filter((u) => u.actif === false).length,
      nouveaux7j: comptes.filter((u) => u.dateInscription && maintenant - ms(u.dateInscription) <= 7 * JOUR_MS).length,
    },
    commerces: {
      valides: commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.VALIDE).length,
      enAttente,
      refuses: commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.REFUSE).length,
      parType: repartition(commerces.filter((c) => c.statutValidation === STATUT_VALIDATION.VALIDE), (c) => c.type),
    },
    offres: {
      actives: actives.length,
      total: offres.length,
      retirees: offres.filter((o) => o.statut === STATUT_OFFRE.RETIREE).length,
      parCategorie: repartition(actives, (o) => o.categorie),
    },
    commandes: {
      payees: payees.length,
      total: commandes.length,
      parStatut: repartition(commandes, (c) => c.statut, Object.values(STATUT_COMMANDE)),
      parJour,
    },
    finance: {
      volume,
      panierMoyen: payees.length ? Math.round(volume / payees.length) : 0,
      economiesEtudiants: somme(payees, (c) => somme(c.lignes || [], (l) => ((l.prixInitial || l.prixUnitaire) - l.prixUnitaire) * l.quantite)),
      paiementsRefuses,
    },
    impact: { repasSauves, kgSauves: arrondi(repasSauves * KG_PAR_REPAS), co2Evite: arrondi(repasSauves * CO2_PAR_REPAS) },
    tauxRetrait,
    signalements: {
      ouverts,
      traites: signalements.filter((s) => s.statut === STATUT_SIGNALEMENT.TRAITE).length,
      rejetes: signalements.filter((s) => s.statut === STATUT_SIGNALEMENT.REJETE).length,
      parMotif: repartition(signalements, (s) => s.motif),
    },
    topCommerces,
    dernieresCommandes,
    aTraiter: { commercesEnAttente: enAttente, signalementsOuverts: ouverts, paiementsRefuses },
  };
}

module.exports = { calculerStatsAdmin, STATUTS_PAYES };
