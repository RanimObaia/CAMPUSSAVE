import { Link } from 'react-router-dom'
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
      <Entete date titre="Tableau de bord" sous="Vos offres, vos commandes et vos repas sauvés, en un coup d'œil."
        action={<div className="cs-actions">
          <Link className="cs-btn" to="/commercant/retrait">Valider un retrait</Link>
          <Link className="cs-btn primary" to="/commercant/offres/nouvelle">Publier une offre</Link>
        </div>} />
      {(stats.erreur || orders.erreur) && <div className="cs-error" role="alert">{stats.erreur || orders.erreur}</div>}
      <div className="cs-grid">
        <Stat label="Offres actives" valeur={s?.offresActives ?? '—'} />
        <Stat label="Commandes du jour" valeur={s?.commandesDuJour ?? '—'} note="payées aujourd'hui" />
        <Stat label="Chiffre d'affaires" valeur={s ? dt(s.chiffreAffaires) : '—'} note="aujourd'hui" />
        <Stat label="Repas sauvés" valeur={s?.repasSauves ?? '—'} note={s?.kgSauves ? `ce mois-ci, ≈ ${s.kgSauves} kg` : 'ce mois-ci'} />
      </div>
      <h2>Dernières commandes</h2>
      <Table colonnes={['Code', 'Date', 'Montant', 'Statut']}
        lignes={recentes.map((o) => [o.code, dateHeure(o.dateCommande), dt(o.montantTotal), <Badge key="b" type="commande" valeur={o.statut} />])} />
    </>
  )
}
