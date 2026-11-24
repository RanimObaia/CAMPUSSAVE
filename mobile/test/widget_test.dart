// Tests de l'application en mode démo (aucun serveur nécessaire) : flutter test
import 'package:campussave/models/modeles.dart';
import 'package:campussave/services/api_mock.dart';
import 'package:campussave/services/format.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('format : millimes en dinars, distances, remise', () {
    expect(dt(4500), '4,500 DT');
    expect(distance(0.35), '350 m');
    expect(distance(1.24), '1,2 km');
    expect(reduction(12000, 4500), 63);
  });

  test('offres : tri par distance et filtre végétarien', () async {
    final api = ApiMock();
    final f = Filtres()..tri = 'distance';
    final offres = await api.offres(f);
    expect(offres, isNotEmpty);
    for (var i = 1; i < offres.length; i++) {
      expect(offres[i].distanceKm! >= offres[i - 1].distanceKm!, isTrue);
    }
    final vege = await api.offres(Filtres()..regime = 'VEGETARIEN');
    expect(vege.every((o) => o.regimes.contains('VEGETARIEN')), isTrue);
  });

  test('paiement réussi : QR, e-mail de confirmation, notification', () async {
    final api = ApiMock();
    await api.connexion('etudiant@demo.tn', 'x');
    final c = await api.creerCommande('s1', {'o1': 2});
    expect(c.statut, 'EN_ATTENTE_PAIEMENT');
    expect(await api.initierPaiement(c.id), startsWith('demo:'));
    final payee = await api.simulerPaiement(c.id, true);
    expect(payee.statut, 'PAYEE');
    expect(payee.emailEnvoye, isTrue);
    final (nonLues, notifs) = await api.notifications();
    expect(nonLues, greaterThan(0));
    expect(notifs.first.type, 'PAIEMENT_REUSSI');
  });

  test('paiement refusé : commande annulée, stock remis, e-mail de refus', () async {
    final api = ApiMock();
    await api.connexion('etudiant@demo.tn', 'x');
    final avant = (await api.offre('o15')).quantiteDisponible;
    final c = await api.creerCommande('s5', {'o15': 3});
    expect((await api.offre('o15')).quantiteDisponible, avant - 3);
    await api.initierPaiement(c.id);
    final refusee = await api.simulerPaiement(c.id, false);
    expect(refusee.statut, 'ANNULEE');
    expect(refusee.emailEchecEnvoye, isTrue);
    expect((await api.offre('o15')).quantiteDisponible, avant);
  });

  test('avis seulement après retrait, une seule fois', () async {
    final api = ApiMock();
    await api.donnerAvis('c91', 5, 'Parfait');
    expect(() => api.donnerAvis('c91', 4, ''), throwsA(isA<Exception>()));
  });
}
