// Mode démo : mêmes données et mêmes règles que le mode démo du site web,
// pour présenter l'application sans serveur.
import '../config.dart';
import '../models/modeles.dart';
import 'api.dart';
import 'format.dart';

class ApiMock implements CampusApi {
  ApiMock() {
    _initialiser();
  }

  Future<T> _attendre<T>(T v) => Future.delayed(const Duration(milliseconds: 250), () => v);
  Never _erreur(String code, String message) => throw ApiException(message, code: code);

  late Utilisateur _moi;
  bool _connecte = false;
  int _seq = 100;
  final _commerces = <String, Map<String, dynamic>>{};
  final _offres = <Map<String, dynamic>>[];
  final _commandes = <Map<String, dynamic>>[];
  final _notifs = <Map<String, dynamic>>[];
  final _avis = <Map<String, dynamic>>[];

  String _h(double heures) => DateTime.now().add(Duration(minutes: (heures * 60).round())).toUtc().toIso8601String();

  void _initialiser() {
    _moi = Utilisateur(id: 'u1', email: 'etudiant@demo.tn', role: 'student', prenom: 'Démo', nom: 'Étudiant', favoris: ['s5'], ecoPoints: 30,
        preferences: {'notifications': {'favoris': true, 'rappels': true, 'commandes': true}});
    for (final c in [
      {'id': 's1', 'nom': 'Boulangerie Le Fournil', 'type': 'BOULANGERIE', 'adresse': 'Rue des Silos, Montfleury, Tunis', 'latitude': 36.791018, 'longitude': 10.1768997, 'noteMoyenne': 4.6, 'nbAvis': 12, 'horairesOuverture': '07:00 - 20:00'},
      {'id': 's4', 'nom': 'Restaurant El Medina', 'type': 'RESTAURANT', 'adresse': '8 rue Sadok Bseis, Montfleury, Tunis', 'latitude': 36.7852353, 'longitude': 10.1758869, 'noteMoyenne': 4.2, 'nbAvis': 7, 'horairesOuverture': '11:00 - 22:00'},
      {'id': 's5', 'nom': 'Pâtisserie Essaada', 'type': 'PATISSERIE', 'adresse': 'Rue des Savants, Montfleury, Tunis', 'latitude': 36.7898581, 'longitude': 10.1728937, 'noteMoyenne': 4.9, 'nbAvis': 21, 'horairesOuverture': '08:00 - 21:00'},
    ]) {
      _commerces[c['id'] as String] = c;
    }
    _offres.addAll([
      {'id': 'o1', 'c': 's1', 'titre': 'Lot de viennoiseries (6 pièces)', 'description': 'Croissants, pains au chocolat et chaussons du matin.', 'categorie': 'BOULANGERIE', 'prixInitial': 12000, 'prixReduit': 4500, 'quantiteDisponible': 4, 'heureDebutRecuperation': _h(1), 'heureFinRecuperation': _h(2), 'statut': 'ACTIVE', 'regimes': ['VEGETARIEN', 'FAIT_MAISON']},
      {'id': 'o3', 'c': 's1', 'titre': 'Assortiment de tartes salées', 'description': '', 'categorie': 'PLATS', 'prixInitial': 10000, 'prixReduit': 5000, 'quantiteDisponible': 6, 'heureDebutRecuperation': _h(3), 'heureFinRecuperation': _h(4), 'statut': 'ACTIVE', 'regimes': ['VEGETARIEN']},
      {'id': 'o10', 'c': 's4', 'titre': 'Couscous au poulet', 'description': 'Portion généreuse, préparée ce midi.', 'categorie': 'PLATS', 'prixInitial': 9000, 'prixReduit': 4000, 'quantiteDisponible': 5, 'heureDebutRecuperation': _h(1), 'heureFinRecuperation': _h(3), 'statut': 'ACTIVE', 'regimes': ['FAIT_MAISON']},
      {'id': 'o11', 'c': 's4', 'titre': 'Sandwich thon-harissa', 'description': '', 'categorie': 'PLATS', 'prixInitial': 5000, 'prixReduit': 2500, 'quantiteDisponible': 8, 'heureDebutRecuperation': _h(0.5), 'heureFinRecuperation': _h(2), 'statut': 'ACTIVE', 'regimes': <String>[]},
      {'id': 'o12', 'c': 's5', 'titre': 'Box makroudh et baklawa', 'description': '6 pièces assorties.', 'categorie': 'PATISSERIE', 'prixInitial': 15000, 'prixReduit': 6000, 'quantiteDisponible': 3, 'heureDebutRecuperation': _h(2), 'heureFinRecuperation': _h(5), 'statut': 'ACTIVE', 'regimes': ['VEGETARIEN', 'FAIT_MAISON']},
      {'id': 'o13', 'c': 's5', 'titre': "Jus d'orange pressé (50 cl)", 'description': '', 'categorie': 'BOISSONS', 'prixInitial': 4000, 'prixReduit': 2000, 'quantiteDisponible': 10, 'heureDebutRecuperation': _h(0.5), 'heureFinRecuperation': _h(4), 'statut': 'ACTIVE', 'regimes': ['VEGAN', 'VEGETARIEN', 'SANS_GLUTEN', 'SANS_LACTOSE']},
    ]);
    _commandes.addAll([
      {'id': 'c90', 'code': 'CS-2031', 'commerceId': 's4', 'commerce': _resume('s4'), 'lignes': [{'offreId': 'o10', 'titre': 'Couscous au poulet', 'quantite': 1, 'prixUnitaire': 4000, 'prixInitial': 9000}], 'montantTotal': 4000, 'statut': 'RECUPEREE', 'avisDonne': true, 'dateCommande': _h(-50), 'paiement': {'statut': 'REUSSI', 'reference': 'KNT-DEMO-CS-2031'}},
      {'id': 'c91', 'code': 'CS-2039', 'commerceId': 's5', 'commerce': _resume('s5'), 'lignes': [{'offreId': 'o12', 'titre': 'Box makroudh et baklawa', 'quantite': 2, 'prixUnitaire': 6000, 'prixInitial': 15000}], 'montantTotal': 12000, 'statut': 'RECUPEREE', 'dateCommande': _h(-26), 'paiement': {'statut': 'REUSSI', 'reference': 'KNT-DEMO-CS-2039'}},
    ]);
    _notifs.addAll([
      {'id': 'n1', 'titre': 'Pâtisserie Essaada a publié une offre', 'corps': 'Box makroudh et baklawa à 6,000 DT. Réserve vite !', 'type': 'OFFRE_FAVORI', 'offreId': 'o12', 'lu': false, 'date': _h(-0.3)},
      {'id': 'n2', 'titre': 'Commande remise ✅', 'corps': "Merci d'avoir sauvé un repas ! Laisse un avis sur le commerce.", 'type': 'COMMANDE_REMISE', 'commandeId': 'c91', 'lu': true, 'date': _h(-25)},
    ]);
    _avis.addAll([
      {'commerceId': 's4', 'prenomEtudiant': 'Démo', 'note': 4, 'commentaire': 'Couscous copieux et encore chaud.', 'date': _h(-48)},
      {'commerceId': 's5', 'prenomEtudiant': 'Yasmine', 'note': 5, 'commentaire': 'Les baklawas étaient parfaites, merci !', 'date': _h(-70)},
      {'commerceId': 's1', 'prenomEtudiant': 'Omar', 'note': 5, 'commentaire': 'Viennoiseries du matin, toujours bonnes le soir.', 'date': _h(-30)},
    ]);
  }

  Map<String, dynamic> _resume(String id) => {..._commerces[id]!};

  Map<String, dynamic> _avecCommerce(Map<String, dynamic> o) {
    final c = _commerces[o['c']]!;
    return {...o, 'commerce': c, 'distanceKm': distanceKm(kEssectLat, kEssectLng, c['latitude'], c['longitude'])};
  }

  void _notifier(String titre, String corps, String type, {String? commandeId}) {
    _notifs.insert(0, {'id': 'n${++_seq}', 'titre': titre, 'corps': corps, 'type': type, 'commandeId': commandeId, 'lu': false, 'date': DateTime.now().toUtc().toIso8601String()});
  }

  void _stock(List lignes, int signe) {
    for (final l in lignes) {
      final o = _offres.firstWhere((x) => x['id'] == l['offreId'], orElse: () => {});
      if (o.isEmpty) continue;
      o['quantiteDisponible'] = (o['quantiteDisponible'] as int) + signe * (l['quantite'] as int);
      o['statut'] = (o['quantiteDisponible'] as int) > 0 ? 'ACTIVE' : 'EPUISEE';
    }
  }

  // ---------- Compte ----------
  @override
  Future<Utilisateur> connexion(String email, String motDePasse) async {
    if (!email.contains('@')) _erreur('IDENTIFIANTS', 'Adresse e-mail invalide.');
    _moi = Utilisateur(id: _moi.id, email: email.trim().toLowerCase(), role: 'student', prenom: _moi.prenom, nom: _moi.nom, favoris: _moi.favoris, preferences: _moi.preferences, ecoPoints: _moi.ecoPoints);
    _connecte = true;
    return _attendre(_moi);
  }

  @override
  Future<Utilisateur> inscription({required String prenom, required String nom, required String email, required String motDePasse, String? etablissement}) async {
    _moi = Utilisateur(id: 'u${++_seq}', email: email.trim().toLowerCase(), role: 'student', prenom: prenom, nom: nom, preferences: {'notifications': {'favoris': true, 'rappels': true, 'commandes': true}});
    _connecte = true;
    return _attendre(_moi);
  }

  @override
  Future<void> deconnexion() async => _connecte = false;

  @override
  Future<Utilisateur?> sessionEnregistree() async => _connecte ? _moi : null;

  @override
  Future<Utilisateur> modifierProfil(Map<String, dynamic> data) async {
    _moi.prenom = data['prenom'] ?? _moi.prenom;
    _moi.nom = data['nom'] ?? _moi.nom;
    if (data['preferences'] is Map) _moi.preferences = {..._moi.preferences, ...Map<String, dynamic>.from(data['preferences'])};
    return _attendre(_moi);
  }

  // ---------- Offres ----------
  @override
  Future<List<Offre>> offres(Filtres f) async {
    final q = f.q.trim().toLowerCase();
    final maintenant = DateTime.now();
    var liste = _offres.map(_avecCommerce).where((o) {
      final fin = DateTime.parse(o['heureFinRecuperation']);
      final debut = DateTime.parse(o['heureDebutRecuperation']);
      final c = o['commerce'] as Map;
      return o['statut'] == 'ACTIVE' && (o['quantiteDisponible'] as int) > 0 && fin.isAfter(maintenant) &&
          (q.isEmpty || '${o['titre']} ${o['description']} ${c['nom']}'.toLowerCase().contains(q)) &&
          (f.categorie.isEmpty || o['categorie'] == f.categorie) &&
          (f.prixMax == null || (o['prixReduit'] as int) <= f.prixMax!) &&
          (f.regime.isEmpty || (o['regimes'] as List).contains(f.regime)) &&
          (f.distanceMax == null || ((o['distanceKm'] as double?) ?? 99) <= f.distanceMax!) &&
          (f.creneau.isEmpty ||
              (f.creneau == 'maintenant' && debut.isBefore(maintenant.add(const Duration(hours: 1)))) ||
              (f.creneau == 'midi' && debut.toLocal().hour >= 11 && debut.toLocal().hour < 15) ||
              (f.creneau == 'soir' && debut.toLocal().hour >= 17));
    }).map(Offre.fromJson).toList();
    final tris = <String, int Function(Offre, Offre)>{
      'distance': (a, b) => (a.distanceKm ?? 99).compareTo(b.distanceKm ?? 99),
      'prix': (a, b) => a.prixReduit.compareTo(b.prixReduit),
      'note': (a, b) => (b.commerce?.noteMoyenne ?? 0).compareTo(a.commerce?.noteMoyenne ?? 0),
      'remise': (a, b) => reduction(b.prixInitial, b.prixReduit).compareTo(reduction(a.prixInitial, a.prixReduit)),
    };
    liste.sort(tris[f.tri] ?? (a, b) => (a.fin ?? maintenant).compareTo(b.fin ?? maintenant));
    return _attendre(liste);
  }

  @override
  Future<Offre> offre(String id) async {
    final o = _offres.firstWhere((x) => x['id'] == id, orElse: () => _erreur('OFFRE_INTROUVABLE', 'Cette offre est introuvable.'));
    return _attendre(Offre.fromJson(_avecCommerce(o)));
  }

  @override
  Future<List<Avis>> avisCommerce(String commerceId) async =>
      _attendre(_avis.where((a) => a['commerceId'] == commerceId).map(Avis.fromJson).toList());

  // ---------- Favoris ----------
  @override
  Future<List<Commerce>> favoris() async {
    final dispo = await offres(Filtres());
    return _attendre(_moi.favoris.where(_commerces.containsKey).map((id) =>
        Commerce.fromJson({..._commerces[id]!, 'offresDisponibles': dispo.where((o) => o.commerce?.id == id).length})).toList());
  }

  @override
  Future<List<String>> basculerFavori(String commerceId, bool ajouter) async {
    final s = {..._moi.favoris};
    ajouter ? s.add(commerceId) : s.remove(commerceId);
    _moi.favoris = s.toList();
    return _attendre(_moi.favoris);
  }

  // ---------- Commandes et paiement ----------
  @override
  Future<Commande> creerCommande(String commerceId, Map<String, int> lignes) async {
    final detail = <Map<String, dynamic>>[];
    for (final e in lignes.entries) {
      final o = _offres.firstWhere((x) => x['id'] == e.key, orElse: () => _erreur('OFFRE_INTROUVABLE', 'Une offre du panier est introuvable.'));
      if (o['statut'] != 'ACTIVE' || e.value > (o['quantiteDisponible'] as int)) {
        _erreur('STOCK_INSUFFISANT', 'Stock insuffisant pour « ${o['titre']} » : il en reste ${o['quantiteDisponible']}.');
      }
      detail.add({'offreId': o['id'], 'titre': o['titre'], 'quantite': e.value, 'prixUnitaire': o['prixReduit'], 'prixInitial': o['prixInitial'], 'debut': o['heureDebutRecuperation'], 'fin': o['heureFinRecuperation']});
    }
    final id = 'c${++_seq}';
    final c = {
      'id': id, 'code': 'CS-${2000 + _seq}', 'commerceId': commerceId, 'commerce': _resume(commerceId),
      'lignes': detail, 'montantTotal': detail.fold<int>(0, (s, l) => s + (l['prixUnitaire'] as int) * (l['quantite'] as int)),
      'heureDebutRecuperation': (detail.map((l) => l['debut'] as String).toList()..sort()).first,
      'heureFinRecuperation': (detail.map((l) => l['fin'] as String).toList()..sort()).last,
      'statut': 'EN_ATTENTE_PAIEMENT', 'dateCommande': DateTime.now().toUtc().toIso8601String(), 'emailEtudiant': _moi.email,
    };
    _stock(detail, -1);
    _commandes.insert(0, c);
    return _attendre(Commande.fromJson(c));
  }

  Map<String, dynamic> _cmd(String id) => _commandes.firstWhere((c) => c['id'] == id, orElse: () => _erreur('COMMANDE_INTROUVABLE', 'Commande introuvable.'));

  @override
  Future<String> initierPaiement(String commandeId) async {
    final c = _cmd(commandeId);
    c['paiement'] = {'statut': 'INITIE', 'reference': 'KNT-DEMO-${c['code']}'};
    return _attendre('demo:$commandeId');
  }

  @override
  Future<Commande> simulerPaiement(String commandeId, bool reussi) async {
    final c = _cmd(commandeId);
    if (c['statut'] != 'EN_ATTENTE_PAIEMENT') return _attendre(Commande.fromJson(c));
    if (reussi) {
      c['statut'] = 'PAYEE';
      c['paiement'] = {...c['paiement'] as Map, 'statut': 'REUSSI', 'datePaiement': DateTime.now().toUtc().toIso8601String()};
      c['emailEnvoye'] = true;
      _notifier('Paiement confirmé ✓', 'Commande ${c['code']} payée. Ton QR code est prêt.', 'PAIEMENT_REUSSI', commandeId: commandeId);
    } else {
      c['statut'] = 'ANNULEE';
      c['motifAnnulation'] = 'PAIEMENT_REFUSE';
      c['paiement'] = {...c['paiement'] as Map, 'statut': 'ECHOUE'};
      c['emailEchecEnvoye'] = true;
      _stock(c['lignes'] as List, 1);
      _notifier('Paiement non abouti', "La commande ${c['code']} est annulée, aucun montant n'a été débité.", 'PAIEMENT_ECHOUE', commandeId: commandeId);
    }
    return _attendre(Commande.fromJson(c));
  }

  @override
  Future<Commande> annulerCommande(String commandeId) => simulerPaiement(commandeId, false);

  @override
  Future<Commande> commande(String id) async => _attendre(Commande.fromJson(_cmd(id)));

  @override
  Future<List<Commande>> mesCommandes() async => _attendre(_commandes.map(Commande.fromJson).toList());

  @override
  Future<String> deleguer(String commandeId, String nom) async {
    final c = _cmd(commandeId);
    if (!['PAYEE', 'PRETE'].contains(c['statut'])) _erreur('DELEGATION_IMPOSSIBLE', 'Seule une commande payée peut être confiée à un ami.');
    final token = (c['delegation'] as Map?)?['token'] ?? 'demo${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}';
    c['delegation'] = {'token': token, 'nom': nom};
    return _attendre('$kWebUrl/retrait/$token');
  }

  @override
  Future<void> annulerDelegation(String commandeId) async => _cmd(commandeId).remove('delegation');

  @override
  Future<void> donnerAvis(String commandeId, int note, String commentaire) async {
    final c = _cmd(commandeId);
    if (c['statut'] != 'RECUPEREE') _erreur('AVIS_TROP_TOT', 'Tu pourras noter le commerce après avoir récupéré ta commande.');
    if (c['avisDonne'] == true) _erreur('AVIS_DEJA_DONNE', 'Tu as déjà noté cette commande.');
    c['avisDonne'] = true;
    _avis.insert(0, {'commerceId': c['commerceId'], 'prenomEtudiant': _moi.prenom, 'note': note, 'commentaire': commentaire, 'date': DateTime.now().toUtc().toIso8601String()});
    await _attendre(null);
  }

  @override
  Future<void> signaler(String commandeId, String motif, String message) async {
    if (message.trim().length < 10) _erreur('VALIDATION', 'Décris le problème (10 caractères au moins).');
    await _attendre(null);
  }

  // ---------- Notifications, stats ----------
  @override
  Future<(int, List<NotificationCs>)> notifications() async {
    final l = _notifs.map(NotificationCs.fromJson).toList();
    return _attendre((l.where((n) => !n.lu).length, l));
  }

  @override
  Future<void> notificationLue(String id) async => _notifs.firstWhere((n) => n['id'] == id, orElse: () => {})['lu'] = true;

  @override
  Future<void> toutLu() async {
    for (final n in _notifs) {
      n['lu'] = true;
    }
  }

  @override
  Future<StatsEtudiant> stats() async {
    final payees = _commandes.where((c) => ['PAYEE', 'PRETE', 'RECUPEREE'].contains(c['statut']));
    final lignes = payees.expand((c) => c['lignes'] as List);
    final repas = lignes.fold<int>(0, (n, l) => n + (l['quantite'] as int));
    const niveaux = [(0, 'Graine'), (3, 'Pousse'), (10, 'Arbre'), (25, 'Forêt')];
    final i = niveaux.lastIndexWhere((n) => repas >= n.$1);
    final suivant = i + 1 < niveaux.length ? niveaux[i + 1] : null;
    return _attendre(StatsEtudiant(
      commandes: payees.length,
      depenses: payees.fold<int>(0, (s, c) => s + (c['montantTotal'] as int)),
      economies: lignes.fold<int>(0, (s, l) => s + ((l['prixInitial'] as int) - (l['prixUnitaire'] as int)) * (l['quantite'] as int)),
      repasSauves: repas,
      kgSauves: (repas * 0.4 * 10).round() / 10,
      co2Evite: repas * 2.5,
      ecoPoints: _moi.ecoPoints,
      niveau: niveaux[i].$2,
      repasPourSuivant: suivant == null ? 0 : suivant.$1 - repas,
      suivant: suivant?.$2,
    ));
  }
}
