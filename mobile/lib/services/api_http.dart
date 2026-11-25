// Vrai backend : connexion Firebase par l'API REST (pas de configuration native à ajouter),
// puis appels à l'API CampusSave avec le jeton « Authorization: Bearer ».
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models/modeles.dart';
import 'api.dart';

class ApiHttp implements CampusApi {
  String? _jeton;
  String? _rafraichissement;
  DateTime _expiration = DateTime.fromMillisecondsSinceEpoch(0);

  // ---------- Firebase Authentication (REST) ----------
  Future<void> _seConnecterFirebase(String email, String motDePasse) async {
    if (kFirebaseApiKey.isEmpty) throw ApiException('FIREBASE_API_KEY manquante : lance l\'app avec --dart-define=FIREBASE_API_KEY=...');
    final r = await http.post(
      Uri.parse('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$kFirebaseApiKey'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': motDePasse, 'returnSecureToken': true}),
    );
    final data = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode != 200) throw ApiException('Identifiants incorrects.', code: 'IDENTIFIANTS');
    await _garder(data['idToken'], data['refreshToken'], int.parse('${data['expiresIn']}'));
  }

  Future<void> _garder(String jeton, String rafraichissement, int secondes) async {
    _jeton = jeton;
    _rafraichissement = rafraichissement;
    _expiration = DateTime.now().add(Duration(seconds: secondes - 60));
    final p = await SharedPreferences.getInstance();
    await p.setString('campussave.refresh', rafraichissement);
  }

  Future<String?> _jetonValide() async {
    if (_jeton != null && DateTime.now().isBefore(_expiration)) return _jeton;
    if (_rafraichissement == null) return null;
    final r = await http.post(
      Uri.parse('https://securetoken.googleapis.com/v1/token?key=$kFirebaseApiKey'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=refresh_token&refresh_token=${Uri.encodeComponent(_rafraichissement!)}',
    );
    if (r.statusCode != 200) return null;
    final d = jsonDecode(r.body) as Map<String, dynamic>;
    await _garder(d['id_token'], d['refresh_token'], int.parse('${d['expires_in']}'));
    return _jeton;
  }

  // ---------- Appel REST ----------
  Future<dynamic> _req(String methode, String chemin, {Map<String, dynamic>? corps, Map<String, String>? params, bool auth = true}) async {
    final jeton = auth ? await _jetonValide() : null;
    final uri = Uri.parse('$kApiUrl$chemin').replace(queryParameters: params?.isEmpty ?? true ? null : params);
    final entetes = {'Content-Type': 'application/json', if (jeton != null) 'Authorization': 'Bearer $jeton'};
    late http.Response r;
    try {
      final req = http.Request(methode, uri)..headers.addAll(entetes);
      if (corps != null) req.body = jsonEncode(corps);
      r = await http.Response.fromStream(await req.send()).timeout(const Duration(seconds: 20));
    } catch (_) {
      throw ApiException("Impossible de joindre le serveur CampusSave. Vérifie ta connexion.");
    }
    if (r.statusCode == 204 || r.body.isEmpty) return null;
    final data = jsonDecode(utf8.decode(r.bodyBytes));
    if (r.statusCode >= 400) {
      throw ApiException(data is Map ? (data['message'] ?? 'Erreur ${r.statusCode}') : 'Erreur ${r.statusCode}', code: data is Map ? data['code'] : null, status: r.statusCode);
    }
    return data;
  }

  // Appel REST ouvert aux espaces commerçant et administrateur (services/api_pro.dart)
  Future<dynamic> requete(String methode, String chemin, {Map<String, dynamic>? corps, Map<String, String>? params}) =>
      _req(methode, chemin, corps: corps, params: params);

  Map<String, dynamic> _m(dynamic v) => Map<String, dynamic>.from(v as Map);
  List<Map<String, dynamic>> _l(dynamic v) => (v as List).map(_m).toList();

  // ---------- Compte ----------
  @override
  Future<Utilisateur> connexion(String email, String motDePasse) async {
    await _seConnecterFirebase(email.trim(), motDePasse);
    final u = Utilisateur.fromJson(_m(await _req('GET', '/users/me')));
    // Étudiant, commerçant et administrateur se connectent ici ; l'écran d'accueil dépend du rôle (voir main.dart).
    return u;
  }

  @override
  Future<Utilisateur> inscription({required String prenom, required String nom, required String email, required String motDePasse, String? etablissement}) async {
    await _req('POST', '/auth/register', auth: false, corps: {
      'prenom': prenom, 'nom': nom, 'email': email.trim(), 'motDePasse': motDePasse, 'role': 'student',
      if (etablissement != null && etablissement.isNotEmpty) 'etablissement': etablissement,
    });
    return connexion(email, motDePasse);
  }

  @override
  Future<void> deconnexion() async {
    _jeton = null;
    _rafraichissement = null;
    final p = await SharedPreferences.getInstance();
    await p.remove('campussave.refresh');
  }

  @override
  Future<Utilisateur?> sessionEnregistree() async {
    final p = await SharedPreferences.getInstance();
    _rafraichissement = p.getString('campussave.refresh');
    if (_rafraichissement == null) return null;
    try {
      return Utilisateur.fromJson(_m(await _req('GET', '/users/me')));
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Utilisateur> modifierProfil(Map<String, dynamic> data) async => Utilisateur.fromJson(_m(await _req('PUT', '/users/me', corps: data)));

  // ---------- Offres ----------
  @override
  Future<List<Offre>> offres(Filtres f) async => _l(await _req('GET', '/offers', params: f.versParams())).map(Offre.fromJson).toList();

  @override
  Future<Offre> offre(String id) async => Offre.fromJson(_m(await _req('GET', '/offers/$id')));

  @override
  Future<List<Avis>> avisCommerce(String commerceId) async => _l(await _req('GET', '/shops/$commerceId/avis', auth: false)).map(Avis.fromJson).toList();

  @override
  Future<List<Commerce>> favoris() async => _l(await _req('GET', '/users/me/favoris')).map(Commerce.fromJson).toList();

  @override
  Future<List<String>> basculerFavori(String commerceId, bool ajouter) async =>
      List<String>.from(_m(await _req(ajouter ? 'PUT' : 'DELETE', '/users/me/favoris/$commerceId'))['favoris']);

  // ---------- Commandes et paiement ----------
  @override
  Future<Commande> creerCommande(String commerceId, Map<String, int> lignes) async => Commande.fromJson(_m(await _req('POST', '/orders', corps: {
        'commerceId': commerceId,
        'lignes': lignes.entries.map((e) => {'offreId': e.key, 'quantite': e.value}).toList(),
      })));

  @override
  Future<String> initierPaiement(String commandeId) async => _m(await _req('POST', '/payments/init', corps: {'commandeId': commandeId}))['payUrl'];

  @override
  Future<Commande> simulerPaiement(String commandeId, bool reussi) => throw ApiException('Paiement simulé disponible seulement en mode démo.');

  @override
  Future<Commande> annulerCommande(String commandeId) async => Commande.fromJson(_m(await _req('POST', '/orders/$commandeId/cancel')));

  @override
  Future<Commande> commande(String id) async => Commande.fromJson(_m(await _req('GET', '/orders/$id')));

  @override
  Future<List<Commande>> mesCommandes() async => _l(await _req('GET', '/orders/mine')).map(Commande.fromJson).toList();

  @override
  Future<String> deleguer(String commandeId, String nom) async => _m(await _req('POST', '/orders/$commandeId/deleguer', corps: {'nom': nom}))['lien'];

  @override
  Future<void> annulerDelegation(String commandeId) async => _req('DELETE', '/orders/$commandeId/deleguer');

  @override
  Future<void> donnerAvis(String commandeId, int note, String commentaire) async =>
      _req('POST', '/orders/$commandeId/avis', corps: {'note': note, 'commentaire': commentaire});

  @override
  Future<void> signaler(String commandeId, String motif, String message) async =>
      _req('POST', '/reports', corps: {'commandeId': commandeId, 'motif': motif, 'message': message});

  // ---------- Notifications, stats ----------
  @override
  Future<(int, List<NotificationCs>)> notifications() async {
    final d = _m(await _req('GET', '/notifications'));
    return ((d['nonLues'] as num).toInt(), _l(d['notifications']).map(NotificationCs.fromJson).toList());
  }

  @override
  Future<void> notificationLue(String id) async => _req('PATCH', '/notifications/$id/lu');

  @override
  Future<void> toutLu() async => _req('POST', '/notifications/tout-lu');

  @override
  Future<StatsEtudiant> stats() async => StatsEtudiant.fromJson(_m(await _req('GET', '/stats/student')));
}
