// Panier de l'étudiant : lignes { offre, quantite }, gardées dans le navigateur.
// Règle : une commande concerne un seul commerce (diagramme de classes),
// donc le panier ne contient que des offres d'un même commerce.
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const PanierContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const usePanier = () => useContext(PanierContext)

// Lecture du panier sauvegardé (localStorage peut être indisponible : on renvoie un panier vide)
function lire(cle) {
  try {
    return JSON.parse(localStorage.getItem(cle)) || []
  } catch {
    return []
  }
}

// On ne garde de l'offre que ce dont le panier a besoin
const resume = (o) => ({
  id: o.id, titre: o.titre, categorie: o.categorie, photoUrl: o.photoUrl,
  prixInitial: o.prixInitial, prixReduit: o.prixReduit, quantiteDisponible: o.quantiteDisponible,
  heureDebutRecuperation: o.heureDebutRecuperation, heureFinRecuperation: o.heureFinRecuperation,
  commerce: o.commerce,
})

export function PanierProvider({ children }) {
  const { user } = useAuth()
  const cle = `campussave-panier-${user?.id || 'invite'}` // un panier par étudiant
  const [lignes, setLignes] = useState(() => lire(cle))

  // À chaque changement, on sauvegarde le panier
  useEffect(() => {
    try {
      localStorage.setItem(cle, JSON.stringify(lignes))
    } catch {
      // stockage indisponible : le panier reste seulement en mémoire
    }
  }, [cle, lignes])

  const commerce = lignes[0]?.offre.commerce || null
  const quantiteDe = (offreId) => lignes.find((l) => l.offre.id === offreId)?.quantite || 0

  // true si l'offre vient d'un autre commerce que celui du panier
  const autreCommerce = (offre) => Boolean(commerce) && commerce.id !== offre.commerce?.id

  function ajouter(offre, quantite) {
    setLignes((actuelles) => {
      // Offre d'un autre commerce : on repart d'un panier vide
      const base = actuelles.length && actuelles[0].offre.commerce?.id !== offre.commerce?.id ? [] : actuelles
      const existante = base.find((l) => l.offre.id === offre.id)
      if (existante) {
        const q = Math.min(existante.quantite + quantite, offre.quantiteDisponible)
        return base.map((l) => (l.offre.id === offre.id ? { ...l, quantite: q } : l))
      }
      return [...base, { offre: resume(offre), quantite: Math.min(quantite, offre.quantiteDisponible) }]
    })
  }

  // Quantité entre 1 et le stock disponible
  function modifierQuantite(offreId, quantite) {
    setLignes((actuelles) => actuelles.map((l) =>
      l.offre.id === offreId ? { ...l, quantite: Math.max(1, Math.min(quantite, l.offre.quantiteDisponible)) } : l))
  }

  const retirer = (offreId) => setLignes((actuelles) => actuelles.filter((l) => l.offre.id !== offreId))
  const vider = () => setLignes([])

  // Totaux en millimes
  const total = lignes.reduce((s, l) => s + l.offre.prixReduit * l.quantite, 0)
  const economie = lignes.reduce((s, l) => s + (l.offre.prixInitial - l.offre.prixReduit) * l.quantite, 0)
  const nbArticles = lignes.reduce((s, l) => s + l.quantite, 0)

  const valeur = { lignes, commerce, total, economie, nbArticles, quantiteDe, autreCommerce, ajouter, modifierQuantite, retirer, vider }
  return <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>
}
