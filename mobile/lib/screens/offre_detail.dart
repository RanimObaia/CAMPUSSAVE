import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import 'offres.dart';
import 'panier.dart';

class EcranOffre extends StatefulWidget {
  const EcranOffre({super.key, required this.id});
  final String id;
  @override
  State<EcranOffre> createState() => _EcranOffreState();
}

class _EcranOffreState extends State<EcranOffre> {
  late Future<Offre> _offre;
  Future<List<Avis>>? _avis;
  int _qte = 1;

  @override
  void initState() {
    super.initState();
    final api = context.read<Session>().api;
    _offre = api.offre(widget.id).then((o) {
      if (o.commerce != null) setState(() => _avis = api.avisCommerce(o.commerce!.id));
      return o;
    });
  }

  Future<void> _ajouter(Offre o) async {
    final s = context.read<Session>();
    if (s.autreCommerce(o)) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Changer de commerce ?'),
          content: Text('Ton panier contient des offres de « ${s.commercePanier!.nom} ». Une commande concerne un seul commerce : le vider pour ajouter celle-ci ?'),
          actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Vider et ajouter'))],
        ),
      );
      if (ok != true) return;
    }
    s.ajouter(o, _qte);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      behavior: SnackBarBehavior.floating,
      content: const Text('Ajouté au panier'),
      action: SnackBarAction(label: 'Voir le panier', onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EcranPanier()))),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    return Scaffold(
      appBar: AppBar(),
      body: FutureBuilder<Offre>(
        future: _offre,
        builder: (context, snap) {
          if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final o = snap.data!;
          final dispo = o.statut == 'ACTIVE' && o.quantiteDisponible > 0;
          final fin = finDans(o.fin);
          return ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 120), children: [
            Center(child: Cloche(categorie: o.categorie, photoUrl: o.photoUrl, remise: reduction(o.prixInitial, o.prixReduit), largeur: 180, hauteur: 210)),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: Text('${o.commerce?.nom ?? ''} · ${categories[o.categorie] ?? o.categorie}', style: const TextStyle(color: C.vert, fontWeight: FontWeight.w700))),
              Note(valeur: o.commerce?.noteMoyenne, nb: o.commerce?.nbAvis),
              Coeur(commerce: o.commerce),
            ]),
            Text(o.titre, style: styleTitre(context, taille: 32)),
            if (o.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(o.description, style: const TextStyle(fontSize: 16))),
            const SizedBox(height: 12),
            Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
              Text(dt(o.prixReduit), style: styleTitre(context, taille: 38).copyWith(color: C.vert)),
              const SizedBox(width: 8),
              Text(dt(o.prixInitial), style: TextStyle(color: Theme.of(context).hintColor, decoration: TextDecoration.lineThrough)),
            ]),
            const SizedBox(height: 6),
            Align(alignment: Alignment.centerLeft, child: Pastille('Tu économises ${dt(o.prixInitial - o.prixReduit)}')),
            const SizedBox(height: 16),
            Card(
              child: Column(children: [
                _ligne(Icons.storefront_outlined, 'Commerce', o.commerce?.nom ?? ''),
                _ligne(Icons.place_outlined, 'Adresse', '${o.commerce?.adresse ?? ''}${o.distanceKm != null ? ' · à ${distance(o.distanceKm)} de l\'ESSECT' : ''}'),
                _ligne(Icons.schedule, 'Retrait', 'de ${heure(o.debut)} à ${heure(o.fin)}${fin != null ? ' · se termine dans $fin' : ''}'),
                _ligne(Icons.inventory_2_outlined, 'Disponibilité', dispo ? '${o.quantiteDisponible} restante(s)' : 'Épuisée'),
                if (o.regimes.isNotEmpty)
                  ListTile(leading: const Icon(Icons.eco_outlined), title: const Text('Préférences'), subtitle: Wrap(spacing: 6, runSpacing: 4, children: [for (final r in o.regimes) Pastille(regimes[r] ?? r)])),
              ]),
            ),
            if (o.commerce?.latitude != null) ...[
              const SizedBox(height: 20),
              Text('Où récupérer', style: styleTitre(context, taille: 22)),
              const SizedBox(height: 10),
              CarteOffres(offres: [o], hauteur: 200),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => launchUrl(Uri.parse('https://www.openstreetmap.org/directions?to=${o.commerce!.latitude}%2C${o.commerce!.longitude}'), mode: LaunchMode.externalApplication),
                icon: const Icon(Icons.directions_walk),
                label: const Text('Itinéraire'),
              ),
            ],
            const SizedBox(height: 20),
            Text('Avis des étudiants', style: styleTitre(context, taille: 22)),
            const SizedBox(height: 8),
            FutureBuilder<List<Avis>>(
              future: _avis,
              builder: (context, a) {
                if (!a.hasData) return const SizedBox.shrink();
                if (a.data!.isEmpty) return Text('Pas encore d\'avis : sois le premier après ton retrait.', style: TextStyle(color: Theme.of(context).hintColor));
                return Column(children: [
                  for (final av in a.data!.take(5))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Card(child: ListTile(
                        title: Row(children: [Text(av.prenom, style: const TextStyle(fontWeight: FontWeight.w700)), const SizedBox(width: 8), Note(valeur: av.note.toDouble())]),
                        subtitle: av.commentaire.isEmpty ? null : Text(av.commentaire),
                      )),
                    ),
                ]);
              },
            ),
          ]);
        },
      ),
      bottomNavigationBar: FutureBuilder<Offre>(
        future: _offre,
        builder: (context, snap) {
          final o = snap.data;
          if (o == null || o.statut != 'ACTIVE' || o.quantiteDisponible <= 0) return const SizedBox.shrink();
          final reste = o.quantiteDisponible - s.quantiteDe(o.id);
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: reste <= 0
                  ? const Text('Tu as déjà tout le stock disponible dans ton panier.', textAlign: TextAlign.center)
                  : Row(children: [
                      IconButton.outlined(onPressed: _qte > 1 ? () => setState(() => _qte--) : null, icon: const Icon(Icons.remove)),
                      SizedBox(width: 36, child: Text('${_qte.clamp(1, reste)}', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
                      IconButton.outlined(onPressed: _qte < reste ? () => setState(() => _qte++) : null, icon: const Icon(Icons.add)),
                      const SizedBox(width: 12),
                      Expanded(child: FilledButton(onPressed: () => _ajouter(o), child: Text('Ajouter · ${dt(o.prixReduit * _qte.clamp(1, reste))}'))),
                    ]),
            ),
          );
        },
      ),
    );
  }

  Widget _ligne(IconData i, String t, String v) => ListTile(leading: Icon(i), title: Text(t, style: const TextStyle(fontSize: 13)), subtitle: Text(v, style: const TextStyle(fontSize: 15)));
}
