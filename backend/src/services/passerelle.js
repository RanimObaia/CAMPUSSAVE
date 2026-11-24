// Choix de la passerelle de paiement selon backend/.env :
//   PAIEMENT_MODE=konnect     → Konnect (par défaut)
//   PAIEMENT_MODE=stripe      → Stripe en mode test (STRIPE_SECRET_KEY=sk_test_...)
//   PAIEMENT_MODE=simulation  → page de paiement de test intégrée, sans service extérieur
const konnect = require('./konnect');
const stripe = require('./stripe');
const simulation = require('./paiementSimule');

const estSimulation = () => process.env.PAIEMENT_MODE === 'simulation';
function passerelle() {
  if (process.env.PAIEMENT_MODE === 'stripe') return stripe;
  if (estSimulation()) return simulation;
  return { nom: 'konnect', ...konnect };
}

module.exports = { passerelle, estSimulation };
