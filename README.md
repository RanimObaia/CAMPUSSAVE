# CampusSave

**Plateforme intelligente de lutte contre le gaspillage alimentaire**
Projet intégrateur — 3ème année E-Business / Business Computing, ESSECT (2026)
Modules : Intégration Web · Développement Mobile · Paiement Électronique

CampusSave met en relation les étudiants de l'ESSECT avec les restaurants et cafétérias à proximité. Les commerçants publient leurs invendus à prix réduits ; les étudiants consultent les offres, remplissent un panier, paient en ligne, puis récupèrent leur commande grâce à un QR code.

## Équipe
| Membre | Rôle |
|---|---|
| Ranim | Cheffe de projet · Backend (auth, commerces, offres, statistiques, données de démo) |
| Eya | Web · Espace étudiant · Paiement Konnect et email de confirmation · Cahier des charges |
| Ahmed | Backend · Commandes, QR code de retrait, notifications push |
| Ines | Web · Espace commerçant et admin · Diagrammes UML |
| Azer | Mobile · Application Flutter |

## Architecture

```
React (web) ─┐                               ┌─ Firebase Authentication
             ├─ REST + Firebase ID token ──► Node.js / Express ─┼─ Cloud Firestore
Flutter ─────┘                               │                  ├─ Firebase Cloud Messaging
                                             │                  └─ Email (Nodemailer)
                                             └─ Konnect (paiement, mode sandbox)
```

Les deux applications utilisent le même backend et partagent les mêmes données.

| Dossier | Contenu | Technologie |
|---|---|---|
| `backend/` | API REST | Node.js, Express, firebase-admin |
| `web/` | Application Web | React.js (Vite) |
| `mobile/` | Application Mobile | Flutter |
| `docs/` | Cahier des charges, UML, maquettes, rapport, captures du paiement | — |

## Acteurs
- **Étudiant** : consulte les offres, gère son panier, réserve et paie.
- **Commerçant** : gère son établissement, publie les offres, traite les commandes (scan QR).
- **Administrateur** : gère les utilisateurs, valide les commerçants, supervise la plateforme.

## Prérequis
- Node.js ≥ 20 et npm
- Flutter SDK ≥ 3.22
- Un projet Firebase (Authentication, Firestore, Cloud Messaging activés)
- Un compte Konnect sandbox (clé API + wallet ID)

## Installation et exécution

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env          # puis remplir les valeurs
# placer la clé de compte de service Firebase dans backend/serviceAccountKey.json
npm run dev                   # http://localhost:4000/api/health
```

### 2. Application Web
```bash
cd web
npm install
cp .env.example .env.local    # puis remplir la configuration Firebase Web
npm run dev                   # http://localhost:5173
```

### 3. Application Mobile
```bash
cd mobile
flutter create . --project-name campussave --org tn.essect --platforms android,ios
flutter pub get
flutterfire configure         # génère firebase_options.dart (non versionné)
flutter run
```

## Configuration Firebase
Aucune clé secrète n'est versionnée. Fichiers à créer localement :
- `backend/.env` et `backend/serviceAccountKey.json`
- `web/.env.local`
- `mobile/lib/firebase_options.dart`, `google-services.json` (Android), `GoogleService-Info.plist` (iOS)

## Données de démonstration
Pour remplir Firestore avec des commerces et des offres réalistes autour de l'ESSECT :
```bash
cd backend
npm run seed                                  # 5 commerces validés, 15 offres, 1 commerce en attente
npm run create-admin -- admin@campussave.tn MotDePasse   # crée le compte administrateur
```
Le script est relançable : il ne touche qu'aux documents dont l'identifiant commence par `demo-`.
Les horaires de retrait sont calculés à partir de l'heure du lancement, relance-le le jour de la démo.

| Compte | Rôle | Mot de passe |
|---|---|---|
| `etudiant@demo.campussave.tn` | Étudiant | `Demo2026!` |
| `elmedina@demo.campussave.tn`, `fournil@…`, `essaada@…`, `carthage@…`, `cafeteria@…` | Commerçant (commerce validé) | `Demo2026!` |
| `bardo@demo.campussave.tn` | Commerçant (commerce en attente de validation) | `Demo2026!` |

**Sans backend :** `VITE_USE_MOCK=true` dans `web/.env.local` lance le site avec des données fictives
(`etudiant@demo.tn`, `merchant@demo.tn`, `admin@demo.tn`, n'importe quel mot de passe). Le paiement y est simulé.

## Paiement en ligne (Konnect, mode test)
- API : `https://api.preprod.konnect.network/api/v2`, compte de test sur `dashboard.sandbox.konnect.network`.
- Parcours : panier → `POST /api/orders` → `POST /api/payments/init` (renvoie `payUrl`) → page Konnect → retour sur le site.
  Konnect appelle `GET /api/payments/webhook?payment_ref=…` ; le backend **revérifie le paiement auprès de Konnect**
  avant de passer la commande en « Payée », générer le QR code et envoyer l'email de confirmation.
- Cartes de test : Visa `4509 2111 1111 1119`, 12/26, CVC 748 (accepté) · MasterCard `5471 2511 1111 1116`, 11/23, CVC 858 (refusé).
- Pour que Konnect joigne le webhook depuis un PC, exposer le port 4000 (ex. `ngrok http 4000`) et mettre l'adresse dans `BACKEND_PUBLIC_URL`.
- Une commande non payée au bout de 30 minutes est annulée et le stock est rendu.

## API REST (préfixe `/api`)
Toutes les routes, sauf indication, demandent l'en-tête `Authorization: Bearer <Firebase ID token>`.
Les erreurs ont la forme `{ "code": "...", "message": "..." }` ; les prix sont en **millimes** (4 500 = 4,500 DT).

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/register` | public |
| GET · PUT | `/users/me` | connecté |
| GET | `/shops`, `/shops/:id` | public |
| GET · POST · PUT | `/shops/mine`, `/shops`, `/shops/:id` | commerçant |
| GET | `/offers`, `/offers/:id` (filtres `q`, `categorie`, `prixMax`) | public |
| GET · POST · PUT · DELETE | `/offers?mine=true`, `/offers`, `/offers/:id` | commerçant |
| POST · GET | `/orders`, `/orders/mine`, `/orders/:id/cancel` | étudiant |
| GET · PATCH · POST | `/orders`, `/orders/:id/ready`, `/orders/validate-qr` | commerçant |
| POST | `/payments/init` | étudiant |
| GET | `/payments/webhook` | Konnect |
| GET | `/stats/student`, `/stats/merchant`, `/stats/admin` | selon le rôle |
| GET · PATCH | `/admin/shops`, `/admin/shops/:id/validate`, `/admin/users`, `/admin/users/:id` | admin |

## Sécurité
- Firestore est fermé à tout accès direct (`firestore.rules` : `allow read, write: if false`). Toutes les lectures et écritures passent par l'API, qui vérifie le jeton et le rôle (custom claim `role`).
- Le rôle admin ne peut pas être choisi à l'inscription : il se crée avec `npm run create-admin`.
- Aucune clé n'est versionnée (`.env`, `serviceAccountKey.json`, `.env.local`, fichiers Firebase mobile sont dans `.gitignore`).

## Fonctionnalités
- [x] Authentification et rôles (étudiant, commerçant, administrateur)
- [x] Gestion des commerces, avec validation par l'administrateur
- [x] Gestion des offres (publication, modification, retrait, stock)
- [x] Recherche (produit, commerce, catégorie, prix)
- [x] Panier et réservation (stock réservé dans une transaction)
- [x] Paiement en ligne (Konnect sandbox) et email de confirmation
- [x] QR code de retrait, validé par le commerçant
- [x] Notifications push (commande prête, commande remise)
- [x] Tableaux de bord étudiant, commerçant et admin (repas et kilos sauvés, chiffre d'affaires)
- [x] Bonus : EcoPoints et impact (repas et kg de nourriture sauvés)
- [ ] Application mobile Flutter (en cours)

## Documentation
- Cahier des charges : `docs/cahier-des-charges/`
- Diagrammes UML (cas d'utilisation, classes) : `docs/uml/` (sources PlantUML `.puml`)
- Maquettes : `docs/maquettes/`
- Rapport : `docs/rapport/`
- Captures du paiement : `docs/captures-paiement/`
