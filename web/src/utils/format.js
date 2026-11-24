// Les montants circulent en millimes (1 DT = 1000 millimes).
export const dt = (m) => `${(Number(m || 0) / 1000).toFixed(3).replace('.', ',')} DT`
export const toMillimes = (dinars) => Math.round(Number(String(dinars).replace(',', '.')) * 1000)
export const fromMillimes = (m) => (Number(m || 0) / 1000).toString()
export const dateHeure = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Tunis' }) : '—'
export const toInputDateTime = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')

const OFFRE = { ACTIVE: ['Active', 'ok'], EPUISEE: ['Épuisée', 'warn'], EXPIREE: ['Expirée', ''], RETIREE: ['Retirée', ''] }
const COMMANDE = {
  EN_ATTENTE_PAIEMENT: ['En attente de paiement', 'warn'], PAYEE: ['Payée', 'ok'], PRETE: ['Prête', 'ok'],
  RECUPEREE: ['Récupérée', ''], ANNULEE: ['Annulée', 'bad'],
}
const COMMERCE = { EN_ATTENTE: ['En attente', 'warn'], VALIDE: ['Validé', 'ok'], REFUSE: ['Refusé', 'bad'] }
export const STATUTS = { offre: OFFRE, commande: COMMANDE, commerce: COMMERCE }

// La date du jour, à l'heure de Tunis : « lundi 23 novembre »
export const aujourdhui = () =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Tunis' })
