// Règles du mot de passe fort : 8 caractères minimum, avec au moins une minuscule,
// une majuscule, un chiffre et un caractère spécial.
const LONGUEUR_MIN = 8

const MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères, avec une minuscule, une majuscule, un chiffre et un caractère spécial.'

function estFort(motDePasse) {
  if (typeof motDePasse !== 'string') return false
  return (
    motDePasse.length >= LONGUEUR_MIN &&
    /[a-z]/.test(motDePasse) &&
    /[A-Z]/.test(motDePasse) &&
    /\d/.test(motDePasse) &&
    /[^A-Za-z0-9\s]/.test(motDePasse)
  )
}

module.exports = { estFort, MESSAGE, LONGUEUR_MIN }
