const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES, TYPES_COMMERCE } = require('../config/constants');
const c = require('../controllers/shops.controller');
const { avisDuCommerce } = require('../controllers/avis.controller');

const router = Router();

// Règles du formulaire "Mon commerce". "obligatoire" = true pour la création.
const reglesCommerce = (obligatoire) => {
  const champ = (nom) => (obligatoire ? body(nom) : body(nom).optional());
  return [
    champ('nom').trim().notEmpty().withMessage('Le nom du commerce est obligatoire.').isLength({ max: 80 }),
    champ('type').isIn(TYPES_COMMERCE).withMessage(`Le type doit être : ${TYPES_COMMERCE.join(', ')}.`),
    champ('adresse').trim().notEmpty().withMessage("L'adresse est obligatoire.").isLength({ max: 200 }),
    champ('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide.').toFloat(),
    champ('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide.').toFloat(),
    body('horairesOuverture').optional().trim().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('telephone').optional({ values: 'falsy' }).trim().matches(/^\d{8}$/)
      .withMessage('Le téléphone doit contenir 8 chiffres.'),
    validate,
  ];
};

router.get('/', c.listePublique);
router.get('/mine', requireAuth, requireRole(ROLES.MERCHANT), c.monCommerce);
router.get('/:id/avis', avisDuCommerce);
router.get('/:id', optionalAuth, c.detail);
router.post('/', requireAuth, requireRole(ROLES.MERCHANT), ...reglesCommerce(true), c.creer);
router.put('/:id', requireAuth, requireRole(ROLES.MERCHANT), ...reglesCommerce(false), c.modifier);

module.exports = router;