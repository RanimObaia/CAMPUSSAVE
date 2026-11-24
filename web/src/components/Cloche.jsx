// Vignette en forme de cloche (arche) avec l'icône de la catégorie de l'offre.
// Chaque catégorie a sa couleur : on reconnaît le type de produit d'un coup d'œil.
import Icone from './Icone'
import { categorie } from '../utils/categories'

export default function Cloche({ code, photoUrl, taille = 'moyenne', remise }) {
  return (
    <div className={`cloche cloche-${taille} cloche-${String(code || 'PLATS').toLowerCase()}`}>
      {photoUrl ? <img src={photoUrl} alt="" /> : <Icone nom={code} taille={taille === 'grande' ? 72 : taille === 'petite' ? 24 : 34} />}
      {remise != null && <b className="cloche-remise">−{remise} %</b>}
      <span className="sr-only">{categorie(code).label}</span>
    </div>
  )
}
