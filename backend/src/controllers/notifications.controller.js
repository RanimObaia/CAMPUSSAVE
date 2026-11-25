const { db } = require('../config/firebase');
const { httpError, docToJson } = require('../utils/http');

const notifications = () => db.collection('notifications');

// GET /api/notifications : mes 50 dernières notifications + le nombre de non lues
async function lister(req, res) {
  const snap = await notifications().where('idUtilisateur', '==', req.user.uid).get();
  const liste = snap.docs.map(docToJson).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 50);
  res.json({ nonLues: liste.filter((n) => !n.lu).length, notifications: liste });
}

// PATCH /api/notifications/:id/lu
async function marquerLue(req, res) {
  const ref = notifications().doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data().idUtilisateur !== req.user.uid) {
    throw httpError(404, 'NOTIFICATION_INTROUVABLE', 'Notification introuvable.');
  }
  await ref.update({ lu: true });
  res.json(docToJson(await ref.get()));
}

// POST /api/notifications/tout-lu
async function toutLu(req, res) {
  const snap = await notifications().where('idUtilisateur', '==', req.user.uid).where('lu', '==', false).get();
  await Promise.all(snap.docs.map((d) => d.ref.update({ lu: true })));
  res.json({ nonLues: 0 });
}

module.exports = { lister, marquerLue, toutLu };
