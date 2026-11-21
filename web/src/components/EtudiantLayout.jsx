// En-tête et menu de l'espace étudiant (barre en haut, pages en dessous)
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PanierProvider, usePanier } from '../context/PanierContext'
import '../styles/etudiant.css'

// Le panier est partagé par toutes les pages de l'espace étudiant
export default function EtudiantLayout() {
  return (
    <PanierProvider>
      <Contenu />
    </PanierProvider>
  )
}

function Contenu() {
  const { user, logout } = useAuth()
  const { nbArticles } = usePanier()
  const LIENS = [
    { to: '/', label: 'Offres', end: true },
    { to: '/panier', label: 'Mon panier', badge: nbArticles },
    { to: '/commandes', label: 'Mes commandes' },
  ]
  return (
    <div className="cs et">
      <header className="et-header">
        <div className="cs-brand et-brand"><i aria-hidden="true" />CampusSave</div>
        <nav className="et-nav" aria-label="Navigation étudiant">
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
              {l.badge > 0 && <span className="et-badge" aria-label={`${l.badge} article(s)`}>{l.badge}</span>}
            </NavLink>
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
