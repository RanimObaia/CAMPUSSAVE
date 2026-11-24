import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';

// Vignette « cloche » (arche) colorée selon la catégorie, avec la remise
class Cloche extends StatelessWidget {
  const Cloche({super.key, required this.categorie, this.remise, this.photoUrl, this.largeur = 76, this.hauteur = 88});
  final String categorie;
  final String? photoUrl;
  final int? remise;
  final double largeur;
  final double hauteur;

  static const _icones = {'BOULANGERIE': Icons.bakery_dining_outlined, 'PATISSERIE': Icons.cake_outlined, 'BOISSONS': Icons.local_drink_outlined};

  @override
  Widget build(BuildContext context) {
    return Container(
      width: largeur,
      height: hauteur,
      decoration: BoxDecoration(
        color: C.categorie(categorie),
        borderRadius: BorderRadius.only(topLeft: Radius.circular(largeur / 2), topRight: Radius.circular(largeur / 2), bottomLeft: const Radius.circular(12), bottomRight: const Radius.circular(12)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(alignment: Alignment.center, fit: StackFit.expand, children: [
        if (photoUrl != null)
          (photoUrl!.startsWith('assets/')
              ? Image.asset(photoUrl!, fit: BoxFit.cover)
              : Image.network(photoUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox()))
        else
          Icon(_icones[categorie] ?? Icons.ramen_dining_outlined, color: C.creme, size: largeur * 0.4),
        if (remise != null)
          Positioned(
            bottom: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
              decoration: BoxDecoration(color: C.papier, borderRadius: BorderRadius.circular(99)),
              child: Text('−$remise %', style: const TextStyle(color: C.harissa, fontWeight: FontWeight.w800, fontSize: 11)),
            ),
          ),
      ]),
    );
  }
}

class Note extends StatelessWidget {
  const Note({super.key, this.valeur, this.nb});
  final double? valeur;
  final int? nb;
  @override
  Widget build(BuildContext context) {
    if (valeur == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: C.vertPale, borderRadius: BorderRadius.circular(99)),
        child: const Text('Nouveau', style: TextStyle(color: C.vert, fontSize: 11, fontWeight: FontWeight.w700)),
      );
    }
    return Row(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.star_rounded, color: C.ble, size: 16),
      Text(valeur!.toStringAsFixed(1).replaceAll('.', ','), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
      if (nb != null) Text(' ($nb)', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
    ]);
  }
}

class Coeur extends StatelessWidget {
  const Coeur({super.key, required this.commerce});
  final Commerce? commerce;
  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    if (commerce == null || s.utilisateur == null) return const SizedBox.shrink();
    final oui = s.estFavori(commerce!.id);
    return IconButton(
      tooltip: oui ? 'Retirer des favoris' : 'Ajouter aux favoris (alerte à chaque nouvelle offre)',
      onPressed: () => s.basculerFavori(commerce!.id),
      icon: Icon(oui ? Icons.favorite : Icons.favorite_border, color: oui ? C.harissa : Theme.of(context).hintColor),
    );
  }
}

class Pastille extends StatelessWidget {
  const Pastille(this.texte, {super.key, this.fond = C.vertPale, this.couleur = C.vert});
  final String texte;
  final Color fond;
  final Color couleur;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(color: fond, borderRadius: BorderRadius.circular(99)),
        child: Text(texte, style: TextStyle(color: couleur, fontSize: 12, fontWeight: FontWeight.w700)),
      );
}

class BadgeStatut extends StatelessWidget {
  const BadgeStatut(this.statut, {super.key});
  final String statut;
  @override
  Widget build(BuildContext context) {
    final (fond, couleur) = switch (statut) {
      'PAYEE' || 'PRETE' => (C.vertPale, C.vert),
      'EN_ATTENTE_PAIEMENT' => (C.blePale, C.ble),
      'ANNULEE' => (C.harissaPale, C.harissa),
      _ => (C.sable, C.gris),
    };
    return Pastille(statutsCommande[statut] ?? statut, fond: fond, couleur: couleur);
  }
}

// Carte d'une offre dans la liste
class CarteOffre extends StatelessWidget {
  const CarteOffre({super.key, required this.offre, required this.onTap});
  final Offre offre;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final o = offre;
    final fin = finDans(o.fin);
    final gris = Theme.of(context).hintColor;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Cloche(categorie: o.categorie, photoUrl: o.photoUrl, remise: reduction(o.prixInitial, o.prixReduit)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(o.commerce?.nom ?? '', style: const TextStyle(color: C.vert, fontWeight: FontWeight.w700, fontSize: 13))),
                  Note(valeur: o.commerce?.noteMoyenne, nb: o.commerce?.nbAvis),
                ]),
                const SizedBox(height: 2),
                Text(o.titre, style: styleTitre(context, taille: 18)),
                const SizedBox(height: 4),
                Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                  Text(dt(o.prixReduit), style: styleTitre(context, taille: 20)),
                  const SizedBox(width: 6),
                  Text(dt(o.prixInitial), style: TextStyle(color: gris, decoration: TextDecoration.lineThrough, fontSize: 12)),
                ]),
                const SizedBox(height: 6),
                Wrap(spacing: 10, runSpacing: 4, children: [
                  _info(Icons.schedule, '${heure(o.debut)} – ${heure(o.fin)}', gris),
                  if (o.distanceKm != null) _info(Icons.place_outlined, distance(o.distanceKm), gris),
                  if (fin != null) Text('Se termine dans $fin', style: TextStyle(color: fin.contains('h') ? C.vert : C.harissa, fontWeight: FontWeight.w700, fontSize: 12)),
                  Text('${o.quantiteDisponible} restante(s)', style: TextStyle(color: gris, fontSize: 12)),
                ]),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _info(IconData i, String t, Color c) => Row(mainAxisSize: MainAxisSize.min, children: [Icon(i, size: 14, color: c), const SizedBox(width: 3), Text(t, style: TextStyle(color: c, fontSize: 12))]);
}

class Vide extends StatelessWidget {
  const Vide({super.key, required this.texte, this.icone = Icons.inbox_outlined, this.action});
  final String texte;
  final IconData icone;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icone, size: 48, color: Theme.of(context).hintColor),
            const SizedBox(height: 12),
            Text(texte, textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).hintColor)),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

class MessageErreur extends StatelessWidget {
  const MessageErreur(this.texte, {super.key});
  final String texte;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: C.harissaPale, borderRadius: BorderRadius.circular(14), border: const Border(left: BorderSide(color: C.harissa, width: 4))),
        child: Text(texte, style: const TextStyle(color: Color(0xFF8C2F1B))),
      );
}

void toast(BuildContext context, String texte) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(texte), behavior: SnackBarBehavior.floating));
