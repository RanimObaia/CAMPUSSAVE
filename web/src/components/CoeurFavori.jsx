// Bouton cœur : ajoute ou retire un commerce des favoris (étudiant connecté seulement)
import { useFavoris } from '../context/FavorisContext'
import Icone from './Icone'

export default function CoeurFavori({ commerce, avecTexte = false }) {
  const favoris = useFavoris()
  if (!favoris?.actif || !commerce) return null
  const oui = favoris.estFavori(commerce.id)
  const libelle = oui ? `Retirer ${commerce.nom} des favoris` : `Ajouter ${commerce.nom} aux favoris`
  return (
    <button
      type="button"
      className={`coeur${oui ? ' coeur-oui' : ''}${avecTexte ? ' coeur-texte' : ''}`}
      aria-pressed={oui}
      aria-label={libelle}
      title={oui ? 'Dans tes favoris : tu es prévenu de ses nouvelles offres' : 'Ajouter aux favoris et être prévenu de ses offres'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoris.basculer(commerce.id) }}
    >
      <Icone nom={oui ? 'coeurPlein' : 'coeur'} taille={20} />
      {avecTexte && <span>{oui ? 'Favori' : 'Ajouter aux favoris'}</span>}
    </button>
  )
}
