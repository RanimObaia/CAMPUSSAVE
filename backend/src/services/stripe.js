// Passerelle de paiement Stripe (mode test) : https://docs.stripe.com/api/checkout/sessions
// Activée avec PAIEMENT_MODE=stripe et STRIPE_SECRET_KEY=sk_test_... dans backend/.env.
//
// Même rôle que Konnect pour le reste du code :
//   initierPaiement → { payUrl, paymentRef }  (payUrl = vraie page de paiement Stripe)
//   lirePaiement    → { status, amount, transactions }  (même forme que la réponse Konnect)
// Devise : STRIPE_DEVISE=tnd si le compte Stripe accepte le dinar (3 décimales : montant en millimes).
// Sinon (cas d'un compte de test sans compte bancaire en TND) : STRIPE_DEVISE=eur, et le montant
// est converti avec STRIPE_TAUX (1 DT = 0,29 € par défaut). Le site garde tous les prix en DT,
// et la page Stripe affiche aussi le montant en DT dans le libellé.
// En mode test, aucune carte réelle n'est débitée (carte de test : 4242 4242 4242 4242).
const { httpError } = require('../utils/http');
const { estReussi } = require('./konnect');

const nom = 'stripe';
const base = () => process.env.STRIPE_API_URL || 'https://api.stripe.com/v1';

async function appel(chemin, { method = 'GET', params } = {}) {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw httpError(503, 'PAIEMENT_INDISPONIBLE', "Le paiement en ligne n'est pas configuré sur le serveur.");
  let reponse;
  try {
    reponse = await fetch(`${base()}${chemin}`, {
      method,
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params ? new URLSearchParams(params).toString() : undefined,
    });
  } catch (err) {
    console.error('Stripe injoignable :', err.message);
    throw httpError(502, 'PAIEMENT_INJOIGNABLE', 'Le service de paiement est injoignable. Réessaie dans un instant.');
  }
  const data = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    console.error('Stripe a refusé la demande :', reponse.status, JSON.stringify(data));
    throw httpError(502, 'PAIEMENT_ERREUR', 'Le service de paiement a refusé la demande. Réessaie dans un instant.');
  }
  return data;
}

const devise = () => (process.env.STRIPE_DEVISE || 'tnd').toLowerCase();

// Millimes → montant Stripe dans la devise choisie
function montantStripe(millimes) {
  if (devise() === 'tnd') return Math.round(millimes / 10) * 10; // TND : millimes, dernier chiffre à 0
  const taux = Number(process.env.STRIPE_TAUX) || 0.29; // 1 DT en devise (0,29 € par défaut)
  return Math.max(50, Math.round((millimes / 1000) * taux * 100)); // centimes, minimum Stripe 0,50
}
const enDinars = (millimes) => `${(millimes / 1000).toFixed(3).replace('.', ',')} DT`;

async function initierPaiement({ montant, description, orderId, commandeId, email, successUrl, failUrl }) {
  const session = await appel('/checkout/sessions', {
    method: 'POST',
    params: {
      mode: 'payment',
      'allowed_payment_method_types[0]': 'card', // carte bancaire uniquement
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': devise(),
      'line_items[0][price_data][unit_amount]': String(montantStripe(montant)),
      'line_items[0][price_data][product_data][name]': `${description} (${enDinars(montant)})`,
      client_reference_id: orderId,
      ...(email ? { customer_email: email } : {}),
      'metadata[commandeId]': commandeId,
      'metadata[montantMillimes]': String(montant),
      success_url: successUrl,
      cancel_url: failUrl,
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60), // minimum Stripe : 30 min
    },
  });
  if (!session.url || !session.id) {
    console.error('Réponse Stripe inattendue :', JSON.stringify(session));
    throw httpError(502, 'PAIEMENT_ERREUR', 'Réponse inattendue du service de paiement.');
  }
  return { payUrl: session.url, paymentRef: session.id };
}

// État réel du paiement, demandé à Stripe (on ne croit jamais le navigateur)
async function lirePaiement(paymentRef) {
  const s = await appel(`/checkout/sessions/${encodeURIComponent(paymentRef)}`);
  const paye = s.payment_status === 'paid';
  return {
    status: paye ? 'completed' : s.status === 'expired' ? 'expired' : 'pending',
    amount: Number(s.metadata?.montantMillimes), // montant de la commande, en millimes
    transactions: paye ? [{ status: 'success', method: 'bank_card' }] : [],
  };
}

module.exports = { nom, initierPaiement, lirePaiement, estReussi, montantStripe };
