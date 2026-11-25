// Appels de l'espace commerçant et de l'espace administrateur.
// Deux versions comme pour l'étudiant : HTTP (vrai backend, même jeton que l'étudiant) et démo (en mémoire).
import '../config.dart';
import '../widgets/pro.dart';
import 'api.dart';
import 'api_http.dart';

abstract class ApiPro {
  static final ApiPro instance = kUseMock ? ApiProMock() : ApiProHttp();

  // ---------- Commerçant ----------
  Future<Json> validerRetrait(String code); // POST /orders/validate-qr
  Future<List<Json>> commandes(); // GET /orders
  Future<void> marquerPrete(String id); // PATCH /orders/:id/ready
  Future<List<Json>> mesOffres(); // GET /offers?mine=true
  Future<void> creerOffre(Json data); // POST /offers
  Future<void> modifierOffre(String id, Json data); // PUT /offers/:id
  Future<void> retirerOffre(String id); // DELETE /offers/:id
  Future<Json> statsCommercant(); // GET /stats/merchant

  // ---------- Administrateur ----------
  Future<List<Json>> commerces(String statut); // GET /admin/shops?statut=
  Future<void> decider(String id, String decision); // PATCH /admin/shops/:id/validate
  Future<Json> statsAdmin(); // GET /stats/admin
}

// ===================== Vrai backend =====================
class ApiProHttp implements ApiPro {
  ApiHttp get _h => CampusApi.instance as ApiHttp;

  Json _m(dynamic v) => Map<String, dynamic>.from(v as Map);
  List<Json> _l(dynamic v) => (v as List).map(_m).toList();

  @override
  Future<Json> validerRetrait(String code) async => _m(await _h.requete('POST', '/orders/validate-qr', corps: {'code': code.trim().toUpperCase()}));

  @override
  Future<List<Json>> commandes() async => _l(await _h.requete('GET', '/orders'));

  @override
  Future<void> marquerPrete(String id) async => _h.requete('PATCH', '/orders/$id/ready');

  @override
  Future<List<Json>> mesOffres() async => _l(await _h.requete('GET', '/offers', params: {'mine': 'true'}));

  @override
  Future<void> creerOffre(Json data) async => _h.requete('POST', '/offers', corps: data);

  @override
  Future<void> modifierOffre(String id, Json data) async => _h.requete('PUT', '/offers/$id', corps: data);

  @override
  Future<void> retirerOffre(String id) async => _h.requete('DELETE', '/offers/$id');

  @override
  Future<Json> statsCommercant() async => _m(await _h.requete('GET', '/stats/merchant'));

  @override
  Future<List<Json>> commerces(String statut) async =>
      _l(await _h.requete('GET', '/admin/shops', params: statut.isEmpty ? null : {'statut': statut}));

  @override
  Future<void> decider(String id, String decision) async => _h.requete('PATCH', '/admin/shops/$id/validate', corps: {'decision': decision});

  @override
  Future<Json> statsAdmin() async => _m(await _h.requete('GET', '/stats/admin'));
}

// ===================== Mode démo (sans serveur) =====================
class ApiProMock implements ApiPro {
  Future<T> _attendre<T>(T v) => Future.delayed(const Duration(milliseconds: 250), () => v);
  Never _erreur(String code, String message) => throw ApiException(message, code: code);

  int _seq = 10;
  static String _iso(Duration d) => DateTime.now().add(d).toUtc().toIso8601String();

  final List<Json> _commandes = [
    {'id': 'c1', 'code': 'CS-2048', 'statut': 'PAYEE', 'montantTotal': 7500, 'dateCommande': DateTime.now().subtract(const Duration(minutes: 40)).toUtc().toIso8601String(), 'lignes': [{'titre': 'Panier du soir', 'quantite': 2}]},
    {'id': 'c2', 'code': 'CS-2047', 'statut': 'RECUPEREE', 'montantTotal': 3500, 'dateCommande': DateTime.now().subtract(const Duration(hours: 5)).toUtc().toIso8601String(), 'lignes': [{'titre': 'Viennoiseries', 'quantite': 1}]},
    {'id': 'c3', 'code': 'CS-2049', 'statut': 'PRETE', 'montantTotal': 4000, 'dateCommande': DateTime.now().subtract(const Duration(minutes: 15)).toUtc().toIso8601String(), 'lignes': [{'titre': 'Plat du jour', 'quantite': 1}]},
  ];

  final List<Json> _offres = [
    {'id': 'o1', 'titre': 'Panier du soir', 'description': 'Plats du jour invendus', 'categorie': 'PLATS', 'prixInitial': 9000, 'prixReduit': 4500, 'quantiteDisponible': 5, 'statut': 'ACTIVE', 'regimes': <String>[], 'recurrente': false},
    {'id': 'o2', 'titre': 'Viennoiseries', 'description': '', 'categorie': 'BOULANGERIE', 'prixInitial': 6000, 'prixReduit': 3000, 'quantiteDisponible': 0, 'statut': 'EPUISEE', 'regimes': <String>['VEGETARIEN'], 'recurrente': true},
  ];

  final List<Json> _commerces = [
    {'id': 's10', 'nom': 'Chez Salma', 'type': 'RESTAURANT', 'adresse': 'Rue de la Liberté, Tunis', 'statutValidation': 'EN_ATTENTE'},
    {'id': 's11', 'nom': 'Pâtisserie Amel', 'type': 'PATISSERIE', 'adresse': 'Avenue Habib Bourguiba, Tunis', 'statutValidation': 'EN_ATTENTE'},
    {'id': 's1', 'nom': 'Boulangerie Dar El Khobz', 'type': 'BOULANGERIE', 'adresse': 'Montfleury, Tunis', 'statutValidation': 'VALIDE'},
  ];

  @override
  Future<Json> validerRetrait(String code) async {
    final c = _commandes.where((x) => x['code'] == code.trim().toUpperCase()).firstOrNull;
    if (c == null) _erreur('QR_INVALIDE', 'Code inconnu : vérifiez le code affiché sous le QR code.');
    if (c['statut'] == 'RECUPEREE') _erreur('QR_DEJA_UTILISE', 'Ce code a déjà été utilisé.');
    if (c['statut'] != 'PAYEE' && c['statut'] != 'PRETE') _erreur('QR_INVALIDE', "Cette commande n'est pas payée.");
    c['statut'] = 'RECUPEREE';
    return _attendre(Map<String, dynamic>.from(c));
  }

  @override
  Future<List<Json>> commandes() => _attendre(_commandes.map((c) => Map<String, dynamic>.from(c)).toList());

  @override
  Future<void> marquerPrete(String id) async {
    final c = _commandes.firstWhere((x) => x['id'] == id);
    if (c['statut'] == 'PAYEE') c['statut'] = 'PRETE';
    await _attendre(null);
  }

  @override
  Future<List<Json>> mesOffres() => _attendre(_offres.map((o) => {...o, 'heureDebutRecuperation': _iso(const Duration(hours: 1)), 'heureFinRecuperation': _iso(const Duration(hours: 3))}).toList());

  @override
  Future<void> creerOffre(Json data) async {
    _offres.insert(0, {'id': 'o${++_seq}', 'statut': 'ACTIVE', ...data});
    await _attendre(null);
  }

  @override
  Future<void> modifierOffre(String id, Json data) async {
    final o = _offres.firstWhere((x) => x['id'] == id);
    o.addAll(data);
    await _attendre(null);
  }

  @override
  Future<void> retirerOffre(String id) async {
    _offres.firstWhere((x) => x['id'] == id)['statut'] = 'RETIREE';
    await _attendre(null);
  }

  @override
  Future<Json> statsCommercant() => _attendre({
        'offresActives': _offres.where((o) => o['statut'] == 'ACTIVE').length,
        'commandesDuJour': _commandes.where((c) => c['statut'] != 'ANNULEE').length,
        'chiffreAffaires': _commandes.fold<int>(0, (s, c) => s + (c['montantTotal'] as int)),
        'repasSauves': 14,
        'kgSauves': 5.6,
      });

  @override
  Future<List<Json>> commerces(String statut) =>
      _attendre(_commerces.where((c) => statut.isEmpty || c['statutValidation'] == statut).map((c) => Map<String, dynamic>.from(c)).toList());

  @override
  Future<void> decider(String id, String decision) async {
    _commerces.firstWhere((c) => c['id'] == id)['statutValidation'] = decision;
    await _attendre(null);
  }

  @override
  Future<Json> statsAdmin() => _attendre({
        'utilisateurs': 38,
        'commercesValides': _commerces.where((c) => c['statutValidation'] == 'VALIDE').length,
        'commercesEnAttente': _commerces.where((c) => c['statutValidation'] == 'EN_ATTENTE').length,
        'commandes': 52,
        'paiements': 52,
        'volume': 312500,
        'repasSauves': 74,
      });
}
