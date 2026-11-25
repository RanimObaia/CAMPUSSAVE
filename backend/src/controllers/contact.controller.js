// Formulaire de contact public : message enregistré + transmis par e-mail à l'équipe.
const { db, FieldValue } = require('../config/firebase');
const email = require('../services/email');

// POST /api/contact  { nom, email, sujet, message }
async function envoyer(req, res) {
  const { nom, sujet, message } = req.body;
  const ref = db.collection('messages').doc();
  await ref.set({ nom, email: req.body.email, sujet, message, date: FieldValue.serverTimestamp(), traite: false });
  const envoye = await email.envoyerContact({ nom, email: req.body.email, sujet, message });
  res.status(201).json({ id: ref.id, emailEnvoye: envoye });
}

module.exports = { envoyer };
