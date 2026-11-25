// Valeurs fixes partagées par tout le backend.
// Elles suivent le diagramme de classes (docs/uml/classes.puml) et le code web.

const ROLES = Object.freeze({
  STUDENT: "student",
  MERCHANT: "merchant",
  ADMIN: "admin",
});

// Rôles qu'on peut choisir à l'inscription. Un admin se crée uniquement
// avec scripts/create-admin.js, jamais par l'API publique.
const ROLES_INSCRIPTION = [ROLES.STUDENT, ROLES.MERCHANT];

const TYPES_COMMERCE = ["RESTAURANT", "CAFETERIA", "BOULANGERIE", "PATISSERIE"];

const STATUT_VALIDATION = Object.freeze({
  EN_ATTENTE: "EN_ATTENTE",
  VALIDE: "VALIDE",
  REFUSE: "REFUSE",
});

// Catégories d'offres, identiques à web/src/config/constants.js
const CATEGORIES_OFFRE = ["BOULANGERIE", "PLATS", "PATISSERIE", "BOISSONS"];

const STATUT_OFFRE = Object.freeze({
  ACTIVE: "ACTIVE",
  EPUISEE: "EPUISEE", // quantité à 0
  EXPIREE: "EXPIREE", // heure de fin de retrait passée (calculé à la lecture)
  RETIREE: "RETIREE", // retirée par le commerçant
});

// Statuts d'une commande, de la réservation au retrait.
const STATUT_COMMANDE = Object.freeze({
  EN_ATTENTE_PAIEMENT: "EN_ATTENTE_PAIEMENT",
  PAYEE: "PAYEE",
  PRETE: "PRETE",
  RECUPEREE: "RECUPEREE",
  ANNULEE: "ANNULEE",
});

// Statuts du paiement Konnect enregistré dans la commande.
const STATUT_PAIEMENT = Object.freeze({
  INITIE: "INITIE",
  REUSSI: "REUSSI",
  ECHOUE: "ECHOUE",
});

// Préférences alimentaires qu'un commerçant peut cocher sur une offre (filtres étudiant)
const REGIMES = ["VEGETARIEN", "VEGAN", "SANS_GLUTEN", "SANS_LACTOSE", "FAIT_MAISON"];

// Signalements (réclamations) d'un étudiant
const MOTIFS_SIGNALEMENT = ["QUALITE", "QUANTITE", "COMMERCE_FERME", "PAIEMENT", "AUTRE"];
const STATUT_SIGNALEMENT = Object.freeze({ OUVERT: "OUVERT", TRAITE: "TRAITE", REJETE: "REJETE" });

// Impact écologique (estimations affichées sur le site et l'app)
const KG_PAR_REPAS = 0.4; // nourriture sauvée par repas
const CO2_PAR_REPAS = 2.5; // kg CO2e évités par repas sauvé (estimation Too Good To Go)

module.exports = {
  ROLES,
  REGIMES,
  MOTIFS_SIGNALEMENT,
  STATUT_SIGNALEMENT,
  KG_PAR_REPAS,
  CO2_PAR_REPAS,
  ROLES_INSCRIPTION,
  TYPES_COMMERCE,
  STATUT_VALIDATION,
  CATEGORIES_OFFRE,
  STATUT_OFFRE,
  STATUT_COMMANDE,
  STATUT_PAIEMENT,
};
