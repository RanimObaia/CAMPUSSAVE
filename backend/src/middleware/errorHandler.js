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
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    code: err.code && status < 500 ? err.code : 'ERREUR_SERVEUR',
    message: status < 500 ? err.message : 'Erreur interne du serveur.',
  });
}

module.exports = { validate, notFound, errorHandler };
