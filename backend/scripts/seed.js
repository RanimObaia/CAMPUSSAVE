require('dotenv').config();
const { auth, db, FieldValue } = require('../src/config/firebase');

const MOT_DE_PASSE = 'Demo2026!';
const DOMAINE_DEMO = '@demo.campussave.tn';

// Créneau de retrait : de "debut" à "fin" heures à partir de maintenant.
const creneau = (debut, fin) => ({
  heureDebutRecuperation: new Date(Date.now() + debut * 3600e3).toISOString(),
  heureFinRecuperation: new Date(Date.now() + fin * 3600e3).toISOString(),
});

// Photos réelles (web/public/photos) : champ ajouté en plus des données de l'équipe.
const PHOTOS = {
  'demo-capucin-croissant': 'capucin-croissant', 'demo-chapati': 'chapati', 'demo-jus-fraise': 'jus-fraise',
  'demo-makloub': 'makloub', 'demo-pizza-neptune': 'pizza', 'demo-baguette-farcie': 'baguette-farcie',
  'demo-viennoiseries': 'viennoiseries', 'demo-baguettes': 'baguettes', 'demo-tabouna': 'tabouna',
  'demo-assortiment-tunisien': 'assortiment-tunisien', 'demo-makroudh': 'makroudh',
  'demo-mille-feuille': 'mille-feuille', 'demo-tarte-fruits': 'tarte-fruits', 'demo-citronnade': 'citronnade',
  'demo-cheesecake': 'cheesecake', 'demo-donuts': 'donuts',
  'demo-cafe-chez-nous': 'commerce-cafe', 'demo-gg-food': 'commerce-restaurant', 'demo-layal': 'baguettes',
  'demo-hajja-naziha': 'commerce-patisserie', 'demo-ben-rjab': 'mille-feuille', 'demo-delicious-yacine': 'cheesecake',
  'demo-horizon': 'brik',
};
const photo = (id) => (PHOTOS[id] ? { photoUrl: `/photos/${PHOTOS[id]}.jpg` } : {});

const COMMERCES = [
  {
    id: 'demo-cafe-chez-nous',
    commercant: { email: `cheznous${DOMAINE_DEMO}`, prenom: 'Sami', nom: 'Ben Amor', telephone: '20111222' },
    nom: 'Café Chez Nous', type: 'CAFETERIA', adresse: 'Avenue Ali Trad, Montfleury, Tunis (en face de l\'ESSECT)',
    latitude: 36.7874681, longitude: 10.1742779, horairesOuverture: '05:00 - 00:00',
    description: 'Le café juste en face de la fac : boissons chaudes, jus et petite restauration.',
    offres: [
      { id: 'demo-capucin-croissant', titre: 'Capucin + croissant', description: 'La pause entre deux cours.', categorie: 'BOISSONS', prixInitial: 3500, prixReduit: 1500, quantiteDisponible: 8, ...creneau(0.5, 3) },
      { id: 'demo-chapati', titre: 'Chapati thon-fromage', description: 'Préparé à midi.', categorie: 'PLATS', prixInitial: 4500, prixReduit: 2000, quantiteDisponible: 6, ...creneau(1, 4) },
      { id: 'demo-jus-fraise', titre: 'Jus de fraise (33 cl)', description: 'Pressé le jour même.', categorie: 'BOISSONS', prixInitial: 4000, prixReduit: 1800, quantiteDisponible: 5, ...creneau(0.5, 4) },
    ],
  },
  {
    id: 'demo-gg-food',
    commercant: { email: `ggfood${DOMAINE_DEMO}`, prenom: 'Nour', nom: 'Jaziri', telephone: '20222333' },
    nom: "GG Food n' drinks", type: 'RESTAURANT', adresse: '8 rue Sadok Bseis, Montfleury, Tunis',
    latitude: 36.7852353, longitude: 10.1758869, horairesOuverture: '06:00 - 00:00',
    description: 'Makloubs, pizzas et sandwichs à deux pas du campus.',
    offres: [
      { id: 'demo-makloub', titre: 'Makloub poulet', description: 'Chaud, avec frites.', categorie: 'PLATS', prixInitial: 8000, prixReduit: 3500, quantiteDisponible: 6, ...creneau(1, 4) },
      { id: 'demo-pizza-neptune', titre: 'Pizza neptune (moyenne)', description: 'Thon, olives, œuf.', categorie: 'PLATS', prixInitial: 12000, prixReduit: 5500, quantiteDisponible: 3, ...creneau(2, 5) },
      { id: 'demo-baguette-farcie', titre: 'Baguette farcie', description: 'Thon, harissa, salade méchouia.', categorie: 'PLATS', prixInitial: 5000, prixReduit: 2200, quantiteDisponible: 7, ...creneau(0.5, 3) },
    ],
  },
  {
    id: 'demo-layal',
    commercant: { email: `layal${DOMAINE_DEMO}`, prenom: 'Rim', nom: 'Chebbi', telephone: '20333444' },
    nom: 'Boulangerie Layal Beb El Falla', type: 'BOULANGERIE', adresse: 'Rue des Silos, Tunis',
    latitude: 36.791018, longitude: 10.1768997, horairesOuverture: '07:00 - 18:00',
    description: 'Pain, tabouna et viennoiseries cuits sur place.',
    offres: [
      { id: 'demo-viennoiseries', titre: 'Lot de viennoiseries (6 pièces)', description: 'Croissants et pains au chocolat du jour.', categorie: 'BOULANGERIE', prixInitial: 9000, prixReduit: 3500, quantiteDisponible: 5, ...creneau(1, 3) },
      { id: 'demo-baguettes', titre: 'Pain du jour (2 baguettes)', description: '', categorie: 'BOULANGERIE', prixInitial: 1000, prixReduit: 500, quantiteDisponible: 10, ...creneau(1, 5) },
      { id: 'demo-tabouna', titre: 'Pain tabouna', description: 'Cuit au four traditionnel.', categorie: 'BOULANGERIE', prixInitial: 1500, prixReduit: 700, quantiteDisponible: 6, ...creneau(2, 5) },
    ],
  },
  {
    id: 'demo-hajja-naziha',
    commercant: { email: `naziha${DOMAINE_DEMO}`, prenom: 'Amel', nom: 'Bouzid', telephone: '20444555' },
    nom: 'Hajja Naziha', type: 'PATISSERIE', adresse: 'Rue des Savants, Tunis',
    latitude: 36.7898581, longitude: 10.1728937, horairesOuverture: '09:00 - 19:00',
    description: 'Pâtisseries tunisiennes traditionnelles.',
    offres: [
      { id: 'demo-assortiment-tunisien', titre: 'Assortiment tunisien (250 g)', description: 'Baklawa, ghraiba, kaak warka.', categorie: 'PATISSERIE', prixInitial: 15000, prixReduit: 6500, quantiteDisponible: 4, ...creneau(1, 4) },
      { id: 'demo-makroudh', titre: 'Makroudh aux dattes (6 pièces)', description: '', categorie: 'PATISSERIE', prixInitial: 6000, prixReduit: 2500, quantiteDisponible: 5, ...creneau(2, 5) },
    ],
  },
  {
    id: 'demo-ben-rjab',
    commercant: { email: `benrjab${DOMAINE_DEMO}`, prenom: 'Walid', nom: 'Sassi', telephone: '20555666' },
    nom: 'Pâtisserie Ben Rjab', type: 'PATISSERIE', adresse: 'Rue Allal Al Fassi, Tunis',
    latitude: 36.7856994, longitude: 10.1752657, horairesOuverture: '08:00 - 19:00',
    description: 'Gâteaux du jour et boissons fraîches.',
    offres: [
      { id: 'demo-mille-feuille', titre: 'Mille-feuille', description: 'Part individuelle.', categorie: 'PATISSERIE', prixInitial: 3500, prixReduit: 1500, quantiteDisponible: 6, ...creneau(1, 4) },
      { id: 'demo-tarte-fruits', titre: 'Tarte aux fruits (part)', description: '', categorie: 'PATISSERIE', prixInitial: 4500, prixReduit: 2000, quantiteDisponible: 4, ...creneau(1, 5) },
      { id: 'demo-citronnade', titre: 'Citronnade maison (50 cl)', description: '', categorie: 'BOISSONS', prixInitial: 3000, prixReduit: 1200, quantiteDisponible: 8, ...creneau(0.5, 4) },
    ],
  },
  {
    id: 'demo-delicious-yacine',
    commercant: { email: `delicious${DOMAINE_DEMO}`, prenom: 'Ines', nom: 'Hamdi', telephone: '20666777' },
    nom: 'Delicious by Yacine', type: 'PATISSERIE', adresse: '75 avenue Ali Trad, Montfleury, Tunis',
    latitude: 36.7871658, longitude: 10.171489, horairesOuverture: '00:00 - 23:59',
    description: 'Desserts et douceurs.',
    offres: [
      { id: 'demo-cheesecake', titre: 'Cheesecake (part)', description: 'Coulis de fruits rouges.', categorie: 'PATISSERIE', prixInitial: 7000, prixReduit: 3000, quantiteDisponible: 5, ...creneau(1, 4) },
      { id: 'demo-donuts', titre: 'Donuts (lot de 3)', description: 'Glaçages variés.', categorie: 'PATISSERIE', prixInitial: 6000, prixReduit: 2500, quantiteDisponible: 6, ...creneau(0.5, 3) },
    ],
  },
];

// Un commerce en attente, pour montrer la validation par l'admin pendant la démo.
const COMMERCE_EN_ATTENTE = {
  id: 'demo-horizon',
  commercant: { email: `horizon${DOMAINE_DEMO}`, prenom: 'Bilel', nom: 'Toumi', telephone: '20777888' },
  nom: "Restaurant l'Horizon chez Bilel", type: 'RESTAURANT', adresse: '31 bis boulevard Bab Menara, Tunis',
  latitude: 36.7932711, longitude: 10.1699801, horairesOuverture: '08:00 - 23:59 (fermé le vendredi)',
  description: 'Cuisine tunisienne : brik, ojja, plats du jour.',
};

const ETUDIANT = { email: `etudiant${DOMAINE_DEMO}`, prenom: 'Yasmine', nom: 'Ben Ali', telephone: '22345678', etablissement: 'ESSECT' };

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

// Le téléphone du commerçant (fictif) n'est pas copié sur le commerce : on n'associe
// pas un faux numéro à un vrai commerce.
async function commerce(c, uid, statutValidation) {
  const { id, commercant, offres, ...infos } = c;
  const ref = db.collection('shops').doc(id);
  const existant = await ref.get();
  await ref.set(
    {
      ...infos,
      ...photo(id),
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
      ...photo(id),
      commerceId,
      statut: champs.quantiteDisponible > 0 ? 'ACTIVE' : 'EPUISEE',
      ...(existant.exists ? { dateModification: FieldValue.serverTimestamp() } : { dateCreation: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
}

// Supprime les anciennes données démo qui ne font plus partie de la liste.
// Ne touche jamais aux documents sans préfixe « demo- » ni aux comptes hors @demo.campussave.tn.
async function nettoyerAnciennesDonnees() {
  const shopsGardes = new Set([...COMMERCES.map((c) => c.id), COMMERCE_EN_ATTENTE.id]);
  const offresGardees = new Set(COMMERCES.flatMap((c) => c.offres.map((o) => o.id)));
  const emailsGardes = new Set([...COMMERCES, COMMERCE_EN_ATTENTE].map((c) => c.commercant.email).concat(ETUDIANT.email));
  let n = 0;

  for (const [collection, gardes] of [['offers', offresGardees], ['shops', shopsGardes]]) {
    const snap = await db.collection(collection).get();
    for (const d of snap.docs) {
      if (d.id.startsWith('demo-') && !gardes.has(d.id)) { await d.ref.delete(); n++; }
    }
  }

  const users = await db.collection('users').get();
  for (const d of users.docs) {
    const email = d.data().email || '';
    if (email.endsWith(DOMAINE_DEMO) && !emailsGardes.has(email)) {
      await auth.deleteUser(d.id).catch((err) => { if (err.code !== 'auth/user-not-found') throw err; });
      await d.ref.delete();
      n++;
    }
  }
  if (n) console.log(`  🧹 ${n} ancienne(s) donnée(s) démo supprimée(s)`);
}

(async () => {
  console.log('Création des données de démonstration…');
  await nettoyerAnciennesDonnees();
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
  console.log('  Admin      : crée-le avec  npm run create-admin -- <email> <mot de passe>');
  process.exit(0);
})().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});