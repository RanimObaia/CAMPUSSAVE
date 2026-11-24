import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import 'commandes.dart';

class EcranPanier extends StatefulWidget {
  const EcranPanier({super.key});
  @override
  State<EcranPanier> createState() => _EcranPanierState();
}

class _EcranPanierState extends State<EcranPanier> {
  bool _envoi = false;
  String _erreur = '';

  // 1. l'API crée la commande (prix et stock vérifiés, quantités réservées)
  // 2. l'API demande un lien de paiement à Konnect
  // 3. paiement (page Konnect, ou page simulée en démo), puis attente de la confirmation
  Future<void> _commander() async {
    final s = context.read<Session>();
    setState(() { _envoi = true; _erreur = ''; });
    try {
      final c = await s.api.creerCommande(s.commercePanier!.id, {for (final e in s.panier.entries) e.key: e.value.$2});
      final lien = await s.api.initierPaiement(c.id);
      if (!mounted) return;
      if (!lien.startsWith('demo:')) await launchUrl(Uri.parse(lien), mode: LaunchMode.externalApplication);
      if (!mounted) return;
      await Navigator.push(context, MaterialPageRoute(builder: (_) => kUseMock ? EcranPaiementDemo(commande: c) : EcranAttentePaiement(commandeId: c.id)));
    } catch (e) {
      setState(() => _erreur = '$e');
    }
    if (mounted) setState(() => _envoi = false);
  }

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    if (s.panier.isEmpty) {
      return Scaffold(appBar: AppBar(title: const Text('Mon panier')), body: const Vide(texte: 'Ton panier est vide.', icone: Icons.shopping_bag_outlined));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Mon panier'), actions: [
        TextButton(onPressed: _envoi ? null : () => s.viderPanier(), child: const Text('Vider')),
      ]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text('Retrait chez ${s.commercePanier?.nom}, ${s.commercePanier?.adresse}', style: TextStyle(color: Theme.of(context).hintColor)),
        const SizedBox(height: 12),
        for (final e in s.panier.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Cloche(categorie: e.value.$1.categorie, photoUrl: e.value.$1.photoUrl, largeur: 44, hauteur: 50),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(e.value.$1.titre, style: styleTitre(context, taille: 16)),
                    Text('${dt(e.value.$1.prixReduit)} l\'unité · ${heure(e.value.$1.debut)} – ${heure(e.value.$1.fin)}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
                  ])),
                  IconButton(onPressed: () => s.changerQuantite(e.key, e.value.$2 - 1), icon: Icon(e.value.$2 == 1 ? Icons.delete_outline : Icons.remove)),
                  Text('${e.value.$2}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  IconButton(onPressed: e.value.$2 < e.value.$1.quantiteDisponible ? () => s.changerQuantite(e.key, e.value.$2 + 1) : null, icon: const Icon(Icons.add)),
                ]),
              ),
            ),
          ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              _ligne('Articles', '${s.nbArticles}'),
              _ligne('Tu économises', dt(s.economie), couleur: C.vert),
              const Divider(height: 24),
              Row(children: [const Text('Total'), const Spacer(), Text(dt(s.total), style: styleTitre(context, taille: 30))]),
            ]),
          ),
        ),
        if (_erreur.isNotEmpty) ...[const SizedBox(height: 12), MessageErreur(_erreur)],
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            FilledButton(onPressed: _envoi ? null : _commander, child: Text(_envoi ? 'Préparation du paiement…' : 'Commander et payer ${dt(s.total)}')),
            const SizedBox(height: 6),
            Text('Paiement sécurisé par carte avec Konnect', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
          ]),
        ),
      ),
    );
  }

  Widget _ligne(String a, String b, {Color? couleur}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [Text(a, style: TextStyle(color: couleur)), const Spacer(), Text(b, style: TextStyle(color: couleur, fontWeight: FontWeight.w700))]),
      );
}

// Mode démo : remplace la page Konnect (carte de test) et joue le rôle du webhook
class EcranPaiementDemo extends StatefulWidget {
  const EcranPaiementDemo({super.key, required this.commande});
  final Commande commande;
  @override
  State<EcranPaiementDemo> createState() => _EcranPaiementDemoState();
}

class _EcranPaiementDemoState extends State<EcranPaiementDemo> {
  bool _envoi = false;
  Future<void> _terminer(bool reussi) async {
    setState(() => _envoi = true);
    final s = context.read<Session>();
    final c = await s.api.simulerPaiement(widget.commande.id, reussi);
    if (!mounted) return;
    await Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => EcranResultatPaiement(commande: c)));
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.commande;
    return Scaffold(
      appBar: AppBar(title: const Text('Paiement Konnect')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: C.blePale, borderRadius: BorderRadius.circular(12)),
          child: const Text('Mode démo : paiement simulé. Avec le backend, cette étape se fait sur la page Konnect.', style: TextStyle(color: C.ble, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 20),
        Text('Commande ${c.code} · ${c.commerce?.nom ?? ''}', style: TextStyle(color: Theme.of(context).hintColor)),
        Text(dt(c.montantTotal), style: styleTitre(context, taille: 44)),
        const SizedBox(height: 16),
        const TextField(enabled: false, decoration: InputDecoration(labelText: 'Numéro de carte (test)', hintText: '4242 4242 4242 4242')),
        const SizedBox(height: 12),
        const Row(children: [
          Expanded(child: TextField(enabled: false, decoration: InputDecoration(labelText: 'Expiration', hintText: '12/28'))),
          SizedBox(width: 12),
          Expanded(child: TextField(enabled: false, decoration: InputDecoration(labelText: 'CVC', hintText: '123'))),
        ]),
        const SizedBox(height: 24),
        FilledButton(onPressed: _envoi ? null : () => _terminer(true), child: Text('Payer ${dt(c.montantTotal)}')),
        const SizedBox(height: 10),
        OutlinedButton(
          style: OutlinedButton.styleFrom(foregroundColor: C.harissa, side: const BorderSide(color: C.harissa)),
          onPressed: _envoi ? null : () => _terminer(false),
          child: const Text('Simuler un paiement refusé'),
        ),
      ]),
    );
  }
}

// Vrai paiement : l'étudiant paie sur la page Konnect (navigateur), l'app attend la confirmation du serveur
class EcranAttentePaiement extends StatefulWidget {
  const EcranAttentePaiement({super.key, required this.commandeId});
  final String commandeId;
  @override
  State<EcranAttentePaiement> createState() => _EcranAttentePaiementState();
}

class _EcranAttentePaiementState extends State<EcranAttentePaiement> with WidgetsBindingObserver {
  Timer? _minuteur;
  int _essais = 0;
  String _erreur = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _minuteur = Timer.periodic(const Duration(seconds: 3), (_) => _verifier());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState etat) {
    if (etat == AppLifecycleState.resumed) _verifier(); // retour depuis la page Konnect
  }

  Future<void> _verifier() async {
    try {
      final c = await context.read<Session>().api.commande(widget.commandeId);
      _essais++;
      if (c.statut != 'EN_ATTENTE_PAIEMENT' && mounted) {
        _minuteur?.cancel();
        await Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => EcranResultatPaiement(commande: c)));
      } else if (_essais > 200) {
        _minuteur?.cancel();
      }
    } catch (e) {
      if (mounted) setState(() => _erreur = '$e');
    }
  }

  Future<void> _abandonner() async {
    final s = context.read<Session>();
    try {
      final c = await s.api.annulerCommande(widget.commandeId);
      if (mounted) await Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => EcranResultatPaiement(commande: c)));
    } catch (e) {
      if (mounted) setState(() => _erreur = '$e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _minuteur?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Paiement')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 24),
            Text('Vérification du paiement', style: styleTitre(context, taille: 26)),
            const SizedBox(height: 8),
            const Text('Termine le paiement sur la page Konnect, puis reviens ici : la confirmation arrive automatiquement.', textAlign: TextAlign.center),
            if (_erreur.isNotEmpty) ...[const SizedBox(height: 16), MessageErreur(_erreur)],
            const SizedBox(height: 24),
            TextButton(onPressed: _abandonner, child: const Text('J\'ai annulé ou le paiement a échoué')),
          ]),
        ),
      );
}

// Résultat : paiement réussi (e-mail de confirmation + QR) ou refusé (e-mail « non abouti »)
class EcranResultatPaiement extends StatelessWidget {
  const EcranResultatPaiement({super.key, required this.commande});
  final Commande commande;

  @override
  Widget build(BuildContext context) {
    final s = context.read<Session>();
    final ok = commande.aRetirer || commande.statut == 'RECUPEREE';
    // Après l'affichage (on ne modifie pas l'état partagé pendant la construction de l'écran)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ok) s.viderPanier();
      s.rafraichirNotifications();
    });
    final email = commande.emailEtudiant ?? s.utilisateur?.email ?? '';
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 92, height: 104,
              decoration: BoxDecoration(color: ok ? C.vert : C.harissa, borderRadius: const BorderRadius.only(topLeft: Radius.circular(46), topRight: Radius.circular(46), bottomLeft: Radius.circular(16), bottomRight: Radius.circular(16))),
              child: Icon(ok ? Icons.check : Icons.close, color: Colors.white, size: 44),
            ),
            const SizedBox(height: 24),
            Text(ok ? 'Paiement réussi' : 'Paiement échoué', style: styleTitre(context, taille: 34)),
            const SizedBox(height: 8),
            Text('Commande ${commande.code} · ${dt(commande.montantTotal)}', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                leading: Icon(Icons.mark_email_read_outlined, color: ok ? C.vert : C.harissa),
                title: Text(ok ? 'E-mail de confirmation envoyé' : 'E-mail « paiement non abouti » envoyé'),
                subtitle: Text(ok ? 'À $email, avec ton QR code de retrait.' : 'À $email. Aucun montant n\'a été débité, la commande est annulée.'),
              ),
            ),
            const SizedBox(height: 24),
            if (ok)
              FilledButton(
                onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => EcranCommande(id: commande.id))),
                child: const Text('Voir mon QR code'),
              )
            else
              FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Retour au panier')),
          ]),
        ),
      ),
    );
  }
}
