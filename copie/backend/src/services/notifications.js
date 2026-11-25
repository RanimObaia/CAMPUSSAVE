// Notifications de l'utilisateur :
// 1. toujours enregistrées dans Firestore (collection "notifications") : la cloche du site et de l'app ;
// 2. envoyées en push (Firebase Cloud Messaging) si l'utilisateur a un fcmToken
//    et n'a pas coupé ce type de notification dans ses préférences.
// Ne lève jamais d'erreur : une notification ratée ne doit pas bloquer une commande.
const { db, FieldValue } = require("../config/firebase");

// Type de notification -> préférence qui permet de la couper
const PREFERENCE_DU_TYPE = {
  OFFRE_FAVORI: "favoris",
  RAPPEL_RETRAIT: "rappels",
  COMMANDE_PRETE: "commandes",
  COMMANDE_REMISE: "commandes",
  PAIEMENT_REUSSI: "commandes",
  PAIEMENT_ECHOUE: "commandes",
};

async function envoyerPush(token, titre, corps, data) {
  // Chargé seulement si besoin : les tests n'ont pas de Firebase Messaging
  const { getMessaging } = require("firebase-admin/messaging");
  const texte = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
  await getMessaging().send({ token, notification: { title: titre, body: corps }, data: texte });
}

async function notifier(uid, titre, corps, data = {}) {
  try {
    const doc = await db.collection("users").doc(uid).get();
    const profil = doc.exists ? doc.data() : {};
    const preference = PREFERENCE_DU_TYPE[data.type];
    if (preference && profil.preferences?.notifications?.[preference] === false) return false;

    await db.collection("notifications").doc().set({
      idUtilisateur: uid,
      titre,
      corps,
      type: data.type || "INFO",
      commandeId: data.commandeId || null,
      offreId: data.offreId || null,
      lu: false,
      date: FieldValue.serverTimestamp(),
    });

    if (profil.fcmToken && process.env.NODE_ENV !== "test") {
      await envoyerPush(profil.fcmToken, titre, corps, data).catch((err) =>
        console.error("Push impossible :", err.message)
      );
    }
    return true;
  } catch (err) {
    console.error("Notification impossible :", err.message);
    return false;
  }
}

module.exports = { notifier };
