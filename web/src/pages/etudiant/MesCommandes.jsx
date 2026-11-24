// Liste des commandes de l'étudiant, de la plus récente à la plus ancienne
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

export default function MesCommandes() {
  const { data: commandes, erreur, chargement } = useChargement(() => api.mesCommandes())

  return (
    <>
      <div>
        <h1>Mes commandes</h1>
        <p className="cs-sub">Présente le QR code d'une commande payée pour la récupérer.</p>
      </div>

      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {chargement && !commandes && <p className="cs-empty">Chargement…</p>}

      {commandes && commandes.length === 0 && (
        <div className="cs-card cs-empty">
          <p>Tu n'as pas encore passé de commande.</p>
          <Link to="/" className="cs-btn primary et-mt">Voir les offres</Link>
        </div>
      )}

      <ul className="et-lignes">
        {commandes?.map((c) => (
          <li key={c.id}>
            <Link to={`/commandes/${c.id}`} className="et-ligne et-commande">
              <div className="et-ligne-texte">
                <span className="et-ligne-titre">{c.commerce?.nom} · {c.code}</span>
                <span className="cs-sub">
                  {dateHeure(c.dateCommande)} · {c.lignes.reduce((n, l) => n + l.quantite, 0)} article(s)
                </span>
              </div>
              <Badge type="commande" valeur={c.statut} />
              <b className="et-ligne-total">{dt(c.montantTotal)}</b>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
