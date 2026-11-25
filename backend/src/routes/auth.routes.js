const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');
const { ROLES_INSCRIPTION } = require('../config/constants');
const { register } = require('../controllers/auth.controller');
const { estFort, MESSAGE: MESSAGE_MDP } = require('../utils/motDePasse');

const router = Router();

router.post(
  '/register',
  body('email').trim().toLowerCase().isEmail().withMessage('Adresse e-mail invalide.'),
  body('motDePasse')
    .custom((v) => estFort(v))
    .withMessage(MESSAGE_MDP),
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire.').isLength({ max: 50 }),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire.').isLength({ max: 50 }),
  body('telephone')
    .trim()
    .matches(/^\d{8}$/)
    .withMessage('Le téléphone doit contenir 8 chiffres.'),
  body('role')
    .isIn(ROLES_INSCRIPTION)
    .withMessage('Le rôle doit être "student" ou "merchant".'),
  body('etablissement').optional().trim().isLength({ max: 100 }),
  body('numeroEtudiant').optional().trim().isLength({ max: 30 }),
  validate,
  register,
);

module.exports = router;
