import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Menu latéral partagé par l'espace commerçant et l'espace administrateur.
export default function Layout({ titre, liens }) {
  const { user, logout } = useAuth()
  return (
    <div className="cs cs-shell">
      <aside className="cs-side">
        <div className="cs-brand"><i aria-hidden="true" />CampusSave</div>
        <div className="cs-role">{titre}</div>
        <nav className="cs-nav" aria-label="Navigation">
          {liens.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="cs-role">{user?.email}</div>
        <button type="button" className="cs-logout" onClick={logout}>Se déconnecter</button>
      </aside>
      <main className="cs-main"><Outlet /></main>
    </div>
  )
}
