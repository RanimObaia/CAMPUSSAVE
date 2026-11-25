import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Les contrôleurs pour récupérer ce que l'utilisateur tape
  final TextEditingController _nomController = TextEditingController();
  final TextEditingController _prenomController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _telephoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _emailController.dispose();
    _telephoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 1. On crée le compte avec Firebase
      final userCredential =
          await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      print("✅ Compte créé avec succès ! ID : ${userCredential.user?.uid}");

      // ICI PLUS TARD : On enverra les infos (nom, prénom, tel) à ton API Node.js
      // pour les enregistrer dans la base de données Firestore.

      // 2. On affiche un message de succès
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content:
              Text("Compte créé avec succès ! Vous pouvez vous connecter."),
          backgroundColor: Colors.green,
        ),
      );

      // 3. On retourne à la page de connexion
      Navigator.pop(context);
    } on FirebaseAuthException catch (e) {
      String messageErreur = "Une erreur est survenue.";
      if (e.code == 'weak-password') {
        messageErreur =
            "Le mot de passe est trop faible (6 caractères minimum).";
      } else if (e.code == 'email-already-in-use') {
        messageErreur = "Un compte existe déjà avec cet email.";
      } else if (e.code == 'invalid-email') {
        messageErreur = "Le format de l'email est invalide.";
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(messageErreur),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
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
      appBar: AppBar(
        backgroundColor: Colors.transparent, // Fond transparent
        elevation: 0,
        iconTheme:
            const IconThemeData(color: Colors.black), // Flèche de retour noire
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Créer un compte',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F7635),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Rejoignez CampusSave et sauvez des repas',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
              const SizedBox(height: 30),

              // Champ Prénom
              TextField(
                controller: _prenomController,
                decoration: const InputDecoration(
                  labelText: 'Prénom',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 16),

              // Champ Nom
              TextField(
                controller: _nomController,
                decoration: const InputDecoration(
                  labelText: 'Nom',
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 16),

              // Champ Email
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Adresse Email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // Champ Téléphone (8 chiffres selon le résumé)
              TextField(
                controller: _telephoneController,
                keyboardType: TextInputType.phone,
                maxLength: 8, // Limite à 8 chiffres
                decoration: const InputDecoration(
                  labelText: 'Numéro de téléphone',
                  prefixIcon: Icon(Icons.phone_outlined),
                  counterText: "", // Cache le petit compteur "0/8" en bas
                ),
              ),
              const SizedBox(height: 16),

              // Champ Mot de passe
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mot de passe',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
              ),
              const SizedBox(height: 30),

              // Bouton S'inscrire
              SizedBox(
                height: 55,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: _register,
                        child: const Text(
                          "S'inscrire",
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
