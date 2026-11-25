// Signalements (réclamations) : problème de qualité, commerce fermé au retrait,
// paiement… L'étudiant signale, l'administrateur traite et répond.
const { db, FieldValue } = require('../config/firebase');
const { STATUT_SIGNALEMENT } = require('../config/constants');
const { httpError, docToJson } = require('../utils/http');
const { notifier } = require('../services/notifications');

const reports = () => db.collection('reports');
const plusRecentsDAbord = (l) => l.sort((a, b) => String(b.date).localeCompare(String(a.date)));

// POST /api/reports  { commandeId?, motif, message }
async function signaler(req, res) {
  const { commandeId, motif, message } = req.body;
  let commerce = null;
  let code = null;
  if (commandeId) {
    const snap = await db.collection('orders').doc(commandeId).get();
    if (!snap.exists || snap.data().idEtudiant !== req.user.uid) {
      throw httpError(404, 'COMMANDE_INTROUVABLE', 'Commande introuvable.');
    }
    commerce = snap.data().commerce || null;
    code = snap.data().code;
  }
  const ref = reports().doc();
  await ref.set({
    idEtudiant: req.user.uid,
    emailEtudiant: req.user.email || null,
    commandeId: commandeId || null,
    codeCommande: code,
    commerce,
    motif,
    message: message.trim(),
    statut: STATUT_SIGNALEMENT.OUVERT,
    reponse: null,
    date: FieldValue.serverTimestamp(),
  });
  res.status(201).json(docToJson(await ref.get()));
}

// GET /api/reports/mine
async function mesSignalements(req, res) {
  const snap = await reports().where('idEtudiant', '==', req.user.uid).get();
  res.json(plusRecentsDAbord(snap.docs.map(docToJson)));
}

// GET /api/admin/reports?statut=OUVERT
async function listeAdmin(req, res) {
  let q = reports();
  if (req.query.statut) q = q.where('statut', '==', req.query.statut);
  const snap = await q.get();
  res.json(plusRecentsDAbord(snap.docs.map(docToJson)));
}

// PATCH /api/admin/reports/:id  { statut: TRAITE | REJETE, reponse? }
async function traiter(req, res) {
  const ref = reports().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) throw httpError(404, 'SIGNALEMENT_INTROUVABLE', 'Signalement introuvable.');
  await ref.update({ statut: req.body.statut, reponse: req.body.reponse || null, dateTraitement: FieldValue.serverTimestamp() });
  const s = snap.data();
  notifier(
    s.idEtudiant,
    'Réponse à ton signalement',
    req.body.reponse || (req.body.statut === STATUT_SIGNALEMENT.TRAITE ? 'Ton signalement a été traité.' : "Ton signalement n'a pas été retenu."),
    { commandeId: s.commandeId || '', type: 'SIGNALEMENT' },
  );
  res.json(docToJson(await ref.get()));
}

module.exports = { signaler, mesSignalements, listeAdmin, traiter };
