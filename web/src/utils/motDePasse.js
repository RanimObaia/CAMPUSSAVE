// Règles du mot de passe fort (mêmes règles que le backend et l'application mobile).
// - 8 caractères minimum
// - au moins une lettre minuscule, une majuscule, un chiffre et un caractère spécial

export const LONGUEUR_MIN = 8

export const REGLES = [
  { id: 'longueur', texte: `${LONGUEUR_MIN} caractères minimum`, ok: (m) => m.length >= LONGUEUR_MIN },
  { id: 'minuscule', texte: 'Une lettre minuscule (a-z)', ok: (m) => /[a-z]/.test(m) },
  { id: 'majuscule', texte: 'Une lettre majuscule (A-Z)', ok: (m) => /[A-Z]/.test(m) },
  { id: 'chiffre', texte: 'Un chiffre (0-9)', ok: (m) => /\d/.test(m) },
  { id: 'special', texte: 'Un caractère spécial (! @ # $ % …)', ok: (m) => /[^A-Za-z0-9\s]/.test(m) },
]

// Renvoie les règles avec leur état pour ce mot de passe
export function evaluer(motDePasse) {
  const m = motDePasse || ''
  return REGLES.map((r) => ({ id: r.id, texte: r.texte, ok: r.ok(m) }))
}

export function estFort(motDePasse) {
  return evaluer(motDePasse).every((r) => r.ok)
}

// Niveau 0 à 5 (nombre de règles respectées) et libellé
export function niveau(motDePasse) {
  const n = evaluer(motDePasse).filter((r) => r.ok).length
  const libelle = n <= 2 ? 'Faible' : n <= 4 ? 'Moyen' : 'Fort'
  return { n, total: REGLES.length, libelle }
}

export const MESSAGE_FAIBLE =
  'Mot de passe trop faible : 8 caractères minimum avec une minuscule, une majuscule, un chiffre et un caractère spécial.'
