const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES, REGIMES } = require('../config/constants');
const c = require('../controllers/users.controller');

const router = Router();

router.get('/me', requireAuth, c.getMe);

router.put(
  '/me',
  requireAuth,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide.').isLength({ max: 50 }),
  body('prenom').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide.').isLength({ max: 50 }),
  body('telephone').optional().trim().matches(/^\d{8}$/).withMessage('Le téléphone doit contenir 8 chiffres.'),
  body('etablissement').optional().trim().isLength({ max: 100 }),
  body('numeroEtudiant').optional().trim().isLength({ max: 30 }),
  body('fcmToken').optional().isString().isLength({ max: 4096 }),
  body('preferences').optional().isObject().withMessage('Préférences invalides.'),
  body('preferences.langue').optional().isIn(['fr', 'ar', 'en']).withMessage('Langue : fr, ar ou en.'),
  body('preferences.regimes').optional().isArray().custom((l) => l.every((r) => REGIMES.includes(r)))
    .withMessage(`Régimes possibles : ${REGIMES.join(', ')}.`),
  body('preferences.notifications').optional().isObject(),
  body('preferences.notifications.*').optional().isBoolean({ strict: true }).withMessage('true ou false attendu.'),
  validate,
  c.updateMe,
);

// Commerces favoris (étudiant) : alerte quand ils publient une offre
router.get('/me/favoris', requireAuth, requireRole(ROLES.STUDENT), c.mesFavoris);
router.put('/me/favoris/:commerceId', requireAuth, requireRole(ROLES.STUDENT), c.ajouterFavori);
router.delete('/me/favoris/:commerceId', requireAuth, requireRole(ROLES.STUDENT), c.retirerFavori);

module.exports = router;
