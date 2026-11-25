// Bouton « Installer l'application » : essaie d'ouvrir directement l'application mobile CampusSave (Flutter).
// - Android : lien intent:// ; si l'application n'est pas installée, Chrome renvoie vers /application.
// - Autres cas : lien campussave://ouvrir ; si rien ne s'ouvre au bout de 1,8 s, on affiche /application.
export const PAQUET_ANDROID = 'tn.essect.campussave'

export function lienOuvertureAndroid(origine) {
  const secours = encodeURIComponent(`${origine}/application`)
  return `intent://ouvrir#Intent;scheme=campussave;package=${PAQUET_ANDROID};S.browser_fallback_url=${secours};end`
}

export const estAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)

// Essaie d'ouvrir l'application ; si rien ne s'ouvre (la page reste au premier plan), on affiche /application.
export function ouvrirApplication({ aller }) {
  if (estAndroid()) { window.location.href = lienOuvertureAndroid(window.location.origin); return }
  let ouverte = false
  const marque = () => { ouverte = true }
  window.addEventListener('blur', marque, { once: true })
  document.addEventListener('visibilitychange', marque, { once: true })
  const cadre = document.createElement('iframe')
  cadre.style.display = 'none'
  cadre.src = 'campussave://ouvrir'
  document.body.appendChild(cadre)
  setTimeout(() => {
    cadre.remove()
    window.removeEventListener('blur', marque)
    document.removeEventListener('visibilitychange', marque)
    if (!ouverte) aller('/application')
  }, 1800)
}
