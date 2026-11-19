const { Timestamp } = require('../config/firebase');

// À lancer depuis un contrôleur pour renvoyer une erreur propre au format
// { code, message } attendu par le web et le mobile :
//   throw httpError(404, 'COMMERCE_INTROUVABLE', 'Commerce introuvable.')
function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// Les dates Firestore (Timestamp) deviennent du texte ISO, lisible partout.
function toPlain(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

// Document Firestore -> objet JSON avec son id.
function docToJson(doc) {
  return { id: doc.id, ...toPlain(doc.data()) };
}

// Garde seulement les champs autorisés présents dans la requête.
function pick(source, keys) {
  return Object.fromEntries(
    keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]),
  );
}

module.exports = { httpError, toPlain, docToJson, pick };
