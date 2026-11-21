// Libellés et icônes des catégories d'offres, pour l'affichage côté étudiant
export const CATEGORIES_AFFICHAGE = {
  BOULANGERIE: { label: 'Boulangerie', icone: '🥐' },
  PLATS: { label: 'Plats', icone: '🍲' },
  PATISSERIE: { label: 'Pâtisserie', icone: '🧁' },
  BOISSONS: { label: 'Boissons', icone: '🥤' },
}

export const categorie = (code) => CATEGORIES_AFFICHAGE[code] || { label: code, icone: '🍽️' }

// Pourcentage de réduction, par exemple 12 000 → 4 500 donne 63
export const reduction = (o) => Math.round((1 - o.prixReduit / o.prixInitial) * 100)

// Heure seule : « 14:30 »
export const heure = (iso) =>
  new Date(iso).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false })
