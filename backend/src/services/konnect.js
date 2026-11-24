// Appels à la passerelle de paiement Konnect (https://api.konnect.network/api/v2/konnect-gateway)
// En test (sandbox) : KONNECT_API_URL=https://api.preprod.konnect.network/api/v2 (cartes de test, pas d'argent réel).
// Adresse officielle de la documentation Konnect ; dashboard de test : https://dashboard.sandbox.konnect.network
const { httpError } = require('../utils/http');
const { DUREE_LIEN_PAIEMENT_MINUTES } = require('../config/paiement');

async function appel(chemin, options = {}) {
  const base = process.env.KONNECT_API_URL;
  const cle = process.env.KONNECT_API_KEY;
  if (!base || !cle) {
    throw httpError(503, 'PAIEMENT_INDISPONIBLE', "Le paiement en ligne n'est pas configuré sur le serveur.");
  }

  let reponse;
  try {
    reponse = await fetch(`${base}${chemin}`, {
      ...options,
      headers: { 'x-api-key': cle, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Konnect injoignable :', err.message);
    throw httpError(502, 'KONNECT_INJOIGNABLE', 'Le service de paiement est injoignable. Réessaie dans un instant.');
  }

  const data = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    console.error('Konnect a refusé la demande :', reponse.status, JSON.stringify(data));
    throw httpError(502, 'KONNECT_ERREUR', 'Le service de paiement a refusé la demande. Réessaie dans un instant.');
  }
  return data;
}

// Crée une demande de paiement. Montant en millimes (comme tout le projet).
// Renvoie { payUrl, paymentRef } : payUrl = la page où l'étudiant saisit sa carte.
async function initierPaiement({ montant, description, orderId, email, prenom, nom, webhook, successUrl, failUrl }) {
  const data = await appel('/payments/init-payment', {
    method: 'POST',
    body: JSON.stringify({
      receiverWalletId: process.env.KONNECT_WALLET_ID,
      token: 'TND',
      amount: montant,
      type: 'immediate',
      description,
      acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
      lifespan: DUREE_LIEN_PAIEMENT_MINUTES,
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: prenom,
      lastName: nom,
      email,
      orderId,
      webhook,
      silentWebhook: true, // Konnect prévient le serveur sans rediriger l'étudiant vers le webhook
      successUrl,
      failUrl,
      theme: 'light',
    }),
  });
  if (!data.payUrl || !data.paymentRef) {
    console.error('Réponse Konnect inattendue :', JSON.stringify(data));
    throw httpError(502, 'KONNECT_ERREUR', 'Réponse inattendue du service de paiement.');
  }
  return { payUrl: data.payUrl, paymentRef: data.paymentRef };
}

// Lit l'état réel d'un paiement chez Konnect (on ne croit jamais le navigateur)
async function lirePaiement(paymentRef) {
  const data = await appel(`/payments/${encodeURIComponent(paymentRef)}`);
  return data.payment;
}

// Konnect recommande de vérifier le statut du paiement ET celui de la transaction
function estReussi(paiement) {
  if (!paiement || paiement.status !== 'completed') return false;
  const transactions = paiement.transactions || [];
  return transactions.length === 0 || transactions.some((t) => t.status === 'success');
}

module.exports = { initierPaiement, lirePaiement, estReussi };