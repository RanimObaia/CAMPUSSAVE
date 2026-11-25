// Pied de page commun : liens vers toutes les pages d'information et légales
import { Link } from 'react-router-dom'
import { useT } from '../context/PreferencesContext'
import Logo from './Logo'

const ANNEE = new Date().getFullYear()

export default function PiedDePage() {
  const t = useT()
  return (
    <footer className="pied">
      <div className="pied-grille">
        <div className="pied-marque">
          <Logo />
          <p>{t('foot.slogan')}</p>
        </div>
        <nav aria-label={t('foot.decouvrir')}>
          <h2>{t('foot.decouvrir')}</h2>
          <Link to="/offres">{t('nav.offres')}</Link>
          <Link to="/#comment">{t('nav.comment')}</Link>
          <Link to="/partenaires">{t('foot.partenaires')}</Link>
          <Link to="/a-propos">{t('foot.apropos')}</Link>
        </nav>
        <nav aria-label={t('foot.aide')}>
          <h2>{t('foot.aide')}</h2>
          <Link to="/aide">{t('foot.faq')}</Link>
          <Link to="/legal/annulation">{t('foot.annulation')}</Link>
          <Link to="/contact">{t('foot.contact')}</Link>
          <Link to="/statut">{t('foot.statut')}</Link>
        </nav>
        <nav aria-label={t('foot.legal')}>
          <h2>{t('foot.legal')}</h2>
          <Link to="/legal/mentions">{t('foot.mentions')}</Link>
          <Link to="/legal/cgu">{t('foot.cgu')}</Link>
          <Link to="/legal/confidentialite">{t('foot.confidentialite')}</Link>
          <Link to="/legal/cookies">{t('foot.cookies')}</Link>
        </nav>
      </div>
      <p className="pied-bas">© {ANNEE} CampusSave · {t('foot.droits')}</p>
    </footer>
  )
}
