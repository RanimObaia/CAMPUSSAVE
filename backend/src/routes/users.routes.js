const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { getMe, updateMe } = require('../controllers/users.controller');

const router = Router();

router.get('/me', requireAuth, getMe);

router.put(
  '/me',
  requireAuth,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide.').isLength({ max: 50 }),
  body('prenom').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide.').isLength({ max: 50 }),
  body('telephone').optional().trim().matches(/^\d{8}$/).withMessage('Le téléphone doit contenir 8 chiffres.'),
  body('etablissement').optional().trim().isLength({ max: 100 }),
  body('numeroEtudiant').optional().trim().isLength({ max: 30 }),
  body('fcmToken').optional().isString().isLength({ max: 4096 }),
  validate,
  updateMe,
);

module.exports = router;
