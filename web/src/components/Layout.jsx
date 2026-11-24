import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import Icone from './Icone'

const initiales = (u) => `${u?.prenom?.[0] || ''}${u?.nom?.[0] || ''}`.toUpperCase() || 'CS'

// Menu latéral partagé par l'espace commerçant et l'espace administrateur.
export default function Layout({ titre, liens }) {
  const { user, logout } = useAuth()
  return (
    <div className="cs cs-shell">
      <aside className="cs-side">
        <Logo />
        <div className="cs-role">{titre}</div>
        <nav className="cs-nav" aria-label={titre}>
          {liens.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icone nom={l.icone} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="cs-moi">
          <span className="cs-initiales" aria-hidden="true">{initiales(user)}</span>
          <span className="cs-moi-texte">
            <b>{user?.prenom} {user?.nom}</b>
            <span>{user?.email}</span>
          </span>
          <button type="button" className="cs-logout" onClick={logout} title="Se déconnecter">
            <Icone nom="sortie" />
            <span className="sr-only">Se déconnecter</span>
          </button>
        </div>
      </aside>
      <main className="cs-main"><Outlet /></main>
    </div>
  )
}