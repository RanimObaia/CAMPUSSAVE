const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { ROLES, MOTIFS_SIGNALEMENT } = require('../config/constants');
const c = require('../controllers/signalements.controller');

const router = Router();
router.use(requireAuth, requireRole(ROLES.STUDENT));
router.get('/mine', c.mesSignalements);
router.post(
  '/',
  body('commandeId').optional({ values: 'falsy' }).isString(),
  body('motif').isIn(MOTIFS_SIGNALEMENT).withMessage(`Motif : ${MOTIFS_SIGNALEMENT.join(', ')}.`),
  body('message').isString().trim().isLength({ min: 10, max: 1000 }).withMessage('Décris le problème (10 à 1000 caractères).'),
  validate,
  c.signaler,
);

module.exports = router;
