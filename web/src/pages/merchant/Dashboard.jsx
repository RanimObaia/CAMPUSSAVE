import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Stat, Table, Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

export default function Dashboard() {
  const stats = useChargement(() => api.merchantStats())
  const orders = useChargement(() => api.listOrders())
  const s = stats.data
  const recentes = (orders.data || []).slice(0, 5)
  return (
    <>
      <Entete titre="Tableau de bord" sous="Vue d'ensemble de votre commerce" />
      {(stats.erreur || orders.erreur) && <div className="cs-error" role="alert">{stats.erreur || orders.erreur}</div>}
      <div className="cs-grid">
        <Stat label="Offres actives" valeur={s?.offresActives ?? '—'} />
        <Stat label="Commandes du jour" valeur={s?.commandesDuJour ?? '—'} />
        <Stat label="Chiffre d'affaires" valeur={s ? dt(s.chiffreAffaires) : '—'} />
        <Stat label="Repas sauvés" valeur={s?.repasSauves ?? '—'} />
      </div>
      <h2>Dernières commandes</h2>
      <Table colonnes={['Code', 'Date', 'Montant', 'Statut']}
        lignes={recentes.map((o) => [o.code, dateHeure(o.createdAt), dt(o.montantTotal), <Badge key="b" type="commande" valeur={o.statut} />])} />
    </>
  )
}
