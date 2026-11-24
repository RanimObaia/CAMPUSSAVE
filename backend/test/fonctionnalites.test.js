// Tests des nouvelles fonctionnalités : e-mail de refus, favoris, avis, délégation,
// signalements, notifications, recherche avancée, offres récurrentes, stats publiques.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const fake = require('./fake-firebase');
require.cache[require.resolve('../src/config/firebase')] = {
  id: path.resolve(__dirname, '../src/config/firebase.js'), filename: path.resolve(__dirname, '../src/config/firebase.js'),
  loaded: true, exports: fake,
};
Object.assign(process.env, {
  NODE_ENV: 'test', KONNECT_API_URL: 'https://konnect.test/api/v2', KONNECT_API_KEY: 'cle', KONNECT_WALLET_ID: 'w',
  WEB_APP_URL: 'http://web.test', BACKEND_PUBLIC_URL: 'http://api.test', MAIL_USER: 'equipe@test.tn', MAIL_APP_PASSWORD: 'y',
});

const paiementsKonnect = new Map();
const vraiFetch = global.fetch;
let nbInit = 0;
global.fetch = async (url, options = {}) => {
  if (!String(url).startsWith('https://konnect.test')) return vraiFetch(url, options);
  if (url.endsWith('/payments/init-payment')) {
    const ref = `ref${(nbInit += 1)}`;
    paiementsKonnect.set(ref, { status: 'pending', amount: JSON.parse(options.body).amount, transactions: [] });
    return new Response(JSON.stringify({ payUrl: `https://pay.test/${ref}`, paymentRef: ref }), { status: 200 });
  }
  const ref = decodeURIComponent(url.split('/payments/')[1]);
  return new Response(JSON.stringify({ payment: paiementsKonnect.get(ref) }), { status: 200 });
};

const emails = [];
require('../src/services/email').remplacerTransportPourTests({ sendMail: async (m) => emails.push(m) });

const app = require('../src/app');
const offres = require('../src/controllers/offers.controller');
const { nettoyerCommandes, envoyerRappels } = require('../src/services/nettoyage');
let base;
const serveur = app.listen(0);
test.before(() => { base = `http://127.0.0.1:${serveur.address().port}/api`; });
test.after(() => serveur.close());

const ETU = 'etu1|student|etu1@test.tn';
const MARCHAND = 'm1|merchant|m1@test.tn';
const ADMIN = 'a1|admin|a1@test.tn';
async function appeler(methode, chemin, jeton, corps) {
  const r = await vraiFetch(`${base}${chemin}`, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  return { status: r.status, body: r.status === 204 ? null : await r.json() };
}
const lire = (cle) => fake.cloner(fake.store.get(cle));
const dans = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const attendre = () => new Promise((r) => setTimeout(r, 30));

test.before(async () => {
  await fake.db.collection('users').doc('etu1').set({ nom: 'Oueslati', prenom: 'Eya', role: 'student', email: 'etu1@test.tn' });
  await fake.db.collection('users').doc('m1').set({ nom: 'Ben Amor', prenom: 'Sami', role: 'merchant' });
  // Deux commerces : un tout près de l'ESSECT, un plus loin
  await fake.db.collection('shops').doc('s1').set({
    nom: 'Café Chez Nous', type: 'CAFETERIA', adresse: 'Montfleury', latitude: 36.7874, longitude: 10.1742,
    statutValidation: 'VALIDE', idCommercant: 'm1',
  });
  await fake.db.collection('shops').doc('s2').set({
    nom: 'Restaurant Lointain', type: 'RESTAURANT', adresse: 'La Marsa', latitude: 36.878, longitude: 10.324,
    statutValidation: 'VALIDE', idCommercant: 'm2', noteMoyenne: 4.8, nbAvis: 10,
  });
  await fake.db.collection('offers').doc('o1').set({
    commerceId: 's1', titre: 'Sandwich végétarien', description: '', categorie: 'PLATS', prixInitial: 6000, prixReduit: 3000,
    quantiteDisponible: 5, heureDebutRecuperation: dans(0.5), heureFinRecuperation: dans(2), statut: 'ACTIVE', regimes: ['VEGETARIEN'],
  });
  await fake.db.collection('offers').doc('o2').set({
    commerceId: 's2', titre: 'Couscous', description: '', categorie: 'PLATS', prixInitial: 10000, prixReduit: 2000,
    quantiteDisponible: 3, heureDebutRecuperation: dans(5), heureFinRecuperation: dans(6), statut: 'ACTIVE', regimes: [],
  });
});

async function commanderEtLancerPaiement(quantite = 2) {
  const c = await appeler('POST', '/orders', ETU, { commerceId: 's1', lignes: [{ offreId: 'o1', quantite }] });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  const p = await appeler('POST', '/payments/init', ETU, { commandeId: c.body.id });
  assert.equal(p.status, 200);
  return c.body.id;
}

// ---------------- Paiement : e-mail de refus ----------------

test('paiement refusé (retour Konnect en échec) : commande annulée, stock remis, e-mail de refus envoyé une fois', async () => {
  const id = await commanderEtLancerPaiement(2);
  assert.equal(lire('offers/o1').quantiteDisponible, 3);
  const r = await appeler('POST', `/orders/${id}/cancel`, ETU);
  assert.equal(r.status, 200);
  assert.equal(r.body.statut, 'ANNULEE');
  assert.equal(r.body.paiement.statut, 'ECHOUE');
  assert.ok(r.body.paiement.reference, 'la référence Konnect est gardée');
  assert.equal(lire('offers/o1').quantiteDisponible, 5);
  const refus = emails.filter((m) => /non abouti/.test(m.subject));
  assert.equal(refus.length, 1);
  assert.equal(refus[0].to, 'etu1@test.tn');
  assert.match(refus[0].html, /Aucun montant/);
  assert.match(refus[0].html, /Café Chez Nous/);
  assert.equal(lire(`orders/${id}`).emailEchecEnvoye, true);

  await appeler('POST', `/orders/${id}/cancel`, ETU); // deuxième appel : rien de plus
  assert.equal(emails.filter((m) => /non abouti/.test(m.subject)).length, 1);
});

test('webhook Konnect « failed » : commande annulée et e-mail de refus', async () => {
  const id = await commanderEtLancerPaiement(1);
  const ref = lire(`orders/${id}`).paiement.reference;
  paiementsKonnect.set(ref, { status: 'failed', amount: 3000, transactions: [{ status: 'failed' }] });
  const avant = emails.length;
  const r = await appeler('GET', `/payments/webhook?payment_ref=${ref}`);
  assert.equal(r.body.statut, 'ANNULEE');
  assert.equal(emails.length, avant + 1);
  assert.match(emails.at(-1).subject, /non abouti/);
});

test('paiement réussi : e-mail de confirmation + notification dans la cloche', async () => {
  const id = await commanderEtLancerPaiement(1);
  const ref = lire(`orders/${id}`).paiement.reference;
  paiementsKonnect.set(ref, { status: 'completed', amount: 3000, transactions: [{ status: 'success' }] });
  const r = await appeler('GET', `/payments/webhook?payment_ref=${ref}`);
  assert.equal(r.body.statut, 'PAYEE');
  assert.match(emails.at(-1).subject, /Paiement confirmé/);
  await attendre();
  const n = await appeler('GET', '/notifications', ETU);
  assert.ok(n.body.notifications.some((x) => x.type === 'PAIEMENT_REUSSI'));
  assert.ok(n.body.nonLues >= 1);
});

test('commande expirée (30 min) après un paiement lancé : annulée par le nettoyage, e-mail « délai dépassé »', async () => {
  const id = await commanderEtLancerPaiement(1);
  await fake.db.collection('orders').doc(id).update({ dateCommande: fake.Timestamp.fromMillis(Date.now() - 31 * 60e3) });
  await nettoyerCommandes();
  assert.equal(lire(`orders/${id}`).statut, 'ANNULEE');
  assert.match(emails.at(-1).html, /délai de paiement/);
});

// ---------------- Recherche avancée ----------------

test('offres : tri par distance, filtre régime, distance max, créneau', async () => {
  const proches = await appeler('GET', '/offers?tri=distance');
  assert.deepEqual(proches.body.map((o) => o.id), ['o1', 'o2']);
  assert.ok(proches.body[0].distanceKm < 1);
  assert.ok(proches.body[0].commerce.latitude);
  assert.deepEqual((await appeler('GET', '/offers?regime=VEGETARIEN')).body.map((o) => o.id), ['o1']);
  assert.deepEqual((await appeler('GET', '/offers?distanceMax=2')).body.map((o) => o.id), ['o1']);
  assert.deepEqual((await appeler('GET', '/offers?tri=note')).body.map((o) => o.id), ['o2', 'o1']);
  assert.deepEqual((await appeler('GET', '/offers?tri=remise')).body.map((o) => o.id), ['o2', 'o1']);
  assert.deepEqual((await appeler('GET', '/offers?creneau=maintenant')).body.map((o) => o.id), ['o1']);
  assert.equal((await appeler('GET', '/offers?tri=nimporte')).status, 400);
});

// ---------------- Favoris + alerte ----------------

test('favoris : ajout, liste, alerte quand le commerce publie, retrait', async () => {
  assert.equal((await appeler('PUT', '/users/me/favoris/s1', ETU)).body.favoris[0], 's1');
  const liste = await appeler('GET', '/users/me/favoris', ETU);
  assert.equal(liste.body[0].nom, 'Café Chez Nous');
  assert.equal(liste.body[0].offresDisponibles, 1);

  const publiee = await appeler('POST', '/offers', MARCHAND, {
    titre: 'Croissants', categorie: 'BOULANGERIE', prixInitial: 4000, prixReduit: 1500, quantiteDisponible: 4,
    heureDebutRecuperation: dans(1), heureFinRecuperation: dans(3), regimes: ['VEGETARIEN'], recurrente: true,
  });
  assert.equal(publiee.status, 201, JSON.stringify(publiee.body));
  await attendre();
  const n = await appeler('GET', '/notifications', ETU);
  const alerte = n.body.notifications.find((x) => x.type === 'OFFRE_FAVORI');
  assert.match(alerte.titre, /Café Chez Nous/);

  // marquer lue puis tout lu
  assert.equal((await appeler('PATCH', `/notifications/${alerte.id}/lu`, ETU)).body.lu, true);
  assert.equal((await appeler('POST', '/notifications/tout-lu', ETU)).body.nonLues, 0);
  assert.equal((await appeler('GET', '/notifications', ETU)).body.nonLues, 0);

  assert.deepEqual((await appeler('DELETE', '/users/me/favoris/s1', ETU)).body.favoris, []);
  assert.equal((await appeler('PUT', '/users/me/favoris/inconnu', ETU)).status, 404);
});

test('préférences : couper les alertes favoris', async () => {
  const r = await appeler('PUT', '/users/me', ETU, { preferences: { langue: 'ar', notifications: { favoris: false } } });
  assert.equal(r.status, 200);
  assert.equal(r.body.preferences.langue, 'ar');
  assert.equal(r.body.preferences.notifications.favoris, false);
  assert.equal((await appeler('PUT', '/users/me', ETU, { preferences: { langue: 'de' } })).status, 400);
  await appeler('PUT', '/users/me', ETU, { preferences: { notifications: { favoris: true } } });
});

// ---------------- Offres récurrentes ----------------

test('republier en un clic et republication automatique des offres récurrentes', async () => {
  const mien = (await appeler('GET', '/offers?mine=true', MARCHAND)).body;
  const croissants = mien.find((o) => o.titre === 'Croissants');
  const copie = await appeler('POST', `/offers/${croissants.id}/republier`, MARCHAND, { quantiteDisponible: 6 });
  assert.equal(copie.status, 201);
  assert.equal(copie.body.quantiteDisponible, 6);
  assert.equal(copie.body.recurrente, true);

  // Le créneau de la copie est passé : la tâche automatique la republie pour le lendemain
  await fake.db.collection('offers').doc(copie.body.id).update({ heureDebutRecuperation: dans(-25), heureFinRecuperation: dans(-23) });
  assert.equal(await offres.republierRecurrentes(), 1);
  const apres = (await appeler('GET', '/offers?mine=true', MARCHAND)).body.filter((o) => o.titre === 'Croissants');
  const nouvelle = apres.find((o) => o.offreOrigine === copie.body.id);
  assert.ok(new Date(nouvelle.heureFinRecuperation) > new Date());
  assert.equal(lire(`offers/${copie.body.id}`).recurrente, false);
});

// ---------------- Rappel, délégation, avis ----------------

test('rappel de retrait 30 min avant, une seule fois', async () => {
  const commandes = (await appeler('GET', '/orders/mine', ETU)).body;
  const payee = commandes.find((c) => c.statut === 'PAYEE');
  await envoyerRappels();
  await envoyerRappels();
  const n = (await appeler('GET', '/notifications', ETU)).body.notifications.filter((x) => x.type === 'RAPPEL_RETRAIT' && x.commandeId === payee.id);
  assert.equal(n.length, 1);
});

test("délégation : lien secret pour un ami, visible sans connexion, annulable", async () => {
  const payee = (await appeler('GET', '/orders/mine', ETU)).body.find((c) => c.statut === 'PAYEE');
  const d = await appeler('POST', `/orders/${payee.id}/deleguer`, ETU, { nom: 'Ranim' });
  assert.equal(d.status, 200);
  assert.match(d.body.lien, /^http:\/\/web\.test\/retrait\//);
  const vue = await appeler('GET', `/orders/delegue/${d.body.token}`);
  assert.equal(vue.status, 200);
  assert.equal(vue.body.code, payee.code);
  assert.equal(vue.body.nomDelegue, 'Ranim');
  assert.equal(vue.body.prenomEtudiant, 'Eya');
  assert.equal(vue.body.idEtudiant, undefined);
  await appeler('DELETE', `/orders/${payee.id}/deleguer`, ETU);
  assert.equal((await appeler('GET', `/orders/delegue/${d.body.token}`)).status, 404);
});

test('avis : seulement après retrait, une fois, met à jour la note du commerce', async () => {
  const payee = (await appeler('GET', '/orders/mine', ETU)).body.find((c) => c.statut === 'PAYEE');
  assert.equal((await appeler('POST', `/orders/${payee.id}/avis`, ETU, { note: 5 })).body.code, 'AVIS_TROP_TOT');
  const remise = await appeler('POST', '/orders/validate-qr', MARCHAND, { code: payee.code });
  assert.equal(remise.status, 200, JSON.stringify(remise.body));
  const avis = await appeler('POST', `/orders/${payee.id}/avis`, ETU, { note: 4, commentaire: 'Très bon, encore chaud.' });
  assert.equal(avis.status, 201);
  assert.equal((await appeler('POST', `/orders/${payee.id}/avis`, ETU, { note: 1 })).body.code, 'AVIS_DEJA_DONNE');
  assert.equal((await appeler('POST', `/orders/${payee.id}/avis`, ETU, { note: 9 })).status, 400);
  assert.equal(lire('shops/s1').noteMoyenne, 4);
  assert.equal(lire('shops/s1').nbAvis, 1);
  const liste = await appeler('GET', '/shops/s1/avis');
  assert.equal(liste.body[0].commentaire, 'Très bon, encore chaud.');
  assert.equal(liste.body[0].idEtudiant, undefined);
});

// ---------------- Signalements, contact, stats ----------------

test("signalement : l'étudiant signale, l'admin traite et l'étudiant est prévenu", async () => {
  const c = (await appeler('GET', '/orders/mine', ETU)).body[0];
  assert.equal((await appeler('POST', '/reports', ETU, { motif: 'QUALITE', message: 'court' })).status, 400);
  const s = await appeler('POST', '/reports', ETU, { commandeId: c.id, motif: 'QUALITE', message: 'Le sandwich était froid et sec.' });
  assert.equal(s.status, 201);
  assert.equal(s.body.statut, 'OUVERT');
  const admin = await appeler('GET', '/admin/reports?statut=OUVERT', ADMIN);
  assert.equal(admin.body.length, 1);
  assert.equal((await appeler('GET', '/admin/reports', ETU)).status, 403);
  const t = await appeler('PATCH', `/admin/reports/${s.body.id}`, ADMIN, { statut: 'TRAITE', reponse: 'Le commerce a été averti.' });
  assert.equal(t.body.statut, 'TRAITE');
  await attendre();
  assert.ok((await appeler('GET', '/notifications', ETU)).body.notifications.some((n) => n.type === 'SIGNALEMENT'));
  assert.equal((await appeler('GET', '/reports/mine', ETU)).body[0].reponse, 'Le commerce a été averti.');
});

test('modération : l\'admin retire une offre, le commerçant est prévenu', async () => {
  const r = await appeler('PATCH', '/admin/offers/o2/retirer', ADMIN, { motif: 'Photo trompeuse' });
  assert.equal(r.body.statut, 'RETIREE');
  assert.equal((await appeler('GET', '/admin/offers', ADMIN)).status, 200);
  assert.equal((await appeler('GET', '/admin/orders', ADMIN)).status, 200);
});

test('contact : message enregistré et transmis à l\'équipe', async () => {
  const r = await appeler('POST', '/contact', null, { nom: 'Azer', email: 'azer@test.tn', sujet: 'Partenariat', message: 'Bonjour, je voudrais inscrire mon café.' });
  assert.equal(r.status, 201);
  assert.equal(r.body.emailEnvoye, true);
  assert.equal(emails.at(-1).to, 'equipe@test.tn');
  assert.equal(emails.at(-1).replyTo, 'azer@test.tn');
  assert.equal((await appeler('POST', '/contact', null, { nom: 'A', email: 'pas-un-mail', sujet: '', message: '' })).status, 400);
});

test('stats publiques, étudiant (CO2 + niveau) et commerçant détaillées', async () => {
  const p = await appeler('GET', '/stats/public');
  assert.equal(p.status, 200);
  assert.ok(p.body.repasSauves >= 1);
  assert.equal(p.body.commerces, 2);
  assert.ok(p.body.co2Evite > 0);
  const e = await appeler('GET', '/stats/student', ETU);
  assert.equal(e.body.co2Evite, e.body.repasSauves * 2.5);
  assert.equal(e.body.niveau.nom, 'Graine');
  const m = await appeler('GET', '/stats/merchant/detail', MARCHAND);
  assert.equal(m.body.parJour.length, 14);
  assert.equal(m.body.noteMoyenne, 4);
  assert.ok(m.body.topOffres.length >= 1);
});
