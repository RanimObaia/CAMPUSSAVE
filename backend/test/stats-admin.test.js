// Tests du tableau de bord administrateur (calcul pur, sans Firebase).
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculerStatsAdmin } = require('../src/services/statsAdmin');

const maintenant = new Date('2026-11-25T12:00:00Z').getTime();
const il_y_a = (heures) => new Date(maintenant - heures * 3600e3).toISOString();

const donnees = {
  maintenant,
  utilisateurs: [
    { id: 'a', role: 'admin' },
    { id: 'u1', role: 'student', actif: true, dateInscription: il_y_a(24) },
    { id: 'u2', role: 'student', actif: false, dateInscription: il_y_a(24 * 30) },
    { id: 'u3', role: 'merchant', actif: true, dateInscription: il_y_a(24 * 3) },
  ],
  commerces: [
    { id: 's1', nom: 'Layal', type: 'BOULANGERIE', statutValidation: 'VALIDE' },
    { id: 's2', nom: 'Horizon', type: 'RESTAURANT', statutValidation: 'EN_ATTENTE' },
    { id: 's3', nom: 'Fermé', type: 'CAFETERIA', statutValidation: 'REFUSE' },
  ],
  commandes: [
    { id: 'c1', code: 'CS-1', commerceId: 's1', statut: 'RECUPEREE', montantTotal: 3500, dateCommande: il_y_a(2), heureFinRecuperation: il_y_a(1), lignes: [{ quantite: 2, prixUnitaire: 1750, prixInitial: 4500 }] },
    { id: 'c2', code: 'CS-2', commerceId: 's1', statut: 'PAYEE', montantTotal: 1000, dateCommande: il_y_a(30), heureFinRecuperation: il_y_a(20), lignes: [{ quantite: 1, prixUnitaire: 1000 }] },
    { id: 'c3', code: 'CS-3', commerceId: 's1', statut: 'ANNULEE', montantTotal: 500, dateCommande: il_y_a(5), lignes: [{ quantite: 1, prixUnitaire: 500 }], paiement: { statut: 'ECHOUE' } },
  ],
  offres: [
    { id: 'o1', categorie: 'BOULANGERIE', statut: 'ACTIVE', quantiteDisponible: 3, heureFinRecuperation: new Date(maintenant + 3600e3).toISOString() },
    { id: 'o2', categorie: 'PLATS', statut: 'ACTIVE', quantiteDisponible: 0, heureFinRecuperation: new Date(maintenant + 3600e3).toISOString() },
    { id: 'o3', categorie: 'PLATS', statut: 'ACTIVE', quantiteDisponible: 4, heureFinRecuperation: new Date(maintenant - 3600e3).toISOString() },
    { id: 'o4', categorie: 'PATISSERIE', statut: 'RETIREE', quantiteDisponible: 4, heureFinRecuperation: new Date(maintenant + 3600e3).toISOString() },
  ],
  signalements: [
    { id: 'r1', statut: 'OUVERT', motif: 'QUALITE' },
    { id: 'r2', statut: 'TRAITE', motif: 'QUALITE' },
    { id: 'r3', statut: 'REJETE', motif: 'AUTRE' },
  ],
};

test('stats admin : utilisateurs sans les admins, commerces par statut', () => {
  const s = calculerStatsAdmin(donnees);
  assert.deepEqual(s.utilisateurs, { total: 3, etudiants: 2, commercants: 1, suspendus: 1, nouveaux7j: 2 });
  assert.deepEqual([s.commerces.valides, s.commerces.enAttente, s.commerces.refuses], [1, 1, 1]);
  assert.deepEqual(s.commerces.parType, [{ libelle: 'BOULANGERIE', valeur: 1 }]);
});

test('stats admin : seules les commandes payées comptent pour le chiffre et l\'impact', () => {
  const s = calculerStatsAdmin(donnees);
  assert.equal(s.commandes.payees, 2);
  assert.equal(s.commandes.total, 3);
  assert.equal(s.finance.volume, 4500);
  assert.equal(s.finance.panierMoyen, 2250);
  assert.equal(s.finance.economiesEtudiants, (4500 - 1750) * 2);
  assert.equal(s.finance.paiementsRefuses, 1);
  assert.deepEqual(s.impact, { repasSauves: 3, kgSauves: 1.2, co2Evite: 7.5 });
  assert.equal(s.tauxRetrait, 50);
});

test('stats admin : offres réservables, répartition par statut et 14 jours', () => {
  const s = calculerStatsAdmin(donnees);
  assert.equal(s.offres.actives, 1);
  assert.equal(s.offres.retirees, 1);
  assert.deepEqual(s.offres.parCategorie, [{ libelle: 'BOULANGERIE', valeur: 1 }]);
  assert.deepEqual(s.commandes.parStatut.map((x) => [x.libelle, x.valeur]), [['PAYEE', 1], ['RECUPEREE', 1], ['ANNULEE', 1]]);
  assert.equal(s.commandes.parJour.length, 14);
  assert.equal(s.commandes.parJour.reduce((n, j) => n + j.commandes, 0), 2);
});

test('stats admin : meilleurs commerces, dernières commandes et éléments à traiter', () => {
  const s = calculerStatsAdmin(donnees);
  assert.equal(s.topCommerces[0].nom, 'Layal');
  assert.equal(s.topCommerces[0].chiffreAffaires, 4500);
  assert.equal(s.dernieresCommandes[0].code, 'CS-1');
  assert.deepEqual(s.aTraiter, { commercesEnAttente: 1, signalementsOuverts: 1, paiementsRefuses: 1 });
  assert.deepEqual(s.signalements.parMotif, [{ libelle: 'QUALITE', valeur: 2 }, { libelle: 'AUTRE', valeur: 1 }]);
});

test('stats admin : base vide, aucun calcul ne plante', () => {
  const s = calculerStatsAdmin({ utilisateurs: [], commerces: [], commandes: [], offres: [], signalements: [], maintenant });
  assert.equal(s.commandes.payees, 0);
  assert.equal(s.finance.panierMoyen, 0);
  assert.equal(s.tauxRetrait, null);
  assert.deepEqual(s.topCommerces, []);
});
