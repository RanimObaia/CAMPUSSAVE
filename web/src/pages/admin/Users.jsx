import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Entete, Table } from '../../components/ui'

const ROLE = { student: 'Étudiant', merchant: 'Commerçant', admin: 'Administrateur' }

export default function Users() {
  const { data, erreur, recharger } = useChargement(() => api.adminUsers())

  async function basculer(u) {
    await api.setUserActive(u.id, !u.actif)
    recharger()
  }

  return (
    <>
      <Entete titre="Utilisateurs" sous="Suspendez ou réactivez des comptes" />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Nom', 'E-mail', 'Rôle', 'Statut', 'Action']} vide="Aucun utilisateur."
        lignes={(data || []).map((u) => [
          `${u.prenom} ${u.nom}`, u.email, ROLE[u.role] || u.role,
          <span key="s" className={`cs-badge ${u.actif ? 'ok' : 'bad'}`}>{u.actif ? 'Actif' : 'Suspendu'}</span>,
          u.role === 'admin' ? '' : <button key="a" type="button" className={`cs-btn ${u.actif ? 'danger' : ''}`} onClick={() => basculer(u)}>{u.actif ? 'Suspendre' : 'Réactiver'}</button>,
        ])} />
    </>
  )
}
