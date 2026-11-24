// Libellés des catégories d'offres, pour l'affichage côté étudiant
export const CATEGORIES_AFFICHAGE = {
  BOULANGERIE: { label: 'Boulangerie' },
  PLATS: { label: 'Plats' },
  PATISSERIE: { label: 'Pâtisserie' },
  BOISSONS: { label: 'Boissons' },
}

export const categorie = (code) => CATEGORIES_AFFICHAGE[code] || { label: code }

// Pourcentage de réduction, par exemple 12 000 → 4 500 donne 63
export const reduction = (o) => Math.round((1 - o.prixReduit / o.prixInitial) * 100)

// Heure seule : « 14:30 »
export const heure = (iso) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' })

// Temps restant avant la fin du retrait : « 1 h 20 », « 35 min », ou null si c'est fini.
// urgent = moins d'une heure.
export function finDans(iso, maintenant = Date.now()) {
  const minutes = Math.round((new Date(iso).getTime() - maintenant) / 60000)
  if (!(minutes > 0)) return null
  const texte = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, '0')}` : ''}`
  return { texte, urgent: minutes < 60 }
}
