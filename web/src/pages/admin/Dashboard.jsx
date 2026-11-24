import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Stat } from '../../components/ui'

export default function AdminDashboard() {
  const { data: s, erreur } = useChargement(() => api.adminStats())
  return (
    <>
      <Entete date titre="Vue globale" sous="Comptes, commerces et paiements de la plateforme."
        action={<Link className="cs-btn primary" to="/admin/commerces">Commerces à valider{s?.commercesEnAttente ? ` (${s.commercesEnAttente})` : ''}</Link>} />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <div className="cs-grid">
        <Stat label="Utilisateurs" valeur={s?.utilisateurs ?? '—'} />
        <Stat label="Commerces validés" valeur={s?.commercesValides ?? '—'} note={s ? `${s.commercesEnAttente} en attente` : ''} />
        <Stat label="Commandes" valeur={s?.commandes ?? '—'} />
        <Stat label="Paiements Konnect" valeur={s?.paiements ?? '—'} note="mode test" />
      </div>
      <div className="cs-actions">
        <Link className="cs-btn" to="/admin/signalements">Signalements à traiter</Link>
        <Link className="cs-btn" to="/admin/offres">Modérer les offres</Link>
        <Link className="cs-btn" to="/admin/commandes">Commandes et paiements</Link>
      </div>
    </>
  )
}
