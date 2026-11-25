// Espace commerçant de l'application mobile :
//   1. Valider un retrait (code CS-…)   2. Commandes reçues   3. Mes offres (publier, modifier, retirer)   4. Tableau de bord
import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../services/api_pro.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import '../widgets/pro.dart';

final _api = ApiPro.instance;

DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());

class EspaceCommercant extends StatefulWidget {
  const EspaceCommercant({super.key});
  @override
  State<EspaceCommercant> createState() => _EspaceCommercantState();
}

class _EspaceCommercantState extends State<EspaceCommercant> {
  int _onglet = 0;

  static const _titres = ['Valider un retrait', 'Commandes', 'Mes offres', 'Tableau de bord'];

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    final pages = <Widget>[const _ValiderRetrait(), const _Commandes(), const _MesOffres(), const _TableauCommercant()];
    return Scaffold(
      appBar: AppBar(
        title: Text(_titres[_onglet]),
        actions: [
          IconButton(
            tooltip: 'Se déconnecter (${s.utilisateur?.email ?? ''})',
            icon: const Icon(Icons.logout),
            onPressed: () => s.deconnexion(),
          ),
        ],
      ),
      body: IndexedStack(index: _onglet, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: (i) => setState(() => _onglet = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.qr_code_scanner), label: 'Retrait'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Commandes'),
          NavigationDestination(icon: Icon(Icons.local_offer_outlined), label: 'Offres'),
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Tableau'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 1. Valider un retrait : saisie du code affiché sous le QR code de l'étudiant
// ---------------------------------------------------------------------------
class _ValiderRetrait extends StatefulWidget {
  const _ValiderRetrait();
  @override
  State<_ValiderRetrait> createState() => _ValiderRetraitState();
}

class _ValiderRetraitState extends State<_ValiderRetrait> {
  final _code = TextEditingController();
  bool _envoi = false;
  String _erreur = '';
  Json? _resultat;

  Future<void> _valider() async {
    final code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _erreur = 'Saisis le code de la commande.');
      return;
    }
    setState(() { _envoi = true; _erreur = ''; _resultat = null; });
    try {
      final r = await _api.validerRetrait(code);
      if (!mounted) return;
      setState(() { _resultat = r; _code.clear(); _envoi = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _erreur = '$e'; _envoi = false; });
    }
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
        Text("Saisis le code affiché sous le QR code de l'étudiant.", style: TextStyle(color: Theme.of(context).hintColor)),
        const SizedBox(height: 16),
        TextField(
          controller: _code,
          textCapitalization: TextCapitalization.characters,
          autocorrect: false,
          enableSuggestions: false,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9-]'))],
          decoration: const InputDecoration(labelText: 'Code de la commande', hintText: 'CS-7KQ3PX', prefixIcon: Icon(Icons.confirmation_number_outlined)),
          onSubmitted: (_) => _valider(),
        ),
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: _envoi ? null : _valider,
          icon: const Icon(Icons.check_circle_outline),
          label: Text(_envoi ? 'Vérification…' : 'Valider le retrait'),
        ),
        const SizedBox(height: 18),
        if (_erreur.isNotEmpty) MessageErreur(_erreur),
        if (_resultat != null)
          Card(
            color: C.vertPale,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                const Icon(Icons.check_circle, color: C.vert, size: 36),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Commande ${_resultat!['code']} remise', style: const TextStyle(fontWeight: FontWeight.w700, color: C.encre)),
                    const SizedBox(height: 2),
                    Text(dt((_resultat!['montantTotal'] ?? 0) as num), style: const TextStyle(color: C.encre)),
                    const SizedBox(height: 6),
                    const Pastille('Récupérée'),
                  ]),
                ),
              ]),
            ),
          ),
      ]);
}

// ---------------------------------------------------------------------------
// 2. Commandes reçues, avec le bouton « Prête »
// ---------------------------------------------------------------------------
class _Commandes extends StatefulWidget {
  const _Commandes();
  @override
  State<_Commandes> createState() => _CommandesState();
}

class _CommandesState extends State<_Commandes> {
  String? _enCours;

  Future<void> _prete(Json c, Future<void> Function() recharger) async {
    setState(() => _enCours = c['id'].toString());
    try {
      await _api.marquerPrete(c['id'].toString());
      await recharger();
    } catch (e) {
      if (mounted) messageRapide(context, '$e', erreur: true);
    } finally {
      if (mounted) setState(() => _enCours = null);
    }
  }

  @override
  Widget build(BuildContext context) => Chargeur<List<Json>>(
        charger: _api.commandes,
        builder: (context, liste, recharger) {
          if (liste.isEmpty) return ListView(children: const [SizedBox(height: 80), Vide(texte: 'Aucune commande pour le moment.', icone: Icons.receipt_long_outlined)]);
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: liste.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final c = liste[i];
              final articles = (c['lignes'] as List? ?? []).map((l) => '${l['quantite']} × ${l['titre']}').join(', ');
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text('${c['code']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      const Spacer(),
                      BadgeStatut('${c['statut']}'),
                    ]),
                    const SizedBox(height: 6),
                    Text(articles),
                    const SizedBox(height: 4),
                    Text('${dateHeure(_date(c['dateCommande']))} · ${dt((c['montantTotal'] ?? 0) as num)}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
                    if (c['statut'] == 'PAYEE') ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _enCours == c['id'].toString() ? null : () => _prete(c, recharger),
                        icon: const Icon(Icons.done),
                        label: const Text('Marquer prête'),
                      ),
                    ],
                  ]),
                ),
              );
            },
          );
        },
      );
}

// ---------------------------------------------------------------------------
// 3. Mes offres : liste, publier, modifier, retirer
// ---------------------------------------------------------------------------
class _MesOffres extends StatefulWidget {
  const _MesOffres();
  @override
  State<_MesOffres> createState() => _MesOffresState();
}

class _MesOffresState extends State<_MesOffres> {
  Key _cle = UniqueKey();

  Future<void> _ouvrirFormulaire([Json? offre]) async {
    final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => FormulaireOffre(offre: offre)));
    if (ok == true && mounted) setState(() => _cle = UniqueKey());
  }

  Future<void> _retirer(Json o) async {
    if (!await confirmer(context, "Retirer l'offre ?", '« ${o['titre']} » ne sera plus visible par les étudiants.', action: 'Retirer')) return;
    try {
      await _api.retirerOffre(o['id'].toString());
      if (mounted) setState(() => _cle = UniqueKey());
    } catch (e) {
      if (mounted) messageRapide(context, '$e', erreur: true);
    }
  }

  @override
  Widget build(BuildContext context) => Stack(children: [
        Chargeur<List<Json>>(
          key: _cle,
          charger: _api.mesOffres,
          builder: (context, liste, recharger) {
            if (liste.isEmpty) return ListView(children: const [SizedBox(height: 80), Vide(texte: "Aucune offre publiée.\nAppuie sur « Publier » pour commencer.", icone: Icons.local_offer_outlined)]);
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
              itemCount: liste.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final o = liste[i];
                final statut = '${o['statut']}';
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text('${o['titre']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                        PastilleEtat(statut),
                      ]),
                      const SizedBox(height: 4),
                      Text('${dt((o['prixReduit'] ?? 0) as num)}  (au lieu de ${dt((o['prixInitial'] ?? 0) as num)}) · stock : ${o['quantiteDisponible']}'),
                      Text('Retrait : ${dateHeure(_date(o['heureDebutRecuperation']))} → ${heure(_date(o['heureFinRecuperation']))}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
                      if (statut != 'RETIREE') ...[
                        const SizedBox(height: 8),
                        Row(children: [
                          OutlinedButton(onPressed: () => _ouvrirFormulaire(o), child: const Text('Modifier')),
                          const SizedBox(width: 8),
                          TextButton(onPressed: () => _retirer(o), style: TextButton.styleFrom(foregroundColor: C.harissa), child: const Text('Retirer')),
                        ]),
                      ],
                    ]),
                  ),
                );
              },
            );
          },
        ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton.extended(onPressed: () => _ouvrirFormulaire(), icon: const Icon(Icons.add), label: const Text('Publier')),
        ),
      ]);
}

// Création et modification d'une offre (mêmes règles que le site : prix réduit < prix initial, stock >= 0, fin > début)
class FormulaireOffre extends StatefulWidget {
  const FormulaireOffre({super.key, this.offre});
  final Json? offre;
  @override
  State<FormulaireOffre> createState() => _FormulaireOffreState();
}

class _FormulaireOffreState extends State<FormulaireOffre> {
  static const _categories = ['BOULANGERIE', 'PLATS', 'PATISSERIE', 'BOISSONS'];
  static const _regimes = {'VEGETARIEN': 'Végétarien', 'VEGAN': 'Vegan', 'SANS_GLUTEN': 'Sans gluten', 'SANS_LACTOSE': 'Sans lactose', 'FAIT_MAISON': 'Fait maison'};

  late final _titre = TextEditingController(text: widget.offre?['titre'] ?? '');
  late final _description = TextEditingController(text: widget.offre?['description'] ?? '');
  late final _quantite = TextEditingController(text: '${widget.offre?['quantiteDisponible'] ?? 1}');
  late final _prixInitial = TextEditingController(text: widget.offre == null ? '' : _enDt(widget.offre!['prixInitial']));
  late final _prixReduit = TextEditingController(text: widget.offre == null ? '' : _enDt(widget.offre!['prixReduit']));
  late final _photo = TextEditingController(text: widget.offre?['photoUrl'] ?? '');
  late String _categorie = _categories.contains(widget.offre?['categorie']) ? widget.offre!['categorie'] : 'PLATS';
  late final Set<String> _choix = {...List<String>.from(widget.offre?['regimes'] ?? const [])};
  late bool _recurrente = widget.offre?['recurrente'] == true;
  late DateTime? _debut = _date(widget.offre?['heureDebutRecuperation'])?.toLocal();
  late DateTime? _fin = _date(widget.offre?['heureFinRecuperation'])?.toLocal();
  String _erreur = '';
  bool _envoi = false;

  static String _enDt(dynamic millimes) => (((millimes ?? 0) as num) / 1000).toString();

  // « 4,5 » ou « 4.500 » -> millimes
  int? _enMillimes(String texte) {
    final v = double.tryParse(texte.trim().replaceAll(',', '.'));
    return v == null ? null : (v * 1000).round();
  }

  Future<DateTime?> _choisirDate(DateTime? actuelle) async {
    final base = actuelle ?? DateTime.now();
    final jour = await showDatePicker(context: context, initialDate: base, firstDate: DateTime.now().subtract(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365)));
    if (jour == null || !mounted) return null;
    final h = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(base));
    if (h == null) return null;
    return DateTime(jour.year, jour.month, jour.day, h.hour, h.minute);
  }

  Future<void> _enregistrer() async {
    final prixInitial = _enMillimes(_prixInitial.text);
    final prixReduit = _enMillimes(_prixReduit.text);
    final quantite = int.tryParse(_quantite.text.trim());
    final photo = _photo.text.trim();
    String? probleme;
    if (_titre.text.trim().isEmpty) {
      probleme = 'Le titre est obligatoire.';
    } else if (prixInitial == null || prixReduit == null || prixReduit <= 0 || prixReduit >= prixInitial) {
      probleme = 'Le prix réduit doit être positif et inférieur au prix initial.';
    } else if (quantite == null || quantite < 0) {
      probleme = 'La quantité doit être un entier positif ou nul.';
    } else if (_debut == null || _fin == null) {
      probleme = 'Choisis le début et la fin du retrait.';
    } else if (!_fin!.isAfter(_debut!)) {
      probleme = "L'heure de fin doit suivre l'heure de début.";
    } else if (photo.isNotEmpty && !RegExp(r'^(https://\S+|/photos/[\w-]+\.(jpe?g|png|webp))$', caseSensitive: false).hasMatch(photo)) {
      probleme = 'La photo doit être une adresse https:// ou une photo du site (/photos/…).';
    }
    if (probleme != null) {
      setState(() => _erreur = probleme!);
      return;
    }
    final data = <String, dynamic>{
      'titre': _titre.text.trim(),
      'description': _description.text.trim(),
      'categorie': _categorie,
      'prixInitial': prixInitial,
      'prixReduit': prixReduit,
      'quantiteDisponible': quantite,
      'heureDebutRecuperation': _debut!.toUtc().toIso8601String(),
      'heureFinRecuperation': _fin!.toUtc().toIso8601String(),
      'regimes': _choix.toList(),
      'recurrente': _recurrente,
      if (photo.isNotEmpty) 'photoUrl': photo,
    };
    setState(() { _envoi = true; _erreur = ''; });
    try {
      if (widget.offre == null) {
        await _api.creerOffre(data);
      } else {
        await _api.modifierOffre(widget.offre!['id'].toString(), data);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() { _erreur = '$e'; _envoi = false; });
    }
  }

  @override
  void dispose() {
    for (final c in [_titre, _description, _quantite, _prixInitial, _prixReduit, _photo]) {
      c.dispose();
    }
    super.dispose();
  }

  Widget _champDate(String libelle, DateTime? valeur, ValueChanged<DateTime> choisi) => OutlinedButton.icon(
        onPressed: () async {
          final d = await _choisirDate(valeur);
          if (d != null) choisi(d);
        },
        icon: const Icon(Icons.schedule),
        label: Text(valeur == null ? libelle : '$libelle : ${dateHeure(valeur)}'),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(widget.offre == null ? 'Publier une offre' : "Modifier l'offre")),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          if (_erreur.isNotEmpty) ...[MessageErreur(_erreur), const SizedBox(height: 14)],
          TextField(controller: _titre, decoration: const InputDecoration(labelText: 'Titre'), maxLength: 100),
          TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3, maxLength: 500),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _categorie,
            decoration: const InputDecoration(labelText: 'Catégorie'),
            items: [for (final c in _categories) DropdownMenuItem(value: c, child: Text(libelleCategorie(c)))],
            onChanged: (v) => setState(() => _categorie = v ?? _categorie),
          ),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: TextField(controller: _prixInitial, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Prix initial (DT)'))),
            const SizedBox(width: 12),
            Expanded(child: TextField(controller: _prixReduit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Prix réduit (DT)'))),
          ]),
          const SizedBox(height: 14),
          TextField(controller: _quantite, keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly], decoration: const InputDecoration(labelText: 'Quantité disponible')),
          const SizedBox(height: 14),
          _champDate('Début du retrait', _debut, (d) => setState(() => _debut = d)),
          const SizedBox(height: 8),
          _champDate('Fin du retrait', _fin, (d) => setState(() => _fin = d)),
          const SizedBox(height: 14),
          TextField(controller: _photo, keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'Photo (lien https, facultatif)')),
          const SizedBox(height: 14),
          const Text('Préférences alimentaires', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Wrap(spacing: 8, runSpacing: 4, children: [
            for (final e in _regimes.entries)
              FilterChip(
                label: Text(e.value),
                selected: _choix.contains(e.key),
                onSelected: (v) => setState(() => v ? _choix.add(e.key) : _choix.remove(e.key)),
              ),
          ]),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Republier chaque jour'),
            subtitle: const Text('Mêmes heures, même quantité'),
            value: _recurrente,
            onChanged: (v) => setState(() => _recurrente = v),
          ),
          const SizedBox(height: 10),
          FilledButton(onPressed: _envoi ? null : _enregistrer, child: Text(_envoi ? 'Enregistrement…' : 'Enregistrer')),
        ]),
      );
}

// ---------------------------------------------------------------------------
// 4. Tableau de bord
// ---------------------------------------------------------------------------
class _TableauCommercant extends StatelessWidget {
  const _TableauCommercant();

  @override
  Widget build(BuildContext context) => Chargeur<Json>(
        charger: _api.statsCommercant,
        builder: (context, s, recharger) {
          final kg = s['kgSauves'];
          return ListView(padding: const EdgeInsets.all(16), children: [
            GrilleStats(cartes: [
              CarteStat(libelle: 'Offres actives', valeur: '${s['offresActives'] ?? 0}'),
              CarteStat(libelle: 'Commandes du jour', valeur: '${s['commandesDuJour'] ?? 0}', note: "payées aujourd'hui"),
              CarteStat(libelle: "Chiffre d'affaires", valeur: dt((s['chiffreAffaires'] ?? 0) as num), note: "aujourd'hui"),
              CarteStat(libelle: 'Repas sauvés', valeur: '${s['repasSauves'] ?? 0}', note: kg != null && kg != 0 ? 'ce mois-ci, ≈ $kg kg' : 'ce mois-ci'),
            ]),
          ]);
        },
      );
}
