// Fausse base Firestore + faux Firebase Auth, en mémoire, pour les tests automatiques.
// Elle imite seulement les fonctions utilisées par le backend.
class Timestamp {
  constructor(ms) { this.ms = ms; }
  static now() { return new Timestamp(Date.now()); }
  static fromMillis(ms) { return new Timestamp(ms); }
  static fromDate(d) { return new Timestamp(d.getTime()); }
  toMillis() { return this.ms; }
  toDate() { return new Date(this.ms); }
}
const SERVER_TS = { sentinelle: 'serverTimestamp' };
const DELETE = { sentinelle: 'delete' };
const FieldValue = { serverTimestamp: () => SERVER_TS, delete: () => DELETE };

const store = new Map(); // "collection/id" -> données
let compteur = 0;
const copie = (v) => (v === undefined ? v : structuredClone(v, { transfer: [] }));
function resoudre(valeur) {
  if (valeur === SERVER_TS) return Timestamp.now();
  if (Array.isArray(valeur)) return valeur.map(resoudre);
  if (valeur && typeof valeur === 'object' && !(valeur instanceof Timestamp)) {
    return Object.fromEntries(Object.entries(valeur).filter(([, v]) => v !== DELETE).map(([k, v]) => [k, resoudre(v)]));
  }
  return valeur;
}
const lireChemin = (obj, chemin) => chemin.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
function cloner(data) { // garde les Timestamp comme Timestamp
  if (data instanceof Timestamp) return new Timestamp(data.ms);
  if (Array.isArray(data)) return data.map(cloner);
  if (data && typeof data === 'object') return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, cloner(v)]));
  return data;
}

function docRef(collection, id) {
  const cle = `${collection}/${id}`;
  const ref = {
    id,
    async get() { return snapshot(ref); },
    async set(data) { store.set(cle, resoudre(data)); },
    async update(data) {
      if (!store.has(cle)) throw new Error(`NOT_FOUND ${cle}`);
      const actuel = store.get(cle);
      const resolu = resoudre(data);
      for (const [k, v] of Object.entries(data)) if (v === DELETE) delete actuel[k];
      store.set(cle, { ...actuel, ...resolu });
    },
    _cle: cle,
  };
  return ref;
}
function snapshot(ref) {
  const data = store.get(ref._cle);
  return { id: ref.id, ref, exists: data !== undefined, data: () => cloner(data) };
}
function query(collection, filtres = [], max = Infinity) {
  return {
    where: (champ, op, valeur) => query(collection, [...filtres, [champ, op, valeur]], max),
    limit: (n) => query(collection, filtres, n),
    async get() {
      const docs = [...store.keys()]
        .filter((k) => k.startsWith(`${collection}/`))
        .map((k) => snapshot(docRef(collection, k.slice(collection.length + 1))))
        .filter((s) => filtres.every(([c, , v]) => lireChemin(s.data(), c) === v))
        .slice(0, max);
      return { empty: docs.length === 0, docs };
    },
  };
}
let verrou = Promise.resolve();
const db = {
  collection: (nom) => ({
    doc: (id) => docRef(nom, id || `auto${(compteur += 1)}`),
    ...query(nom),
  }),
  // Une transaction à la fois : suffisant pour tester l'isolation
  runTransaction(fn) {
    const suite = verrou.then(async () => {
      const ecritures = [];
      const t = {
        get: (r) => (r.get ? r.get() : r),
        set: (r, d) => ecritures.push(() => r.set(d)),
        update: (r, d) => ecritures.push(() => r.update(d)),
      };
      const resultat = await fn(t);
      for (const e of ecritures) await e();
      return resultat;
    });
    verrou = suite.catch(() => {});
    return suite;
  },
};

// Jeton de test : "uid|role|email"
const auth = {
  async verifyIdToken(token) {
    const [uid, role, email] = token.split('|');
    if (!uid) throw Object.assign(new Error('bad'), { code: 'auth/argument-error' });
    return { uid, role, email };
  },
};

module.exports = { db, auth, FieldValue, Timestamp, store, cloner };
