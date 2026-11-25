const test = require('node:test');
const assert = require('node:assert/strict');
const { estFort } = require('../src/utils/motDePasse');

test('accepte un mot de passe fort', () => {
  assert.equal(estFort('Demo2026!'), true);
  assert.equal(estFort('Campus#Save1'), true);
});

test('refuse un mot de passe trop court', () => {
  assert.equal(estFort('Ab1!'), false);
  assert.equal(estFort('Ab1!xyz'), false); // 7 caractères
});

test('refuse s\'il manque une catégorie de caractères', () => {
  assert.equal(estFort('demo2026!'), false); // pas de majuscule
  assert.equal(estFort('DEMO2026!'), false); // pas de minuscule
  assert.equal(estFort('Demo!Demo!'), false); // pas de chiffre
  assert.equal(estFort('Demo20262'), false); // pas de caractère spécial
});

test('refuse une valeur qui n\'est pas du texte', () => {
  assert.equal(estFort(undefined), false);
  assert.equal(estFort(12345678), false);
  assert.equal(estFort(null), false);
});
