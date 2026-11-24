// Tests du paiement Konnect : node --test (aucune connexion à Firebase ni à Konnect)
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// 1. On remplace src/config/firebase.js par la fausse base AVANT de charger l'API
const fake = require('./fake-firebase');
require.cache[require.resolve('../src/config/firebase')] = {
  id: path.resolve(__dirname, '../src/config/firebase.js'), filename: path.resolve(__dirname, '../src/config/firebase.js'),
  loaded: true, exports: fake,
};
Object.assign(process.env, {
  KONNECT_API_URL: 'https://konnect.test/api/v2', KONNECT_API_KEY: 'cle-test', KONNECT_WALLET_ID: 'wallet-test',
  WEB_APP_URL: 'http://web.test', BACKEND_PUBLIC_URL: 'http://api.test', MAIL_USER: 'x', MAIL_APP_PASSWORD: 'y',
});

// 2. Faux Konnect : on garde les demandes reçues et on choisit le statut des paiements
const konnectRecu = [];
const paiementsKonnect = new Map();
const vraiFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  if (!String(url).startsWith('https://konnect.test')) return vraiFetch(url, options);
  konnectRecu.push({ url: String(url), options });
  if (url.endsWith('/payments/init-payment')) {
    const ref = `ref${konnectRecu.length}`;
    paiementsKonnect.set(ref, { status: 'pending', amount: JSON.parse(options.body).amount, transactions: [] });
    return new Response(JSON.stringify({ payUrl: `https://pay.test/${ref}`, paymentRef: ref }), { status: 200 });
  }
  const ref = decodeURIComponent(url.split('/payments/')[1]);
  return new Response(JSON.stringify({ payment: paiementsKonnect.get(ref) }), { status: 200 });
};

// 3. Faux envoi d'email
const emails = [];
require('../src/services/email').remplacerTransportPourTests({ sendMail: async (m) => emails.push(m) });

const app = require('../src/app');
let base;
const serveur = app.listen(0);
test.before(() => { base = `http://127.0.0.1:${serveur.address().port}/api`; });
test.after(() => serveur.close());

const ETU = 'etu1|student|etu1@test.tn';
const AUTRE = 'etu2|student|etu2@test.tn';
async function appeler(methode, chemin, jeton, corps) {
  const r = await vraiFetch(`${base}${chemin}`, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
async function nouvelleCommande(id, montant = 9000) {
  await fake.db.collection('users').doc('etu1').set({ nom: 'Oueslati', prenom: 'Eya' });
  await fake.db.collection('orders').doc(id).set({
    code: `CS-${id.toUpperCase()}`, idEtudiant: 'etu1', emailEtudiant: 'etu1@test.tn', idCommerce: 's1',
    commerce: { nom: 'Boulangerie Le Fournil', adresse: 'Rue de la Liberté, Tunis' },
    lignes: [{ offreId: 'o1', titre: 'Lot de viennoiseries', quantite: 2, prixUnitaire: montant / 2, prixInitial: 12000 }],
    montantTotal: montant, statut: 'EN_ATTENTE_PAIEMENT', paiement: null, qrCode: null,
    heureDebutRecuperation: fake.Timestamp.fromMillis(Date.now() + 3600e3),
    heureFinRecuperation: fake.Timestamp.fromMillis(Date.now() + 7200e3),
  });
}
const commande = async (id) => fake.cloner(fake.store.get(`orders/${id}`));

test('init : crée le lien Konnect avec le bon montant et les bonnes URL', async () => {
  await nouvelleCommande('c1');
  const r = await appeler('POST', '/payments/init', ETU, { commandeId: 'c1' });
  assert.equal(r.status, 200);
  assert.match(r.body.payUrl, /^https:\/\/pay\.test\//);
  const envoye = JSON.parse(konnectRecu.at(-1).options.body);
  assert.equal(konnectRecu.at(-1).options.headers['x-api-key'], 'cle-test');
  assert.equal(envoye.amount, 9000); // millimes, pris dans la base
  assert.equal(envoye.token, 'TND');
  assert.equal(envoye.receiverWalletId, 'wallet-test');
  assert.equal(envoye.silentWebhook, true);
  assert.equal(envoye.webhook, 'http://api.test/api/payments/webhook');
  assert.equal(envoye.successUrl, 'http://web.test/paiement/retour?commande=c1');
  assert.equal(envoye.failUrl, 'http://web.test/paiement/retour?commande=c1&echec=1');
  const c = await commande('c1');
  assert.equal(c.paiement.statut, 'INITIE');
  assert.equal(c.statut, 'EN_ATTENTE_PAIEMENT');
});

test('init deux fois (double clic) : le même lien, un seul appel à Konnect', async () => {
  const avant = konnectRecu.length;
  const r = await appeler('POST', '/payments/init', ETU, { commandeId: 'c1' });
  assert.equal(r.status, 200);
  assert.equal(konnectRecu.length, avant);
});

test("init : refusé pour la commande d'un autre étudiant, sans jeton, ou sans commandeId", async () => {
  assert.equal((await appeler('POST', '/payments/init', AUTRE, { commandeId: 'c1' })).status, 404);
  assert.equal((await appeler('POST', '/payments/init', null, { commandeId: 'c1' })).status, 401);
  assert.equal((await appeler('POST', '/payments/init', 'm1|merchant|m@t.tn', { commandeId: 'c1' })).status, 403);
  assert.equal((await appeler('POST', '/payments/init', ETU, {})).body.code, 'VALIDATION');
});

test('webhook pendant que le paiement est en cours : rien ne change', async () => {
  const ref = (await commande('c1')).paiement.reference;
  const r = await appeler('GET', `/payments/webhook?payment_ref=${ref}`);
  assert.equal(r.body.statut, 'EN_ATTENTE_PAIEMENT');
  assert.equal(emails.length, 0);
});

test('webhook après paiement réussi : Payée, QR code, un seul email même si appelé deux fois', async () => {
  const ref = (await commande('c1')).paiement.reference;
  paiementsKonnect.set(ref, { status: 'completed', amount: 9000, transactions: [{ status: 'success', method: 'bank_card' }] });
  const r = await appeler('GET', `/payments/webhook?payment_ref=${ref}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.statut, 'PAYEE');
  const c = await commande('c1');
  assert.equal(c.paiement.statut, 'REUSSI');
  assert.equal(c.paiement.methode, 'bank_card');
  assert.equal(c.qrCode.code, 'CS-C1');
  assert.equal(c.qrCode.estUtilise, false);
  assert.equal(c.emailEnvoye, true);
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, 'etu1@test.tn');
  assert.match(emails[0].subject, /CS-C1/);
  assert.match(emails[0].html, /9,000 DT/);
  assert.match(emails[0].html, /Boulangerie Le Fournil/);
  assert.match(emails[0].html, new RegExp(ref));
  assert.equal(emails[0].attachments[0].cid, 'qrcode');
  assert.ok(emails[0].attachments[0].content.length > 100); // image PNG du QR code

  await appeler('GET', `/payments/webhook?payment_ref=${ref}`); // Konnect rappelle
  assert.equal(emails.length, 1);
});

test('init sur une commande déjà payée : refusé', async () => {
  const r = await appeler('POST', '/payments/init', ETU, { commandeId: 'c1' });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'COMMANDE_DEJA_PAYEE');
});

test('montant Konnect différent de la commande : pas validée', async () => {
  await nouvelleCommande('c2', 5000);
  await appeler('POST', '/payments/init', ETU, { commandeId: 'c2' });
  const ref = (await commande('c2')).paiement.reference;
  paiementsKonnect.set(ref, { status: 'completed', amount: 100, transactions: [{ status: 'success' }] });
  const r = await appeler('GET', `/payments/webhook?payment_ref=${ref}`);
  assert.equal(r.body.statut, 'EN_ATTENTE_PAIEMENT');
});

test('paiement "completed" mais transaction échouée : pas validée', async () => {
  await nouvelleCommande('c3', 5000);
  await appeler('POST', '/payments/init', ETU, { commandeId: 'c3' });
  const ref = (await commande('c3')).paiement.reference;
  paiementsKonnect.set(ref, { status: 'completed', amount: 5000, transactions: [{ status: 'failed' }] });
  assert.equal((await appeler('GET', `/payments/webhook?payment_ref=${ref}`)).body.statut, 'EN_ATTENTE_PAIEMENT');
});

test('webhook : référence manquante ou inconnue', async () => {
  assert.equal((await appeler('GET', '/payments/webhook')).status, 400);
  assert.equal((await appeler('GET', '/payments/webhook?payment_ref=inconnue')).status, 404);
});

test('Konnect non configuré : erreur claire 503', async () => {
  await nouvelleCommande('c4');
  const cle = process.env.KONNECT_API_KEY;
  delete process.env.KONNECT_API_KEY;
  const r = await appeler('POST', '/payments/init', ETU, { commandeId: 'c4' });
  process.env.KONNECT_API_KEY = cle;
  assert.equal(r.status, 503);
  assert.equal(r.body.code, 'PAIEMENT_INDISPONIBLE');
});

// ----- Passerelle de test (PAIEMENT_MODE=simulation) -----
test('simulation : paiement de test réussi → commande payée, QR code et email, sans appeler Konnect', async () => {
  process.env.PAIEMENT_MODE = 'simulation';
  try {
    await nouvelleCommande('sim1', 6000);
    const avant = konnectRecu.length;
    const init = await appeler('POST', '/payments/init', ETU, { commandeId: 'sim1' });
    assert.equal(init.status, 200);
    assert.equal(init.body.payUrl, '/paiement/simulation/sim1');
    const r = await appeler('POST', '/payments/simulation', ETU, { commandeId: 'sim1', reussi: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.statut, 'PAYEE');
    assert.equal(r.body.qrCode.code, 'CS-SIM1');
    assert.equal(r.body.paiement.methode, 'bank_card');
    assert.equal(konnectRecu.length, avant, 'Konnect ne doit pas être appelé');
    // un 2e clic ne change rien
    const r2 = await appeler('POST', '/payments/simulation', ETU, { commandeId: 'sim1', reussi: true });
    assert.equal(r2.body.statut, 'PAYEE');
  } finally { delete process.env.PAIEMENT_MODE; }
});

test('simulation : paiement refusé → commande toujours en attente ; autre étudiant refusé', async () => {
  process.env.PAIEMENT_MODE = 'simulation';
  try {
    await nouvelleCommande('sim2');
    await appeler('POST', '/payments/init', ETU, { commandeId: 'sim2' });
    assert.equal((await appeler('POST', '/payments/simulation', AUTRE, { commandeId: 'sim2', reussi: true })).status, 404);
    const r = await appeler('POST', '/payments/simulation', ETU, { commandeId: 'sim2', reussi: false });
    assert.equal(r.body.statut, 'EN_ATTENTE_PAIEMENT');
  } finally { delete process.env.PAIEMENT_MODE; }
});

test('simulation désactivée en mode Konnect', async () => {
  await nouvelleCommande('sim3');
  const r = await appeler('POST', '/payments/simulation', ETU, { commandeId: 'sim3', reussi: true });
  assert.equal(r.status, 404);
});

// ----- Passerelle Stripe (PAIEMENT_MODE=stripe), avec un faux Stripe -----
test('stripe : session de paiement créée, puis commande payée quand Stripe dit « paid »', async () => {
  Object.assign(process.env, { PAIEMENT_MODE: 'stripe', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_API_URL: 'https://stripe.test/v1' });
  const sessions = new Map();
  const ancienFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    if (!String(url).startsWith('https://stripe.test')) return ancienFetch(url, options);
    if (options.method === 'POST') {
      const p = new URLSearchParams(options.body);
      const s = { id: 'cs_test_1', url: 'https://checkout.stripe.test/cs_test_1', payment_status: 'unpaid', status: 'open',
        metadata: { montantMillimes: p.get('metadata[montantMillimes]') }, unit: p.get('line_items[0][price_data][unit_amount]') };
      sessions.set(s.id, s);
      return new Response(JSON.stringify(s), { status: 200 });
    }
    return new Response(JSON.stringify(sessions.get(url.split('/').pop())), { status: 200 });
  };
  try {
    await nouvelleCommande('str1', 10000);
    const init = await appeler('POST', '/payments/init', ETU, { commandeId: 'str1' });
    assert.equal(init.body.payUrl, 'https://checkout.stripe.test/cs_test_1');
    assert.equal(sessions.get('cs_test_1').unit, '10000'); // 10 DT = 10000 millimes, en TND
    let c = await appeler('GET', '/orders/str1', ETU);
    assert.equal(c.body.statut, 'EN_ATTENTE_PAIEMENT');
    sessions.get('cs_test_1').payment_status = 'paid';
    const { verifierPaiement, lireCommande } = require('../src/services/paiement');
    c = await verifierPaiement(await lireCommande('str1'));
    assert.equal(c.statut, 'PAYEE');
    assert.equal(c.qrCode.code, 'CS-STR1');
  } finally {
    global.fetch = ancienFetch;
    for (const k of ['PAIEMENT_MODE', 'STRIPE_SECRET_KEY', 'STRIPE_API_URL']) delete process.env[k];
  }
});
