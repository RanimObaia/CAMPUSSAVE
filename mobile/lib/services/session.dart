import 'package:material_ui/material_ui.dart';

import '../models/modeles.dart';
import 'api.dart';

// État partagé de l'application : utilisateur connecté, panier, favoris, thème, notifications non lues.
class Session extends ChangeNotifier {
  final api = CampusApi.instance;
  Utilisateur? utilisateur;
  bool demarre = false;
  ThemeMode theme = ThemeMode.system;
  int nonLues = 0;

  // Panier : une commande = un seul commerce (règle du diagramme de classes)
  final Map<String, (Offre, int)> panier = {};
  Commerce? get commercePanier => panier.isEmpty ? null : panier.values.first.$1.commerce;
  int get nbArticles => panier.values.fold(0, (n, l) => n + l.$2);
  int get total => panier.values.fold(0, (s, l) => s + l.$1.prixReduit * l.$2);
  int get economie => panier.values.fold(0, (s, l) => s + (l.$1.prixInitial - l.$1.prixReduit) * l.$2);

  Future<void> demarrer() async {
    utilisateur = await api.sessionEnregistree();
    demarre = true;
    notifyListeners();
    if (utilisateur != null) rafraichirNotifications();
  }

  Future<void> connexion(String email, String mdp) async {
    utilisateur = await api.connexion(email, mdp);
    notifyListeners();
    rafraichirNotifications();
  }

  Future<void> inscription({required String prenom, required String nom, required String email, required String mdp, String? etablissement}) async {
    utilisateur = await api.inscription(prenom: prenom, nom: nom, email: email, motDePasse: mdp, etablissement: etablissement);
    notifyListeners();
  }

  Future<void> deconnexion() async {
    await api.deconnexion();
    utilisateur = null;
    panier.clear();
    notifyListeners();
  }

  void changerTheme(ThemeMode m) {
    theme = m;
    notifyListeners();
  }

  // ---------- Panier ----------
  bool autreCommerce(Offre o) => commercePanier != null && commercePanier!.id != o.commerce?.id;
  int quantiteDe(String offreId) => panier[offreId]?.$2 ?? 0;

  void ajouter(Offre o, int q) {
    if (autreCommerce(o)) panier.clear();
    final avant = quantiteDe(o.id);
    panier[o.id] = (o, (avant + q).clamp(1, o.quantiteDisponible));
    notifyListeners();
  }

  void changerQuantite(String offreId, int q) {
    final l = panier[offreId];
    if (l == null) return;
    if (q <= 0) {
      panier.remove(offreId);
    } else {
      panier[offreId] = (l.$1, q.clamp(1, l.$1.quantiteDisponible));
    }
    notifyListeners();
  }

  void viderPanier() {
    panier.clear();
    notifyListeners();
  }

  // ---------- Favoris ----------
  bool estFavori(String? commerceId) => commerceId != null && (utilisateur?.favoris.contains(commerceId) ?? false);

  Future<void> basculerFavori(String commerceId) async {
    final u = utilisateur;
    if (u == null) return;
    final ajouter = !u.favoris.contains(commerceId);
    u.favoris = ajouter ? [...u.favoris, commerceId] : u.favoris.where((x) => x != commerceId).toList();
    notifyListeners();
    try {
      u.favoris = await api.basculerFavori(commerceId, ajouter);
    } catch (_) {
      u.favoris = ajouter ? u.favoris.where((x) => x != commerceId).toList() : [...u.favoris, commerceId];
    }
    notifyListeners();
  }

  Future<void> rafraichirNotifications() async {
    try {
      final (n, _) = await api.notifications();
      nonLues = n;
      notifyListeners();
    } catch (_) {}
  }
}
