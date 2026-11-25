import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import 'notifications.dart';
import 'offres.dart';

// Onglet « Favoris » : commerces suivis (alerte à chaque nouvelle offre)
class EcranFavoris extends StatefulWidget {
  const EcranFavoris({super.key});
  @override
  State<EcranFavoris> createState() => _EcranFavorisState();
}

class _EcranFavorisState extends State<EcranFavoris> {
  late Future<List<Commerce>> _liste;
  @override
  void initState() {
    super.initState();
    _liste = context.read<Session>().api.favoris();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<Session>(); // se met à jour quand un cœur change
    return Scaffold(
      appBar: AppBar(title: const Text('Favoris')),
      body: FutureBuilder<List<Commerce>>(
        future: _liste,
        builder: (context, snap) {
          if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final s = context.read<Session>();
          final l = snap.data!.where((c) => s.estFavori(c.id)).toList();
          if (l.isEmpty) return const Vide(texte: 'Pas encore de favori.\nTouche le cœur d\'une offre pour être prévenu des nouvelles offres de ce commerce.', icone: Icons.favorite_border);
          return ListView(padding: const EdgeInsets.all(16), children: [
            Text('Tu reçois une notification dès qu\'un de ces commerces publie une offre.', style: TextStyle(color: Theme.of(context).hintColor)),
            const SizedBox(height: 12),
            for (final c in l)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Card(
                  child: ListTile(
                    title: Text(c.nom, style: styleTitre(context, taille: 18)),
                    subtitle: Text('${c.adresse}${c.horaires != null ? '\n${c.horaires}' : ''}'),
                    isThreeLine: c.horaires != null,
                    leading: Note(valeur: c.noteMoyenne),
                    trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                      if (c.offresDisponibles > 0) Pastille('${c.offresDisponibles} offre(s)'),
                      Coeur(commerce: c),
                    ]),
                  ),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

// Onglet « Moi » : impact, réglages, aide, déconnexion
class EcranMoi extends StatefulWidget {
  const EcranMoi({super.key});
  @override
  State<EcranMoi> createState() => _EcranMoiState();
}

class _EcranMoiState extends State<EcranMoi> {
  late Future<StatsEtudiant> _stats;
  @override
  void initState() {
    super.initState();
    _stats = context.read<Session>().api.stats();
  }

  Future<void> _preference(String cle, bool v) async {
    final s = context.read<Session>();
    final notifs = Map<String, dynamic>.from(s.utilisateur!.preferences['notifications'] ?? {});
    notifs[cle] = v;
    s.utilisateur!.preferences = {...s.utilisateur!.preferences, 'notifications': notifs};
    setState(() {});
    try {
      await s.api.modifierProfil({'preferences': {'notifications': notifs}});
    } catch (e) {
      if (mounted) toast(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    final u = s.utilisateur!;
    return Scaffold(
      appBar: AppBar(title: Text('${u.prenom} ${u.nom}')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        FutureBuilder<StatsEtudiant>(
          future: _stats,
          builder: (context, snap) {
            final st = snap.data;
            if (st == null) return const SizedBox(height: 120, child: Center(child: CircularProgressIndicator()));
            final progres = st.suivant == null ? 1.0 : st.repasSauves / (st.repasSauves + st.repasPourSuivant);
            return Column(children: [
              Card(
                color: C.pin,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Mon impact', style: TextStyle(color: Color(0xFFA9C2B3))),
                    Text('${st.repasSauves} repas sauvés', style: const TextStyle(fontFamily: titre, color: Colors.white, fontSize: 34, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Row(children: [
                      _chiffre('${st.co2Evite.toStringAsFixed(1).replaceAll('.', ',')} kg', 'CO2 évité'),
                      _chiffre(dt(st.economies), 'économisés'),
                      _chiffre('${st.ecoPoints}', 'EcoPoints'),
                    ]),
                  ]),
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Niveau « ${st.niveau} »', style: styleTitre(context, taille: 20).copyWith(color: C.vert)),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: progres, minHeight: 10, borderRadius: BorderRadius.circular(99), color: C.vert, backgroundColor: C.sable),
                    const SizedBox(height: 6),
                    Text(st.suivant == null ? 'Niveau maximum atteint, bravo !' : 'Encore ${st.repasPourSuivant} repas pour passer « ${st.suivant} »', style: TextStyle(color: Theme.of(context).hintColor)),
                    Text('Estimations : 0,4 kg de nourriture et 2,5 kg de CO2 par repas sauvé.', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11)),
                  ]),
                ),
              ),
            ]);
          },
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(children: [
            ListTile(
              leading: const Icon(Icons.notifications_none),
              title: const Text('Mes notifications'),
              trailing: s.nonLues > 0 ? Badge(label: Text('${s.nonLues}')) : const Icon(Icons.chevron_right),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EcranNotifications())),
            ),
            SwitchListTile(title: const Text('Nouvelles offres de mes favoris'), value: u.notif('favoris'), onChanged: (v) => _preference('favoris', v)),
            SwitchListTile(title: const Text('Rappel 30 min avant mon retrait'), value: u.notif('rappels'), onChanged: (v) => _preference('rappels', v)),
            SwitchListTile(title: const Text('Paiement et suivi de commande'), value: u.notif('commandes'), onChanged: (v) => _preference('commandes', v)),
            ListTile(
              leading: const Icon(Icons.dark_mode_outlined),
              title: const Text('Thème'),
              trailing: DropdownButton<ThemeMode>(
                value: s.theme,
                underline: const SizedBox.shrink(),
                items: const [
                  DropdownMenuItem(value: ThemeMode.system, child: Text('Système')),
                  DropdownMenuItem(value: ThemeMode.light, child: Text('Clair')),
                  DropdownMenuItem(value: ThemeMode.dark, child: Text('Sombre')),
                ],
                onChanged: (m) => s.changerTheme(m ?? ThemeMode.system),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        Text('Aide', style: styleTitre(context, taille: 22)),
        const SizedBox(height: 8),
        Card(child: Column(children: [for (final (q, r) in _faq) ExpansionTile(shape: const Border(), title: Text(q, style: const TextStyle(fontWeight: FontWeight.w600)), childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16), children: [Text(r)])])),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final (l, chemin) in const [('Conditions d\'utilisation', '/legal/cgu'), ('Confidentialité', '/legal/confidentialite'), ('Remboursement', '/legal/annulation'), ('Contact', '/contact')])
            ActionChip(label: Text(l), onPressed: () => launchUrl(Uri.parse('$kWebUrl$chemin'), mode: LaunchMode.externalApplication)),
        ]),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(foregroundColor: C.harissa, side: const BorderSide(color: C.harissa)),
          onPressed: () => s.deconnexion(),
          icon: const Icon(Icons.logout),
          label: const Text('Se déconnecter'),
        ),
        const SizedBox(height: 8),
        Center(child: Text(kUseMock ? 'Mode démo · données fictives' : 'Connecté à $kApiUrl', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11))),
      ]),
    );
  }

  Widget _chiffre(String v, String l) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(v, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          Text(l, style: const TextStyle(color: Color(0xFFA9C2B3), fontSize: 12)),
        ]),
      );

  static const _faq = [
    ('Comment récupérer ma commande ?', 'Va au commerce pendant le créneau, ouvre la commande et glisse « Afficher au comptoir » : le commerçant scanne ton QR code.'),
    ('Un ami peut-il y aller à ma place ?', 'Oui : dans la commande, « Confier le retrait à un ami » crée un lien avec le QR code. Tu peux l\'annuler à tout moment.'),
    ('Mon paiement a été refusé, suis-je débité ?', 'Non. La commande est annulée, rien n\'est débité et tu reçois un e-mail « paiement non abouti ».'),
    ('Je n\'ai pas reçu l\'e-mail de confirmation', 'Regarde dans les spams. Ta commande et son QR code restent dans « Commandes ».'),
    ('Un problème avec une commande ?', 'Ouvre la commande et touche « Signaler un problème » dans les 48 heures : l\'équipe répond sous 72 heures.'),
  ];
}

// Petite redirection pratique utilisée par l'onglet Carte
class EcranCarte extends StatelessWidget {
  const EcranCarte({super.key});
  @override
  Widget build(BuildContext context) => const EcranOffres(carte: true);
}
