// Données de démonstration : commerces autour de l'ESSECT, offres et comptes de test.
//
//   node scripts/seed.js
//
// - Les commerces et les commerçants sont fictifs.
// - Les heures de retrait sont recalculées à chaque lancement (à partir de maintenant) :
//   relance le script le matin de la démo pour avoir des offres disponibles.
// - Le script ne touche qu'aux données "démo" (identifiants qui commencent par "demo-").
//   Il peut être relancé autant de fois que nécessaire, sans créer de doublons.
require('dotenv').config();
const { auth, db, FieldValue } = require('../src/config/firebase');

const MOT_DE_PASSE = 'Demo2026!';

// Créneau de retrait : de "debut" à "fin" heures à partir de maintenant.
const creneau = (debut, fin) => ({
  heureDebutRecuperation: new Date(Date.now() + debut * 3600e3).toISOString(),
  heureFinRecuperation: new Date(Date.now() + fin * 3600e3).toISOString(),
});

const COMMERCES = [
  {
    id: 'demo-el-medina',
    commercant: { email: 'elmedina@demo.campussave.tn', prenom: 'Karim', nom: 'Ben Salah', telephone: '71234567' },
    nom: 'Restaurant El Medina', type: 'RESTAURANT', adresse: 'Avenue de Carthage, Tunis',
    latitude: 36.7982, longitude: 10.1797, horairesOuverture: '11:00 - 22:00',
    description: 'Cuisine tunisienne traditionnelle, plats du jour préparés le midi.',
    offres: [
      { id: 'demo-couscous', titre: 'Couscous au poulet', description: 'Portion généreuse, préparée ce midi.', categorie: 'PLATS', prixInitial: 9000, prixReduit: 4000, quantiteDisponible: 6, ...creneau(1, 4) },
      { id: 'demo-ojja', titre: 'Ojja merguez', description: 'Avec pain maison.', categorie: 'PLATS', prixInitial: 8000, prixReduit: 3500, quantiteDisponible: 4, ...creneau(2, 5) },
      { id: 'demo-sandwich-thon', titre: 'Sandwich thon-harissa', description: 'Pain du jour, œuf et olives.', categorie: 'PLATS', prixInitial: 5000, prixReduit: 2500, quantiteDisponible: 8, ...creneau(0.5, 3) },
    ],
  },
  {
    id: 'demo-le-fournil',
    commercant: { email: 'fournil@demo.campussave.tn', prenom: 'Sonia', nom: 'Gharbi', telephone: '71345678' },
    nom: 'Boulangerie Le Fournil', type: 'BOULANGERIE', adresse: 'Rue Abou Zakaria El Hafsi, Montfleury, Tunis',
    latitude: 36.7895, longitude: 10.1781, horairesOuverture: '06:30 - 20:00',
    description: 'Pain et viennoiseries cuits sur place chaque matin.',
    offres: [
      { id: 'demo-viennoiseries', titre: 'Lot de viennoiseries (6 pièces)', description: 'Croissants et pains au chocolat du jour.', categorie: 'BOULANGERIE', prixInitial: 12000, prixReduit: 4500, quantiteDisponible: 5, ...creneau(1, 3) },
      { id: 'demo-baguettes', titre: 'Pain du jour (2 baguettes)', description: '', categorie: 'BOULANGERIE', prixInitial: 1500, prixReduit: 700, quantiteDisponible: 10, ...creneau(2, 6) },
      { id: 'demo-pain-complet', titre: 'Pain complet aux graines', description: 'Grand format.', categorie: 'BOULANGERIE', prixInitial: 3000, prixReduit: 1500, quantiteDisponible: 3, ...creneau(3, 7) },
    ],
  },
  {
    id: 'demo-essaada',
    commercant: { email: 'essaada@demo.campussave.tn', prenom: 'Hichem', nom: 'Trabelsi', telephone: '71456789' },
    nom: 'Pâtisserie Essaada', type: 'PATISSERIE', adresse: 'Montfleury, Tunis',
    latitude: 36.7871, longitude: 10.1810, horairesOuverture: '08:00 - 21:00',
    description: 'Pâtisseries tunisiennes et gâteaux du jour.',
    offres: [
      { id: 'demo-makroudh', titre: 'Box makroudh et baklawa', description: '6 pièces assorties.', categorie: 'PATISSERIE', prixInitial: 15000, prixReduit: 6000, quantiteDisponible: 3, ...creneau(2, 5) },
      { id: 'demo-tarte-pommes', titre: 'Part de tarte aux pommes', description: '', categorie: 'PATISSERIE', prixInitial: 5000, prixReduit: 2000, quantiteDisponible: 4, ...creneau(1, 4) },
      { id: 'demo-jus-orange', titre: "Jus d'orange pressé (50 cl)", description: 'Pressé le matin même.', categorie: 'BOISSONS', prixInitial: 4000, prixReduit: 2000, quantiteDisponible: 10, ...creneau(0.5, 4) },
    ],
  },
  {
    id: 'demo-cafe-carthage',
    commercant: { email: 'carthage@demo.campussave.tn', prenom: 'Leila', nom: 'Mansour', telephone: '71567890' },
    nom: 'Café Carthage', type: 'CAFETERIA', adresse: 'Boulevard du 9 Avril, Tunis',
    latitude: 36.7930, longitude: 10.1745, horairesOuverture: '07:00 - 19:00',
    description: 'Café, jus frais et petite restauration.',
    offres: [
      { id: 'demo-capucin-cake', titre: 'Capucin + part de cake', description: 'La pause idéale entre deux cours.', categorie: 'BOISSONS', prixInitial: 7000, prixReduit: 3000, quantiteDisponible: 6, ...creneau(1, 3) },
      { id: 'demo-panini', titre: 'Panini poulet-fromage', description: '', categorie: 'PLATS', prixInitial: 6500, prixReduit: 3000, quantiteDisponible: 5, ...creneau(2, 5) },
      { id: 'demo-smoothie', titre: 'Smoothie fraise-banane', description: '', categorie: 'BOISSONS', prixInitial: 6000, prixReduit: 2500, quantiteDisponible: 4, ...creneau(1, 4) },
    ],
  },
  {
    id: 'demo-cafeteria-campus',
    commercant: { email: 'cafeteria@demo.campussave.tn', prenom: 'Mehdi', nom: 'Karray', telephone: '71678901' },
    nom: 'Cafétéria du Campus', type: 'CAFETERIA', adresse: 'Campus ESSECT, Montfleury, Tunis',
    latitude: 36.7889, longitude: 10.1772, horairesOuverture: '07:30 - 17:30',
    description: 'La cafétéria à deux pas des amphis.',
    offres: [
      { id: 'demo-lablabi', titre: 'Lablabi', description: 'Bol chaud, œuf et câpres.', categorie: 'PLATS', prixInitial: 4000, prixReduit: 2000, quantiteDisponible: 7, ...creneau(0.5, 3) },
      { id: 'demo-salade-mechouia', titre: 'Salade méchouia + baguette', description: '', categorie: 'PLATS', prixInitial: 5000, prixReduit: 2500, quantiteDisponible: 5, ...creneau(1, 4) },
      { id: 'demo-croissants-amande', titre: 'Croissants aux amandes (x2)', description: '', categorie: 'BOULANGERIE', prixInitial: 4000, prixReduit: 1800, quantiteDisponible: 6, ...creneau(1, 5) },
    ],
  },
];

// Un commerce en attente, pour montrer la validation par l'admin pendant la démo.
const COMMERCE_EN_ATTENTE = {
  id: 'demo-snack-bardo',
  commercant: { email: 'bardo@demo.campussave.tn', prenom: 'Oussama', nom: 'Haddad', telephone: '71789012' },
  nom: 'Snack Le Bardo', type: 'RESTAURANT', adresse: 'Le Bardo, Tunis',
  latitude: 36.8092, longitude: 10.1342, horairesOuverture: '10:00 - 23:00',
  description: 'Sandwichs et plats rapides.',
};

const ETUDIANT = { email: 'etudiant@demo.campussave.tn', prenom: 'Yasmine', nom: 'Ben Ali', telephone: '22345678', etablissement: 'ESSECT' };

// Crée le compte (ou remet son mot de passe), lui donne son rôle et écrit son profil.
async function compte({ email, prenom, nom, telephone, etablissement }, role) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: MOT_DE_PASSE, disabled: false, displayName: `${prenom} ${nom}` });
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    user = await auth.createUser({ email, password: MOT_DE_PASSE, displayName: `${prenom} ${nom}` });
  }
  await auth.setCustomUserClaims(user.uid, { role });

  const ref = db.collection('users').doc(user.uid);
  const existant = await ref.get();
  const profil = { nom, prenom, email, telephone, role, actif: true };
  if (role === 'student') Object.assign(profil, { etablissement, ecoPoints: existant.data()?.ecoPoints ?? 0 });
  if (!existant.exists) profil.dateInscription = FieldValue.serverTimestamp();
  await ref.set(profil, { merge: true });
  return user.uid;
}

async function commerce(c, uid, statutValidation) {
  const { id, commercant, offres, ...infos } = c;
  const ref = db.collection('shops').doc(id);
  const existant = await ref.get();
  await ref.set(
    {
      ...infos,
      telephone: commercant.telephone,
      idCommercant: uid,
      statutValidation,
      ...(existant.exists ? {} : { dateCreation: FieldValue.serverTimestamp() }),
      ...(statutValidation === 'VALIDE' ? { dateDecision: FieldValue.serverTimestamp() } : {}),
    },
    { merge: true },
  );
}

async function offre(o, commerceId) {
  const { id, ...champs } = o;
  const ref = db.collection('offers').doc(id);
  const existant = await ref.get();
  await ref.set(
    {
      ...champs,
      commerceId,
      statut: champs.quantiteDisponible > 0 ? 'ACTIVE' : 'EPUISEE',
      ...(existant.exists ? { dateModification: FieldValue.serverTimestamp() } : { dateCreation: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
}

(async () => {
  console.log('Création des données de démonstration…');
  for (const c of COMMERCES) {
    const uid = await compte(c.commercant, 'merchant');
    await commerce(c, uid, 'VALIDE');
    for (const o of c.offres) await offre(o, c.id);
    console.log(`  ✅ ${c.nom} (${c.offres.length} offres)`);
  }
  const uidAttente = await compte(COMMERCE_EN_ATTENTE.commercant, 'merchant');
  await commerce({ ...COMMERCE_EN_ATTENTE, offres: [] }, uidAttente, 'EN_ATTENTE');
  console.log(`  ⏳ ${COMMERCE_EN_ATTENTE.nom} (en attente de validation)`);
  await compte(ETUDIANT, 'student');
  console.log(`  🎓 Étudiant ${ETUDIANT.prenom} ${ETUDIANT.nom}`);

  console.log(`\nComptes de démonstration (mot de passe : ${MOT_DE_PASSE}) :`);
  console.log(`  Étudiant   : ${ETUDIANT.email}`);
  for (const c of [...COMMERCES, COMMERCE_EN_ATTENTE]) console.log(`  Commerçant : ${c.commercant.email} (${c.nom})`);
  console.log('  Admin      : crée-le avec  node scripts/create-admin.js <email>');
  process.exit(0);
})().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});