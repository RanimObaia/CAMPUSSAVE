// Données fictives : même forme que les réponses de l'API (mêmes noms que le diagramme de classes).
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 150))
const h = (n) => new Date(Date.now() + n * 3600e3).toISOString()
let seq = 100

const db = {
  shop: { id: 's1', nom: 'Boulangerie Le Fournil', description: 'Pain et viennoiseries du jour', type: 'BOULANGERIE', adresse: 'Rue de la Liberté, Tunis', latitude: 36.8065, longitude: 10.1815, horairesOuverture: '07:00 - 20:00', statutValidation: 'VALIDE' },
  offers: [
    { id: 'o1', titre: 'Lot de viennoiseries (6 pièces)', description: '', categorie: 'BOULANGERIE', prixInitial: 12000, prixReduit: 4500, quantiteDisponible: 4, heureDebutRecuperation: h(1), heureFinRecuperation: h(2), statut: 'ACTIVE' },
    { id: 'o2', titre: 'Pain du jour (2 baguettes)', description: '', categorie: 'BOULANGERIE', prixInitial: 3000, prixReduit: 1500, quantiteDisponible: 0, heureDebutRecuperation: h(2), heureFinRecuperation: h(3), statut: 'EPUISEE' },
    { id: 'o3', titre: 'Assortiment de tartes salées', description: '', categorie: 'PLATS', prixInitial: 10000, prixReduit: 5000, quantiteDisponible: 6, heureDebutRecuperation: h(3), heureFinRecuperation: h(4), statut: 'ACTIVE' },
  ],
  orders: [
    { id: 'c1', code: 'CS-2047', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 1, prixUnitaire: 4500 }], montantTotal: 4500, statut: 'RECUPEREE', dateCommande: h(-5) },
    { id: 'c2', code: 'CS-2048', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 2, prixUnitaire: 4500 }], montantTotal: 9000, statut: 'PAYEE', dateCommande: h(-1) },
    { id: 'c3', code: 'CS-2049', lignes: [{ titre: 'Assortiment de tartes salées', quantite: 1, prixUnitaire: 5000 }], montantTotal: 5000, statut: 'PRETE', dateCommande: h(-0.5) },
  ],
  shops: [
    { id: 's2', nom: 'Pâtisserie Les Délices', type: 'PATISSERIE', adresse: 'Tunis', statutValidation: 'EN_ATTENTE' },
    { id: 's3', nom: 'Café Le Jasmin', type: 'CAFETERIA', adresse: 'Ariana', statutValidation: 'EN_ATTENTE' },
    { id: 's1', nom: 'Boulangerie Le Fournil', type: 'BOULANGERIE', adresse: 'Tunis', statutValidation: 'VALIDE' },
  ],
  // Offres d'autres commerces validés, pour l'espace étudiant (Eya)
  offresAutres: [
    { id: 'o10', commerceId: 's4', titre: 'Couscous au poulet', description: 'Portion généreuse, préparée ce midi.', categorie: 'PLATS', prixInitial: 9000, prixReduit: 4000, quantiteDisponible: 5, heureDebutRecuperation: h(1), heureFinRecuperation: h(3), statut: 'ACTIVE' },
    { id: 'o11', commerceId: 's4', titre: 'Sandwich thon-harissa', description: '', categorie: 'PLATS', prixInitial: 5000, prixReduit: 2500, quantiteDisponible: 8, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(2), statut: 'ACTIVE' },
    { id: 'o12', commerceId: 's5', titre: 'Box makroudh et baklawa', description: '6 pièces assorties.', categorie: 'PATISSERIE', prixInitial: 15000, prixReduit: 6000, quantiteDisponible: 3, heureDebutRecuperation: h(2), heureFinRecuperation: h(5), statut: 'ACTIVE' },
    { id: 'o13', commerceId: 's5', titre: 'Jus d\'orange pressé (50 cl)', description: '', categorie: 'BOISSONS', prixInitial: 4000, prixReduit: 2000, quantiteDisponible: 10, heureDebutRecuperation: h(0.5), heureFinRecuperation: h(4), statut: 'ACTIVE' },
  ],
  commercesAutres: [
    { id: 's4', nom: 'Restaurant El Medina', type: 'RESTAURANT', adresse: 'Avenue de Carthage, Tunis', horairesOuverture: '11:00 - 22:00', statutValidation: 'VALIDE' },
    { id: 's5', nom: 'Pâtisserie Essaada', type: 'PATISSERIE', adresse: 'Montfleury, Tunis', horairesOuverture: '08:00 - 21:00', statutValidation: 'VALIDE' },
  ],
  users: [
    { id: 'u1', nom: 'Étudiant', prenom: 'Démo', email: 'etudiant@demo.tn', role: 'student', actif: true },
    { id: 'u2', nom: 'Fournil', prenom: 'Le', email: 'merchant@demo.tn', role: 'merchant', actif: true },
    { id: 'u3', nom: 'Suspendu', prenom: 'Compte', email: 'suspendu@demo.tn', role: 'student', actif: false },
  ],
}

const fail = (code, message) => Promise.reject(Object.assign(new Error(message), { code }))

// Espace étudiant : toutes les offres avec leur commerce (le Fournil = la boutique du commerçant démo)
function offresAvecCommerce() {
  const commerces = [db.shop, ...db.commercesAutres]
  return [...db.offers.map((o) => ({ ...o, commerceId: db.shop.id })), ...db.offresAutres].map((o) => {
    const c = commerces.find((x) => x.id === o.commerceId)
    return { ...o, commerce: { id: c.id, nom: c.nom, type: c.type, adresse: c.adresse, statutValidation: c.statutValidation } }
  })
}

// Deux commandes déjà récupérées par l'étudiant démo, pour que son tableau de bord ne soit pas vide
db.orders.push(
  { id: 'c90', code: 'CS-2031', parEtudiant: true, commerceId: 's4', commerce: { id: 's4', nom: 'Restaurant El Medina', adresse: 'Avenue de Carthage, Tunis' }, lignes: [{ offreId: 'o10', titre: 'Couscous au poulet', quantite: 1, prixUnitaire: 4000, prixInitial: 9000 }], montantTotal: 4000, statut: 'RECUPEREE', dateCommande: h(-50), paiement: { statut: 'REUSSI', reference: 'KNT-DEMO-CS-2031' } },
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
      if (c.paiement) c.paiement = { ...c.paiement, statut: 'ECHOUE' }
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
    })
  },
  // Étudiant : offres visibles (actives, en stock, pas expirées, commerce validé) + filtres de recherche
  listOffers: (filtres = {}) => {
    const q = (filtres.q || '').trim().toLowerCase()
    const maintenant = Date.now()
    const liste = offresAvecCommerce().filter((o) =>
      o.statut === 'ACTIVE' && o.quantiteDisponible > 0 && new Date(o.heureFinRecuperation).getTime() > maintenant &&
      o.commerce.statutValidation === 'VALIDE' &&
      (!q || o.titre.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || o.commerce.nom.toLowerCase().includes(q)) &&
      (!filtres.categorie || o.categorie === filtres.categorie) &&
      (!filtres.prixMax || o.prixReduit <= Number(filtres.prixMax)))
    return wait(liste)
  },
  getOffreDetail: (id) => {
    const o = offresAvecCommerce().find((x) => x.id === id)
    return o ? wait(o) : fail('OFFRE_INTROUVABLE', 'Cette offre est introuvable.')
  },
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
  getMe: (email) => wait(db.users.find((u) => u.email === email) || { id: 'a1', nom: 'Admin', prenom: 'Démo', email, role: email.startsWith('admin') ? 'admin' : 'merchant', actif: true }),
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
  merchantStats: () => wait({
    offresActives: db.offers.filter((o) => o.statut === 'ACTIVE').length,
    commandesDuJour: db.orders.length,
    chiffreAffaires: db.orders.filter((o) => o.statut !== 'ANNULEE').reduce((s, o) => s + o.montantTotal, 0),
    repasSauves: db.orders.filter((o) => o.statut === 'RECUPEREE').reduce((s, o) => s + o.lignes.reduce((n, l) => n + l.quantite, 0), 0),
  }),
  adminStats: () => wait({ utilisateurs: db.users.length, commercesValides: db.shops.filter((s) => s.statutValidation === 'VALIDE').length, commercesEnAttente: db.shops.filter((s) => s.statutValidation === 'EN_ATTENTE').length, commandes: db.orders.length, paiements: db.orders.filter((o) => o.statut !== 'ANNULEE' && o.statut !== 'EN_ATTENTE_PAIEMENT').length }),
  adminShops: (statut) => wait(db.shops.filter((s) => !statut || s.statutValidation === statut)),
  validateShop: (id, decision) => { db.shops = db.shops.map((s) => (s.id === id ? { ...s, statutValidation: decision } : s)); return wait({}) },
  adminUsers: () => wait(db.users),
  setUserActive: (id, actif) => { db.users = db.users.map((u) => (u.id === id ? { ...u, actif } : u)); return wait({}) },
}
