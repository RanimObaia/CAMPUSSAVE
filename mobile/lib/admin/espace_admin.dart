// Espace administrateur de l'application mobile :
//   5. Commerces à valider ou refuser   6. Tableau de bord
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../services/api_pro.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import '../widgets/pro.dart';

final _api = ApiPro.instance;

class EspaceAdmin extends StatefulWidget {
  const EspaceAdmin({super.key});
  @override
  State<EspaceAdmin> createState() => _EspaceAdminState();
}

class _EspaceAdminState extends State<EspaceAdmin> {
  int _onglet = 0;

  static const _titres = ['Commerces', 'Tableau de bord'];

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
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
      body: IndexedStack(index: _onglet, children: const [_Commerces(), _TableauAdmin()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: (i) => setState(() => _onglet = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.storefront_outlined), label: 'Commerces'),
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Tableau'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Commerces : filtre par statut (en attente par défaut), valider ou refuser
// ---------------------------------------------------------------------------
class _Commerces extends StatefulWidget {
  const _Commerces();
  @override
  State<_Commerces> createState() => _CommercesState();
}

class _CommercesState extends State<_Commerces> {
  String _statut = 'EN_ATTENTE';
  String? _enCours;

  Future<void> _decider(Json c, String decision, Future<void> Function() recharger) async {
    final valider = decision == 'VALIDE';
    final ok = await confirmer(
      context,
      valider ? 'Valider ce commerce ?' : 'Refuser ce commerce ?',
      valider ? '« ${c['nom']} » pourra publier des offres.' : '« ${c['nom']} » ne pourra pas publier d\'offres.',
      action: valider ? 'Valider' : 'Refuser',
    );
    if (!ok) return;
    setState(() => _enCours = c['id'].toString());
    try {
      await _api.decider(c['id'].toString(), decision);
      await recharger();
      if (mounted) messageRapide(context, valider ? 'Commerce validé.' : 'Commerce refusé.');
    } catch (e) {
      if (mounted) messageRapide(context, '$e', erreur: true);
    } finally {
      if (mounted) setState(() => _enCours = null);
    }
  }

  @override
  Widget build(BuildContext context) => Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: SizedBox(
            width: double.infinity,
            child: Wrap(spacing: 8, children: [
              for (final e in const {'EN_ATTENTE': 'En attente', 'VALIDE': 'Validés', 'REFUSE': 'Refusés', '': 'Tous'}.entries)
                ChoiceChip(label: Text(e.value), selected: _statut == e.key, onSelected: (_) => setState(() => _statut = e.key)),
            ]),
          ),
        ),
        Expanded(
          child: Chargeur<List<Json>>(
            key: ValueKey(_statut),
            charger: () => _api.commerces(_statut),
            builder: (context, liste, recharger) {
              if (liste.isEmpty) {
                return ListView(children: [
                  const SizedBox(height: 80),
                  Vide(texte: _statut == 'EN_ATTENTE' ? 'Aucun commerce à valider.' : 'Aucun commerce.', icone: Icons.storefront_outlined),
                ]);
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: liste.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final c = liste[i];
                  final statut = '${c['statutValidation']}';
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(child: Text('${c['nom']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                          PastilleEtat(statut),
                        ]),
                        const SizedBox(height: 4),
                        Text('${libelleTypeCommerce('${c['type']}')} · ${c['adresse']}', style: TextStyle(color: Theme.of(context).hintColor)),
                        if (statut == 'EN_ATTENTE') ...[
                          const SizedBox(height: 10),
                          Row(children: [
                            FilledButton(
                              onPressed: _enCours == c['id'].toString() ? null : () => _decider(c, 'VALIDE', recharger),
                              style: FilledButton.styleFrom(minimumSize: const Size(100, 42)),
                              child: const Text('Valider'),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: _enCours == c['id'].toString() ? null : () => _decider(c, 'REFUSE', recharger),
                              style: OutlinedButton.styleFrom(minimumSize: const Size(100, 42), foregroundColor: C.harissa, side: const BorderSide(color: C.harissa, width: 1.5)),
                              child: const Text('Refuser'),
                            ),
                          ]),
                        ],
                      ]),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ]);
}

// ---------------------------------------------------------------------------
// 6. Tableau de bord
// ---------------------------------------------------------------------------
class _TableauAdmin extends StatelessWidget {
  const _TableauAdmin();

  @override
  Widget build(BuildContext context) => Chargeur<Json>(
        charger: _api.statsAdmin,
        builder: (context, s, recharger) => ListView(padding: const EdgeInsets.all(16), children: [
          GrilleStats(cartes: [
            CarteStat(libelle: 'Utilisateurs', valeur: '${s['utilisateurs'] ?? 0}'),
            CarteStat(libelle: 'Commerces validés', valeur: '${s['commercesValides'] ?? 0}', note: '${s['commercesEnAttente'] ?? 0} en attente'),
            CarteStat(libelle: 'Commandes payées', valeur: '${s['commandes'] ?? 0}'),
            CarteStat(libelle: "Chiffre d'affaires", valeur: dt((s['volume'] ?? 0) as num)),
            CarteStat(libelle: 'Repas sauvés', valeur: '${s['repasSauves'] ?? 0}'),
            CarteStat(libelle: 'Paiements', valeur: '${s['paiements'] ?? 0}'),
          ]),
        ]),
      );
}
