// Pages légales. Projet universitaire : les textes décrivent le fonctionnement réel
// de CampusSave et doivent être relus avant une mise en service publique.
export const LEGAL = {
  mentions: {
    titre: 'Mentions légales',
    maj: '24 novembre 2026',
    sections: [
      ['Éditeur', 'CampusSave est un projet réalisé par des étudiants de 3e année Business Computing de l\'École Supérieure des Sciences Économiques et Commerciales de Tunis (ESSECT), 4 rue Abou Zakaria El Hafsi, 1089 Montfleury, Tunis.'],
      ['Équipe', 'Ranim Obaia (responsable du projet, backend), Ines Hachana (espace commerçant, administration, UML), Eya Oueslati (espace étudiant, paiement), Ahmed (commandes, QR code, notifications), Azer (application mobile).'],
      ['Hébergement', 'Les données sont stockées sur Google Firebase (Google Cloud, région Europe). Le site web est servi par l\'hébergeur choisi par l\'équipe lors du déploiement.'],
      ['Paiement', 'Les paiements sont traités par Konnect Networks (konnect.network), prestataire de paiement agréé en Tunisie. CampusSave ne stocke aucune donnée de carte bancaire.'],
      ['Contact', 'Pour toute question, utilisez la page Contact du site.'],
    ],
  },
  cgu: {
    titre: 'Conditions générales d\'utilisation et de vente',
    maj: '24 novembre 2026',
    sections: [
      ['Objet', 'CampusSave met en relation des étudiants et des commerces de proximité (restaurants, cafétérias, boulangeries, pâtisseries) qui vendent leurs invendus du jour à prix réduit.'],
      ['Compte', 'L\'inscription est gratuite. Chaque utilisateur est responsable de ses identifiants. Un compte peut être suspendu par l\'administration en cas d\'abus (commandes non retirées à répétition, faux signalements, contenu trompeur).'],
      ['Commerçants', 'Un commerce n\'apparaît qu\'après validation par l\'administration. Le commerçant garantit que les produits proposés sont propres à la consommation au moment du retrait et que la description, le prix initial et le créneau sont exacts.'],
      ['Commande et prix', 'Les prix sont affichés en dinars tunisiens (DT), toutes taxes comprises. Une commande concerne un seul commerce. Les quantités sont réservées dès la création de la commande, pendant 30 minutes au plus en attendant le paiement.'],
      ['Paiement', 'Le paiement en ligne est obligatoire et se fait sur la page sécurisée de Konnect. La commande est confirmée uniquement quand Konnect confirme le paiement ; un e-mail de confirmation contenant le QR code est alors envoyé. En cas de refus, un e-mail « paiement non abouti » est envoyé et rien n\'est débité.'],
      ['Retrait', 'L\'étudiant (ou la personne à qui il a confié son lien de retrait) présente le QR code pendant le créneau indiqué. Une commande non retirée pendant le créneau n\'est pas remboursée, sauf faute du commerce.'],
      ['Avis', 'Seuls les étudiants ayant récupéré une commande peuvent noter le commerce. Les avis injurieux ou sans rapport avec la commande peuvent être retirés.'],
      ['Responsabilité', 'CampusSave est un intermédiaire : la préparation, l\'hygiène et la qualité des produits relèvent du commerçant. Tout problème peut être signalé depuis la commande.'],
    ],
  },
  confidentialite: {
    titre: 'Politique de confidentialité',
    maj: '24 novembre 2026',
    sections: [
      ['Données collectées', 'Nom, prénom, adresse e-mail, téléphone (facultatif), établissement et numéro d\'étudiant (facultatifs), commerces favoris, commandes, avis et signalements. Pour les commerçants : informations du commerce et sa position sur la carte.'],
      ['Position', 'Ta position n\'est utilisée que dans ton navigateur ou ton téléphone pour calculer les distances, quand tu cliques sur « Utiliser ma position ». Elle n\'est pas enregistrée sur nos serveurs.'],
      ['Finalités', 'Gérer ton compte, tes commandes et leur paiement, t\'envoyer les e-mails de paiement (confirmation ou refus) et les notifications que tu as choisies, produire des statistiques anonymes (repas sauvés).'],
      ['Destinataires', 'Le commerçant voit le code et le contenu de ta commande. Konnect reçoit ton nom, ton e-mail et le montant pour le paiement. Aucune donnée n\'est vendue ni utilisée pour la publicité.'],
      ['Durée', 'Les données du compte sont gardées tant que le compte existe. Les commandes sont gardées 3 ans pour la comptabilité des commerçants.'],
      ['Tes droits', 'Conformément à la loi organique n° 2004-63 sur la protection des données personnelles, tu peux demander l\'accès, la rectification ou la suppression de tes données depuis la page Contact.'],
    ],
  },
  cookies: {
    titre: 'Cookies et stockage local',
    maj: '24 novembre 2026',
    sections: [
      ['Ce que nous utilisons', 'CampusSave n\'utilise aucun cookie publicitaire ni outil de mesure d\'audience tiers. Le navigateur garde seulement : ta session de connexion (Firebase Authentication), ton panier, ta langue, ton thème clair ou sombre et ton choix sur cette bannière.'],
      ['Pourquoi pas de consentement préalable', 'Ces éléments sont strictement nécessaires au fonctionnement du service. Le bouton « Refuser le non essentiel » ne change donc rien au fonctionnement : il n\'y a rien de non essentiel.'],
      ['Effacer', 'Tu peux tout effacer depuis les réglages de ton navigateur (données de site). Tu seras déconnecté et ton panier sera vidé.'],
    ],
  },
  annulation: {
    titre: 'Annulation, réclamation et remboursement',
    maj: '24 novembre 2026',
    sections: [
      ['Avant le paiement', 'Tant que la commande n\'est pas payée, tu peux abandonner le paiement : la commande est annulée automatiquement au bout de 30 minutes et les produits sont remis en vente. Rien n\'est débité.'],
      ['Paiement refusé', 'Si Konnect refuse le paiement, la commande est annulée immédiatement et tu reçois un e-mail « paiement non abouti ». Tu peux recommander si l\'offre est encore disponible.'],
      ['Après le paiement', 'Une commande payée ne peut pas être annulée par l\'étudiant : les produits sont mis de côté pour toi. Tu peux confier le retrait à un ami si tu ne peux pas y aller.'],
      ['Réclamation', 'Commerce fermé pendant le créneau, quantité incomplète, produit impropre : utilise « Signaler un problème » dans ta commande dans les 48 heures. L\'administration répond sous 72 heures.'],
      ['Remboursement', 'Si la réclamation est acceptée, le remboursement est fait sur le moyen de paiement utilisé, via Konnect, sous 7 jours ouvrés.'],
    ],
  },
}
