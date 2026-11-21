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

// Appelé par Konnect (pas de jeton) : la sécurité vient de la vérification auprès de Konnect
router.get('/webhook', c.webhook);

module.exports = router;
