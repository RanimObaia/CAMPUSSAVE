import 'package:material_ui/material_ui.dart';

// Charte CampusSave (identique au site web) : pin profond + crème, accent « harissa »
class C {
  static const pin = Color(0xFF133B2C);
  static const pinClair = Color(0xFF1D4A38);
  static const vert = Color(0xFF1C6A4B);
  static const vertPale = Color(0xFFDCEADF);
  static const creme = Color(0xFFF3EDE1);
  static const sable = Color(0xFFE9E0CF);
  static const papier = Color(0xFFFFFCF6);
  static const encre = Color(0xFF1B2A22);
  static const gris = Color(0xFF5B6A60);
  static const trait = Color(0xFFE2D8C6);
  static const harissa = Color(0xFFB5432A);
  static const harissaPale = Color(0xFFF6E1D9);
  static const ble = Color(0xFF9A6A12);
  static const blePale = Color(0xFFF5E8C8);

  static Color categorie(String code) => switch (code) {
        'BOULANGERIE' => const Color(0xFFC08A35),
        'PATISSERIE' => harissa,
        'BOISSONS' => const Color(0xFF4B6F62),
        _ => vert,
      };
}

const titre = 'serif';

ThemeData themeClair() => _theme(Brightness.light);
ThemeData themeSombre() => _theme(Brightness.dark);

ThemeData _theme(Brightness b) {
  final sombre = b == Brightness.dark;
  final fond = sombre ? const Color(0xFF121A16) : C.creme;
  final carte = sombre ? const Color(0xFF18221D) : C.papier;
  final texte = sombre ? const Color(0xFFEBE5D8) : C.encre;
  final scheme = ColorScheme.fromSeed(
    seedColor: C.vert,
    brightness: b,
    primary: sombre ? const Color(0xFF3FA77A) : C.vert,
    secondary: C.harissa,
    surface: carte,
    onSurface: texte,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: fond,
    appBarTheme: AppBarTheme(
      backgroundColor: fond,
      foregroundColor: texte,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(fontFamily: titre, fontSize: 24, fontWeight: FontWeight.w600, color: texte),
    ),
    cardTheme: CardThemeData(
      color: carte,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: sombre ? const Color(0xFF2C3A33) : C.trait),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 50),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        shape: const StadiumBorder(),
        side: BorderSide(color: scheme.primary, width: 1.5),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: carte,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: sombre ? const Color(0xFF2C3A33) : C.trait)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: sombre ? const Color(0xFF2C3A33) : C.trait, width: 1.5)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: scheme.primary, width: 2)),
    ),
    chipTheme: ChipThemeData(shape: const StadiumBorder(), side: BorderSide(color: sombre ? const Color(0xFF2C3A33) : C.trait)),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: carte,
      indicatorColor: sombre ? const Color(0xFF1D3A2D) : C.vertPale,
      labelTextStyle: WidgetStatePropertyAll(TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: texte)),
    ),
  );
}

// Titre en serif, comme les titres du site
TextStyle styleTitre(BuildContext context, {double taille = 28}) => TextStyle(
      fontFamily: titre,
      fontSize: taille,
      fontWeight: FontWeight.w600,
      height: 1.1,
      letterSpacing: -0.4,
      color: Theme.of(context).colorScheme.onSurface,
    );
