const { db, FieldValue } = require('../config/firebase');
const { STATUT_COMMANDE, STATUT_PAIEMENT } = require('../config/paiement');
const { httpError, docToJson } = require('../utils/http');
const paiement = require('../services/paiement');
const { passerelle, estSimulation } = require('../services/passerelle');

// POST /api/payments/init  { commandeId }  (étudiant)
// Demande un lien de paiement à Konnect pour une commande en attente et renvoie { payUrl }.
async function initier(req, res) {
  const commande = await paiement.lireCommande(req.body.commandeId);
  if (commande.idEtudiant !== req.user.uid) throw httpError(404, 'COMMANDE_INTROUVABLE', 'Commande introuvable.');
  if (commande.statut === STATUT_COMMANDE.ANNULEE) {
    throw httpError(409, 'COMMANDE_ANNULEE', 'Cette commande est annulée. Recommence depuis le panier.');
  }
  if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
    throw httpError(409, 'COMMANDE_DEJA_PAYEE', 'Cette commande est déjà payée.');
  }
  // Lien déjà créé (double clic, retour arrière) : on renvoie le même
  if (commande.paiement?.payUrl) return res.json({ payUrl: commande.paiement.payUrl });

  const profil = (await db.collection('users').doc(req.user.uid).get()).data() || {};
  const web = process.env.WEB_APP_URL || 'http://localhost:5173';
  const retour = `${web}/paiement/retour?commande=${commande.id}`;
  const { payUrl, paymentRef } = await passerelle().initierPaiement({
    commandeId: commande.id,
    montant: commande.montantTotal,
    description: `CampusSave – commande ${commande.code} – ${commande.commerce.nom}`,
    orderId: commande.code,
    email: commande.emailEtudiant,
    prenom: profil.prenom,
    nom: profil.nom,
    webhook: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:4000'}/api/payments/webhook`,
    successUrl: retour,
    failUrl: `${retour}&echec=1`,
  });

  await db.collection('orders').doc(commande.id).update({
    paiement: {
      statut: STATUT_PAIEMENT.INITIE,
      reference: paymentRef,
      payUrl,
      montant: commande.montantTotal,
      methode: passerelle().nom,
      dateInitiation: FieldValue.serverTimestamp(),
    },
  });
  res.json({ payUrl });
}

// GET /api/payments/webhook?payment_ref=...  (appelé par Konnect, sans connexion)
// On ne croit pas l'appel lui-même : on redemande l'état du paiement à Konnect.
async function webhook(req, res) {
  const ref = req.query.payment_ref;
  if (!ref) throw httpError(400, 'REFERENCE_MANQUANTE', 'payment_ref manquant.');
  const snap = await db.collection('orders').where('paiement.reference', '==', String(ref)).limit(1).get();
  if (snap.empty) throw httpError(404, 'COMMANDE_INTROUVABLE', 'Aucune commande pour ce paiement.');
  const commande = await paiement.verifierPaiement(docToJson(snap.docs[0]));
  res.json({ code: commande.code, statut: commande.statut });
}

// POST /api/payments/simulation  { commandeId, reussi }  (étudiant, PAIEMENT_MODE=simulation seulement)
// Page de paiement de test : enregistre le résultat choisi, puis confirme la commande
// exactement comme avec Konnect (vérification du paiement, QR code, email).
async function simuler(req, res) {
  if (!estSimulation()) throw httpError(404, 'INTROUVABLE', 'Le paiement de test est désactivé.');
  const commande = await paiement.lireCommande(req.body.commandeId);
  if (commande.idEtudiant !== req.user.uid) throw httpError(404, 'COMMANDE_INTROUVABLE', 'Commande introuvable.');
  if (!commande.paiement?.reference) throw httpError(409, 'PAIEMENT_NON_INITIE', "Le paiement de cette commande n'a pas été lancé.");
  if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) return res.json(commande);
  await passerelle().enregistrerResultat(commande.paiement.reference, req.body.reussi === true);
  res.json(await paiement.verifierPaiement(commande));
}

module.exports = { initier, webhook, simuler };
