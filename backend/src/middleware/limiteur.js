// Limite de requêtes : protège l'API contre le spam et les essais répétés (inscription, contact).
// Au-delà de la limite, l'API répond 429 avec un message clair en français.
const rateLimit = require('express-rate-limit');

function creerLimiteur({ fenetreMs, max, message }) {
  return rateLimit({
    windowMs: fenetreMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ code: 'TROP_DE_REQUETES', message });
    },
  });
}

// Toute l'API : 300 requêtes par 15 minutes et par adresse IP
const limiteGenerale = creerLimiteur({
  fenetreMs: 15 * 60 * 1000,
  max: 300,
  message: 'Trop de requêtes. Réessaie dans quelques minutes.',
});

// Inscription et contact : 20 requêtes par heure et par adresse IP
const limiteSensible = creerLimiteur({
  fenetreMs: 60 * 60 * 1000,
  max: 20,
  message: 'Trop de tentatives. Réessaie dans une heure.',
});

// Les tests automatiques font beaucoup de requêtes depuis la même adresse : pas de limite pour eux
const passer = (req, res, next) => next();
const actif = process.env.NODE_ENV !== 'test';

module.exports = {
  creerLimiteur,
  limiteGenerale: actif ? limiteGenerale : passer,
  limiteSensible: actif ? limiteSensible : passer,
};
