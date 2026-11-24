// Passerelle de paiement simulée : remplace Konnect quand son sandbox est indisponible.
// Activée avec PAIEMENT_MODE=simulation dans backend/.env.
//
// Elle imite exactement Konnect pour le reste du code :
//   initierPaiement → { payUrl, paymentRef }   (payUrl = page de paiement de test du site)
//   lirePaiement    → { status, amount, transactions }   (même forme que la réponse Konnect)
//   estReussi       → même règle que Konnect
// Aucune carte réelle, aucun argent : l'étudiant choisit « payer » ou « refuser » sur la page de test.
const { db, FieldValue } = require('../config/firebase');
const { httpError } = require('../utils/http');
const { estReussi } = require('./konnect');

const nom = 'simulation';
const paiements = () => db.collection('paiementsSimules');

async function initierPaiement({ montant, orderId, commandeId }) {
  const paymentRef = `SIM-${orderId}-${Date.now()}`;
  await paiements().doc(paymentRef).set({
    reference: paymentRef,
    commandeId,
    montant,
    statut: 'pending',
    dateCreation: FieldValue.serverTimestamp(),
  });
  // Lien relatif : le site ouvre sa page de paiement de test sans recharger
  return { payUrl: `/paiement/simulation/${commandeId}`, paymentRef };
}

async function lirePaiement(paymentRef) {
  const doc = await paiements().doc(paymentRef).get();
  if (!doc.exists) throw httpError(404, 'PAIEMENT_INTROUVABLE', 'Paiement introuvable.');
  const p = doc.data();
  return {
    status: p.statut,
    amount: p.montant,
    transactions: p.statut === 'completed' ? [{ status: 'success', method: 'bank_card' }] : [],
  };
}

// Résultat choisi sur la page de test (ce que ferait l'étudiant sur la page Konnect)
async function enregistrerResultat(paymentRef, reussi) {
  await paiements().doc(paymentRef).update({
    statut: reussi ? 'completed' : 'failed',
    dateResultat: FieldValue.serverTimestamp(),
  });
}

module.exports = { nom, initierPaiement, lirePaiement, estReussi, enregistrerResultat };
