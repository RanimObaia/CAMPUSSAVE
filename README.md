# CampusSave

**Plateforme intelligente de lutte contre le gaspillage alimentaire**
Projet intégrateur — 3ème année E-Business / Business Computing, ESSECT (2026)
Modules : Intégration Web · Développement Mobile · Paiement Électronique

CampusSave met en relation les étudiants de l'ESSECT avec les restaurants et cafétérias à proximité. Les commerçants publient leurs invendus à prix réduits ; les étudiants consultent les offres, remplissent un panier, paient en ligne, puis récupèrent leur commande grâce à un QR code.

## Équipe
| Membre | Rôle |
|---|---|
| Ranim | Cheffe de projet · Backend (auth, commerces, offres, statistiques, données de démo) |
| Eya | Web · Espace étudiant · Paiement en ligne (Konnect, Stripe) et email de confirmation · Cahier des charges |
| Ahmed | Backend · Commandes, QR code de retrait, notifications push |
| Ines | Web · Espace commerçant et admin · Diagrammes UML |
| Azer | Mobile · Application Flutter |

## Architecture

```
React (web) ─┐                               ┌─ Firebase Authentication
             ├─ REST + Firebase ID token ──► Node.js / Express ─┼─ Cloud Firestore
Flutter ─────┘                               │                  ├─ Firebase Cloud Messaging
                                             │                  └─ Email (Nodemailer)
                                             └─ Paiement en ligne : Stripe (mode test) ou Konnect
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
- Un compte Stripe en mode test (clé secrète `sk_test_…`), ou un compte Konnect sandbox (clé API + wallet ID)
- Un compte Gmail avec un mot de passe d'application (email de confirmation)

## Installation et exécution

### Lancement rapide (backend + web ensemble)
Depuis la racine du projet, une fois `backend/.env`, `backend/serviceAccountKey.json` et `web/.env.local` en place :
```bash
npm run installer   # installe la racine, le backend et le web
npm run seed        # données de démonstration (une fois, puis le matin de la démo)
npm run dev         # API sur http://localhost:4000/api et site sur http://localhost:5173
```
Le détail de chaque partie suit.

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
flutter pub get
flutter run -d chrome                     # mode démo : données fictives, sans serveur
```
Avec le vrai backend (lancé avec `npm run dev`) et la vraie base Firebase :
```bash
flutter run -d chrome --web-port 5174 \
  --dart-define=USE_MOCK=false \
  --dart-define=API_URL=http://localhost:4000/api \
  --dart-define=FIREBASE_API_KEY=<clé Web Firebase, = VITE_FIREBASE_API_KEY> \
  --dart-define=WEB_URL=http://localhost:5173
```
Ajouter l'origine de l'app dans `backend/.env` : `CORS_ORIGINS=http://localhost:5173,http://localhost:5174`.
Sur l'émulateur Android, remplacer `localhost` par `10.0.2.2` dans `API_URL`. Plus de détails : `mobile/README.md`.

L'application mobile couvre les trois rôles avec le même backend et les mêmes données que le site :
- **Étudiant** : offres (liste et carte), favoris, panier, paiement en ligne, commandes, QR code de retrait, notifications ;
- **Commerçant** : validation d'un retrait par le code de la commande, commandes reçues (« Prête »), offres (publier, modifier, retirer), tableau de bord ;
- **Administrateur** : validation des commerces, tableau de bord.
La gestion complète (statistiques détaillées, utilisateurs, modération, signalements) se fait sur le site web.

## Configuration Firebase
Aucune clé secrète n'est versionnée. Fichiers à créer localement :
- `backend/.env` et `backend/serviceAccountKey.json`
- `web/.env.local`
- l'application mobile n'a besoin d'aucun fichier secret : la clé Web Firebase (publique) est passée au lancement avec `--dart-define`

## Données de démonstration
Pour remplir Firestore avec des commerces et des offres réalistes autour de l'ESSECT :
```bash
cd backend
npm run seed                                  # 6 commerces validés, 16 offres, 1 commerce en attente
npm run create-admin -- admin@campussave.tn MotDePasse   # crée le compte administrateur
```
Le script est relançable : il ne touche qu'aux documents dont l'identifiant commence par `demo-`.
Les horaires de retrait sont calculés à partir de l'heure du lancement, relance-le le jour de la démo.

| Compte | Rôle | Mot de passe |
|---|---|---|
| `etudiant@demo.campussave.tn` | Étudiant | `Demo2026!` |
| `cheznous@demo.campussave.tn`, `ggfood@…`, `layal@…`, `naziha@…`, `benrjab@…`, `delicious@…` | Commerçant (commerce validé) | `Demo2026!` |
| `horizon@demo.campussave.tn` | Commerçant (commerce en attente de validation) | `Demo2026!` |

> **Commerces de démonstration :** ce sont de vrais commerces situés à moins de 1 km de l'ESSECT (noms, adresses, coordonnées GPS et horaires issus de Google Maps). Les offres, les prix et les comptes commerçants sont **simulés**, et aucun vrai numéro de téléphone n'est utilisé. Aucun de ces commerces n'utilise réellement CampusSave : ces données servent uniquement à la démonstration du projet.

**Sans backend :** `VITE_USE_MOCK=true` dans `web/.env.local` lance le site avec des données fictives
(`etudiant@demo.tn`, `merchant@demo.tn`, `admin@demo.tn`, n'importe quel mot de passe). Le paiement y est simulé.

## Paiement en ligne (mode test)
Le backend peut utiliser trois passerelles de paiement. On choisit la passerelle avec une seule ligne de `backend/.env`, sans changer le code :

| `PAIEMENT_MODE` | Passerelle | Usage |
|---|---|---|
| `stripe` | Stripe, mode test (vraie page de paiement par carte) | **utilisé pour la démo** |
| `konnect` | Konnect sandbox (passerelle tunisienne, paiement en dinars) | cible pour la mise en production ; le sandbox était indisponible pendant le projet (pas de SMS de vérification) |
| `simulation` | Page de paiement de test intégrée au site | sans aucun service extérieur |

**Parcours :** panier → `POST /api/orders` (stock réservé) → `POST /api/payments/init` (renvoie `payUrl`) → page de paiement → retour sur le site.
Le navigateur n'est jamais cru : le backend **redemande l'état du paiement à la passerelle** avant de passer la commande en « Payée », de générer le QR code et d'envoyer l'email de confirmation (une seule fois).
Une commande non payée au bout de 30 minutes est annulée et le stock est rendu ; un paiement refusé ou abandonné annule aussi la commande.

### Stripe (mode test)
```env
PAIEMENT_MODE=stripe
STRIPE_SECRET_KEY=sk_test_...    # dashboard.stripe.com > Développeurs > Clés API
STRIPE_DEVISE=eur                # le compte de test n'accepte pas le TND
STRIPE_TAUX=0.29                 # 1 DT = 0,29 € ; tnd si le compte accepte le dinar
```
- Tous les prix du site restent en DT. Le montant en DT est écrit sur la page Stripe ; Stripe encaisse l'équivalent en euros (minimum Stripe : 0,50 €).
- Carte de test acceptée : `4242 4242 4242 4242`, date future (12/30), CVC 123. Carte refusée : `4000 0000 0000 0002`.
- Aucun webhook à exposer : le paiement est vérifié auprès de Stripe au retour sur le site.

### Konnect (sandbox)
```env
PAIEMENT_MODE=konnect
KONNECT_API_URL=https://api.preprod.konnect.network/api/v2
KONNECT_API_KEY=...
KONNECT_WALLET_ID=...
```
- Konnect appelle `GET /api/payments/webhook?payment_ref=…`. Depuis un PC, exposer le port 4000 (ex. `ngrok http 4000`) et mettre l'adresse dans `BACKEND_PUBLIC_URL`.

### Email de confirmation
```env
MAIL_USER=adresse@gmail.com
MAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # mot de passe d'application Google (16 lettres, sans espaces)
MAIL_COPIE=adresse@gmail.com         # facultatif : reçoit une copie cachée de chaque confirmation
```
L'email récapitule la commande (articles, total en DT, adresse et créneau de retrait, référence du paiement) avec le QR code de retrait.

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
| POST | `/payments/simulation` | étudiant (`PAIEMENT_MODE=simulation`) |
| GET | `/payments/webhook` | Konnect (public, revérifié auprès de Konnect) |
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
- [x] Paiement en ligne en mode test (Stripe ; Konnect prêt) et email de confirmation avec QR code
- [x] QR code de retrait, validé par le commerçant
- [x] Notifications push (commande prête, commande remise)
- [x] Tableaux de bord étudiant, commerçant et admin (repas et kilos sauvés, chiffre d'affaires)
- [x] Bonus : EcoPoints, Impact Dashboard (repas et kg de nourriture sauvés), Campus Radar (carte des commerces)
- [x] Application mobile Flutter (étudiant, commerçant, administrateur) partageant le backend et les données du site

## Documentation
- Cahier des charges : `docs/cahier-des-charges/`
- Diagrammes UML (cas d'utilisation, classes) : `docs/uml/` (sources PlantUML `.puml`)
- Maquettes : `docs/maquettes/`
- Rapport : `docs/rapport/`
- Captures du paiement : `docs/captures-paiement/`