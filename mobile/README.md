# CampusSave mobile (Flutter)

L'application des étudiants : offres du jour en liste et sur la carte, filtres et tri,
favoris, panier, paiement Konnect, QR code de retrait (plein écran au comptoir),
retrait confié à un ami, avis, signalements, notifications et impact (CO2, EcoPoints).

## Lancer

```bash
flutter pub get
flutter run                      # mode démo : données fictives, aucun serveur
```

Avec le vrai backend (`npm run dev` à la racine du projet) :

```bash
flutter run --dart-define=USE_MOCK=false \
            --dart-define=API_URL=http://10.0.2.2:4000/api \
            --dart-define=FIREBASE_API_KEY=<clé web du projet Firebase> \
            --dart-define=WEB_URL=http://10.0.2.2:5173
```

`10.0.2.2` est l'ordinateur vu depuis l'émulateur Android (sur un vrai téléphone : l'adresse IP du PC).
La connexion utilise l'API REST de Firebase Authentication : aucun `google-services.json` n'est nécessaire.

## Paiement

1. L'app crée la commande (`POST /orders`) puis demande le lien Konnect (`POST /payments/init`).
2. La page Konnect s'ouvre dans le navigateur ; l'app attend la confirmation (`GET /orders/:id`).
3. Paiement réussi : e-mail de confirmation avec le QR code. Refusé ou abandonné : commande annulée,
   stock remis, e-mail « paiement non abouti ». En mode démo, une page simule Konnect.

## Vérifier

```bash
flutter analyze
flutter test
flutter build apk --release      # build/app/outputs/flutter-apk/app-release.apk
```

## Organisation

- `lib/services/api.dart` : ce que l'app demande au serveur ; `api_mock.dart` (démo) et `api_http.dart` (backend)
- `lib/services/session.dart` : utilisateur, panier (un seul commerce), favoris, thème, notifications
- `lib/screens/` : démarrage, offres + carte, détail, panier + paiement, commandes + QR, favoris, notifications, Moi
- `lib/widgets/communs.dart` : composants partagés (vignette « cloche », note, cœur, carte d'offre)

À ajouter quand le fichier `google-services.json` sera disponible : notifications push
(`firebase_messaging`). En attendant, les notifications sont lues dans l'API (cloche et onglet Moi).
