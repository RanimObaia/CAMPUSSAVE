import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import 'notifications.dart';
import 'offre_detail.dart';
import 'panier.dart';

// Offres du jour : recherche, catégories, tri, filtres, vue liste ou carte
class EcranOffres extends StatefulWidget {
  const EcranOffres({super.key, this.carte = false});
  final bool carte;
  @override
  State<EcranOffres> createState() => _EcranOffresState();
}

class _EcranOffresState extends State<EcranOffres> {
  final _filtres = Filtres();
  final _recherche = TextEditingController();
  Timer? _attente;
  Future<List<Offre>>? _chargement;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  void _charger() => setState(() => _chargement = context.read<Session>().api.offres(_filtres));

  @override
  void dispose() {
    _attente?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.carte ? 'Autour de l\'ESSECT' : 'Bonjour ${s.utilisateur?.prenom ?? ''}'),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EcranNotifications())),
            icon: Badge(isLabelVisible: s.nonLues > 0, label: Text('${s.nonLues}'), child: const Icon(Icons.notifications_none)),
          ),
          IconButton(
            tooltip: 'Panier',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EcranPanier())),
            icon: Badge(isLabelVisible: s.nbArticles > 0, label: Text('${s.nbArticles}'), child: const Icon(Icons.shopping_bag_outlined)),
          ),
        ],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _recherche,
                textInputAction: TextInputAction.search,
                decoration: const InputDecoration(hintText: 'Couscous, viennoiseries, commerce…', prefixIcon: Icon(Icons.search), isDense: true),
                onChanged: (v) {
                  _attente?.cancel();
                  _attente = Timer(const Duration(milliseconds: 300), () { _filtres.q = v; _charger(); });
                },
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Trier et filtrer',
              onPressed: _ouvrirFiltres,
              icon: Badge(isLabelVisible: _filtres.nbActifs > 0, label: Text('${_filtres.nbActifs}'), child: const Icon(Icons.tune)),
            ),
          ]),
        ),
        SizedBox(
          height: 44,
          child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), children: [
            _chip('Toutes', ''),
            for (final e in categories.entries) _chip(e.value, e.key),
          ]),
        ),
        Expanded(
          child: FutureBuilder<List<Offre>>(
            future: _chargement,
            builder: (context, snap) {
              if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
              if (!snap.hasData) return const Center(child: CircularProgressIndicator());
              final offres = snap.data!;
              if (offres.isEmpty) {
                return Vide(
                  texte: _filtres.nbActifs > 0 || _filtres.q.isNotEmpty || _filtres.categorie.isNotEmpty
                      ? 'Aucune offre ne correspond à ta recherche.'
                      : 'Pas d\'offre pour le moment. Les commerces publient leurs invendus en fin de journée.',
                  icone: Icons.no_food_outlined,
                );
              }
              if (widget.carte) return CarteOffres(offres: offres);
              return RefreshIndicator(
                onRefresh: () async => _charger(),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: offres.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    if (i == 0) return Text('${offres.length} offre(s) à sauver', style: TextStyle(color: Theme.of(context).hintColor, fontStyle: FontStyle.italic));
                    final o = offres[i - 1];
                    return CarteOffre(offre: o, onTap: () => ouvrirOffre(context, o.id).then((_) => _charger()));
                  },
                ),
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _chip(String texte, String code) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(texte),
          selected: _filtres.categorie == code,
          onSelected: (_) { _filtres.categorie = code; _charger(); },
        ),
      );

  Future<void> _ouvrirFiltres() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => StatefulBuilder(builder: (context, maj) {
        Widget groupe<T>(String titre, List<(String, T)> choix, T valeur, void Function(T) changer) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 12),
              Text(titre, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Wrap(spacing: 8, runSpacing: 6, children: [
                for (final (l, v) in choix) ChoiceChip(label: Text(l), selected: valeur == v, onSelected: (_) => maj(() => changer(v))),
              ]),
            ]);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: SingleChildScrollView(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Trier et filtrer', style: styleTitre(context, taille: 24)),
                groupe<String>('Trier par', const [('Se termine bientôt', ''), ('Les plus proches', 'distance'), ('Prix le plus bas', 'prix'), ('Les mieux notés', 'note'), ('Plus grosse remise', 'remise')], _filtres.tri, (v) => _filtres.tri = v),
                groupe<int?>('Prix maximum', const [('Tous', null), ('≤ 3 DT', 3000), ('≤ 5 DT', 5000), ('≤ 10 DT', 10000)], _filtres.prixMax, (v) => _filtres.prixMax = v),
                groupe<double?>('Distance depuis l\'ESSECT', const [('Toutes', null), ('≤ 500 m', 0.5), ('≤ 1 km', 1.0), ('≤ 3 km', 3.0)], _filtres.distanceMax, (v) => _filtres.distanceMax = v),
                groupe<String>('Retrait', const [('Tous', ''), ('Dans l\'heure', 'maintenant'), ('Midi', 'midi'), ('Soir', 'soir')], _filtres.creneau, (v) => _filtres.creneau = v),
                groupe<String>('Préférence', [('Toutes', ''), for (final e in regimes.entries) (e.value, e.key)], _filtres.regime, (v) => _filtres.regime = v),
                const SizedBox(height: 20),
                Row(children: [
                  TextButton(onPressed: () => maj(() { _filtres..tri = ''..prixMax = null..distanceMax = null..creneau = ''..regime = ''; }), child: const Text('Effacer')),
                  const Spacer(),
                  FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Voir les offres')),
                ]),
              ]),
            ),
          ),
        );
      }),
    );
    _charger();
  }
}

Future<void> ouvrirOffre(BuildContext context, String id) => Navigator.push(context, MaterialPageRoute(builder: (_) => EcranOffre(id: id)));

// Carte OpenStreetMap : un repère par commerce, le campus, et la fiche du commerce touché
class CarteOffres extends StatefulWidget {
  const CarteOffres({super.key, required this.offres, this.hauteur});
  final List<Offre> offres;
  final double? hauteur;
  @override
  State<CarteOffres> createState() => _CarteOffresState();
}

class _CarteOffresState extends State<CarteOffres> {
  String? _choisi;

  @override
  Widget build(BuildContext context) {
    final parCommerce = <String, List<Offre>>{};
    for (final o in widget.offres) {
      if (o.commerce?.latitude == null) continue;
      parCommerce.putIfAbsent(o.commerce!.id, () => []).add(o);
    }
    final carte = FlutterMap(
      options: const MapOptions(initialCenter: LatLng(kEssectLat, kEssectLng), initialZoom: 16),
      children: [
        TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'tn.essect.campussave'),
        MarkerLayer(markers: [
          const Marker(point: LatLng(kEssectLat, kEssectLng), width: 70, height: 34, child: _Repere(texte: 'ESSECT', couleur: C.pin)),
          for (final e in parCommerce.entries)
            Marker(
              point: LatLng(e.value.first.commerce!.latitude!, e.value.first.commerce!.longitude!),
              width: 44, height: 50,
              child: GestureDetector(
                onTap: () => setState(() => _choisi = e.key),
                child: _Repere(texte: '${e.value.length}', couleur: _choisi == e.key ? C.harissa : C.vert),
              ),
            ),
        ]),
        const RichAttributionWidget(attributions: [TextSourceAttribution('OpenStreetMap')]),
      ],
    );
    if (widget.hauteur != null) return ClipRRect(borderRadius: BorderRadius.circular(18), child: SizedBox(height: widget.hauteur, child: carte));
    final offresChoisies = parCommerce[_choisi];
    return Stack(children: [
      carte,
      if (offresChoisies != null)
        Positioned(
          left: 12, right: 12, bottom: 12,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(offresChoisies.first.commerce!.nom, style: styleTitre(context, taille: 20))),
                  Note(valeur: offresChoisies.first.commerce!.noteMoyenne, nb: offresChoisies.first.commerce!.nbAvis),
                  IconButton(onPressed: () => setState(() => _choisi = null), icon: const Icon(Icons.close)),
                ]),
                Text('${offresChoisies.first.commerce!.adresse} · ${distance(offresChoisies.first.distanceKm)}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
                const Divider(),
                for (final o in offresChoisies)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(o.titre),
                    subtitle: Text('${heure(o.debut)} – ${heure(o.fin)}'),
                    trailing: Text(dt(o.prixReduit), style: const TextStyle(fontWeight: FontWeight.w800)),
                    onTap: () => ouvrirOffre(context, o.id),
                  ),
              ]),
            ),
          ),
        ),
    ]);
  }
}

class _Repere extends StatelessWidget {
  const _Repere({required this.texte, required this.couleur});
  final String texte;
  final Color couleur;
  @override
  Widget build(BuildContext context) => Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: couleur,
          border: Border.all(color: Colors.white, width: 3),
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(22), topRight: Radius.circular(22), bottomLeft: Radius.circular(8), bottomRight: Radius.circular(8)),
          boxShadow: const [BoxShadow(blurRadius: 6, color: Colors.black26, offset: Offset(0, 3))],
        ),
        child: Text(texte, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
      );
}
