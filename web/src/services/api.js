import { API_URL, USE_MOCK } from '../config/constants'
import { auth } from './firebase'
import { mock } from './mock'

// Appel REST avec le jeton Firebase. Les erreurs de l'API ont la forme { code, message }.
async function request(path, { method = 'GET', body } = {}) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.message || data.error || `Erreur ${res.status}`), { code: data.code, status: res.status })
  return data
}

const real = {
  // Inscription (étudiant ou commerçant) : route publique, sans jeton
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/users/me'),
  // Étudiant : recherche d'offres (produit ou commerce, catégorie, prix maximum en millimes)
  listOffers: (filtres = {}) => {
    const params = new URLSearchParams()
    for (const [cle, valeur] of Object.entries(filtres)) if (valeur) params.set(cle, valeur)
    const qs = params.toString()
    return request(`/offers${qs ? `?${qs}` : ''}`)
  },
  getOffreDetail: (id) => request(`/offers/${id}`),
  getMyShop: () => request('/shops/mine'),
  saveShop: (data) => (data.id ? request(`/shops/${data.id}`, { method: 'PUT', body: data }) : request('/shops', { method: 'POST', body: data })),
  listMyOffers: () => request('/offers?mine=true'),
  getOffer: (id) => request(`/offers/${id}`),
  createOffer: (data) => request('/offers', { method: 'POST', body: data }),
  updateOffer: (id, data) => request(`/offers/${id}`, { method: 'PUT', body: data }),
  removeOffer: (id) => request(`/offers/${id}`, { method: 'DELETE' }),
  listOrders: () => request('/orders'),
  markReady: (id) => request(`/orders/${id}/ready`, { method: 'PATCH' }),
  validateQr: (code) => request('/orders/validate-qr', { method: 'POST', body: { code } }),
  merchantStats: () => request('/stats/merchant'),
  adminStats: () => request('/stats/admin'),
  adminShops: (statut) => request(`/admin/shops${statut ? `?statut=${statut}` : ''}`),
  validateShop: (id, decision) => request(`/admin/shops/${id}/validate`, { method: 'PATCH', body: { decision } }),
  adminUsers: () => request('/admin/users'),
  setUserActive: (id, actif) => request(`/admin/users/${id}`, { method: 'PATCH', body: { actif } }),
}

export const api = USE_MOCK ? mock : real
