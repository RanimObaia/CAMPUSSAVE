const crypto = require("crypto");
const { db, FieldValue } = require("../config/firebase");
const { httpError, docToJson } = require("../utils/http");
const constants = require("../config/constants");
const { commerceDuCommercant } = require("./shops.controller");

// ---------- À VÉRIFIER avec le code de Ranim (voir étape 3) ----------
const COLLECTION_COMMERCES = "shops";
const CHAMP_VALIDATION_COMMERCE = "statutValidation"; // champ du commerce qui vaut 'VALIDE'
const CHAMP_COMMERCE_DE_OFFRE = "commerceId"; // champ de l'offre qui pointe vers le commerce
const CHAMP_FIN_OFFRE = "heureFinRecuperation";
const CHAMP_DEBUT_OFFRE = "heureDebutRecuperation";
const CHAMP_ECOPOINTS = "ecoPoints"; // champ du profil étudiant
// ---------------------------------------------------------------------

const STATUT_COMMANDE =
  constants.STATUT_COMMANDE ||
  Object.freeze({
    EN_ATTENTE_PAIEMENT: "EN_ATTENTE_PAIEMENT",
    PAYEE: "PAYEE",
    PRETE: "PRETE",
    RECUPEREE: "RECUPEREE",
    ANNULEE: "ANNULEE",
  });
const STATUT_OFFRE =
  constants.STATUT_OFFRE ||
  Object.freeze({
    ACTIVE: "ACTIVE",
    EPUISEE: "EPUISEE",
    RETIREE: "RETIREE",
  });
const { STATUT_VALIDATION } = constants;

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
      const creeLe = enMillis(commande.createdAt);
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
    if (echecPaiement) maj.paiement = { statut: "ECHOUE" };
    tx.set(orderRef, maj, { merge: true });
    return true;
  });
}

async function peutVoir(user, commande) {
  if (user.role === "admin") return true;
  if (user.role === "student") return commande.etudiantId === user.uid;
  if (user.role === "merchant")
    return (await monCommerceId(user.uid)) === commande.commerceId;
  return false;
}

function plusRecentesDAbord(liste) {
  return liste.sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
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
  const shopRef = db.collection(COLLECTION_COMMERCES).doc(commerceId);
  const offerRefs = [...demandees.keys()].map((id) =>
    db.collection("offers").doc(id)
  );

  await db.runTransaction(async (tx) => {
    // 1) LECTURES
    const [shopSnap, ...offerSnaps] = await tx.getAll(shopRef, ...offerRefs);

    if (
      !shopSnap.exists ||
      shopSnap.data()[CHAMP_VALIDATION_COMMERCE] !== STATUT_VALIDATION.VALIDE
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
      if (
        !offerSnap.exists ||
        offerSnap.data()[CHAMP_COMMERCE_DE_OFFRE] !== commerceId
      ) {
        throw httpError(
          404,
          "OFFRE_INTROUVABLE",
          "Une offre du panier est introuvable."
        );
      }
      const offre = offerSnap.data();
      const quantite = demandees.get(offerSnap.id);

      const finMs = enMillis(offre[CHAMP_FIN_OFFRE]);
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

      const debutMs = enMillis(offre[CHAMP_DEBUT_OFFRE]);
      if (debutMs && (!debut || debutMs < debut.ms))
        debut = { ms: debutMs, valeur: offre[CHAMP_DEBUT_OFFRE] };
      if (finMs && (!fin || finMs > fin.ms))
        fin = { ms: finMs, valeur: offre[CHAMP_FIN_OFFRE] };
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
      etudiantId: req.user.uid,
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
      createdAt: FieldValue.serverTimestamp(),
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
    db.collection("orders").where("etudiantId", "==", req.user.uid).get();
  let snap = await requete();

  // Commandes non payées depuis plus de 30 minutes : on les annule et on remet le stock.
  const resultats = await Promise.all(
    snap.docs.map((d) =>
      annulerEtRemettreStock(d.ref, { seulementSiExpiree: true })
    )
  );
  if (resultats.some(Boolean)) snap = await requete();

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
    await annulerEtRemettreStock(ref, { seulementSiExpiree: true });

    // TODO (étape paiement) : si la commande est encore EN_ATTENTE_PAIEMENT et a une
    // paiement.reference, vérifier le paiement chez Konnect avec la fonction de services/paiement.js.

    snap = await ref.get();
  }
  res.json(docToJson(snap));
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

  res.json(docToJson(await ref.get()));
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

    tx.update(ref, {
      statut: STATUT_COMMANDE.RECUPEREE,
      dateRecuperation: FieldValue.serverTimestamp(),
    });
    // Bonus EcoPoints : +10 par repas
    tx.set(
      db.collection("users").doc(commande.etudiantId),
      { [CHAMP_ECOPOINTS]: FieldValue.increment(POINTS_PAR_REPAS) },
      { merge: true }
    );
  });

  res.json(docToJson(await ref.get()));
}

module.exports = {
  createOrder,
  listMine,
  getOrder,
  listForMerchant,
  markReady,
  validateQr,
  annulerEtRemettreStock, // réutilisable par le paiement (échec / expiration)
};
