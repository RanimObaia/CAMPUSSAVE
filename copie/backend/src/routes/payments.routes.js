const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES } = require('../config/constants');
const c = require('../controllers/payments.controller');

const router = Router();

router.post(
  '/init',
  requireAuth,
  requireRole(ROLES.STUDENT),
  body('commandeId').isString().trim().notEmpty().withMessage('La commande est obligatoire.'),
  validate,
  c.initier,
);

// Page de paiement de test (PAIEMENT_MODE=simulation)
router.post(
  '/simulation',
  requireAuth,
  requireRole(ROLES.STUDENT),
  body('commandeId').isString().trim().notEmpty().withMessage('La commande est obligatoire.'),
  body('reussi').isBoolean().withMessage('Le résultat du paiement est obligatoire.'),
  validate,
  c.simuler,
);

// Appelé par Konnect (pas de jeton) : la sécurité vient de la vérification auprès de Konnect
router.get('/webhook', c.webhook);

module.exports = router;
