// En-tête et menu de l'espace étudiant (barre en haut, pages en dessous)
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PanierProvider, usePanier } from '../context/PanierContext'
import Logo from './Logo'
import Icone from './Icone'
import '../styles/etudiant.css'

// Le panier est partagé par toutes les pages de l'espace étudiant
export default function EtudiantLayout() {
  return (
    <PanierProvider>
      <Contenu />
    </PanierProvider>
  )
}

const LIENS = [
  { to: '/', label: 'Offres', end: true },
  { to: '/commandes', label: 'Mes commandes' },
  { to: '/tableau-de-bord', label: 'Tableau de bord' },
]

function Contenu() {
  const { user, logout } = useAuth()
  const { nbArticles } = usePanier()
  return (
    <div className="cs et">
      <header className="et-header">
        <Link to="/" className="et-accueil" aria-label="CampusSave, accueil"><Logo /></Link>
        <nav className="et-nav" aria-label="Navigation étudiant">
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="et-user">
          <NavLink to="/panier" className="et-panier-bouton">
            <Icone nom="panier" />
            <span>Panier</span>
            {nbArticles > 0 && <span className="et-badge" aria-label={`${nbArticles} article(s)`}>{nbArticles}</span>}
          </NavLink>
          <span className="et-prenom">{user?.prenom}</span>
          <button type="button" className="et-sortie" onClick={logout} title="Se déconnecter">
            <Icone nom="sortie" />
            <span className="sr-only">Se déconnecter</span>
          </button>
        </div>
      </header>
      <main className="et-main"><Outlet /></main>
    </div>
  )
}
