import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Table, Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

export default function Orders() {
  const { data, erreur, recharger } = useChargement(() => api.listOrders())

  async function prete(o) {
    await api.markReady(o.id)
    recharger()
  }

  return (
    <>
      <Entete titre="Commandes" sous="Suivez les commandes de vos clients" />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Code', 'Articles', 'Date', 'Montant', 'Statut', 'Action']} vide="Aucune commande."
        lignes={(data || []).map((o) => [
          <strong key="c">{o.code}</strong>,
          o.lignes.map((l) => `${l.quantite} × ${l.titre}`).join(', '),
          dateHeure(o.createdAt), dt(o.montantTotal),
          <Badge key="s" type="commande" valeur={o.statut} />,
          o.statut === 'PAYEE' ? <button key="a" type="button" className="cs-btn" onClick={() => prete(o)}>Marquer prête</button> : '',
        ])} />
    </>
  )
}
