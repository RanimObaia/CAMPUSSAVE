import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Table, Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

export default function Offers() {
  const { data, erreur, recharger } = useChargement(() => api.listMyOffers())

  async function republier(o) {
    const q = window.prompt(`Republier « ${o.titre} » pour le prochain créneau. Quantité :`, String(o.quantiteInitiale || o.quantiteDisponible || 1))
    if (q === null) return
    await api.republierOffre(o.id, Number(q) || undefined)
    recharger()
  }

  async function retirer(o) {
    if (!window.confirm(`Retirer l'offre « ${o.titre} » ?`)) return
    await api.removeOffer(o.id)
    recharger()
  }

  return (
    <>
      <Entete titre="Mes offres" sous="Publiez et gérez vos invendus"
        action={<Link className="cs-btn primary" to="/commercant/offres/nouvelle">Publier une offre</Link>} />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Offre', 'Prix', 'Stock', 'Retrait', 'Statut', 'Actions']}
        vide="Aucune offre publiée."
        lignes={(data || []).map((o) => [
          <span key="t"><strong>{o.titre}</strong>{o.recurrente && <span className="cs-badge ok cs-ml">Chaque jour</span>}{o.retireeParAdmin && <span className="cs-badge bad cs-ml" title={o.motifRetrait || ''}>Retirée par la modération</span>}</span>,
          <span key="p">{dt(o.prixReduit)} <s>{dt(o.prixInitial)}</s></span>,
          o.quantiteDisponible,
          `${dateHeure(o.heureDebutRecuperation)} → ${dateHeure(o.heureFinRecuperation)}`,
          <Badge key="s" type="offre" valeur={o.statut} />,
          <div key="a" className="cs-actions">
            {o.statut !== 'RETIREE' && <Link className="cs-btn" to={`/commercant/offres/${o.id}`}>Modifier</Link>}
            {(o.statut === 'EXPIREE' || o.statut === 'EPUISEE') && !o.retireeParAdmin && <button type="button" className="cs-btn primary" onClick={() => republier(o)}>Republier</button>}
            {o.statut !== 'RETIREE' && <button type="button" className="cs-btn danger" onClick={() => retirer(o)}>Retirer</button>}
          </div>,
        ])} />
    </>
  )
}
