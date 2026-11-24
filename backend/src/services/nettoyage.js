// Nettoyage automatique des commandes non payées.
// Toutes les 5 minutes, le serveur relit les commandes EN_ATTENTE_PAIEMENT :
// il demande d'abord à Konnect si le paiement a abouti (on n'annule jamais une
// commande payée), puis annule celles de plus de 30 minutes et rend le stock.
// Sans ça, une commande abandonnée bloquerait le stock jusqu'à ce que l'étudiant
// revienne sur « Mes commandes ».
const { db } = require("../config/firebase");
const { docToJson } = require("../utils/http");
const { STATUT_COMMANDE } = require("../config/constants");
const { verifierPuisExpirer } = require("../controllers/orders.controller");

const INTERVALLE_MS = 5 * 60 * 1000; // 5 minutes

async function nettoyerCommandes() {
  const snap = await db
    .collection("orders")
    .where("statut", "==", STATUT_COMMANDE.EN_ATTENTE_PAIEMENT)
    .get();
  for (const d of snap.docs) {
    await verifierPuisExpirer(d.ref, docToJson(d));
  }
}

function demarrerNettoyage() {
  const tour = () =>
    nettoyerCommandes().catch((err) =>
      console.error("Nettoyage des commandes impossible :", err.message)
    );
  tour(); // une première fois au démarrage
  return setInterval(tour, INTERVALLE_MS);
}

module.exports = { nettoyerCommandes, demarrerNettoyage };