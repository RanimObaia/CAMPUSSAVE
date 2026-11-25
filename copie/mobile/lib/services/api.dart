import '../config.dart';
import '../models/modeles.dart';
import 'api_http.dart';
import 'api_mock.dart';

// Erreur renvoyée par l'API : { code, message } (même format que le web)
class ApiException implements Exception {
  ApiException(this.message, {this.code, this.status});
  final String message;
  final String? code;
  final int? status;
  @override
  String toString() => message;
}

// Tout ce que l'application demande au serveur. Deux versions : démo (en mémoire) et HTTP (vrai backend).
abstract class CampusApi {
  static final CampusApi instance = kUseMock ? ApiMock() : ApiHttp();

  Future<Utilisateur> connexion(String email, String motDePasse);
  Future<Utilisateur> inscription({required String prenom, required String nom, required String email, required String motDePasse, String? etablissement});
  Future<void> deconnexion();
  Future<Utilisateur?> sessionEnregistree();
  Future<Utilisateur> modifierProfil(Map<String, dynamic> data);

  Future<List<Offre>> offres(Filtres f);
  Future<Offre> offre(String id);
  Future<List<Avis>> avisCommerce(String commerceId);

  Future<List<Commerce>> favoris();
  Future<List<String>> basculerFavori(String commerceId, bool ajouter);

  Future<Commande> creerCommande(String commerceId, Map<String, int> lignes);
  // Renvoie le lien de paiement Konnect (en démo : « demo:<id> »)
  Future<String> initierPaiement(String commandeId);
  Future<Commande> simulerPaiement(String commandeId, bool reussi); // démo seulement
  Future<Commande> annulerCommande(String commandeId);
  Future<Commande> commande(String id);
  Future<List<Commande>> mesCommandes();

  Future<String> deleguer(String commandeId, String nom);
  Future<void> annulerDelegation(String commandeId);
  Future<void> donnerAvis(String commandeId, int note, String commentaire);
  Future<void> signaler(String commandeId, String motif, String message);

  Future<(int, List<NotificationCs>)> notifications();
  Future<void> notificationLue(String id);
  Future<void> toutLu();

  Future<StatsEtudiant> stats();
}
