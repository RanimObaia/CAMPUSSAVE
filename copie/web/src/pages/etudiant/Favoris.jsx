// Commerces favoris : leurs offres disponibles, et l'alerte quand ils publient
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { useT } from '../../context/PreferencesContext'
import CoeurFavori from '../../components/CoeurFavori'
import { Note } from '../../components/Etoiles'
import { TYPES } from '../../utils/categories'

export default function Favoris() {
  const t = useT()
  useTitre(t('nav.favoris'))
  const { data, erreur, chargement } = useChargement(() => api.mesFavoris())
  return (
    <>
      <div>
        <h1>{t('nav.favoris')}</h1>
        <p className="cs-sub">Tu reçois une notification dès qu'un de ces commerces publie une offre. Touche le cœur d'une offre pour ajouter son commerce.</p>
      </div>
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {chargement && !data && <p className="cs-empty">{t('commun.chargement')}</p>}
      {data?.length === 0 && (
        <div className="cs-card cs-empty">
          <p>Pas encore de favori.</p>
          <Link to="/offres" className="cs-btn primary et-mt">Parcourir les offres</Link>
        </div>
      )}
      <ul className="et-lignes">
        {data?.map((c) => (
          <li key={c.id} className="et-ligne">
            <div className="et-ligne-texte">
              <span className="et-ligne-titre">{c.nom}</span>
              <span className="cs-sub">{TYPES[c.type] || c.type} · {c.adresse}{c.horairesOuverture && ` · ${c.horairesOuverture}`}</span>
            </div>
            <Note valeur={c.noteMoyenne} nb={c.nbAvis} petit />
            {c.offresDisponibles > 0
              ? <Link to={`/offres?q=${encodeURIComponent(c.nom)}`} className="cs-btn primary">{c.offresDisponibles} offre{c.offresDisponibles > 1 ? 's' : ''}</Link>
              : <span className="cs-sub">Aucune offre pour l'instant</span>}
            <CoeurFavori commerce={c} />
          </li>
        ))}
      </ul>
    </>
  )
}
