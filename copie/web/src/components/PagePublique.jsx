// Mise en page des pages publiques (accueil, aide, légal…) : en-tête, contenu, pied de page
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../context/PreferencesContext'
import Logo from './Logo'
import Reglages from './Reglages'
import PiedDePage from './PiedDePage'

const ESPACE = { student: '/offres', merchant: '/commercant', admin: '/admin' }

export default function PagePublique() {
  const t = useT()
  const { user } = useAuth()
  return (
    <div className="cs pub">
      <a href="#contenu" className="evitement">{t('nav.evitement')}</a>
      <header className="pub-header">
        <Link to="/" className="pub-logo" aria-label="CampusSave, accueil"><Logo /></Link>
        <nav className="pub-nav" aria-label="Navigation principale">
          <NavLink to="/offres">{t('nav.offres')}</NavLink>
          <a href="/#comment">{t('nav.comment')}</a>
          <NavLink to="/partenaires">{t('nav.commercants')}</NavLink>
          <NavLink to="/aide">{t('nav.aide')}</NavLink>
        </nav>
        <div className="pub-actions">
          <Reglages />
          {user ? (
            <Link to={ESPACE[user.role] || '/offres'} className="cs-btn primary">{t('nav.monEspace')}</Link>
          ) : (
            <>
              <Link to="/login" className="cs-btn pub-connexion">{t('nav.connexion')}</Link>
              <Link to="/inscription" className="cs-btn primary">{t('nav.inscription')}</Link>
            </>
          )}
        </div>
      </header>
      <main id="contenu" className="pub-main"><Outlet /></main>
      <PiedDePage />
    </div>
  )
}
