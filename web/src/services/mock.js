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
    { id: 'c1', code: 'CS-2047', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 1, prixUnitaire: 4500 }], montantTotal: 4500, statut: 'RECUPEREE', createdAt: h(-5) },
    { id: 'c2', code: 'CS-2048', lignes: [{ titre: 'Lot de viennoiseries (6 pièces)', quantite: 2, prixUnitaire: 4500 }], montantTotal: 9000, statut: 'PAYEE', createdAt: h(-1) },
    { id: 'c3', code: 'CS-2049', lignes: [{ titre: 'Assortiment de tartes salées', quantite: 1, prixUnitaire: 5000 }], montantTotal: 5000, statut: 'PRETE', createdAt: h(-0.5) },
  ],
  shops: [
    { id: 's2', nom: 'Pâtisserie Les Délices', type: 'PATISSERIE', adresse: 'Tunis', statutValidation: 'EN_ATTENTE' },
    { id: 's3', nom: 'Café Le Jasmin', type: 'CAFETERIA', adresse: 'Ariana', statutValidation: 'EN_ATTENTE' },
    { id: 's1', nom: 'Boulangerie Le Fournil', type: 'BOULANGERIE', adresse: 'Tunis', statutValidation: 'VALIDE' },
  ],
  users: [
    { id: 'u1', nom: 'Étudiant', prenom: 'Démo', email: 'etudiant@demo.tn', role: 'student', actif: true },
    { id: 'u2', nom: 'Fournil', prenom: 'Le', email: 'merchant@demo.tn', role: 'merchant', actif: true },
    { id: 'u3', nom: 'Suspendu', prenom: 'Compte', email: 'suspendu@demo.tn', role: 'student', actif: false },
  ],
}

const fail = (code, message) => Promise.reject(Object.assign(new Error(message), { code }))

export const mock = {
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
  listOrders: () => wait(db.orders),
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
