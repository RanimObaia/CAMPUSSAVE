// Données fictives : même forme que les réponses de l'API (mêmes noms que le diagramme de classes).
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 150))
const h = (n) => new Date(Date.now() + n * 3600e3).toISOString()
let seq = 100
// Une commande est « payée » à partir de PAYEE (ni en attente de paiement, ni annulée)
const STATUTS_PAYES = ['PAYEE', 'PRETE', 'RECUPEREE']
// Jour (AAAA-MM-JJ) à l'heure de Tunis
const jourTunis = (d) => new Date(d).toLocaleDateString('fr-CA', { timeZone: 'Africa/Tunis' })

// Les commerces sont ceux du script de démonstration du backend (scripts/seed.js) :
// de vrais commerces autour de l'ESSECT, avec leurs vraies adresses.
const P = (nom) => `/photos/${nom}.jpg`
const db = {
  shop: { id: 's1', nom: 'Boulangerie Layal Beb El Falla', description: 'Pain, tabouna et viennoiseries cuits sur place.', type: 'BOULANGERIE', adresse: 'Rue des Silos, Montfleury, Tunis', latitude: 36.791018, longitude: 10.1768997, horairesOuverture: '07:00 - 18:00', statutValidation: 'VALIDE', noteMoyenne: 4.6, nbAvis: 12, photoUrl: P('baguettes') },
  offers: [
    { id: 'o1', titre: 'Lot de viennoiseries (6 pièces)', description: 'Croissants et pains au chocolat du jour.', categorie: 'BOULANGERIE', prixInitial: 9000, prixReduit: 3500, quantiteDisponible: 4, heureDebutRecuperation: h(1), heureFinRecuperation: h(2), statut: 'ACTIVE', regimes: ['VEGETARIEN', 'FAIT_MAISON'], recurrente: true, photoUrl: P('viennoiseries') },
    { id: 'o2', titre: 'Pain du jour (2 baguettes)', description: '', categorie: 'BOULANGERIE', prixInitial: 1000, prixReduit: 500, quantiteDisponible: 0, heureDebutRecuperation: h(2), heureFinRecuperation: h(3), statut: 'EPUISEE', regimes: ['VEGAN', 'VEGETARIEN'], photoUrl: P('baguettes') },
    { id: 'o3', titre: 'Assortiment de tartes salées', description: 'Quiches épinards, poivrons et fromage.', categorie: 'PLATS', prixInitial: 10000, prixReduit: 4500, quantiteDisponible: 6, heureDebutRecuperation: h(3), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('tartes-salees') },
    { id: 'o4', titre: 'Pain tabouna', description: 'Cuit au four traditionnel.', categorie: 'BOULANGERIE', prixInitial: 1500, prixReduit: 700, quantiteDisponible: 6, heureDebutRecuperation: h(2), heureFinRecuperation: h(5), statut: 'ACTIVE', regimes: ['VEGAN', 'VEGETARIEN', 'FAIT_MAISON'], photoUrl: P('tabouna') },
  ],
  orders: [
    { id: 'c1', code: 'CS-2047', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 1, prixUnitaire: 3500 }], montantTotal: 3500, statut: 'RECUPEREE', dateCommande: h(-5) },
    { id: 'c2', code: 'CS-2048', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 2, prixUnitaire: 3500 }], montantTotal: 7000, statut: 'PAYEE', dateCommande: h(-1) },
    { id: 'c3', code: 'CS-2049', lignes: [{ titre: 'Assortiment de tartes salées', quantite: 1, prixUnitaire: 4500 }], montantTotal: 4500, statut: 'PRETE', dateCommande: h(-0.5) },
  ],
  shops: [
    { id: 's2', nom: "Restaurant l'Horizon chez Bilel", type: 'RESTAURANT', adresse: '31 bis boulevard Bab Menara, Tunis', statutValidation: 'EN_ATTENTE', dateCreation: h(-20) },
    { id: 's3', nom: 'Café Le Jasmin', type: 'CAFETERIA', adresse: 'Ariana', statutValidation: 'EN_ATTENTE', dateCreation: h(-6) },
    { id: 's1', nom: 'Boulangerie Layal Beb El Falla', type: 'BOULANGERIE', adresse: 'Rue des Silos, Tunis', statutValidation: 'VALIDE' },
  ],
  // Offres des autres commerces validés, pour l'espace étudiant
  offresAutres: [
    { id: 'o10', commerceId: 's4', titre: 'Makloub poulet', description: 'Chaud, avec frites.', categorie: 'PLATS', prixInitial: 8000, prixReduit: 3500, quantiteDisponible: 5, heureDebutRecuperation: h(1), heureFinRecuperation: h(3), statut: 'ACTIVE', regimes: [], photoUrl: P('makloub') },
    { id: 'o11', commerceId: 's4', titre: 'Baguette farcie', description: 'Thon, harissa, salade méchouia.', categorie: 'PLATS', prixInitial: 5000, prixReduit: 2200, quantiteDisponible: 8, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(2), statut: 'ACTIVE', regimes: [], photoUrl: P('baguette-farcie') },
    { id: 'o14', commerceId: 's4', titre: 'Pizza neptune (moyenne)', description: 'Thon, olives, œuf.', categorie: 'PLATS', prixInitial: 12000, prixReduit: 5500, quantiteDisponible: 3, heureDebutRecuperation: h(2), heureFinRecuperation: h(5), statut: 'ACTIVE', regimes: [], photoUrl: P('pizza') },
    { id: 'o12', commerceId: 's5', titre: 'Assortiment tunisien (250 g)', description: 'Baklawa, ghraiba, kaak warka.', categorie: 'PATISSERIE', prixInitial: 15000, prixReduit: 6500, quantiteDisponible: 3, heureDebutRecuperation: h(2), heureFinRecuperation: h(5), statut: 'ACTIVE', regimes: ['VEGETARIEN', 'FAIT_MAISON'], photoUrl: P('assortiment-tunisien') },
    { id: 'o15', commerceId: 's5', titre: 'Makroudh aux dattes (6 pièces)', description: 'Semoule, pâte de dattes, miel.', categorie: 'PATISSERIE', prixInitial: 6000, prixReduit: 2500, quantiteDisponible: 5, heureDebutRecuperation: h(1), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGAN', 'VEGETARIEN', 'FAIT_MAISON'], photoUrl: P('makroudh') },
    { id: 'o13', commerceId: 's6', titre: "Jus d'orange pressé (50 cl)", description: 'Oranges maltaises pressées le matin.', categorie: 'BOISSONS', prixInitial: 4000, prixReduit: 2000, quantiteDisponible: 10, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGAN', 'VEGETARIEN', 'SANS_GLUTEN', 'SANS_LACTOSE'], photoUrl: P('jus-orange') },
    { id: 'o16', commerceId: 's6', titre: 'Capucin + croissant', description: 'La pause entre deux cours.', categorie: 'BOISSONS', prixInitial: 3500, prixReduit: 1500, quantiteDisponible: 8, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(3), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('capucin-croissant') },
    { id: 'o17', commerceId: 's6', titre: 'Chapati thon-fromage', description: 'Préparé à midi.', categorie: 'PLATS', prixInitial: 4500, prixReduit: 2000, quantiteDisponible: 6, heureDebutRecuperation: h(1), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: [], photoUrl: P('chapati') },
    { id: 'o18', commerceId: 's6', titre: 'Jus de fraise (33 cl)', description: 'Pressé le jour même.', categorie: 'BOISSONS', prixInitial: 4000, prixReduit: 1800, quantiteDisponible: 5, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGAN', 'VEGETARIEN', 'SANS_GLUTEN'], photoUrl: P('jus-fraise') },
    { id: 'o19', commerceId: 's7', titre: 'Mille-feuille', description: 'Part individuelle.', categorie: 'PATISSERIE', prixInitial: 3500, prixReduit: 1500, quantiteDisponible: 6, heureDebutRecuperation: h(1), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('mille-feuille') },
    { id: 'o20', commerceId: 's7', titre: 'Tarte aux fruits (part)', description: 'Fraises, kiwi, mûres.', categorie: 'PATISSERIE', prixInitial: 4500, prixReduit: 2000, quantiteDisponible: 4, heureDebutRecuperation: h(1), heureFinRecuperation: h(5), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('tarte-fruits') },
    { id: 'o21', commerceId: 's7', titre: 'Citronnade maison (50 cl)', description: 'Citron et menthe fraîche.', categorie: 'BOISSONS', prixInitial: 3000, prixReduit: 1200, quantiteDisponible: 8, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGAN', 'VEGETARIEN', 'SANS_GLUTEN', 'SANS_LACTOSE'], photoUrl: P('citronnade') },
    { id: 'o22', commerceId: 's8', titre: 'Cheesecake (part)', description: 'Coulis de fruits rouges.', categorie: 'PATISSERIE', prixInitial: 7000, prixReduit: 3000, quantiteDisponible: 5, heureDebutRecuperation: h(1), heureFinRecuperation: h(4), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('cheesecake') },
    { id: 'o23', commerceId: 's8', titre: 'Donuts (lot de 3)', description: 'Glaçages variés.', categorie: 'PATISSERIE', prixInitial: 6000, prixReduit: 2500, quantiteDisponible: 6, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(3), statut: 'ACTIVE', regimes: ['VEGETARIEN'], photoUrl: P('donuts') },
  ],
  commercesAutres: [
    { id: 's4', nom: "GG Food n' drinks", type: 'RESTAURANT', description: 'Makloubs, pizzas et sandwichs à deux pas du campus.', adresse: '8 rue Sadok Bseis, Montfleury, Tunis', latitude: 36.7852353, longitude: 10.1758869, horairesOuverture: '06:00 - 00:00', statutValidation: 'VALIDE', noteMoyenne: 4.2, nbAvis: 7, photoUrl: P('commerce-restaurant') },
    { id: 's5', nom: 'Hajja Naziha', type: 'PATISSERIE', description: 'Pâtisseries tunisiennes traditionnelles.', adresse: 'Rue des Savants, Montfleury, Tunis', latitude: 36.7898581, longitude: 10.1728937, horairesOuverture: '09:00 - 19:00', statutValidation: 'VALIDE', noteMoyenne: 4.9, nbAvis: 21, photoUrl: P('commerce-patisserie') },
    { id: 's6', nom: 'Café Chez Nous', type: 'CAFETERIA', description: 'Le café juste en face de la fac.', adresse: "Avenue Ali Trad, Montfleury, Tunis (en face de l'ESSECT)", latitude: 36.7874681, longitude: 10.1742779, horairesOuverture: '05:00 - 00:00', statutValidation: 'VALIDE', noteMoyenne: 4.4, nbAvis: 33, photoUrl: P('commerce-cafe') },
    { id: 's7', nom: 'Pâtisserie Ben Rjab', type: 'PATISSERIE', description: 'Gâteaux du jour et boissons fraîches.', adresse: 'Rue Allal Al Fassi, Montfleury, Tunis', latitude: 36.7856994, longitude: 10.1752657, horairesOuverture: '08:00 - 19:00', statutValidation: 'VALIDE', noteMoyenne: 4.5, nbAvis: 15, photoUrl: P('mille-feuille') },
    { id: 's8', nom: 'Delicious by Yacine', type: 'PATISSERIE', description: 'Desserts et douceurs.', adresse: '75 avenue Ali Trad, Montfleury, Tunis', latitude: 36.7871658, longitude: 10.171489, horairesOuverture: '00:00 - 23:59', statutValidation: 'VALIDE', noteMoyenne: null, nbAvis: 0, photoUrl: P('cheesecake') },
  ],
  users: [
    { id: 'u1', nom: 'Ben Ali', prenom: 'Yasmine', email: 'etudiant@demo.tn', role: 'student', actif: true, etablissement: 'ESSECT', favoris: ['s5'], ecoPoints: 30, dateInscription: h(-24 * 40), preferences: { langue: 'fr', notifications: { favoris: true, rappels: true, commandes: true, emails: true } } },
    { id: 'u2', nom: 'Chebbi', prenom: 'Rim', email: 'merchant@demo.tn', role: 'merchant', actif: true, dateInscription: h(-24 * 60) },
    { id: 'u3', nom: 'Suspendu', prenom: 'Compte', email: 'suspendu@demo.tn', role: 'student', actif: false, dateInscription: h(-24 * 20) },
    { id: 'u4', nom: 'Trabelsi', prenom: 'Omar', email: 'omar.trabelsi@essect.ucar.tn', role: 'student', actif: true, etablissement: 'ESSECT', dateInscription: h(-24 * 9) },
    { id: 'u5', nom: 'Gharbi', prenom: 'Salma', email: 'salma.gharbi@essect.ucar.tn', role: 'student', actif: true, etablissement: 'ESSECT', dateInscription: h(-24 * 3) },
    { id: 'u6', nom: 'Jaziri', prenom: 'Nour', email: 'ggfood@demo.tn', role: 'merchant', actif: true, dateInscription: h(-24 * 55) },
  ],
}

const fail = (code, message) => Promise.reject(Object.assign(new Error(message), { code }))
let courant = null // utilisateur connecté en mode démo

// Campus ESSECT (Montfleury) : point de départ des distances
const ESSECT = { lat: 36.7907, lng: 10.1786 }
function distanceKm(a, b) {
  if (a?.lat == null || b?.lat == null) return null
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const k = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(k)) * 10) / 10
}
const heureTunis = (d) => Number(new Date(d).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', hour12: false }).slice(0, 2))
const remiseDe = (o) => 1 - o.prixReduit / o.prixInitial
const TRIS = {
  fin: (a, b) => a.heureFinRecuperation.localeCompare(b.heureFinRecuperation),
  distance: (a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9),
  prix: (a, b) => a.prixReduit - b.prixReduit,
  note: (a, b) => (b.commerce?.noteMoyenne || 0) - (a.commerce?.noteMoyenne || 0),
  remise: (a, b) => remiseDe(b) - remiseDe(a),
}
function creneauOk(o, creneau) {
  if (!creneau) return true
  if (creneau === 'maintenant') return new Date(o.heureDebutRecuperation).getTime() <= Date.now() + 3600e3
  const hh = heureTunis(o.heureDebutRecuperation)
  if (creneau === 'midi') return hh >= 11 && hh < 15
  if (creneau === 'soir') return hh >= 17
  return true
}
const notifications = [
  { id: 'n1', titre: 'Hajja Naziha a publié une offre', corps: 'Assortiment tunisien (250 g) à 6,500 DT. Réserve vite !', type: 'OFFRE_FAVORI', offreId: 'o12', lu: false, date: h(-0.3) },
  { id: 'n2', titre: 'Commande remise ✅', corps: "Merci d'avoir sauvé un repas ! Laisse un avis sur le commerce pour aider les autres étudiants.", type: 'COMMANDE_REMISE', commandeId: 'c91', lu: true, date: h(-25) },
]
let seqNotif = 10
function notifier(titre, corps, extra = {}) {
  notifications.unshift({ id: `n${++seqNotif}`, titre, corps, type: 'INFO', lu: false, date: new Date().toISOString(), ...extra })
}
const avis = [
  { id: 'c90', commandeId: 'c90', commerceId: 's4', prenomEtudiant: 'Démo', note: 4, commentaire: 'Makloub copieux et encore chaud.', date: h(-48) },
  { id: 'r2', commerceId: 's5', prenomEtudiant: 'Yasmine', note: 5, commentaire: 'Les baklawas étaient parfaites, merci !', date: h(-70) },
  { id: 'r3', commerceId: 's1', prenomEtudiant: 'Omar', note: 5, commentaire: 'Viennoiseries du matin, toujours bonnes le soir.', date: h(-30) },
]
const signalements = []
const delegations = new Map() // token -> commandeId
const NIVEAUX = [{ min: 0, nom: 'Graine' }, { min: 3, nom: 'Pousse' }, { min: 10, nom: 'Arbre' }, { min: 25, nom: 'Forêt' }]
function niveau(repas) {
  const i = NIVEAUX.findLastIndex((n) => repas >= n.min)
  const suivant = NIVEAUX[i + 1]
  return { nom: NIVEAUX[i].nom, repasPourSuivant: suivant ? suivant.min - repas : 0, suivant: suivant?.nom || null }
}

// Espace étudiant : toutes les offres avec leur commerce (le Fournil = la boutique du commerçant démo)
function offresAvecCommerce() {
  const commerces = [db.shop, ...db.commercesAutres]
  return [...db.offers.map((o) => ({ ...o, commerceId: db.shop.id })), ...db.offresAutres].map((o) => {
    const c = commerces.find((x) => x.id === o.commerceId)
    return { ...o, commerce: { id: c.id, nom: c.nom, type: c.type, adresse: c.adresse, statutValidation: c.statutValidation, latitude: c.latitude, longitude: c.longitude, noteMoyenne: c.noteMoyenne ?? null, nbAvis: c.nbAvis || 0, horairesOuverture: c.horairesOuverture } }
  })
}

// Deux commandes déjà récupérées par l'étudiant démo, pour que son tableau de bord ne soit pas vide
db.orders.push(
  { id: 'c90', code: 'CS-2031', parEtudiant: true, commerceId: 's4', commerce: { id: 's4', nom: 'Restaurant El Medina', adresse: 'Avenue de Carthage, Tunis' }, lignes: [{ offreId: 'o10', titre: 'Makloub poulet', quantite: 1, prixUnitaire: 3500, prixInitial: 8000 }], montantTotal: 3500, statut: 'RECUPEREE', avisDonne: true, dateCommande: h(-50), paiement: { statut: 'REUSSI', reference: 'KNT-DEMO-CS-2031' } },
  { id: 'c91', code: 'CS-2039', parEtudiant: true, commerceId: 's5', commerce: { id: 's5', nom: 'Pâtisserie Essaada', adresse: 'Montfleury, Tunis' }, lignes: [{ offreId: 'o12', titre: 'Box makroudh et baklawa', quantite: 2, prixUnitaire: 6000, prixInitial: 15000 }], montantTotal: 12000, statut: 'RECUPEREE', dateCommande: h(-26), paiement: { statut: 'REUSSI', reference: 'KNT-DEMO-CS-2039' } },
)

// Espace étudiant : commandes passées depuis le panier (Eya)
const commandesEtudiant = () => db.orders.filter((o) => o.parEtudiant).sort((a, b) => b.dateCommande.localeCompare(a.dateCommande))
const toutesLesOffres = () => [...db.offers, ...db.offresAutres]
function changerStock(lignes, signe) {
  for (const l of lignes) {
    const o = toutesLesOffres().find((x) => x.id === l.offreId)
    if (!o) continue
    o.quantiteDisponible += signe * l.quantite
    o.statut = o.quantiteDisponible > 0 ? 'ACTIVE' : 'EPUISEE'
  }
}

export const mock = {
  // Étudiant : POST /orders → commande « En attente de paiement », quantités réservées
  createOrder: ({ commerceId, lignes }) => {
    const offres = offresAvecCommerce()
    const detail = []
    for (const l of lignes) {
      const o = offres.find((x) => x.id === l.offreId)
      if (!o || o.commerce.id !== commerceId) return fail('OFFRE_INTROUVABLE', 'Une offre du panier est introuvable.')
      if (o.statut !== 'ACTIVE' || l.quantite > o.quantiteDisponible) return fail('STOCK_INSUFFISANT', `Stock insuffisant pour « ${o.titre} » : il en reste ${o.quantiteDisponible}.`)
      detail.push({ offre: o, quantite: l.quantite })
    }
    const commande = {
      id: `c${++seq}`, code: `CS-${2000 + seq}`, parEtudiant: true, commerceId,
      commerce: { id: detail[0].offre.commerce.id, nom: detail[0].offre.commerce.nom, adresse: detail[0].offre.commerce.adresse },
      lignes: detail.map(({ offre, quantite }) => ({ offreId: offre.id, titre: offre.titre, quantite, prixUnitaire: offre.prixReduit, prixInitial: offre.prixInitial })),
      montantTotal: detail.reduce((s, { offre, quantite }) => s + offre.prixReduit * quantite, 0),
      heureDebutRecuperation: detail.map((d) => d.offre.heureDebutRecuperation).sort()[0],
      heureFinRecuperation: detail.map((d) => d.offre.heureFinRecuperation).sort().at(-1),
      statut: 'EN_ATTENTE_PAIEMENT', dateCommande: new Date().toISOString(), paiement: null,
    }
    changerStock(commande.lignes, -1)
    db.orders.unshift(commande)
    return wait(commande)
  },
  // POST /payments/init → lien vers la page de paiement (ici, la page Konnect simulée)
  initPaiement: (commandeId) => {
    const c = db.orders.find((o) => o.id === commandeId)
    if (!c) return fail('COMMANDE_INTROUVABLE', 'Commande introuvable.')
    c.paiement = { statut: 'INITIE', reference: `KNT-DEMO-${c.code}`, montant: c.montantTotal }
    return wait({ payUrl: `/paiement/simulation/${c.id}` })
  },
  // Ce que fait le webhook Konnect côté serveur (mode démo seulement)
  simulerResultatPaiement: (commandeId, reussi) => {
    const c = db.orders.find((o) => o.id === commandeId)
    if (!c) return fail('COMMANDE_INTROUVABLE', 'Commande introuvable.')
    if (c.statut !== 'EN_ATTENTE_PAIEMENT') return wait(c) // déjà traité : rien ne change
    if (reussi) {
      c.statut = 'PAYEE'
      c.paiement = { ...c.paiement, statut: 'REUSSI', datePaiement: new Date().toISOString() }
      c.emailEnvoye = true
      c.emailEtudiant = courant?.email
      notifier('Paiement confirmé ✓', `Commande ${c.code} payée. Ton QR code est prêt.`, { type: 'PAIEMENT_REUSSI', commandeId: c.id })
    } else {
      c.statut = 'ANNULEE'
      c.paiement = { ...c.paiement, statut: 'ECHOUE' }
      changerStock(c.lignes, +1) // quantités remises en vente
    }
    return wait(c)
  },
  // POST /orders/:id/cancel : même effet qu'un paiement refusé (seulement si la commande est en attente)
  annulerCommande: (id) => {
    const c = db.orders.find((o) => o.id === id)
    if (!c) return fail('COMMANDE_INTROUVABLE', 'Commande introuvable.')
    if (c.statut === 'EN_ATTENTE_PAIEMENT') {
      c.statut = 'ANNULEE'
      c.motifAnnulation = 'PAIEMENT_REFUSE'
      if (c.paiement) {
        c.paiement = { ...c.paiement, statut: 'ECHOUE' }
        c.emailEchecEnvoye = true
        c.emailEtudiant = courant?.email
        notifier('Paiement non abouti', `La commande ${c.code} est annulée, aucun montant n'a été débité.`, { type: 'PAIEMENT_ECHOUE', commandeId: c.id })
      }
      changerStock(c.lignes, +1)
    } else if (c.statut !== 'ANNULEE') {
      return fail('COMMANDE_DEJA_PAYEE', 'Cette commande est déjà payée : elle ne peut plus être annulée.')
    }
    return wait(c)
  },
  getCommande: (id) => {
    const c = db.orders.find((o) => o.id === id)
    return c ? wait(c) : fail('COMMANDE_INTROUVABLE', 'Commande introuvable.')
  },
  mesCommandes: () => wait(commandesEtudiant()),
  // GET /stats/student : chiffres du tableau de bord étudiant (commandes payées seulement)
  studentStats: () => {
    const payees = commandesEtudiant().filter((c) => ['PAYEE', 'PRETE', 'RECUPEREE'].includes(c.statut))
    const lignes = payees.flatMap((c) => c.lignes)
    return wait({
      commandes: payees.length,
      depenses: payees.reduce((s, c) => s + c.montantTotal, 0),
      economies: lignes.reduce((s, l) => s + ((l.prixInitial || l.prixUnitaire) - l.prixUnitaire) * l.quantite, 0),
      repasSauves: lignes.reduce((s, l) => s + l.quantite, 0),
      kgSauves: Math.round(lignes.reduce((s, l) => s + l.quantite, 0) * 0.4 * 10) / 10,
      co2Evite: Math.round(lignes.reduce((s, l) => s + l.quantite, 0) * 2.5 * 10) / 10,
      ecoPoints: courant?.ecoPoints || 0,
      niveau: niveau(lignes.reduce((s, l) => s + l.quantite, 0)),
    })
  },
  // Étudiant : offres visibles (actives, en stock, pas expirées, commerce validé) + filtres de recherche
  listOffers: (filtres = {}) => {
    const q = (filtres.q || '').trim().toLowerCase()
    const maintenant = Date.now()
    const position = filtres.lat && filtres.lng ? { lat: Number(filtres.lat), lng: Number(filtres.lng) } : ESSECT
    const liste = offresAvecCommerce()
      .map((o) => ({ ...o, distanceKm: distanceKm(position, { lat: o.commerce.latitude, lng: o.commerce.longitude }) }))
      .filter((o) =>
        o.statut === 'ACTIVE' && o.quantiteDisponible > 0 && new Date(o.heureFinRecuperation).getTime() > maintenant &&
        o.commerce.statutValidation === 'VALIDE' &&
        (!q || o.titre.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || o.commerce.nom.toLowerCase().includes(q)) &&
        (!filtres.categorie || o.categorie === filtres.categorie) &&
        (!filtres.typeCommerce || o.commerce.type === filtres.typeCommerce) &&
        (!filtres.regime || (o.regimes || []).includes(filtres.regime)) &&
        (!filtres.distanceMax || (o.distanceKm != null && o.distanceKm <= Number(filtres.distanceMax))) &&
        creneauOk(o, filtres.creneau) &&
        (!filtres.prixMax || o.prixReduit <= Number(filtres.prixMax)))
    liste.sort(TRIS[filtres.tri] || TRIS.fin)
    return wait(liste)
  },
  getOffreDetail: (id) => {
    const o = offresAvecCommerce().find((x) => x.id === id)
    if (!o) return fail('OFFRE_INTROUVABLE', 'Cette offre est introuvable.')
    return wait({ ...o, distanceKm: distanceKm(ESSECT, { lat: o.commerce.latitude, lng: o.commerce.longitude }) })
  },
  // ---------- Favoris ----------
  mesFavoris: () => {
    const ids = courant?.favoris || []
    const offres = offresAvecCommerce().filter((o) => o.statut === 'ACTIVE' && o.quantiteDisponible > 0 && new Date(o.heureFinRecuperation) > new Date())
    return wait([db.shop, ...db.commercesAutres].filter((c) => ids.includes(c.id)).map((c) => ({ ...c, offresDisponibles: offres.filter((o) => o.commerce.id === c.id).length })))
  },
  ajouterFavori: (commerceId) => {
    courant.favoris = [...new Set([...(courant.favoris || []), commerceId])]
    return wait({ favoris: courant.favoris })
  },
  retirerFavori: (commerceId) => {
    courant.favoris = (courant.favoris || []).filter((x) => x !== commerceId)
    return wait({ favoris: courant.favoris })
  },
  // ---------- Notifications ----------
  notifications: () => wait({ nonLues: notifications.filter((n) => !n.lu).length, notifications }),
  notificationLue: (id) => { const n = notifications.find((x) => x.id === id); if (n) n.lu = true; return wait(n) },
  toutLu: () => { notifications.forEach((n) => { n.lu = true }); return wait({ nonLues: 0 }) },
  // ---------- Avis ----------
  avisCommerce: (commerceId) => wait(avis.filter((a) => a.commerceId === commerceId).sort((a, b) => b.date.localeCompare(a.date))),
  donnerAvis: (commandeId, { note, commentaire }) => {
    const c = db.orders.find((o) => o.id === commandeId)
    if (!c) return fail('COMMANDE_INTROUVABLE', 'Commande introuvable.')
    if (c.statut !== 'RECUPEREE') return fail('AVIS_TROP_TOT', 'Tu pourras noter le commerce après avoir récupéré ta commande.')
    if (c.avisDonne) return fail('AVIS_DEJA_DONNE', 'Tu as déjà noté cette commande.')
    const shop = [db.shop, ...db.commercesAutres].find((x) => x.id === c.commerceId)
    const nb = (shop.nbAvis || 0) + 1
    shop.noteMoyenne = Math.round((((shop.noteMoyenne || 0) * (nb - 1) + note) / nb) * 10) / 10
    shop.nbAvis = nb
    c.avisDonne = true
    const a = { id: c.id, commandeId: c.id, commerceId: c.commerceId, prenomEtudiant: courant?.prenom || 'Étudiant', note, commentaire: commentaire || '', date: new Date().toISOString() }
    avis.unshift(a)
    return wait(a)
  },
  // ---------- Délégation du retrait ----------
  deleguer: (commandeId, nom) => {
    const c = db.orders.find((o) => o.id === commandeId)
    if (!c || !['PAYEE', 'PRETE'].includes(c.statut)) return fail('DELEGATION_IMPOSSIBLE', 'Seule une commande payée et pas encore retirée peut être confiée à un ami.')
    const token = c.delegation?.token || Math.random().toString(36).slice(2, 14)
    c.delegation = { token, nom: nom || null, date: new Date().toISOString() }
    delegations.set(token, c.id)
    return wait({ token, lien: `${window.location.origin}/retrait/${token}` })
  },
  annulerDelegation: (commandeId) => {
    const c = db.orders.find((o) => o.id === commandeId)
    if (c?.delegation) delegations.delete(c.delegation.token)
    if (c) delete c.delegation
    return wait(c)
  },
  voirDelegation: (token) => {
    const c = db.orders.find((o) => o.id === delegations.get(token))
    if (!c) return fail('LIEN_INVALIDE', "Ce lien de retrait n'est pas valide ou a été annulé.")
    return wait({
      code: ['PAYEE', 'PRETE'].includes(c.statut) ? c.code : null, statut: c.statut, commerce: c.commerce,
      lignes: c.lignes.map(({ titre, quantite }) => ({ titre, quantite })),
      heureDebutRecuperation: c.heureDebutRecuperation, heureFinRecuperation: c.heureFinRecuperation,
      nomDelegue: c.delegation?.nom, prenomEtudiant: 'Démo',
    })
  },
  // ---------- Signalements ----------
  signaler: ({ commandeId, motif, message }) => {
    const c = db.orders.find((o) => o.id === commandeId)
    const sgl = { id: `r${++seq}`, commandeId: commandeId || null, codeCommande: c?.code || null, commerce: c?.commerce || null, emailEtudiant: courant?.email, motif, message, statut: 'OUVERT', reponse: null, date: new Date().toISOString() }
    signalements.unshift(sgl)
    return wait(sgl)
  },
  mesSignalements: () => wait(signalements),
  adminSignalements: (statut) => wait(signalements.filter((x) => !statut || x.statut === statut)),
  traiterSignalement: (id, statut, reponse) => {
    const sgl = signalements.find((x) => x.id === id)
    Object.assign(sgl, { statut, reponse: reponse || null })
    notifier('Réponse à ton signalement', reponse || 'Ton signalement a été traité.', { type: 'SIGNALEMENT', commandeId: sgl.commandeId })
    return wait(sgl)
  },
  // ---------- Contact, stats publiques ----------
  contact: () => wait({ id: `m${++seq}`, emailEnvoye: false }),
  statsPubliques: () => {
    const payees = db.orders.filter((o) => STATUTS_PAYES.includes(o.statut))
    const repas = payees.reduce((n, o) => n + o.lignes.reduce((k, l) => k + l.quantite, 0), 0) + 1240
    return wait({ repasSauves: repas, commerces: 3 + 5, etudiants: 860, co2Evite: Math.round(repas * 2.5), economies: repas * 4200 })
  },
  // ---------- Commerçant : stats détaillées, republier ----------
  merchantStatsDetail: () => {
    const payees = db.orders.filter((o) => (!o.commerceId || o.commerceId === db.shop.id) && STATUTS_PAYES.includes(o.statut))
    const recup = payees.filter((o) => o.statut === 'RECUPEREE')
    const repas = recup.reduce((n, o) => n + o.lignes.reduce((k, l) => k + l.quantite, 0), 0)
    const parJour = Array.from({ length: 14 }, (_, i) => {
      const jour = jourTunis(Date.now() - (13 - i) * 864e5)
      const du = payees.filter((o) => jourTunis(o.dateCommande) === jour)
      // historique fictif pour que le graphique ne soit pas vide
      const passe = i < 13 ? [3, 5, 2, 6, 4, 7, 5, 3, 6, 8, 4, 6, 7][i] : 0
      return { jour, commandes: du.length + passe, chiffreAffaires: du.reduce((s, o) => s + o.montantTotal, 0) + passe * 4500 }
    })
    return wait({
      repasSauves: repas + 64, chiffreAffaires: parJour.reduce((s, j) => s + j.chiffreAffaires, 0), commandes: parJour.reduce((s, j) => s + j.commandes, 0),
      tauxRetrait: 94, noteMoyenne: db.shop.noteMoyenne, nbAvis: db.shop.nbAvis, co2Evite: Math.round((repas + 64) * 2.5),
      parJour, topOffres: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 38 }, { titre: 'Assortiment de tartes salées', quantite: 21 }, { titre: 'Pain du jour (2 baguettes)', quantite: 15 }],
    })
  },
  republierOffre: (id, quantiteDisponible) => {
    const o = db.offers.find((x) => x.id === id)
    if (!o) return fail('OFFRE_INTROUVABLE', 'Cette offre est introuvable.')
    const duree = new Date(o.heureFinRecuperation) - new Date(o.heureDebutRecuperation)
    let debut = new Date(o.heureDebutRecuperation).getTime()
    while (debut + duree <= Date.now()) debut += 864e5
    const q = quantiteDisponible || o.quantiteInitiale || o.quantiteDisponible || 1
    const copie = { ...o, id: `o${++seq}`, quantiteDisponible: q, statut: 'ACTIVE', heureDebutRecuperation: new Date(debut).toISOString(), heureFinRecuperation: new Date(debut + duree).toISOString(), offreOrigine: o.id }
    o.recurrente = false
    db.offers.unshift(copie)
    return wait(copie)
  },
  // ---------- Admin : modération, commandes ----------
  adminOffres: () => wait(offresAvecCommerce()),
  retirerOffreAdmin: (id, motif) => {
    const o = toutesLesOffres().find((x) => x.id === id)
    if (o) Object.assign(o, { statut: 'RETIREE', retireeParAdmin: true, motifRetrait: motif || null })
    return wait(o)
  },
  sante: () => wait({ status: 'ok', service: 'campussave-demo', time: new Date().toISOString() }),
  adminCommandes: () => wait([...db.orders].sort((a, b) => b.dateCommande.localeCompare(a.dateCommande))),
  // Inscription fictive : même règles et mêmes erreurs que POST /auth/register
  register: (data) => {
    const email = data.email.trim().toLowerCase()
    if (db.users.some((u) => u.email === email)) return fail('EMAIL_DEJA_UTILISE', 'Cette adresse e-mail est déjà utilisée.')
    const user = { ...data, email, id: `u${++seq}`, actif: true }
    delete user.motDePasse // le mot de passe n'est jamais renvoyé
    if (user.role === 'student') user.ecoPoints = 0
    db.users.push(user)
    return wait(user)
  },
  getMe: (email = 'merchant@demo.tn') => {
    let u = db.users.find((x) => x.email === email.trim().toLowerCase())
    if (!u) {
      u = { id: 'a1', nom: 'Admin', prenom: 'Démo', email, role: email.startsWith('admin') ? 'admin' : 'merchant', actif: true }
      db.users.push(u)
    }
    courant = u
    return wait(u)
  },
  updateMe: (data) => {
    const user = courant || db.users.find((u) => u.email === 'merchant@demo.tn')
    if (!user) return fail('UTILISATEUR_INTROUVABLE', 'Utilisateur introuvable.')
    const { preferences, ...reste } = data
    Object.assign(user, reste)
    if (preferences) {
      const avant = user.preferences || {}
      user.preferences = { ...avant, ...preferences, notifications: { ...(avant.notifications || {}), ...(preferences.notifications || {}) } }
    }
    return wait(user)
  },
  getMyShop: () => wait(db.shop),
  saveShop: (data) => { db.shop = { ...db.shop, ...data }; return wait(db.shop) },
  listMyOffers: () => wait(db.offers),
  getOffer: (id) => wait(db.offers.find((o) => o.id === id)),
  createOffer: (data) => { const o = { ...data, id: `o${++seq}`, statut: data.quantiteDisponible > 0 ? 'ACTIVE' : 'EPUISEE' }; db.offers.unshift(o); return wait(o) },
  updateOffer: (id, data) => { db.offers = db.offers.map((o) => (o.id === id ? { ...o, ...data, statut: data.quantiteDisponible > 0 && o.statut === 'EPUISEE' ? 'ACTIVE' : data.quantiteDisponible === 0 ? 'EPUISEE' : o.statut } : o)); return wait(db.offers.find((o) => o.id === id)) },
  removeOffer: (id) => { db.offers = db.offers.map((o) => (o.id === id ? { ...o, statut: 'RETIREE' } : o)); return wait({}) },
  listOrders: () => wait(db.orders.filter((o) => !o.commerceId || o.commerceId === db.shop.id)),
  markReady: (id) => { db.orders = db.orders.map((o) => (o.id === id && o.statut === 'PAYEE' ? { ...o, statut: 'PRETE' } : o)); return wait(db.orders.find((o) => o.id === id)) },
  validateQr: (code) => {
    const c = String(code).trim().toUpperCase()
    const o = db.orders.find((x) => x.code === c)
    if (!o) return fail('QR_INVALIDE', 'Code inconnu.')
    if (o.statut === 'RECUPEREE') return fail('QR_DEJA_UTILISE', 'Cette commande a déjà été remise.')
    if (o.statut !== 'PAYEE' && o.statut !== 'PRETE') return fail('COMMANDE_NON_PAYEE', "Cette commande n'est pas payée.")
    o.statut = 'RECUPEREE'
    return wait(o)
  },
  // GET /stats/merchant : seulement les commandes payées (PAYEE, PRETE, RECUPEREE) de son commerce.
  // « Du jour » et « du mois » se calculent à l'heure de Tunis, comme le fera le backend.
  merchantStats: () => {
    const payees = db.orders.filter((o) => (!o.commerceId || o.commerceId === db.shop.id) && STATUTS_PAYES.includes(o.statut))
    const duJour = payees.filter((o) => jourTunis(o.dateCommande) === jourTunis(new Date()))
    const duMois = payees.filter((o) => o.statut === 'RECUPEREE' && jourTunis(o.dateCommande).slice(0, 7) === jourTunis(new Date()).slice(0, 7))
    return wait({
      offresActives: db.offers.filter((o) => o.statut === 'ACTIVE' && o.quantiteDisponible > 0 && new Date(o.heureFinRecuperation).getTime() > Date.now()).length,
      commandesDuJour: duJour.length,
      chiffreAffaires: duJour.reduce((s, o) => s + o.montantTotal, 0),
      repasSauves: duMois.reduce((s, o) => s + o.lignes.reduce((n, l) => n + l.quantite, 0), 0),
    })
  },
  // GET /stats/admin : utilisateurs = étudiants + commerçants (sans les admins) ; commandes et paiements = commandes payées
  adminStats: () => wait({
    utilisateurs: db.users.filter((u) => u.role !== 'admin').length,
    commercesValides: db.shops.filter((s) => s.statutValidation === 'VALIDE').length,
    commercesEnAttente: db.shops.filter((s) => s.statutValidation === 'EN_ATTENTE').length,
    commandes: db.orders.filter((o) => STATUTS_PAYES.includes(o.statut)).length,
    paiements: db.orders.filter((o) => STATUTS_PAYES.includes(o.statut)).length,
  }),
  adminShops: (statut) => wait(db.shops.filter((s) => !statut || s.statutValidation === statut)),
  validateShop: (id, decision) => { db.shops = db.shops.map((s) => (s.id === id ? { ...s, statutValidation: decision } : s)); return wait({}) },
  adminUsers: () => wait(db.users),
  setUserActive: (id, actif) => { db.users = db.users.map((u) => (u.id === id ? { ...u, actif } : u)); return wait({}) },
}
