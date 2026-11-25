// Annulation d'une commande non payée : stock remis en vente, paiement marqué
// ECHOUE et e-mail « paiement non abouti » à l'étudiant (une seule fois).
// Utilisé par : retour Konnect en échec (POST /orders/:id/cancel), webhook Konnect
// en échec, et nettoyage automatique des commandes de plus de 30 minutes.
const { db, FieldValue } = require("../config/firebase");
const { STATUT_OFFRE, STATUT_COMMANDE, STATUT_PAIEMENT } = require("../config/constants");
const { docToJson } = require("../utils/http");
const email = require("./email");
const { notifier } = require("./notifications");

const DELAI_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

function enMillis(valeur) {
  if (!valeur) return null;
  if (typeof valeur.toMillis === "function") return valeur.toMillis();
  const t = new Date(valeur).getTime();
  return Number.isNaN(t) ? null : t;
}

// Annule une commande EN_ATTENTE_PAIEMENT et remet le stock (dans une transaction).
// seulementSiExpiree : n'annule que si la commande a plus de 30 minutes.
// echecPaiement : le paiement a été refusé (sinon : expiré).
// Renvoie true si la commande a été annulée.
async function annulerEtRemettreStock(orderRef, { seulementSiExpiree = false, echecPaiement = false } = {}) {
  const annulee = await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return false;
    const commande = snap.data();
    if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) return false;

    if (seulementSiExpiree) {
      const creeLe = enMillis(commande.dateCommande);
      if (!creeLe || Date.now() - creeLe < DELAI_EXPIRATION_MS) return false;
    }

    // Lectures d'abord
    const offerRefs = commande.lignes.map((l) => db.collection("offers").doc(l.offreId));
    const offerSnaps = await tx.getAll(...offerRefs);

    // Puis écritures
    offerSnaps.forEach((offerSnap, i) => {
      if (!offerSnap.exists) return;
      const changes = { quantiteDisponible: FieldValue.increment(commande.lignes[i].quantite) };
      if (offerSnap.data().statut === STATUT_OFFRE.EPUISEE) changes.statut = STATUT_OFFRE.ACTIVE;
      tx.update(offerSnap.ref, changes);
    });

    const maj = {
      statut: STATUT_COMMANDE.ANNULEE,
      dateAnnulation: FieldValue.serverTimestamp(),
      motifAnnulation: echecPaiement ? "PAIEMENT_REFUSE" : "PAIEMENT_EXPIRE",
    };
    // On garde la référence Konnect (utile dans l'e-mail et pour le support)
    if (commande.paiement) maj.paiement = { ...commande.paiement, statut: STATUT_PAIEMENT.ECHOUE };
    else if (echecPaiement) maj.paiement = { statut: STATUT_PAIEMENT.ECHOUE };
    tx.set(orderRef, maj, { merge: true });
    return true;
  });

  if (annulee) await prevenirEchec(orderRef, echecPaiement ? "REFUSE" : "EXPIRE");
  return annulee;
}

// E-mail + notification « paiement non abouti ». Seulement si un paiement a été
// lancé (l'étudiant est allé sur Konnect) et une seule fois par commande.
async function prevenirEchec(orderRef, motif) {
  try {
    const commande = docToJson(await orderRef.get());
    if (!commande.paiement?.reference || commande.emailEchecEnvoye !== undefined) return;
    const envoye = await email.envoyerEchec(commande, motif);
    await orderRef.update({ emailEchecEnvoye: envoye });
    notifier(
      commande.idEtudiant,
      "Paiement non abouti",
      `La commande ${commande.code} est annulée, aucun montant n'a été débité.`,
      { commandeId: commande.id, type: "PAIEMENT_ECHOUE" }
    );
  } catch (err) {
    console.error("Prévenir l'échec du paiement impossible :", err.message);
  }
}

module.exports = { annulerEtRemettreStock, enMillis, DELAI_EXPIRATION_MS };
