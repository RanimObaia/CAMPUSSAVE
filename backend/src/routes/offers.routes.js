const { Router } = require('express');
const { body, query } = require('express-validator');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES, CATEGORIES_OFFRE, REGIMES } = require('../config/constants');
const c = require('../controllers/offers.controller');

const router = Router();

// Règles du formulaire "Publier une offre". Les prix sont en millimes (4500 = 4,500 DT).
// "obligatoire" = true pour la création ; en modification chaque champ est facultatif.
const reglesOffre = (obligatoire) => {
  const champ = (nom) => (obligatoire ? body(nom) : body(nom).optional());
  return [
    champ('titre').trim().notEmpty().withMessage('Le titre est obligatoire.').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    champ('categorie').isIn(CATEGORIES_OFFRE)
      .withMessage(`La catégorie doit être : ${CATEGORIES_OFFRE.join(', ')}.`),
    champ('prixInitial').isInt({ min: 1 })
      .withMessage('Le prix initial doit être un nombre entier de millimes, supérieur à 0.').toInt(),
    champ('prixReduit').isInt({ min: 1 })
      .withMessage('Le prix réduit doit être un nombre entier de millimes, supérieur à 0.').toInt(),
    champ('quantiteDisponible').isInt({ min: 0, max: 1000 })
      .withMessage('La quantité doit être un entier positif ou nul.').toInt(),
    champ('heureDebutRecuperation').isISO8601().withMessage('Heure de début invalide.'),
    champ('heureFinRecuperation').isISO8601().withMessage('Heure de fin invalide.'),
    body('photoUrl').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true })
      .withMessage('La photo doit être une adresse https://.'),
    body('regimes').optional().isArray({ max: REGIMES.length })
      .custom((l) => l.every((r) => REGIMES.includes(r))).withMessage(`Régimes possibles : ${REGIMES.join(', ')}.`),
    body('recurrente').optional().isBoolean({ strict: true }).withMessage('"recurrente" vaut true ou false.'),
    validate,
  ];
};

router.get(
  '/',
  optionalAuth,
  query('prixMax').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('prixMax doit être un entier (millimes).'),
  query('categorie').optional({ values: 'falsy' }).isIn(CATEGORIES_OFFRE).withMessage('Catégorie inconnue.'),
  query('regime').optional({ values: 'falsy' }).isIn(REGIMES).withMessage('Régime inconnu.'),
  query('tri').optional({ values: 'falsy' }).isIn(['fin', 'distance', 'prix', 'note', 'remise']).withMessage('Tri inconnu.'),
  query('creneau').optional({ values: 'falsy' }).isIn(['maintenant', 'midi', 'soir']).withMessage('Créneau inconnu.'),
  query(['lat', 'lng', 'distanceMax']).optional({ values: 'falsy' }).isFloat().withMessage('Nombre attendu.'),
  validate,
  c.lister,
);
router.get('/:id', optionalAuth, c.detail);
router.post('/', requireAuth, requireRole(ROLES.MERCHANT), ...reglesOffre(true), c.creer);
router.put('/:id', requireAuth, requireRole(ROLES.MERCHANT), ...reglesOffre(false), c.modifier);
router.delete('/:id', requireAuth, requireRole(ROLES.MERCHANT), c.retirer);
router.post(
  '/:id/republier',
  requireAuth,
  requireRole(ROLES.MERCHANT),
  body('quantiteDisponible').optional().isInt({ min: 1, max: 1000 }).withMessage('Quantité invalide.').toInt(),
  validate,
  c.republier,
);

module.exports = router;