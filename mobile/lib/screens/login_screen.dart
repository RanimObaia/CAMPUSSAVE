import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'register_screen.dart';
import 'main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final userCredential =
          await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      print("✅ Connecté avec succès ! ID : ${userCredential.user?.uid}");

      // Redirection vers la page principale
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainNavigationScreen()),
        );
      }
    } on FirebaseAuthException catch (e) {
      String messageErreur = "Une erreur est survenue.";
      if (e.code == 'user-not-found') {
        messageErreur = "Aucun utilisateur trouvé pour cet email.";
      } else if (e.code == 'wrong-password') {
        messageErreur = "Mot de passe incorrect.";
      } else if (e.code == 'invalid-email') {
        messageErreur = "Le format de l'email est invalide.";
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(messageErreur),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating, // Pop-up flottant
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Le Logo / Icône
                const Icon(
                  Icons.eco, // Icône de feuille
                  size: 80,
                  color: Color(0xFF0F7635),
                ),
                const SizedBox(height: 16),

                // 2. Le Titre
                const Text(
                  'CampusSave',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F7635),
                  ),
                ),
                const SizedBox(height: 8),

                // 3. Le sous-titre
                const Text(
                  'Connectez-vous pour sauver des repas',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 40),

                // 4. Champ Email
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Adresse Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Champ Mot de passe
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Mot de passe',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 32),

                // 6. Bouton Se Connecter
                SizedBox(
                  height: 55,
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : ElevatedButton(
                          onPressed: _login,
                          child: const Text(
                            'Se connecter',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ),
                ),
                const SizedBox(height: 16),

                // 7. Bouton S'inscrire
                // 7. Bouton S'inscrire
                TextButton(
                  onPressed: () {
                    // On navigue vers la page d'inscription
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const RegisterScreen()),
                    );
                  },
                  child: const Text(
                    "Pas encore de compte ? S'inscrire",
                    style: TextStyle(
                      color: Color(0xFF0F7635),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
