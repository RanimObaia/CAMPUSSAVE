// En-tête et menu de l'espace étudiant (barre en haut, pages en dessous)
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/etudiant.css'

const LIENS = [
  { to: '/', label: 'Offres', end: true },
  // Ajoutés aux prochaines étapes : Mon panier, Mes commandes
]

export default function EtudiantLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="cs et">
      <header className="et-header">
        <div className="cs-brand et-brand"><i aria-hidden="true" />CampusSave</div>
        <nav className="et-nav" aria-label="Navigation étudiant">
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="et-user">
          <span>{user?.prenom}</span>
          <button type="button" className="cs-btn" onClick={logout}>Se déconnecter</button>
        </div>
      </header>
      <main className="et-main"><Outlet /></main>
    </div>
  )
}
