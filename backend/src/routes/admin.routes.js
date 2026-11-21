const { Router } = require('express');
const { body, query } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES, STATUT_VALIDATION } = require('../config/constants');
const shops = require('../controllers/shops.controller');
const admin = require('../controllers/admin.controller');

const router = Router();

// Toutes les routes /api/admin/... sont réservées à l'administrateur.
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get(
  '/shops',
  query('statut').optional().isIn(Object.values(STATUT_VALIDATION))
    .withMessage('Statut invalide : EN_ATTENTE, VALIDE ou REFUSE.'),
  validate,
  shops.listeAdmin,
);

router.patch(
  '/shops/:id/validate',
  body('decision').isIn([STATUT_VALIDATION.VALIDE, STATUT_VALIDATION.REFUSE])
    .withMessage('La décision doit être VALIDE ou REFUSE.'),
  body('motif').optional().trim().isLength({ max: 300 }),
  validate,
  shops.valider,
);

router.get(
  '/users',
  query('role').optional().isIn(Object.values(ROLES)).withMessage('Rôle invalide.'),
  validate,
  admin.listeUtilisateurs,
);

router.patch(
  '/users/:id',
  body('actif').isBoolean({ strict: true }).withMessage('"actif" doit valoir true ou false.'),
  validate,
  admin.changerActif,
);

module.exports = router;