// CampusSave mobile (Flutter) : l'application des étudiants.
// Offres en liste et sur la carte, favoris, panier, paiement Konnect, QR code de retrait,
// délégation à un ami, avis, notifications, impact écologique.
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/accueil.dart';
import 'screens/demarrage.dart';
import 'services/session.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final session = Session();
  await session.demarrer();
  runApp(ChangeNotifierProvider.value(value: session, child: CampusSaveApp(onboardingVu: prefs.getBool('campussave.onboarding') ?? false)));
}

class CampusSaveApp extends StatefulWidget {
  const CampusSaveApp({super.key, required this.onboardingVu});
  final bool onboardingVu;
  @override
  State<CampusSaveApp> createState() => _CampusSaveAppState();
}

class _CampusSaveAppState extends State<CampusSaveApp> {
  late bool _onboardingVu = widget.onboardingVu;

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    final Widget ecran;
    if (!_onboardingVu) {
      ecran = Onboarding(onFini: () => setState(() => _onboardingVu = true));
    } else if (s.utilisateur == null) {
      ecran = const Connexion();
    } else {
      ecran = const Accueil();
    }
    return MaterialApp(
      title: 'CampusSave',
      debugShowCheckedModeBanner: false,
      theme: themeClair(),
      darkTheme: themeSombre(),
      themeMode: s.theme,
      home: ecran,
    );
  }
}
