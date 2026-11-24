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
const FieldValue = {
  serverTimestamp: () => SERVER_TS,
  delete: () => DELETE,
  increment: (n) => ({ sentinelle: 'increment', n }),
};
const estIncrement = (v) => v && typeof v === 'object' && v.sentinelle === 'increment';

const store = new Map(); // "collection/id" -> données
let compteur = 0;
const copie = (v) => (v === undefined ? v : structuredClone(v, { transfer: [] }));
function resoudre(valeur, actuel) {
  if (valeur === SERVER_TS) return Timestamp.now();
  if (estIncrement(valeur)) return (typeof actuel === 'number' ? actuel : 0) + valeur.n;
  if (Array.isArray(valeur)) return valeur.map(resoudre);
  if (valeur && typeof valeur === 'object' && !(valeur instanceof Timestamp)) {
    return Object.fromEntries(Object.entries(valeur).filter(([, v]) => v !== DELETE).map(([k, v]) => [k, resoudre(v, actuel?.[k])]));
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
    async set(data, options = {}) {
      const actuel = options.merge ? store.get(cle) || {} : {};
      store.set(cle, { ...actuel, ...resoudre(data, actuel) });
    },
    async update(data) {
      if (!store.has(cle)) throw new Error(`NOT_FOUND ${cle}`);
      const actuel = store.get(cle);
      // Champs pointés "a.b" (ex. "qrCode.estUtilise") : on les range dans l'objet
      for (const [k, v] of Object.entries(data)) {
        if (!k.includes('.')) continue;
        const [parent, enfant] = k.split('.');
        data = { ...data, [parent]: { ...(actuel[parent] || {}), ...(data[parent] || {}), [enfant]: v } };
        delete data[k];
      }
      const resolu = resoudre(data, actuel);
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
    orderBy: () => query(collection, filtres, max),
    limit: (n) => query(collection, filtres, n),
    async get() {
      const docs = [...store.keys()]
        .filter((k) => k.startsWith(`${collection}/`))
        .map((k) => snapshot(docRef(collection, k.slice(collection.length + 1))))
        .filter((s) => filtres.every(([c, op, v]) => {
          const x = lireChemin(s.data(), c);
          if (op === 'array-contains') return Array.isArray(x) && x.includes(v);
          if (op === 'in') return v.includes(x);
          return x === v;
        }))
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
        getAll: (...refs) => Promise.all(refs.map((r) => r.get())),
        set: (r, d, o) => ecritures.push(() => r.set(d, o)),
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
