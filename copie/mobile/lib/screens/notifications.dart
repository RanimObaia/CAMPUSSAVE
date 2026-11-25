import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../models/modeles.dart';
import '../services/format.dart';
import '../services/session.dart';
import '../theme.dart';
import '../widgets/communs.dart';
import 'commandes.dart';
import 'offres.dart';

class EcranNotifications extends StatefulWidget {
  const EcranNotifications({super.key});
  @override
  State<EcranNotifications> createState() => _EcranNotificationsState();
}

class _EcranNotificationsState extends State<EcranNotifications> {
  late Future<(int, List<NotificationCs>)> _liste;
  static const _icones = {
    'OFFRE_FAVORI': Icons.favorite, 'RAPPEL_RETRAIT': Icons.alarm, 'COMMANDE_PRETE': Icons.check_circle_outline,
    'COMMANDE_REMISE': Icons.check_circle, 'PAIEMENT_REUSSI': Icons.receipt_long, 'PAIEMENT_ECHOUE': Icons.error_outline, 'SIGNALEMENT': Icons.flag_outlined,
  };

  @override
  void initState() {
    super.initState();
    _charger();
  }

  void _charger() {
    setState(() => _liste = context.read<Session>().api.notifications());
    context.read<Session>().rafraichirNotifications();
  }

  Future<void> _ouvrir(NotificationCs n) async {
    final api = context.read<Session>().api;
    if (!n.lu) await api.notificationLue(n.id);
    if (!mounted) return;
    if (n.commandeId != null) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => EcranCommande(id: n.commandeId!)));
    } else if (n.offreId != null) {
      await ouvrirOffre(context, n.offreId!);
    }
    _charger();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Notifications'), actions: [
          TextButton(onPressed: () async { await context.read<Session>().api.toutLu(); _charger(); }, child: const Text('Tout lu')),
        ]),
        body: FutureBuilder<(int, List<NotificationCs>)>(
          future: _liste,
          builder: (context, snap) {
            if (snap.hasError) return Padding(padding: const EdgeInsets.all(16), child: MessageErreur('${snap.error}'));
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final l = snap.data!.$2;
            if (l.isEmpty) return const Vide(texte: 'Aucune notification pour l\'instant.', icone: Icons.notifications_none);
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: l.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final n = l[i];
                return Card(
                  shape: n.lu ? null : RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: C.vert, width: 1.5)),
                  child: ListTile(
                    leading: CircleAvatar(backgroundColor: C.vertPale, child: Icon(_icones[n.type] ?? Icons.notifications_none, color: C.vert)),
                    title: Text(n.titre, style: TextStyle(fontWeight: n.lu ? FontWeight.w500 : FontWeight.w800)),
                    subtitle: Text('${n.corps}\n${dateHeure(n.date)}'),
                    isThreeLine: true,
                    trailing: n.lu ? null : const CircleAvatar(radius: 5, backgroundColor: C.harissa),
                    onTap: () => _ouvrir(n),
                  ),
                );
              },
            );
          },
        ),
      );
}
