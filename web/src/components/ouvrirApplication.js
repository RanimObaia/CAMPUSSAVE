// Bouton « Installer l'application » : ouvre directement l'application mobile.
// - Android : lien intent:// ; si l'application est installée elle s'ouvre, sinon Chrome renvoie vers /application
//   (téléchargement de l'APK ou installation du site).
// - Autres cas : installation du site (PWA) si le navigateur la propose, sinon page /application.
export const PAQUET_ANDROID = 'tn.essect.campussave'

export function lienOuvertureAndroid(origine) {
  const secours = encodeURIComponent(`${origine}/application`)
  return `intent://ouvrir#Intent;scheme=campussave;package=${PAQUET_ANDROID};S.browser_fallback_url=${secours};end`
}

export const estAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)

export async function ouvrirApplication({ installerSite, possible, aller }) {
  if (estAndroid()) { window.location.href = lienOuvertureAndroid(window.location.origin); return }
  if (possible && await installerSite()) return
  aller('/application')
}