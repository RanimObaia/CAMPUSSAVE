// Valeurs du paiement en ligne. Fichier séparé de constants.js pour ne pas
// toucher au même fichier que les commandes (branche d'Ahmed).

// Statuts d'une commande (diagramme de classes : StatutCommande)
const STATUT_COMMANDE = Object.freeze({
  EN_ATTENTE_PAIEMENT: 'EN_ATTENTE_PAIEMENT',
  PAYEE: 'PAYEE',
  PRETE: 'PRETE',
  RECUPEREE: 'RECUPEREE',
  ANNULEE: 'ANNULEE',
});

// Statuts d'un paiement (diagramme de classes : StatutPaiement)
const STATUT_PAIEMENT = Object.freeze({
  INITIE: 'INITIE',
  REUSSI: 'REUSSI',
  ECHOUE: 'ECHOUE',
});

// Durée de validité du lien de paiement Konnect, en minutes
const DUREE_LIEN_PAIEMENT_MINUTES = 15;

module.exports = { STATUT_COMMANDE, STATUT_PAIEMENT, DUREE_LIEN_PAIEMENT_MINUTES };
