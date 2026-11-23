const { getMessaging } = require("firebase-admin/messaging");
const { db } = require("../config/firebase"); // initialise Firebase Admin

// Envoie une notification push à un utilisateur (via son fcmToken).
// Ne lève jamais d'erreur : une notification ratée ne doit pas bloquer une commande.
async function notifier(uid, titre, corps, data = {}) {
  try {
    const doc = await db.collection("users").doc(uid).get();
    const token = doc.exists ? doc.data().fcmToken : null;
    if (!token) return false; // l'utilisateur n'a pas activé les notifications

    await getMessaging().send({
      token,
      notification: { title: titre, body: corps },
      data, // les valeurs doivent être du texte
    });
    return true;
  } catch (err) {
    console.error("Notification impossible :", err.message);
    return false;
  }
}

module.exports = { notifier };
