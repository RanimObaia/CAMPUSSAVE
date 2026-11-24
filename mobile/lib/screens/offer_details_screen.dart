import 'package:flutter/material.dart';
import 'offer_details_screen.dart';

class OfferDetailsScreen extends StatelessWidget {
  const OfferDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          // Image de l'offre
          Image.network(
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            height: 250,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) =>
                Container(height: 250, color: Colors.grey[200]),
          ),
          const SizedBox(height: 20),

          // Détails
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(24.0),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Le Bistro Campus',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F7635).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('En stock',
                            style: TextStyle(
                                color: Color(0xFF0F7635),
                                fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Panier Gourmet Chaud du Midi',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Un délicieux repas composé de produits frais et locaux, sauvé du gaspillage alimentaire.',
                    style: TextStyle(
                        fontSize: 16, color: Colors.black54, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  const Row(
                    children: [
                      Icon(Icons.access_time, color: Color(0xFF0F7635)),
                      SizedBox(width: 8),
                      Text('Retrait : 13h30 - 15h00',
                          style: TextStyle(fontSize: 16)),
                    ],
                  ),
                  const Spacer(),

                  // Prix et bouton d'ajout
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Prix réduit',
                              style: TextStyle(color: Colors.grey)),
                          Text('6.5 DT',
                              style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F7635))),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          // On fera la logique du panier plus tard
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Ajouté au panier !'),
                                backgroundColor: Color(0xFF0F7635)),
                          );
                        },
                        icon: const Icon(Icons.add_shopping_cart),
                        label: const Text('Ajouter',
                            style: TextStyle(fontSize: 16)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 16),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
