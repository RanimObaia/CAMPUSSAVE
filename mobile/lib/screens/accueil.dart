import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../services/session.dart';
import 'commandes.dart';
import 'moi.dart';
import 'offres.dart';

// Barre de navigation du bas : Offres, Carte, Favoris, Commandes, Moi
class Accueil extends StatefulWidget {
  const Accueil({super.key});
  @override
  State<Accueil> createState() => _AccueilState();
}

class _AccueilState extends State<Accueil> {
  int _onglet = 0;

  @override
  Widget build(BuildContext context) {
    final s = context.watch<Session>();
    final pages = [const EcranOffres(), const EcranCarte(), const EcranFavoris(), const EcranCommandes(), const EcranMoi()];
    return Scaffold(
      body: IndexedStack(index: _onglet, children: [for (var i = 0; i < pages.length; i++) i == _onglet ? pages[i] : const SizedBox.shrink()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: (i) {
          setState(() => _onglet = i);
          s.rafraichirNotifications();
        },
        destinations: [
          const NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Offres'),
          const NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Carte'),
          const NavigationDestination(icon: Icon(Icons.favorite_border), selectedIcon: Icon(Icons.favorite), label: 'Favoris'),
          const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Commandes'),
          NavigationDestination(
            icon: Badge(isLabelVisible: s.nonLues > 0, label: Text('${s.nonLues}'), child: const Icon(Icons.person_outline)),
            selectedIcon: const Icon(Icons.person),
            label: 'Moi',
          ),
        ],
      ),
    );
  }
}
