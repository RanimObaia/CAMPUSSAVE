// Valeurs fixes partagées par tout le backend.
// Elles suivent le diagramme de classes (docs/uml/classes.puml) et le code web.

const ROLES = Object.freeze({
  STUDENT: 'student',
  MERCHANT: 'merchant',
  ADMIN: 'admin',
});

// Rôles qu'on peut choisir à l'inscription. Un admin se crée uniquement
// avec scripts/create-admin.js, jamais par l'API publique.
const ROLES_INSCRIPTION = [ROLES.STUDENT, ROLES.MERCHANT];

const TYPES_COMMERCE = ['RESTAURANT', 'CAFETERIA', 'BOULANGERIE', 'PATISSERIE'];

const STATUT_VALIDATION = Object.freeze({
  EN_ATTENTE: 'EN_ATTENTE',
  VALIDE: 'VALIDE',
  REFUSE: 'REFUSE',
});

// Catégories d'offres, identiques à web/src/config/constants.js
const CATEGORIES_OFFRE = ['BOULANGERIE', 'PLATS', 'PATISSERIE', 'BOISSONS'];

const STATUT_OFFRE = Object.freeze({
  ACTIVE: 'ACTIVE',
  EPUISEE: 'EPUISEE', // quantité à 0
  EXPIREE: 'EXPIREE', // heure de fin de retrait passée (calculé à la lecture)
  RETIREE: 'RETIREE', // retirée par le commerçant
});

module.exports = {
  ROLES, ROLES_INSCRIPTION, TYPES_COMMERCE, STATUT_VALIDATION, CATEGORIES_OFFRE, STATUT_OFFRE,
};