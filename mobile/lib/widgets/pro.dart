// Éléments communs aux espaces commerçant et administrateur (chargement, cartes de chiffres, confirmation).
import 'package:material_ui/material_ui.dart';

import '../theme.dart';
import 'communs.dart';

typedef Json = Map<String, dynamic>;

// Charge des données, affiche un cercle d'attente, l'erreur (avec « Réessayer ») ou le contenu.
// Le builder reçoit une fonction « recharger » à appeler après une action (ex. valider un commerce).
class Chargeur<T> extends StatefulWidget {
  const Chargeur({super.key, required this.charger, required this.builder});
  final Future<T> Function() charger;
  final Widget Function(BuildContext context, T donnees, Future<void> Function() recharger) builder;

  @override
  State<Chargeur<T>> createState() => _ChargeurState<T>();
}

class _ChargeurState<T> extends State<Chargeur<T>> {
  late Future<T> _futur = widget.charger();

  Future<void> _recharger() async {
    final nouveau = widget.charger();
    setState(() => _futur = nouveau);
    try {
      await nouveau;
    } catch (_) {/* l'erreur s'affiche dans le FutureBuilder */}
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
        future: _futur,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  MessageErreur('${snap.error}'),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _recharger, child: const Text('Réessayer')),
                ]),
              ),
            );
          }
          return RefreshIndicator(onRefresh: _recharger, child: widget.builder(context, snap.data as T, _recharger));
        },
      );
}

// Carte « chiffre clé » du tableau de bord
class CarteStat extends StatelessWidget {
  const CarteStat({super.key, required this.libelle, required this.valeur, this.note});
  final String libelle;
  final String valeur;
  final String? note;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(libelle, style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor)),
            const SizedBox(height: 4),
            FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text(valeur, style: styleTitre(context, taille: 26))),
            if (note != null) Text(note!, style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
          ]),
        ),
      );
}

// Grille de 2 colonnes de cartes de chiffres
class GrilleStats extends StatelessWidget {
  const GrilleStats({super.key, required this.cartes});
  final List<CarteStat> cartes;

  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.45,
        children: cartes,
      );
}

Future<bool> confirmer(BuildContext context, String titreBoite, String message, {String action = 'Confirmer'}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (_) => AlertDialog(
      title: Text(titreBoite),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(action)),
      ],
    ),
  );
  return r ?? false;
}

void messageRapide(BuildContext context, String texte, {bool erreur = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(texte), backgroundColor: erreur ? C.harissa : null));
}

// Barre du bas commune (commerçant et admin)
String libelleCategorie(String c) => switch (c) {
      'BOULANGERIE' => 'Boulangerie',
      'PATISSERIE' => 'Pâtisserie',
      'BOISSONS' => 'Boissons',
      'PLATS' => 'Plats',
      _ => c,
    };

String libelleTypeCommerce(String t) => switch (t) {
      'RESTAURANT' => 'Restaurant',
      'CAFETERIA' => 'Cafétéria',
      'BOULANGERIE' => 'Boulangerie',
      'PATISSERIE' => 'Pâtisserie',
      _ => t,
    };

// Pastille de statut d'une offre ou d'un commerce
class PastilleEtat extends StatelessWidget {
  const PastilleEtat(this.statut, {super.key});
  final String statut;
  @override
  Widget build(BuildContext context) {
    final (texte, fond, couleur) = switch (statut) {
      'ACTIVE' => ('En ligne', C.vertPale, C.vert),
      'VALIDE' => ('Validé', C.vertPale, C.vert),
      'EN_ATTENTE' => ('En attente', C.blePale, C.ble),
      'EPUISEE' => ('Épuisée', C.blePale, C.ble),
      'EXPIREE' => ('Expirée', C.sable, C.gris),
      'RETIREE' => ('Retirée', C.harissaPale, C.harissa),
      'REFUSE' => ('Refusé', C.harissaPale, C.harissa),
      _ => (statut, C.sable, C.gris),
    };
    return Pastille(texte, fond: fond, couleur: couleur);
  }
}
