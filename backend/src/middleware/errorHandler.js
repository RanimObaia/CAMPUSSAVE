const { validationResult } = require('express-validator');

// À placer après les règles express-validator : renvoie 400 avec la liste des erreurs.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ champ: e.path, message: e.msg }));
  res.status(400).json({ code: 'VALIDATION', message: details[0].message, details });
}

function notFound(req, res) {
  res.status(404).json({
    code: 'ROUTE_INTROUVABLE',
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
}

// Dernier middleware : transforme toute erreur en { code, message }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Corps de requête qui n'est pas du JSON valide (envoyé par express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      code: 'JSON_INVALIDE',
      message: "Le corps de la requête n'est pas un JSON valide.",
    });
  }

  const status = err.status || 500;
  // Erreur prévue, créée avec httpError() (même en 5xx, ex. Konnect indisponible) :
  // son code et son message sont faits pour l'utilisateur. Les autres restent cachées.
  const prevue = Boolean(err.status && err.code);
  if (status >= 500) console.error(err);
  res.status(status).json({
    code: prevue || status < 500 ? err.code || 'REQUETE_INVALIDE' : 'ERREUR_SERVEUR',
    message: prevue || status < 500 ? err.message : 'Erreur interne du serveur.',
  });
}

module.exports = { validate, notFound, errorHandler };