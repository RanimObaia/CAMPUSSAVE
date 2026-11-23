const crypto = require("crypto");
const { db, FieldValue } = require("../config/firebase");
const { httpError, docToJson } = require("../utils/http");
const {
  STATUT_VALIDATION,
  STATUT_OFFRE,
  STATUT_COMMANDE,
  STATUT_PAIEMENT,
} = require("../config/constants");
const { commerceDuCommercant } = require("./shops.controller");
const { verifierPaiement } = require("../services/paiement");
const { notifier } = require("../services/notifications");

const DELAI_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
const POINTS_PAR_REPAS = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ----------------------------- Outils -----------------------------

function enMillis(valeur) {
  if (!valeur) return null;
  if (typeof valeur.toMillis === "function") return valeur.toMillis();
  const t = new Date(valeur).getTime();
  return Number.isNaN(t) ? null : t;
}

// Code impossible à deviner : CS- + 6 caractères aléatoires.
function genererCode() {
  let s = "";
  for (let i = 0; i < 6; i += 1)
    s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `CS-${s}`;
}

async function codeUnique() {
  for (let i = 0; i < 10; i += 1) {
    const code = genererCode();
    const deja = await db
      .collection("orders")
      .where("code", "==", code)
      .limit(1)
      .get();
    if (deja.empty) return code;
  }
  throw httpError(
    500,
    "ERREUR_SERVEUR",
    "Impossible de générer le code de commande."
  );
}

async function monCommerceId(uid) {
  try {
    const commerce = await commerceDuCommercant(uid);
    return commerce ? commerce.id : null;
  } catch {
    return null;
  }
}

async function commerceIdObligatoire(uid) {
  const id = await monCommerceId(uid);
  if (!id)
    throw httpError(
      404,
      "COMMERCE_INTROUVABLE",
      "Aucun commerce associé à votre compte."
    );
  return id;
}

// Annule une commande EN_ATTENTE_PAIEMENT et remet le stock (dans une transaction).
// seulementSiExpiree : n'annule que si la commande a plus de 30 minutes.
// echecPaiement : marque aussi le paiement comme ECHOUE.
// Renvoie true si la commande a été annulée.
async function annulerEtRemettreStock(
  orderRef,
  { seulementSiExpiree = false, echecPaiement = false } = {}
) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return false;
    const commande = snap.data();
    if (commande.statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) return false;

    if (seulementSiExpiree) {
      const creeLe = enMillis(commande.dateCommande);
      if (!creeLe || Date.now() - creeLe < DELAI_EXPIRATION_MS) return false;
    }

    // Lectures d'abord
    const offerRefs = commande.lignes.map((l) =>
      db.collection("offers").doc(l.offreId)
    );
    const offerSnaps = await tx.getAll(...offerRefs);

    // Puis écritures
    offerSnaps.forEach((offerSnap, i) => {
      if (!offerSnap.exists) return;
      const changes = {
        quantiteDisponible: FieldValue.increment(commande.lignes[i].quantite),
      };
      if (offerSnap.data().statut === STATUT_OFFRE.EPUISEE)
        changes.statut = STATUT_OFFRE.ACTIVE;
      tx.update(offerSnap.ref, changes);
    });

    const maj = { statut: STATUT_COMMANDE.ANNULEE };
    if (echecPaiement) maj.paiement = { statut: STATUT_PAIEMENT.ECHOUE };
    tx.set(orderRef, maj, { merge: true });
    return true;
  });
}

// Commande non payée : on demande d'abord à Konnect si le paiement a abouti
// (jamais d'annulation d'une commande déjà payée), puis on annule si elle a plus de 30 minutes.
async function verifierPuisExpirer(ref, commande) {
  try {
    await verifierPaiement(commande);
  } catch (err) {
    console.error("Vérification Konnect impossible :", err.message);
  }
  const apres = await ref.get();
  if (apres.data().statut === STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
    await annulerEtRemettreStock(ref, { seulementSiExpiree: true });
  }
}

async function peutVoir(user, commande) {
  if (user.role === "admin") return true;
  if (user.role === "student") return commande.idEtudiant === user.uid;
  if (user.role === "merchant")
    return (await monCommerceId(user.uid)) === commande.commerceId;
  return false;
}

function plusRecentesDAbord(liste) {
  return liste.sort((a, b) =>
    String(b.dateCommande).localeCompare(String(a.dateCommande))
  );
}

// ----------------------------- Routes -----------------------------

// POST /api/orders : { commerceId, lignes: [{ offreId, quantite }] }
async function createOrder(req, res) {
  const { commerceId } = req.body;

  // Deux lignes avec la même offre : on additionne.
  const demandees = new Map();
  for (const l of req.body.lignes) {
    demandees.set(l.offreId, (demandees.get(l.offreId) || 0) + l.quantite);
  }

  const code = await codeUnique();
  const orderRef = db.collection("orders").doc();
  const shopRef = db.collection("shops").doc(commerceId);
  const offerRefs = [...demandees.keys()].map((id) =>
    db.collection("offers").doc(id)
  );

  await db.runTransaction(async (tx) => {
    // 1) LECTURES
    const [shopSnap, ...offerSnaps] = await tx.getAll(shopRef, ...offerRefs);

    if (
      !shopSnap.exists ||
      shopSnap.data().statutValidation !== STATUT_VALIDATION.VALIDE
    ) {
      throw httpError(
        400,
        "COMMERCE_NON_VALIDE",
        "Ce commerce n'est pas disponible."
      );
    }
    const shop = shopSnap.data();

    const lignes = [];
    let montantTotal = 0;
    let debut = null;
    let fin = null;

    for (const offerSnap of offerSnaps) {
      if (!offerSnap.exists || offerSnap.data().commerceId !== commerceId) {
        throw httpError(
          404,
          "OFFRE_INTROUVABLE",
          "Une offre du panier est introuvable."
        );
      }
      const offre = offerSnap.data();
      const quantite = demandees.get(offerSnap.id);

      const finMs = enMillis(offre.heureFinRecuperation);
      if (
        offre.statut !== STATUT_OFFRE.ACTIVE ||
        (finMs && finMs < Date.now())
      ) {
        throw httpError(
          409,
          "OFFRE_INDISPONIBLE",
          `L'offre « ${offre.titre} » n'est plus disponible.`
        );
      }
      if (quantite > offre.quantiteDisponible) {
        throw httpError(
          409,
          "STOCK_INSUFFISANT",
          `Stock insuffisant pour « ${offre.titre} » : il en reste ${offre.quantiteDisponible}.`
        );
      }

      // Le prix vient de Firestore, jamais du navigateur.
      montantTotal += offre.prixReduit * quantite;
      lignes.push({
        offreId: offerSnap.id,
        titre: offre.titre,
        quantite,
        prixUnitaire: offre.prixReduit,
        prixInitial: offre.prixInitial,
      });

      const debutMs = enMillis(offre.heureDebutRecuperation);
      if (debutMs && (!debut || debutMs < debut.ms))
        debut = { ms: debutMs, valeur: offre.heureDebutRecuperation };
      if (finMs && (!fin || finMs > fin.ms))
        fin = { ms: finMs, valeur: offre.heureFinRecuperation };
    }

    // 2) ÉCRITURES
    offerSnaps.forEach((offerSnap) => {
      const quantite = demandees.get(offerSnap.id);
      const reste = offerSnap.data().quantiteDisponible - quantite;
      const changes = { quantiteDisponible: FieldValue.increment(-quantite) };
      if (reste === 0) changes.statut = STATUT_OFFRE.EPUISEE;
      tx.update(offerSnap.ref, changes);
    });

    tx.set(orderRef, {
      code,
      idEtudiant: req.user.uid,
      emailEtudiant: req.user.email || null, // destinataire de l'email de confirmation
      commerceId,
      commerce: {
        id: shopSnap.id,
        nom: shop.nom || null,
        adresse: shop.adresse || null,
      },
      lignes,
      montantTotal,
      heureDebutRecuperation: debut ? debut.valeur : null,
      heureFinRecuperation: fin ? fin.valeur : null,
      statut: STATUT_COMMANDE.EN_ATTENTE_PAIEMENT,
      dateCommande: FieldValue.serverTimestamp(),
      paiement: null,
      datePrete: null,
      dateRecuperation: null,
    });
  });

  res.status(201).json(docToJson(await orderRef.get()));
}

// GET /api/orders/mine : mes commandes (étudiant)
async function listMine(req, res) {
  const requete = () =>
    db.collection("orders").where("idEtudiant", "==", req.user.uid).get();
  const premiere = await requete();

  // Commandes non payées : vérification Konnect, puis annulation si > 30 minutes.
  for (const d of premiere.docs) {
    if (d.data().statut === STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
      await verifierPuisExpirer(d.ref, docToJson(d));
    }
  }

  const snap = await requete();
  res.json(plusRecentesDAbord(snap.docs.map(docToJson)));
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const ref = db.collection("orders").doc(req.params.id);
  let snap = await ref.get();

  // 404 (et non 403) pour ne rien révéler.
  if (!snap.exists || !(await peutVoir(req.user, snap.data()))) {
    throw httpError(404, "COMMANDE_INTROUVABLE", "Commande introuvable.");
  }

  if (snap.data().statut === STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
    await verifierPuisExpirer(ref, docToJson(snap));
    snap = await ref.get();
  }
  res.json(docToJson(snap));
}

// POST /api/orders/:id/cancel : l'étudiant annule après un paiement refusé
async function cancelOrder(req, res) {
  const ref = db.collection("orders").doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists || snap.data().idEtudiant !== req.user.uid) {
    throw httpError(404, "COMMANDE_INTROUVABLE", "Commande introuvable.");
  }
  if (snap.data().statut === STATUT_COMMANDE.ANNULEE)
    return res.json(docToJson(snap));
  if (snap.data().statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
    throw httpError(
      409,
      "COMMANDE_DEJA_PAYEE",
      "Cette commande est déjà payée."
    );
  }

  // Sécurité : si Konnect confirme finalement le paiement, on n'annule pas.
  try {
    await verifierPaiement(docToJson(snap));
  } catch (err) {
    console.error("Vérification Konnect impossible :", err.message);
  }
  const apres = await ref.get();
  if (apres.data().statut !== STATUT_COMMANDE.EN_ATTENTE_PAIEMENT) {
    throw httpError(
      409,
      "COMMANDE_DEJA_PAYEE",
      "Cette commande est déjà payée."
    );
  }

  await annulerEtRemettreStock(ref, { echecPaiement: true });
  res.json(docToJson(await ref.get()));
}

// GET /api/orders : commandes de mon commerce (commerçant)
async function listForMerchant(req, res) {
  const commerceId = await commerceIdObligatoire(req.user.uid);
  const snap = await db
    .collection("orders")
    .where("commerceId", "==", commerceId)
    .get();
  const visibles = [
    STATUT_COMMANDE.PAYEE,
    STATUT_COMMANDE.PRETE,
    STATUT_COMMANDE.RECUPEREE,
  ];
  const commandes = snap.docs
    .map(docToJson)
    .filter((c) => visibles.includes(c.statut));
  res.json(plusRecentesDAbord(commandes));
}

// PATCH /api/orders/:id/ready : PAYEE -> PRETE
async function markReady(req, res) {
  const commerceId = await commerceIdObligatoire(req.user.uid);
  const ref = db.collection("orders").doc(req.params.id);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().commerceId !== commerceId) {
      throw httpError(404, "COMMANDE_INTROUVABLE", "Commande introuvable.");
    }
    if (snap.data().statut !== STATUT_COMMANDE.PAYEE) {
      throw httpError(
        409,
        "STATUT_INVALIDE",
        "Seule une commande payée peut être marquée prête."
      );
    }
    tx.update(ref, {
      statut: STATUT_COMMANDE.PRETE,
      datePrete: FieldValue.serverTimestamp(),
    });
  });

  const maj = await ref.get();
  // Notification push à l'étudiant (sans attendre, et sans jamais bloquer la réponse)
  notifier(
    maj.data().idEtudiant,
    "Commande prête 🎉",
    `Votre commande ${maj.data().code} est prête à être retirée.`,
    { commandeId: ref.id }
  );
  res.json(docToJson(maj));
}

// POST /api/orders/validate-qr : { code } -> RECUPEREE
async function validateQr(req, res) {
  const commerceId = await commerceIdObligatoire(req.user.uid);
  const code = String(req.body.code || "")
    .toUpperCase()
    .replace(/\s/g, "");

  const trouvees = await db
    .collection("orders")
    .where("commerceId", "==", commerceId)
    .where("code", "==", code)
    .limit(1)
    .get();
  if (trouvees.empty) throw httpError(404, "QR_INVALIDE", "Code inconnu.");
  const ref = trouvees.docs[0].ref;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const commande = snap.data();

    if (commande.statut === STATUT_COMMANDE.RECUPEREE) {
      throw httpError(
        409,
        "QR_DEJA_UTILISE",
        "Cette commande a déjà été remise."
      );
    }
    if (
      ![STATUT_COMMANDE.PAYEE, STATUT_COMMANDE.PRETE].includes(commande.statut)
    ) {
      throw httpError(
        409,
        "COMMANDE_NON_PAYEE",
        "Cette commande n'est pas payée."
      );
    }

    // EcoPoints : +10 par repas, donc 10 x la somme des quantités.
    const repas = commande.lignes.reduce((somme, l) => somme + l.quantite, 0);

    tx.update(ref, {
      statut: STATUT_COMMANDE.RECUPEREE,
      dateRecuperation: FieldValue.serverTimestamp(),
      "qrCode.estUtilise": true,
      "qrCode.dateValidation": FieldValue.serverTimestamp(),
    });
    tx.set(
      db.collection("users").doc(commande.idEtudiant),
      { ecoPoints: FieldValue.increment(POINTS_PAR_REPAS * repas) },
      { merge: true }
    );
  });

  const maj = await ref.get();
  notifier(
    maj.data().idEtudiant,
    "Commande remise ✅",
    "Merci d'avoir sauvé un repas ! Vos EcoPoints ont été ajoutés.",
    { commandeId: ref.id }
  );
  res.json(docToJson(maj));
}

module.exports = {
  createOrder,
  listMine,
  getOrder,
  cancelOrder,
  listForMerchant,
  markReady,
  validateQr,
  annulerEtRemettreStock,
};
