// Détail d'une offre : commerce, description, prix, quantité restante, créneau de retrait
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { dt } from '../../utils/format'
import { categorie, heure, reduction } from '../../utils/categories'

export default function OffreDetail() {
  const { id } = useParams()
  const { data: o, erreur, chargement } = useChargement(() => api.getOffreDetail(id), [id])

  if (erreur) {
    return (
      <>
        <Link to="/" className="et-retour">← Retour aux offres</Link>
        <div className="cs-error" role="alert">{erreur}</div>
      </>
    )
  }
  if (chargement || !o) return <p className="cs-empty">Chargement…</p>

  const jour = new Date(o.heureDebutRecuperation).toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long' })
  const disponible = o.statut === 'ACTIVE' && o.quantiteDisponible > 0

  return (
    <>
      <Link to="/" className="et-retour">← Retour aux offres</Link>

      <article className="et-detail">
        <div className="et-visuel et-visuel-grand" aria-hidden="true">
          {o.photoUrl ? <img src={o.photoUrl} alt="" /> : <span>{categorie(o.categorie).icone}</span>}
          <b className="et-remise">-{reduction(o)} %</b>
        </div>

        <div className="et-detail-texte">
          <span className="et-commerce">{categorie(o.categorie).label}</span>
          <h1>{o.titre}</h1>
          {o.description && <p>{o.description}</p>}

          <div className="et-prix et-prix-grand">
            <b>{dt(o.prixReduit)}</b>
            <s>{dt(o.prixInitial)}</s>
          </div>
          <p className="cs-sub">Tu économises {dt(o.prixInitial - o.prixReduit)}.</p>

          <dl className="et-liste-infos">
            <div><dt>Commerce</dt><dd>{o.commerce?.nom}</dd></div>
            <div><dt>Adresse</dt><dd>{o.commerce?.adresse}</dd></div>
            <div><dt>Retrait</dt><dd>{jour}, de {heure(o.heureDebutRecuperation)} à {heure(o.heureFinRecuperation)}</dd></div>
            <div><dt>Disponibilité</dt><dd>{disponible ? `${o.quantiteDisponible} restante${o.quantiteDisponible > 1 ? 's' : ''}` : 'Épuisée'}</dd></div>
          </dl>
        </div>
      </article>
    </>
  )
}
