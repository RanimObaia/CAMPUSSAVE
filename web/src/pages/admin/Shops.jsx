import { libelle } from '../../config/constants'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Table, Badge } from '../../components/ui'

export default function Shops() {
  const { data, erreur, recharger } = useChargement(() => api.adminShops())

  async function decider(s, decision) {
    await api.validateShop(s.id, decision)
    recharger()
  }

  return (
    <>
      <Entete titre="Commerces" sous="Validez ou refusez les demandes des commerçants" />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Commerce', 'Type', 'Adresse', 'Statut', 'Action']} vide="Aucun commerce."
        lignes={(data || []).map((s) => [
          <strong key="n">{s.nom}</strong>, libelle(s.type), s.adresse, <Badge key="b" type="commerce" valeur={s.statutValidation} />,
          s.statutValidation === 'EN_ATTENTE' ? (
            <div key="a" className="cs-actions">
              <button type="button" className="cs-btn primary" onClick={() => decider(s, 'VALIDE')}>Valider</button>
              <button type="button" className="cs-btn danger" onClick={() => decider(s, 'REFUSE')}>Refuser</button>
            </div>
          ) : '',
        ])} />
    </>
  )
}
