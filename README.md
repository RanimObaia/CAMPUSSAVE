# CampusSave 🌱

**Plateforme intelligente de lutte contre le gaspillage alimentaire**
Projet intégrateur — 3ème année E-Business / Business Computing, ESSECT (2026)
Modules : Intégration Web · Développement Mobile · Paiement Électronique

CampusSave met en relation les étudiants de l'ESSECT avec les restaurants et cafétérias à proximité. Les commerçants publient leurs invendus à prix réduits ; les étudiants consultent les offres, remplissent un panier, paient en ligne, puis récupèrent leur commande grâce à un QR code.

## Équipe
| Nom | Rôle |
|---|---|
| _À compléter_ | |

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

## Fonctionnalités
- [ ] Authentification et rôles
- [ ] Gestion des commerces (validation admin)
- [ ] Gestion des offres
- [ ] Recherche (produit, commerce, catégorie, prix)
- [ ] Panier et réservation
- [ ] Paiement en ligne (Konnect sandbox) + email de confirmation
- [ ] QR code de retrait
- [ ] Tableaux de bord (étudiant, commerçant, admin)
- [ ] Bonus : EcoPoints, Impact Dashboard, Surprise Basket, Campus Radar
