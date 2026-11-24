// Bannière d'information sur le stockage (aucun traceur : seulement le nécessaire)
import { Link } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'

export default function BanniereCookies() {
  const { cookies, setCookies, t } = usePreferences()
  if (cookies) return null
  return (
    <div className="cookies" role="region" aria-label="Cookies">
      <p>{t('cookie.texte')} <Link to="/legal/cookies">{t('cookie.plus')}</Link></p>
      <div className="cs-actions">
        <button type="button" className="cs-btn" onClick={() => setCookies('essentiels')}>{t('cookie.refuser')}</button>
        <button type="button" className="cs-btn primary" onClick={() => setCookies('accepte')}>{t('cookie.accepter')}</button>
      </div>
    </div>
  )
}
