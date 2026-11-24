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
} = require("../controllers/orders.controller");

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

module.exports = router;