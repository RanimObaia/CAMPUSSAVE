import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Stat } from '../../components/ui'

export default function AdminDashboard() {
  const { data: s, erreur } = useChargement(() => api.adminStats())
  return (
    <>
      <Entete titre="Vue globale" sous="Supervision de la plateforme CampusSave" />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <div className="cs-grid">
        <Stat label="Utilisateurs" valeur={s?.utilisateurs ?? '—'} />
        <Stat label="Commerces validés" valeur={s?.commercesValides ?? '—'} note={s ? `${s.commercesEnAttente} en attente` : ''} />
        <Stat label="Commandes" valeur={s?.commandes ?? '—'} />
        <Stat label="Paiements Konnect" valeur={s?.paiements ?? '—'} note="mode test" />
      </div>
    </>
  )
}
