const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");
const {
  createOrder,
  listMine,
  getOrder,
  cancelOrder,
  listForMerchant,
  markReady,
  validateQr,
  deleguer,
  annulerDelegation,
  voirDelegation,
} = require("../controllers/orders.controller");
const { donnerAvis } = require("../controllers/avis.controller");

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("student"),
  body("commerceId").isString().notEmpty().withMessage("Commerce manquant."),
  body("lignes")
    .isArray({ min: 1, max: 20 })
    .withMessage("Le panier doit contenir entre 1 et 20 lignes."),
  body("lignes.*.offreId")
    .isString()
    .notEmpty()
    .withMessage("Offre manquante."),
  body("lignes.*.quantite")
    .isInt({ min: 1, max: 50 })
    .withMessage("La quantité doit être un entier de 1 à 50.")
    .toInt(),
  validate,
  createOrder
);

// Lien public de l'ami qui récupère la commande (pas de connexion)
router.get("/delegue/:token", voirDelegation);

// ⚠️ /mine et /validate-qr AVANT /:id
router.get("/mine", requireAuth, requireRole("student"), listMine);
router.post(
  "/validate-qr",
  requireAuth,
  requireRole("merchant"),
  body("code").isString().notEmpty().withMessage("Code manquant."),
  validate,
  validateQr
);

router.get("/", requireAuth, requireRole("merchant"), listForMerchant);
router.get("/:id", requireAuth, getOrder);
router.patch("/:id/ready", requireAuth, requireRole("merchant"), markReady);
router.post("/:id/cancel", requireAuth, requireRole("student"), cancelOrder);
router.post(
  "/:id/deleguer",
  requireAuth,
  requireRole("student"),
  body("nom").optional().isString().trim().isLength({ max: 60 }),
  validate,
  deleguer
);
router.delete("/:id/deleguer", requireAuth, requireRole("student"), annulerDelegation);
router.post(
  "/:id/avis",
  requireAuth,
  requireRole("student"),
  body("note").isInt({ min: 1, max: 5 }).withMessage("La note va de 1 à 5.").toInt(),
  body("commentaire").optional().isString().trim().isLength({ max: 500 }),
  validate,
  donnerAvis
);

module.exports = router;
