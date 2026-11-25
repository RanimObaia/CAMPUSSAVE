import 'dart:math';

// Les montants circulent en millimes (1 DT = 1000 millimes), comme dans tout le projet.
String dt(num millimes) => '${(millimes / 1000).toStringAsFixed(3).replaceAll('.', ',')} DT';

// Heure locale « 18:30 »
String heure(DateTime? d) {
  if (d == null) return '';
  final l = d.toLocal();
  return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
}

String dateHeure(DateTime? d) {
  if (d == null) return '—';
  final l = d.toLocal();
  return '${l.day.toString().padLeft(2, '0')}/${l.month.toString().padLeft(2, '0')}/${l.year} ${heure(l)}';
}

int reduction(int initial, int reduit) => initial <= 0 ? 0 : ((1 - reduit / initial) * 100).round();

// Temps restant « 1 h 20 », « 35 min » ou null si c'est fini
String? finDans(DateTime? fin, [DateTime? maintenant]) {
  if (fin == null) return null;
  final minutes = fin.difference(maintenant ?? DateTime.now()).inMinutes;
  if (minutes <= 0) return null;
  if (minutes < 60) return '$minutes min';
  final m = minutes % 60;
  return '${minutes ~/ 60} h${m > 0 ? ' ${m.toString().padLeft(2, '0')}' : ''}';
}

String distance(double? km) {
  if (km == null) return '';
  if (km < 1) return '${(km * 100).round() * 10} m';
  return '${km.toStringAsFixed(1).replaceAll('.', ',')} km';
}

// Distance à vol d'oiseau (haversine), en km arrondis au dixième
double? distanceKm(double? lat1, double? lng1, double? lat2, double? lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  double rad(double x) => x * pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLng = rad(lng2 - lng1);
  final h = pow(sin(dLat / 2), 2) + cos(rad(lat1)) * cos(rad(lat2)) * pow(sin(dLng / 2), 2);
  return (6371 * 2 * asin(sqrt(h)) * 10).round() / 10;
}

const categories = {'BOULANGERIE': 'Boulangerie', 'PLATS': 'Plats', 'PATISSERIE': 'Pâtisserie', 'BOISSONS': 'Boissons'};
const regimes = {
  'VEGETARIEN': 'Végétarien', 'VEGAN': 'Végan', 'SANS_GLUTEN': 'Sans gluten', 'SANS_LACTOSE': 'Sans lactose', 'FAIT_MAISON': 'Fait maison',
};
const statutsCommande = {
  'EN_ATTENTE_PAIEMENT': 'En attente de paiement', 'PAYEE': 'Payée', 'PRETE': 'Prête', 'RECUPEREE': 'Récupérée', 'ANNULEE': 'Annulée',
};
