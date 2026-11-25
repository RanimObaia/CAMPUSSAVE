// Modèles : mêmes noms de champs que l'API (et que le diagramme de classes).
DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
double? _double(dynamic v) => v == null ? null : (v as num).toDouble();
int _int(dynamic v) => v == null ? 0 : (v as num).toInt();

class Utilisateur {
  Utilisateur({required this.id, required this.email, required this.role, this.prenom = '', this.nom = '', this.favoris = const [], this.preferences = const {}, this.ecoPoints = 0});
  final String id;
  final String email;
  final String role;
  String prenom;
  String nom;
  List<String> favoris;
  Map<String, dynamic> preferences;
  int ecoPoints;

  factory Utilisateur.fromJson(Map<String, dynamic> j) => Utilisateur(
        id: j['id'].toString(),
        email: j['email'] ?? '',
        role: j['role'] ?? 'student',
        prenom: j['prenom'] ?? '',
        nom: j['nom'] ?? '',
        favoris: List<String>.from(j['favoris'] ?? const []),
        preferences: Map<String, dynamic>.from(j['preferences'] ?? const {}),
        ecoPoints: _int(j['ecoPoints']),
      );

  bool notif(String cle) => (preferences['notifications'] as Map?)?[cle] != false;
}

class Commerce {
  Commerce({required this.id, required this.nom, this.type = '', this.adresse = '', this.latitude, this.longitude, this.noteMoyenne, this.nbAvis = 0, this.horaires, this.offresDisponibles = 0});
  final String id;
  final String nom;
  final String type;
  final String adresse;
  final double? latitude;
  final double? longitude;
  final double? noteMoyenne;
  final int nbAvis;
  final String? horaires;
  final int offresDisponibles;

  factory Commerce.fromJson(Map<String, dynamic> j) => Commerce(
        id: j['id'].toString(),
        nom: j['nom'] ?? '',
        type: j['type'] ?? '',
        adresse: j['adresse'] ?? '',
        latitude: _double(j['latitude']),
        longitude: _double(j['longitude']),
        noteMoyenne: _double(j['noteMoyenne']),
        nbAvis: _int(j['nbAvis']),
        horaires: j['horairesOuverture'],
        offresDisponibles: _int(j['offresDisponibles']),
      );
}

class Offre {
  Offre({required this.id, required this.titre, required this.categorie, required this.prixInitial, required this.prixReduit, required this.quantiteDisponible, required this.debut, required this.fin, required this.statut, this.description = '', this.commerce, this.regimes = const [], this.distanceKm, this.photoUrl});
  final String id;
  final String titre;
  final String description;
  final String categorie;
  final int prixInitial;
  final int prixReduit;
  int quantiteDisponible;
  final DateTime? debut;
  final DateTime? fin;
  String statut;
  final Commerce? commerce;
  final List<String> regimes;
  final double? distanceKm;
  final String? photoUrl;

  factory Offre.fromJson(Map<String, dynamic> j) => Offre(
        id: j['id'].toString(),
        titre: j['titre'] ?? '',
        description: j['description'] ?? '',
        categorie: j['categorie'] ?? 'PLATS',
        prixInitial: _int(j['prixInitial']),
        prixReduit: _int(j['prixReduit']),
        quantiteDisponible: _int(j['quantiteDisponible']),
        debut: _date(j['heureDebutRecuperation']),
        fin: _date(j['heureFinRecuperation']),
        statut: j['statut'] ?? 'ACTIVE',
        commerce: j['commerce'] is Map ? Commerce.fromJson(Map<String, dynamic>.from(j['commerce'])) : null,
        regimes: List<String>.from(j['regimes'] ?? const []),
        distanceKm: _double(j['distanceKm']),
        photoUrl: j['photoUrl'],
      );
}

class Ligne {
  Ligne({required this.offreId, required this.titre, required this.quantite, required this.prixUnitaire, this.prixInitial});
  final String offreId;
  final String titre;
  final int quantite;
  final int prixUnitaire;
  final int? prixInitial;

  factory Ligne.fromJson(Map<String, dynamic> j) => Ligne(
        offreId: (j['offreId'] ?? '').toString(),
        titre: j['titre'] ?? '',
        quantite: _int(j['quantite']),
        prixUnitaire: _int(j['prixUnitaire']),
        prixInitial: j['prixInitial'] == null ? null : _int(j['prixInitial']),
      );
}

class Commande {
  Commande({required this.id, required this.code, required this.statut, required this.lignes, required this.montantTotal, this.commerce, this.debut, this.fin, this.dateCommande, this.paiementStatut, this.paiementReference, this.emailEnvoye = false, this.emailEchecEnvoye = false, this.emailEtudiant, this.avisDonne = false, this.delegationToken, this.motifAnnulation});
  final String id;
  final String code;
  String statut;
  final List<Ligne> lignes;
  final int montantTotal;
  final Commerce? commerce;
  final DateTime? debut;
  final DateTime? fin;
  final DateTime? dateCommande;
  String? paiementStatut;
  String? paiementReference;
  bool emailEnvoye;
  bool emailEchecEnvoye;
  String? emailEtudiant;
  bool avisDonne;
  String? delegationToken;
  String? motifAnnulation;

  bool get aRetirer => statut == 'PAYEE' || statut == 'PRETE';
  int get nbArticles => lignes.fold(0, (n, l) => n + l.quantite);

  factory Commande.fromJson(Map<String, dynamic> j) {
    final p = j['paiement'] is Map ? Map<String, dynamic>.from(j['paiement']) : null;
    return Commande(
      id: j['id'].toString(),
      code: j['code'] ?? '',
      statut: j['statut'] ?? '',
      lignes: (j['lignes'] as List? ?? []).map((l) => Ligne.fromJson(Map<String, dynamic>.from(l))).toList(),
      montantTotal: _int(j['montantTotal']),
      commerce: j['commerce'] is Map ? Commerce.fromJson({'id': '', ...Map<String, dynamic>.from(j['commerce'])}) : null,
      debut: _date(j['heureDebutRecuperation']),
      fin: _date(j['heureFinRecuperation']),
      dateCommande: _date(j['dateCommande']),
      paiementStatut: p?['statut'],
      paiementReference: p?['reference'],
      emailEnvoye: j['emailEnvoye'] == true,
      emailEchecEnvoye: j['emailEchecEnvoye'] == true,
      emailEtudiant: j['emailEtudiant'],
      avisDonne: j['avisDonne'] == true,
      delegationToken: (j['delegation'] as Map?)?['token'],
      motifAnnulation: j['motifAnnulation'],
    );
  }
}

class NotificationCs {
  NotificationCs({required this.id, required this.titre, required this.corps, required this.type, this.lu = false, this.date, this.commandeId, this.offreId});
  final String id;
  final String titre;
  final String corps;
  final String type;
  bool lu;
  final DateTime? date;
  final String? commandeId;
  final String? offreId;

  factory NotificationCs.fromJson(Map<String, dynamic> j) => NotificationCs(
        id: j['id'].toString(),
        titre: j['titre'] ?? '',
        corps: j['corps'] ?? '',
        type: j['type'] ?? 'INFO',
        lu: j['lu'] == true,
        date: _date(j['date']),
        commandeId: j['commandeId'],
        offreId: j['offreId'],
      );
}

class Avis {
  Avis({required this.prenom, required this.note, this.commentaire = '', this.date});
  final String prenom;
  final int note;
  final String commentaire;
  final DateTime? date;
  factory Avis.fromJson(Map<String, dynamic> j) =>
      Avis(prenom: j['prenomEtudiant'] ?? 'Étudiant', note: _int(j['note']), commentaire: j['commentaire'] ?? '', date: _date(j['date']));
}

class StatsEtudiant {
  StatsEtudiant({this.commandes = 0, this.depenses = 0, this.economies = 0, this.repasSauves = 0, this.kgSauves = 0, this.co2Evite = 0, this.ecoPoints = 0, this.niveau = 'Graine', this.repasPourSuivant = 0, this.suivant});
  final int commandes;
  final int depenses;
  final int economies;
  final int repasSauves;
  final double kgSauves;
  final double co2Evite;
  final int ecoPoints;
  final String niveau;
  final int repasPourSuivant;
  final String? suivant;

  factory StatsEtudiant.fromJson(Map<String, dynamic> j) {
    final n = Map<String, dynamic>.from(j['niveau'] ?? const {});
    return StatsEtudiant(
      commandes: _int(j['commandes']),
      depenses: _int(j['depenses']),
      economies: _int(j['economies']),
      repasSauves: _int(j['repasSauves']),
      kgSauves: _double(j['kgSauves']) ?? 0,
      co2Evite: _double(j['co2Evite']) ?? 0,
      ecoPoints: _int(j['ecoPoints']),
      niveau: n['nom'] ?? 'Graine',
      repasPourSuivant: _int(n['repasPourSuivant']),
      suivant: n['suivant'],
    );
  }
}

// Filtres de recherche des offres (mêmes paramètres que GET /api/offers)
class Filtres {
  String q = '';
  String categorie = '';
  String tri = '';
  int? prixMax;
  double? distanceMax;
  String creneau = '';
  String regime = '';

  int get nbActifs => [prixMax != null, distanceMax != null, creneau.isNotEmpty, regime.isNotEmpty].where((x) => x).length;

  Map<String, String> versParams() => {
        if (q.isNotEmpty) 'q': q,
        if (categorie.isNotEmpty) 'categorie': categorie,
        if (tri.isNotEmpty) 'tri': tri,
        if (prixMax != null) 'prixMax': '$prixMax',
        if (distanceMax != null) 'distanceMax': '$distanceMax',
        if (creneau.isNotEmpty) 'creneau': creneau,
        if (regime.isNotEmpty) 'regime': regime,
      };
}
