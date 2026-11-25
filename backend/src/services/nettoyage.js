// Tâches automatiques (toutes les 5 minutes) : nettoyage des commandes non payées,
// rappels de retrait, republication des offres récurrentes.
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

const { notifier } = require("./notifications");
const { heureCourte } = require("./format");

const INTERVALLE_MS = 5 * 60 * 1000; // 5 minutes
const AVANCE_RAPPEL_MS = 30 * 60 * 1000; // rappel 30 minutes avant le début du retrait

// Rappel « Ton retrait commence bientôt » (une fois par commande payée)
async function envoyerRappels() {
  const maintenant = Date.now();
  for (const statut of [STATUT_COMMANDE.PAYEE, STATUT_COMMANDE.PRETE]) {
    const snap = await db.collection("orders").where("statut", "==", statut).get();
    for (const d of snap.docs) {
      const c = docToJson(d);
      if (c.rappelEnvoye || !c.heureDebutRecuperation) continue;
      const debut = new Date(c.heureDebutRecuperation).getTime();
      const fin = new Date(c.heureFinRecuperation || c.heureDebutRecuperation).getTime();
      if (debut - maintenant > AVANCE_RAPPEL_MS || fin < maintenant) continue;
      await d.ref.update({ rappelEnvoye: true });
      await notifier(
        c.idEtudiant,
        "Ton retrait commence bientôt ⏰",
        `${c.commerce?.nom} : retrait de ${heureCourte(c.heureDebutRecuperation)} à ${heureCourte(c.heureFinRecuperation)}. Pense à ton QR code ${c.code}.`,
        { commandeId: c.id, type: "RAPPEL_RETRAIT" }
      );
    }
  }
}

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
  // Chargé ici pour éviter une dépendance circulaire au démarrage
  const { republierRecurrentes } = require("../controllers/offers.controller");
  const tour = () =>
    Promise.all([
      nettoyerCommandes().catch((err) => console.error("Nettoyage des commandes impossible :", err.message)),
      envoyerRappels().catch((err) => console.error("Rappels de retrait impossibles :", err.message)),
      republierRecurrentes().catch((err) => console.error("Offres récurrentes impossibles :", err.message)),
    ]);
  tour(); // une première fois au démarrage
  return setInterval(tour, INTERVALLE_MS);
}

module.exports = { nettoyerCommandes, envoyerRappels, demarrerNettoyage };