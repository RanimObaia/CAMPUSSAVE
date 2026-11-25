const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');
const c = require('../controllers/contact.controller');

const router = Router();

// Anti-abus simple : 5 messages par adresse IP et par heure
const envois = new Map();
function limiter(req, res, next) {
  const ip = req.ip;
  const maintenant = Date.now();
  const recents = (envois.get(ip) || []).filter((t) => maintenant - t < 3600e3);
  if (recents.length >= 5) {
    return res.status(429).json({ code: 'TROP_DE_MESSAGES', message: 'Trop de messages envoyés. Réessaie dans une heure.' });
  }
  envois.set(ip, [...recents, maintenant]);
  next();
}

router.post(
  '/',
  limiter,
  body('nom').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Ton nom est obligatoire.'),
  body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
  body('sujet').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Le sujet est obligatoire.'),
  body('message').isString().trim().isLength({ min: 10, max: 2000 }).withMessage('Le message doit faire 10 à 2000 caractères.'),
  validate,
  c.envoyer,
);

module.exports = router;
