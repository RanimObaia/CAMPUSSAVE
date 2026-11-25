// Réglages de l'application, choisis au lancement :
//   flutter run                                     -> mode démo (données fictives, sans serveur)
//   flutter run --dart-define=USE_MOCK=false \
//               --dart-define=API_URL=http://10.0.2.2:4000/api \
//               --dart-define=FIREBASE_API_KEY=xxxx -> vrai backend
// (10.0.2.2 = l'ordinateur vu depuis l'émulateur Android)
const bool kUseMock = bool.fromEnvironment('USE_MOCK', defaultValue: true);
const String kApiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:4000/api');
const String kFirebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY', defaultValue: '');
const String kWebUrl = String.fromEnvironment('WEB_URL', defaultValue: 'http://localhost:5173');

// Campus ESSECT (Montfleury, Tunis) : point de départ des distances
const double kEssectLat = 36.7907;
const double kEssectLng = 10.1786;
