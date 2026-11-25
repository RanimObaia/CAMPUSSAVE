// En-tête et menu de l'espace étudiant (barre en haut, pages en dessous, pied de page).
// Les offres sont visibles sans compte : le menu s'adapte au visiteur.
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../context/PreferencesContext'
import { PanierProvider, usePanier } from '../context/PanierContext'
import { FavorisProvider } from '../context/FavorisContext'
import { ROLES } from '../config/constants'
import Logo from './Logo'
import Icone from './Icone'
import Reglages from './Reglages'
import ClocheNotifications from './ClocheNotifications'
import PiedDePage from './PiedDePage'
import '../styles/etudiant.css'

// Le panier et les favoris sont partagés par toutes les pages de l'espace étudiant
export default function EtudiantLayout() {
  return (
    <PanierProvider>
      <FavorisProvider>
        <Contenu />
      </FavorisProvider>
    </PanierProvider>
  )
}

const ESPACE = { merchant: '/commercant', admin: '/admin' }

function Contenu() {
  const { user, logout } = useAuth()
  const t = useT()
  const { nbArticles } = usePanier()
  const etudiant = user?.role === ROLES.STUDENT
  const liens = etudiant
    ? [
      { to: '/offres', label: t('nav.offres') },
      { to: '/favoris', label: t('nav.favoris') },
      { to: '/commandes', label: t('nav.commandes') },
      { to: '/tableau-de-bord', label: t('nav.tableau') },
    ]
    : [{ to: '/offres', label: t('nav.offres') }, { to: '/partenaires', label: t('nav.commercants') }, { to: '/aide', label: t('nav.aide') }]

  return (
    <div className="cs et">
      <a href="#contenu" className="evitement">{t('nav.evitement')}</a>
      <header className="et-header">
        <Link to={etudiant ? '/offres' : '/'} className="et-accueil" aria-label="CampusSave, accueil"><Logo /></Link>
        <nav className="et-nav" aria-label="Navigation étudiant">
          {liens.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
        </nav>
        <div className="et-user">
          <Reglages />
          {etudiant && (
            <>
              <ClocheNotifications />
              <NavLink to="/panier" className="et-panier-bouton">
                <Icone nom="panier" />
                <span>{t('nav.panier')}</span>
                {nbArticles > 0 && <span className="et-badge" aria-label={`${nbArticles} article(s)`}>{nbArticles}</span>}
              </NavLink>
              <NavLink to="/parametres" className="et-prenom" title={t('nav.parametres')}>{user?.prenom}</NavLink>
            </>
          )}
          {user && !etudiant && <Link to={ESPACE[user.role] || '/'} className="cs-btn primary">{t('nav.monEspace')}</Link>}
          {user ? (
            <button type="button" className="et-sortie" onClick={logout} title={t('nav.deconnexion')}>
              <Icone nom="sortie" />
              <span className="sr-only">{t('nav.deconnexion')}</span>
            </button>
          ) : (
            <>
              <Link to="/login" className="cs-btn">{t('nav.connexion')}</Link>
              <Link to="/inscription" className="cs-btn primary et-masque-mobile">{t('nav.inscription')}</Link>
            </>
          )}
        </div>
      </header>
      <main id="contenu" className="et-main"><Outlet /></main>
      <PiedDePage />
    </div>
  )
}
