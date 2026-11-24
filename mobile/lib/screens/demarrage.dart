import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';

// Présentation au premier lancement (3 écrans), puis connexion
class Onboarding extends StatefulWidget {
  const Onboarding({super.key, required this.onFini});
  final VoidCallback onFini;
  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _OnboardingState extends State<Onboarding> {
  final _pages = PageController();
  int _i = 0;
  static const _contenu = [
    (Icons.search, 'Découvre', 'Les restaurants, cafés et boulangeries autour de l\'ESSECT vendent leurs invendus du jour à moitié prix ou moins.'),
    (Icons.credit_card, 'Réserve et paie', 'Paie en ligne avec Konnect. Tu reçois un e-mail de confirmation avec ton QR code.'),
    (Icons.qr_code_2, 'Récupère', 'Passe au commerce pendant le créneau et montre ton QR code. Chaque repas sauvé évite 2,5 kg de CO2.'),
  ];

  Future<void> _fin() async {
    final p = await SharedPreferences.getInstance();
    await p.setBool('campussave.onboarding', true);
    widget.onFini();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.pin,
      body: SafeArea(
        child: Column(children: [
          Align(alignment: Alignment.centerRight, child: TextButton(onPressed: _fin, child: const Text('Passer', style: TextStyle(color: C.creme)))),
          Expanded(
            child: PageView.builder(
              controller: _pages,
              itemCount: _contenu.length,
              onPageChanged: (i) => setState(() => _i = i),
              itemBuilder: (_, i) {
                final (icone, titrePage, texte) = _contenu[i];
                return Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 120, height: 136,
                      decoration: const BoxDecoration(color: C.vert, borderRadius: BorderRadius.only(topLeft: Radius.circular(60), topRight: Radius.circular(60), bottomLeft: Radius.circular(18), bottomRight: Radius.circular(18))),
                      child: Icon(icone, color: C.creme, size: 54),
                    ),
                    const SizedBox(height: 40),
                    Text(titrePage, style: const TextStyle(fontFamily: titre, fontSize: 44, color: Colors.white, fontWeight: FontWeight.w500, height: 1)),
                    const SizedBox(height: 16),
                    Text(texte, style: const TextStyle(color: Color(0xFFB9CFC2), fontSize: 17, height: 1.4)),
                  ]),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(32, 0, 32, 24),
            child: Row(children: [
              ...List.generate(_contenu.length, (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 6),
                    width: i == _i ? 24 : 8, height: 8,
                    decoration: BoxDecoration(color: i == _i ? C.creme : C.pinClair, borderRadius: BorderRadius.circular(99)),
                  )),
              const Spacer(),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: C.creme, foregroundColor: C.pin),
                onPressed: () => _i < _contenu.length - 1 ? _pages.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut) : _fin(),
                child: Text(_i < _contenu.length - 1 ? 'Suivant' : 'Commencer'),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class Connexion extends StatefulWidget {
  const Connexion({super.key});
  @override
  State<Connexion> createState() => _ConnexionState();
}

class _ConnexionState extends State<Connexion> {
  final _email = TextEditingController(text: kUseMock ? 'etudiant@demo.tn' : '');
  final _mdp = TextEditingController(text: kUseMock ? 'demo' : '');
  String _erreur = '';
  bool _envoi = false;

  Future<void> _valider() async {
    setState(() { _envoi = true; _erreur = ''; });
    try {
      await context.read<Session>().connexion(_email.text, _mdp.text);
    } catch (e) {
      setState(() => _erreur = '$e');
    }
    if (mounted) setState(() => _envoi = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(24), children: [
          const SizedBox(height: 24),
          Row(children: [
            const CircleAvatar(radius: 18, backgroundColor: C.vert, child: Icon(Icons.room_service, color: C.creme, size: 20)),
            const SizedBox(width: 10),
            Text('CampusSave', style: styleTitre(context, taille: 22)),
          ]),
          const SizedBox(height: 40),
          Text('Content de te revoir', style: styleTitre(context, taille: 34)),
          const SizedBox(height: 8),
          Text('Connecte-toi pour sauver ton prochain repas.', style: TextStyle(color: Theme.of(context).hintColor)),
          if (kUseMock) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: C.blePale, borderRadius: BorderRadius.circular(12)),
              child: const Text('Mode démo : n\'importe quelle adresse et n\'importe quel mot de passe.', style: TextStyle(color: C.ble)),
            ),
          ],
          const SizedBox(height: 24),
          if (_erreur.isNotEmpty) ...[MessageErreur(_erreur), const SizedBox(height: 16)],
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], decoration: const InputDecoration(labelText: 'Adresse e-mail')),
          const SizedBox(height: 14),
          TextField(controller: _mdp, obscureText: true, autofillHints: const [AutofillHints.password], decoration: const InputDecoration(labelText: 'Mot de passe'), onSubmitted: (_) => _valider()),
          const SizedBox(height: 22),
          FilledButton(onPressed: _envoi ? null : _valider, child: Text(_envoi ? 'Connexion…' : 'Se connecter')),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Inscription())), child: const Text('Créer un compte étudiant')),
        ]),
      ),
    );
  }
}

class Inscription extends StatefulWidget {
  const Inscription({super.key});
  @override
  State<Inscription> createState() => _InscriptionState();
}

class _InscriptionState extends State<Inscription> {
  final _cle = GlobalKey<FormState>();
  final _prenom = TextEditingController();
  final _nom = TextEditingController();
  final _email = TextEditingController();
  final _mdp = TextEditingController();
  final _etab = TextEditingController(text: 'ESSECT');
  bool _cgu = false;
  String _erreur = '';
  bool _envoi = false;

  Future<void> _valider() async {
    if (!_cle.currentState!.validate()) return;
    if (!_cgu) { setState(() => _erreur = 'Accepte les conditions d\'utilisation pour continuer.'); return; }
    setState(() { _envoi = true; _erreur = ''; });
    try {
      await context.read<Session>().inscription(prenom: _prenom.text.trim(), nom: _nom.text.trim(), email: _email.text.trim(), mdp: _mdp.text, etablissement: _etab.text.trim());
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() { _erreur = '$e'; _envoi = false; });
    }
  }

  String? _requis(String? v) => (v == null || v.trim().isEmpty) ? 'Obligatoire' : null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Créer un compte')),
      body: Form(
        key: _cle,
        child: ListView(padding: const EdgeInsets.all(24), children: [
          if (_erreur.isNotEmpty) ...[MessageErreur(_erreur), const SizedBox(height: 16)],
          Row(children: [
            Expanded(child: TextFormField(controller: _prenom, decoration: const InputDecoration(labelText: 'Prénom'), validator: _requis)),
            const SizedBox(width: 12),
            Expanded(child: TextFormField(controller: _nom, decoration: const InputDecoration(labelText: 'Nom'), validator: _requis)),
          ]),
          const SizedBox(height: 14),
          TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Adresse e-mail'), validator: (v) => (v ?? '').contains('@') ? null : 'Adresse e-mail invalide'),
          const SizedBox(height: 14),
          TextFormField(controller: _mdp, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe (8 caractères au moins)'), validator: (v) => (v ?? '').length >= 8 ? null : '8 caractères au moins'),
          const SizedBox(height: 14),
          TextFormField(controller: _etab, decoration: const InputDecoration(labelText: 'Établissement (facultatif)')),
          const SizedBox(height: 8),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _cgu,
            onChanged: (v) => setState(() => _cgu = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('J\'accepte les conditions d\'utilisation et la politique de confidentialité de CampusSave.'),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: _envoi ? null : _valider, child: Text(_envoi ? 'Création…' : 'Créer mon compte')),
        ]),
      ),
    );
  }
}
