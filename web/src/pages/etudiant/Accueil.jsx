// Accueil de l'espace étudiant (provisoire) : la liste des offres arrive ici
import { useAuth } from '../../context/AuthContext'
import { Entete } from '../../components/ui'

export default function Accueil() {
  const { user, logout } = useAuth()
  return (
    <div className="cs">
      <main className="cs-main">
        <Entete
          titre={`Bonjour ${user?.prenom || ''} 👋`}
          sous="Les offres anti-gaspillage autour de l'ESSECT arrivent ici."
          action={<button type="button" className="cs-btn" onClick={logout}>Se déconnecter</button>}
        />
      </main>
    </div>
  )
}
