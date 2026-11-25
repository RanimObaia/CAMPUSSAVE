// Commerces favoris de l'étudiant : cœur sur les offres, page Favoris, alertes de publication
import { createContext, useContext, useState } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../services/api'
import { ROLES } from '../config/constants'

const FavorisContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useFavoris = () => useContext(FavorisContext)

export function FavorisProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState(() => new Set(user?.favoris || []))
  const [cle, setCle] = useState(user?.id)
  // Changement d'utilisateur : on repart de ses favoris
  if (cle !== user?.id) {
    setCle(user?.id)
    setIds(new Set(user?.favoris || []))
  }

  const actif = user?.role === ROLES.STUDENT
  async function basculer(commerceId) {
    const ajouter = !ids.has(commerceId)
    setIds((avant) => { const n = new Set(avant); if (ajouter) n.add(commerceId); else n.delete(commerceId); return n })
    try {
      const r = ajouter ? await api.ajouterFavori(commerceId) : await api.retirerFavori(commerceId)
      setIds(new Set(r.favoris))
    } catch {
      setIds((avant) => { const n = new Set(avant); if (ajouter) n.delete(commerceId); else n.add(commerceId); return n })
    }
  }
  return <FavorisContext.Provider value={{ actif, estFavori: (id) => ids.has(id), basculer }}>{children}</FavorisContext.Provider>
}
