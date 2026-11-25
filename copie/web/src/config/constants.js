// Rôles tels que renvoyés par l'API (GET /users/me) : student / merchant / admin.
export const ROLES = { STUDENT: 'student', MERCHANT: 'merchant', ADMIN: 'admin' }

export const CATEGORIES = ['BOULANGERIE', 'PLATS', 'PATISSERIE', 'BOISSONS']
export const TYPES_COMMERCE = ['RESTAURANT', 'CAFETERIA', 'BOULANGERIE', 'PATISSERIE']

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
// VITE_USE_MOCK=true : données fictives, utile tant que le backend n'est pas prêt.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Libellés lisibles des codes ci-dessus (les codes restent ceux de l'API)
export const LIBELLES = {
  BOULANGERIE: 'Boulangerie', PLATS: 'Plats', PATISSERIE: 'Pâtisserie', BOISSONS: 'Boissons',
  RESTAURANT: 'Restaurant', CAFETERIA: 'Cafétéria',
}
export const libelle = (code) => LIBELLES[code] || code
