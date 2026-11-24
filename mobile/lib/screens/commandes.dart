import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';

class EcranCommandes extends StatefulWidget {
  const EcranCommandes({super.key});
  @override
  State<EcranCommandes> createState() => _EcranCommandesState();
}

class _EcranCommandesState extends State<EcranCommandes> {
  late Future<List<Commande>> _liste;
  @override
  void initState() {
    super.initState();
    _charger();
  }

  void _charger() => setState(() => _liste = context.read<Session>().api.mesCommandes());

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Mes commandes')),
        body: FutureBuilder<List<Commande>>(
          future: _liste,
          builder: (context, snap) {
            if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final l = snap.data!;
            if (l.isEmpty) return const Vide(texte: 'Tu n\'as pas encore passé de commande.', icone: Icons.receipt_long_outlined);
            final aRetirer = l.where((c) => c.aRetirer).toList();
            final autres = l.where((c) => !c.aRetirer).toList();
            return RefreshIndicator(
              onRefresh: () async => _charger(),
              child: ListView(padding: const EdgeInsets.all(16), children: [
                if (aRetirer.isNotEmpty) ...[
                  Text('À retirer', style: styleTitre(context, taille: 22)),
                  const SizedBox(height: 8),
                  for (final c in aRetirer) _tuile(context, c, enAvant: true),
                  const SizedBox(height: 16),
                ],
                Text('Historique', style: styleTitre(context, taille: 22)),
                const SizedBox(height: 8),
                for (final c in autres) _tuile(context, c),
              ]),
            );
          },
        ),
      );

  Widget _tuile(BuildContext context, Commande c, {bool enAvant = false}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Card(
          shape: enAvant ? RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: C.vert, width: 2)) : null,
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            title: Text('${c.commerce?.nom ?? ''} · ${c.code}', style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(children: [BadgeStatut(c.statut), const SizedBox(width: 8), Expanded(child: Text(enAvant ? 'Retrait ${heure(c.debut)} – ${heure(c.fin)}' : dateHeure(c.dateCommande), style: const TextStyle(fontSize: 12)))]),
            ),
            trailing: enAvant ? const Icon(Icons.qr_code_2, color: C.vert, size: 32) : Text(dt(c.montantTotal), style: const TextStyle(fontWeight: FontWeight.w700)),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EcranCommande(id: c.id))).then((_) => _charger()),
          ),
        ),
      );
}

// Détail : QR code (plein écran au comptoir), délégation, avis, signalement
class EcranCommande extends StatefulWidget {
  const EcranCommande({super.key, required this.id});
  final String id;
  @override
  State<EcranCommande> createState() => _EcranCommandeState();
}

class _EcranCommandeState extends State<EcranCommande> {
  late Future<Commande> _c;
  double _glisse = 0;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  void _charger() => setState(() => _c = context.read<Session>().api.commande(widget.id));

  void _pleinEcran(Commande c) {
    Navigator.push(context, MaterialPageRoute(fullscreenDialog: true, builder: (_) => QrPleinEcran(commande: c)));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(),
        body: FutureBuilder<Commande>(
          future: _c,
          builder: (context, snap) {
            if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final c = snap.data!;
            return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 32), children: [
              Row(children: [Expanded(child: Text('Commande ${c.code}', style: styleTitre(context, taille: 28))), BadgeStatut(c.statut)]),
              Text('Passée le ${dateHeure(c.dateCommande)}', style: TextStyle(color: Theme.of(context).hintColor)),
              const SizedBox(height: 16),
              if (c.aRetirer) _blocQr(c),
              if (c.statut == 'EN_ATTENTE_PAIEMENT') const Card(child: ListTile(leading: Icon(Icons.hourglass_top), title: Text('Paiement en attente'), subtitle: Text('Le QR code apparaîtra dès que le paiement sera confirmé.'))),
              if (c.statut == 'ANNULEE')
                Card(child: ListTile(leading: const Icon(Icons.cancel_outlined, color: C.harissa), title: const Text('Commande annulée'), subtitle: Text('${c.motifAnnulation == 'PAIEMENT_EXPIRE' ? 'Le délai de paiement est dépassé.' : 'Le paiement n\'a pas abouti.'} Aucun montant n\'a été débité.'))),
              if (c.statut == 'RECUPEREE') const Card(child: ListTile(leading: Icon(Icons.check_circle, color: C.vert), title: Text('Commande récupérée'), subtitle: Text('Bon appétit !'))),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    for (final l in c.lignes)
                      Padding(padding: const EdgeInsets.only(bottom: 6), child: Row(children: [Expanded(child: Text('${l.quantite} × ${l.titre}')), Text(dt(l.prixUnitaire * l.quantite))])),
                    const Divider(),
                    Row(children: [Text(c.statut == 'ANNULEE' ? 'Total (non débité)' : 'Total payé'), const Spacer(), Text(dt(c.montantTotal), style: styleTitre(context, taille: 22))]),
                    const SizedBox(height: 10),
                    Text('${c.commerce?.nom ?? ''}, ${c.commerce?.adresse ?? ''}'),
                    if (c.debut != null) Text('Retrait de ${heure(c.debut)} à ${heure(c.fin)}', style: TextStyle(color: Theme.of(context).hintColor)),
                    if (c.paiementReference != null) Text('Paiement : réf. ${c.paiementReference}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
                    if (c.emailEnvoye || c.emailEchecEnvoye)
                      Text(c.emailEnvoye ? 'E-mail de confirmation envoyé' : 'E-mail « paiement non abouti » envoyé', style: const TextStyle(color: C.vert, fontSize: 12, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ),
              if (c.aRetirer) ...[const SizedBox(height: 12), _Delegation(commande: c, onChange: _charger)],
              if (c.statut == 'RECUPEREE' && !c.avisDonne) ...[const SizedBox(height: 12), _Avis(commande: c, onFini: _charger)],
              if (c.statut == 'RECUPEREE' && c.avisDonne) const Padding(padding: EdgeInsets.only(top: 12), child: Text('Merci pour ton avis !', style: TextStyle(color: C.vert, fontWeight: FontWeight.w600))),
              const SizedBox(height: 12),
              OutlinedButton.icon(onPressed: () => _signaler(context, c), icon: const Icon(Icons.flag_outlined), label: const Text('Signaler un problème')),
            ]);
          },
        ),
      );

  Widget _blocQr(Commande c) => Card(
        color: C.pin,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            const Text('Ton QR code', style: TextStyle(fontFamily: titre, fontSize: 22, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: QrImageView(data: c.code, size: 190, semanticsLabel: 'QR code ${c.code}'),
            ),
            const SizedBox(height: 8),
            Text(c.code, style: const TextStyle(fontFamily: titre, fontSize: 26, color: Colors.white, letterSpacing: 3)),
            const SizedBox(height: 12),
            // Glisser au comptoir : le QR s'affiche en plein écran
            Container(
              decoration: BoxDecoration(color: C.pinClair, borderRadius: BorderRadius.circular(99)),
              child: Stack(alignment: Alignment.center, children: [
                const IgnorePointer(child: Text('Glisse pour afficher au comptoir  →', style: TextStyle(color: Color(0xFFD7E4DC), fontWeight: FontWeight.w600))),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(trackHeight: 44, activeTrackColor: Colors.transparent, inactiveTrackColor: Colors.transparent, thumbColor: C.creme, overlayShape: SliderComponentShape.noOverlay, thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 20)),
                  child: Slider(
                    value: _glisse,
                    onChanged: (v) {
                      setState(() => _glisse = v);
                      if (v > 0.92) { setState(() => _glisse = 0); _pleinEcran(c); }
                    },
                    onChangeEnd: (_) => setState(() => _glisse = 0),
                  ),
                ),
              ]),
            ),
            TextButton.icon(onPressed: () => _pleinEcran(c), icon: const Icon(Icons.fullscreen, color: Colors.white), label: const Text('Afficher en grand', style: TextStyle(color: Colors.white))),
          ]),
        ),
      );

  Future<void> _signaler(BuildContext context, Commande c) async {
    const motifs = {'QUALITE': 'Produit de mauvaise qualité', 'QUANTITE': 'Quantité incomplète', 'COMMERCE_FERME': 'Commerce fermé pendant le créneau', 'PAIEMENT': 'Problème de paiement', 'AUTRE': 'Autre'};
    var motif = 'QUALITE';
    final message = TextEditingController();
    final envoye = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(builder: (ctx, maj) => Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Signaler un problème', style: styleTitre(ctx, taille: 24)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: motif,
                decoration: const InputDecoration(labelText: 'Motif'),
                items: [for (final e in motifs.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
                onChanged: (v) => maj(() => motif = v ?? motif),
              ),
              const SizedBox(height: 12),
              TextField(controller: message, minLines: 3, maxLines: 6, decoration: const InputDecoration(labelText: 'Décris le problème')),
              const SizedBox(height: 16),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Envoyer'))),
            ]),
          )),
    );
    if (envoye != true || !context.mounted) return;
    try {
      await context.read<Session>().api.signaler(c.id, motif, message.text);
      if (context.mounted) toast(context, 'Signalement envoyé. L\'équipe te répond sous 72 heures.');
    } catch (e) {
      if (context.mounted) toast(context, '$e');
    }
  }
}

class QrPleinEcran extends StatelessWidget {
  const QrPleinEcran({super.key, required this.commande});
  final Commande commande;
  @override
  Widget build(BuildContext context) {
    final fin = finDans(commande.fin);
    final avant = commande.debut != null && commande.debut!.isAfter(DateTime.now());
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(commande.commerce?.nom ?? '', style: const TextStyle(fontFamily: titre, fontSize: 26, color: C.pin, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(border: Border.all(color: C.vert, width: 6), borderRadius: BorderRadius.circular(22)),
              child: QrImageView(data: commande.code, size: MediaQuery.of(context).size.width * 0.7),
            ),
            const SizedBox(height: 12),
            Text(commande.code, style: const TextStyle(fontFamily: titre, fontSize: 40, color: C.pin, letterSpacing: 4, fontWeight: FontWeight.w700)),
            Text(avant ? 'Retrait à partir de ${heure(commande.debut)}' : fin != null ? 'Créneau : encore $fin' : 'Créneau terminé',
                style: const TextStyle(color: C.vert, fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 8),
            for (final l in commande.lignes) Text('${l.quantite} × ${l.titre}', style: const TextStyle(color: C.gris)),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer')),
          ]),
        ),
      ),
    );
  }
}

class _Delegation extends StatefulWidget {
  const _Delegation({required this.commande, required this.onChange});
  final Commande commande;
  final VoidCallback onChange;
  @override
  State<_Delegation> createState() => _DelegationState();
}

class _DelegationState extends State<_Delegation> {
  final _nom = TextEditingController();
  String? _lien;

  Future<void> _creer() async {
    try {
      final l = await context.read<Session>().api.deleguer(widget.commande.id, _nom.text.trim());
      setState(() => _lien = l);
    } catch (e) {
      if (mounted) toast(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) => Card(
        child: ExpansionTile(
          shape: const Border(),
          leading: const Icon(Icons.share_outlined),
          title: const Text('Confier le retrait à un ami', style: TextStyle(fontWeight: FontWeight.w700)),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            if (_lien == null) ...[
              const Text('Tu ne peux pas y aller ? Crée un lien : ton ami y verra le QR code à présenter.'),
              const SizedBox(height: 10),
              TextField(controller: _nom, decoration: const InputDecoration(labelText: 'Prénom de ton ami (facultatif)')),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: _creer, child: const Text('Créer le lien'))),
            ] else ...[
              SelectableText(_lien!, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 8, children: [
                FilledButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: _lien!));
                    if (context.mounted) toast(context, 'Lien copié');
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('Copier'),
                ),
                OutlinedButton(
                  onPressed: () => launchUrl(Uri.parse('https://wa.me/?text=${Uri.encodeComponent('Récupère ma commande CampusSave : $_lien')}'), mode: LaunchMode.externalApplication),
                  child: const Text('WhatsApp'),
                ),
                TextButton(
                  onPressed: () async {
                    await context.read<Session>().api.annulerDelegation(widget.commande.id);
                    setState(() => _lien = null);
                    widget.onChange();
                  },
                  child: const Text('Annuler le lien', style: TextStyle(color: C.harissa)),
                ),
              ]),
            ],
          ],
        ),
      );
}

class _Avis extends StatefulWidget {
  const _Avis({required this.commande, required this.onFini});
  final Commande commande;
  final VoidCallback onFini;
  @override
  State<_Avis> createState() => _AvisState();
}

class _AvisState extends State<_Avis> {
  int _note = 0;
  final _commentaire = TextEditingController();

  Future<void> _envoyer() async {
    if (_note == 0) {
      toast(context, 'Choisis une note de 1 à 5.');
      return;
    }
    try {
      await context.read<Session>().api.donnerAvis(widget.commande.id, _note, _commentaire.text.trim());
      widget.onFini();
    } catch (e) {
      if (mounted) toast(context, '$e');
    }
  }

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Comment était ta commande chez ${widget.commande.commerce?.nom ?? ''} ?', style: styleTitre(context, taille: 18)),
            Row(children: [
              for (var n = 1; n <= 5; n++)
                IconButton(
                  tooltip: '$n sur 5',
                  onPressed: () => setState(() => _note = n),
                  icon: Icon(n <= _note ? Icons.star_rounded : Icons.star_outline_rounded, color: C.ble, size: 34),
                ),
            ]),
            TextField(controller: _commentaire, maxLines: 3, decoration: const InputDecoration(labelText: 'Commentaire (facultatif)')),
            const SizedBox(height: 10),
            FilledButton(onPressed: _envoyer, child: const Text('Publier mon avis')),
          ]),
        ),
      );
}
