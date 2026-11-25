const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { creerLimiteur } = require('../src/middleware/limiteur');

function demarrer(max) {
  const app = express();
  app.get('/ok', creerLimiteur({ fenetreMs: 60_000, max, message: 'Trop de tentatives.' }), (req, res) => res.json({ ok: true }));
  return new Promise((resolve) => {
    const serveur = app.listen(0, () => resolve({ serveur, url: `http://127.0.0.1:${serveur.address().port}/ok` }));
  });
}

test('limite de requêtes : au-delà du maximum, réponse 429 en français', async () => {
  const { serveur, url } = await demarrer(3);
  try {
    for (let i = 0; i < 3; i += 1) assert.equal((await fetch(url)).status, 200);
    const refuse = await fetch(url);
    assert.equal(refuse.status, 429);
    const corps = await refuse.json();
    assert.equal(corps.code, 'TROP_DE_REQUETES');
    assert.equal(corps.message, 'Trop de tentatives.');
  } finally {
    serveur.close();
  }
});
