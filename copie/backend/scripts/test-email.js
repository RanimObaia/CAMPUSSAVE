// Vérifie la configuration Gmail en envoyant les deux e-mails de paiement
// (réussi + refusé) à l'adresse donnée, avec une commande d'exemple.
//   npm run email:test -- ton.adresse@gmail.com
// Besoin seulement de MAIL_USER et MAIL_APP_PASSWORD dans backend/.env
require('dotenv').config();
const email = require('../src/services/email');

const destinataire = process.argv[2] || process.env.MAIL_USER;
if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
  console.error('MAIL_USER et MAIL_APP_PASSWORD doivent être remplis dans backend/.env');
  process.exit(1);
}

const maintenant = Date.now();
const commande = {
  code: 'CS-TEST42',
  emailEtudiant: destinataire,
  commerce: { nom: 'Boulangerie Le Fournil', adresse: 'Rue de la Liberté, Tunis' },
  lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 2, prixUnitaire: 4500, prixInitial: 12000 }],
  montantTotal: 9000,
  heureDebutRecuperation: new Date(maintenant + 3600e3).toISOString(),
  heureFinRecuperation: new Date(maintenant + 7200e3).toISOString(),
  paiement: { reference: 'KNT-TEST-0001', datePaiement: new Date().toISOString() },
};

(async () => {
  const ok = await email.envoyerConfirmation(commande);
  console.log(ok ? `✓ E-mail « paiement confirmé » envoyé à ${destinataire}` : '✕ E-mail « paiement confirmé » non envoyé (voir l\'erreur ci-dessus)');
  const ko = await email.envoyerEchec(commande, 'REFUSE');
  console.log(ko ? `✓ E-mail « paiement non abouti » envoyé à ${destinataire}` : '✕ E-mail « paiement non abouti » non envoyé');
  process.exit(ok && ko ? 0 : 1);
})();
