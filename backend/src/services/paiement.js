// Confirmation du paiement : vérification auprès de Konnect, passage à « Payée »,
// QR code de retrait, email de confirmation (ou annulation + email de refus).
// La commande elle-même (création, stock, annulation) est gérée par le code
// des commandes (branche d'Ahmed). Ce fichier suppose seulement qu'une commande
// de la collection "orders" a : code, idEtudiant, emailEtudiant, commerce { nom, adresse },
// lignes, montantTotal (millimes), statut et paiement.
const { db, FieldValue } = require('../config/firebase');
const { STATUT_COMMANDE, STATUT_PAIEMENT } = require('../config/paiement');
const { httpError, docToJson } = require('../utils/http');
const { passerelle } = require('./passerelle');
const email = require('./email');
const { notifier } = require('./notifications');
const { annulerEtRemettreStock } = require('./annulation');

const orders = () => db.collection('orders');

async function lireCommande(id) {
  const doc = await orders().doc(id).get();
  if (!doc.exists) throw httpError(404, 'COMMANDE_INTROUVABLE', 'Commande introuvable.');
  return docToJson(doc);
}

// Paiement confirmé : statut « Payée » + QR code, puis email (une seule fois,
// même si Konnect appelle le webhook plusieurs fois)
async function marquerPayee(id, paiementKonnect) {
  let nouveau = false;
  await db.runTransaction(async (t) => {
    const ref = orders().doc(id);
    const commande = (await t.get(ref)).data();
    if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) return; // déjà traitée
    nouveau = true;
    const transaction = (paiementKonnect.transactions || []).find((tr) => tr.status === 'success');
    t.update(ref, {
      statut: STATUT_COMMANDE.PAYEE,
      paiement: {
        ...commande.paiement,
        statut: STATUT_PAIEMENT.REUSSI,
        datePaiement: FieldValue.serverTimestamp(),
        ...(transaction?.method ? { methode: transaction.method } : {}),
      },
      // QR code (diagramme de classes : QRCode) : son contenu est le code de la commande
      qrCode: { code: commande.code, dateGeneration: FieldValue.serverTimestamp(), estUtilise: false, dateValidation: null },
    });
  });

  if (nouveau) {
    const envoye = await email.envoyerConfirmation(await lireCommande(id));
    await orders().doc(id).update({ emailEnvoye: envoye });
    const c = await lireCommande(id);
    notifier(c.idEtudiant, 'Paiement confirmé ✓', `Commande ${c.code} payée. Ton QR code est prêt.`, { commandeId: id, type: 'PAIEMENT_REUSSI' });
  }
  return lireCommande(id);
}

// Demande à la passerelle (Konnect ou simulation) où en est le paiement d'une commande en attente.
// À appeler depuis le webhook ET quand l'application consulte la commande
// (GET /orders/:id) : le paiement est alors confirmé même si le webhook
// n'arrive pas (serveur en local, sans ngrok).
async function verifierPaiement(commande) {
  if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT || !commande.paiement?.reference) return commande;
  const passe = passerelle();
  const paiement = await passe.lirePaiement(commande.paiement.reference);
  if (passe.estEchoue?.(paiement)) {
    // Refus définitif chez la passerelle : annulation, stock remis, e-mail de refus
    await annulerEtRemettreStock(orders().doc(commande.id), { echecPaiement: true });
    return lireCommande(commande.id);
  }
  if (!passe.estReussi(paiement)) return commande;
  if (Number(paiement.amount) !== commande.montantTotal) {
    console.error(`Montant Konnect (${paiement.amount}) différent de la commande ${commande.code} (${commande.montantTotal}).`);
    return commande;
  }
  return marquerPayee(commande.id, paiement);
}

module.exports = { lireCommande, marquerPayee, verifierPaiement };
