// Note sur 5 : affichage (lecture) ou choix (saisie)
import Icone from './Icone'
import { note as formatNote } from '../utils/categories'

export function Note({ valeur, nb, petit = false }) {
  if (valeur == null) return <span className="note note-vide">Nouveau</span>
  return (
    <span className={`note${petit ? ' note-petit' : ''}`} title={`${formatNote(valeur)} sur 5, ${nb} avis`}>
      <Icone nom="etoilePleine" taille={petit ? 14 : 16} />
      <b>{formatNote(valeur)}</b>
      {nb != null && <span>({nb})</span>}
    </span>
  )
}

export function ChoixEtoiles({ valeur, onChange }) {
  return (
    <div className="etoiles-choix" role="radiogroup" aria-label="Note sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valeur === n} aria-label={`${n} sur 5`} className={n <= valeur ? 'actif' : ''} onClick={() => onChange(n)}>
          <Icone nom={n <= valeur ? 'etoilePleine' : 'etoile'} taille={30} />
        </button>
      ))}
    </div>
  )
}
