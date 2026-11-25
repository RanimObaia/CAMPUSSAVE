// Avis et notes des commerces : un étudiant note un commerce (1 à 5) après avoir
// récupéré sa commande. Un seul avis par commande ; la note moyenne du commerce
// est recalculée dans la même transaction.
const { db, FieldValue } = require('../config/firebase');
const { STATUT_COMMANDE } = require('../config/constants');
const { httpError, docToJson } = require('../utils/http');

// POST /api/orders/:id/avis  { note: 1..5, commentaire? }
async function donnerAvis(req, res) {
  const orderRef = db.collection('orders').doc(req.params.id);
  const avisRef = db.collection('reviews').doc(req.params.id); // id = commande : un seul avis
  const note = Number(req.body.note);
  const commentaire = (req.body.commentaire || '').trim();

  await db.runTransaction(async (tx) => {
    const [orderSnap, avisSnap] = await tx.getAll(orderRef, avisRef);
    if (!orderSnap.exists || orderSnap.data().idEtudiant !== req.user.uid) {
      throw httpError(404, 'COMMANDE_INTROUVABLE', 'Commande introuvable.');
    }
    const commande = orderSnap.data();
    if (commande.statut !== STATUT_COMMANDE.RECUPEREE) {
      throw httpError(409, 'AVIS_TROP_TOT', 'Tu pourras noter le commerce après avoir récupéré ta commande.');
    }
    if (avisSnap.exists) throw httpError(409, 'AVIS_DEJA_DONNE', 'Tu as déjà noté cette commande.');

    const shopRef = db.collection('shops').doc(commande.commerceId);
    const shopSnap = await tx.get(shopRef);
    const shop = shopSnap.exists ? shopSnap.data() : {};
    const nb = (shop.nbAvis || 0) + 1;
    const moyenne = ((shop.noteMoyenne || 0) * (nb - 1) + note) / nb;

    const profil = (await db.collection('users').doc(req.user.uid).get()).data() || {};
    tx.set(avisRef, {
      commandeId: orderRef.id,
      commerceId: commande.commerceId,
      idEtudiant: req.user.uid,
      prenomEtudiant: profil.prenom || 'Étudiant',
      note,
      commentaire,
      date: FieldValue.serverTimestamp(),
    });
    if (shopSnap.exists) tx.update(shopRef, { nbAvis: nb, noteMoyenne: Math.round(moyenne * 10) / 10 });
    tx.update(orderRef, { avisDonne: true });
  });

  res.status(201).json(docToJson(await avisRef.get()));
}

// GET /api/shops/:id/avis : les avis d'un commerce, les plus récents d'abord
async function avisDuCommerce(req, res) {
  const snap = await db.collection('reviews').where('commerceId', '==', req.params.id).get();
  const liste = snap.docs
    .map(docToJson)
    .map(({ idEtudiant, ...avis }) => avis) // on ne publie pas l'identifiant de l'étudiant
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  res.json(liste);
}

module.exports = { donnerAvis, avisDuCommerce };
