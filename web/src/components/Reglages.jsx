// Choix de la langue + bouton clair / sombre, présents dans tous les en-têtes
import { usePreferences } from '../context/PreferencesContext'
import { LANGUES } from '../i18n/textes'
import Icone from './Icone'

export default function Reglages({ sombre = false }) {
  const { langue, setLangue, theme, setTheme, t } = usePreferences()
  const versSombre = theme !== 'sombre'
  return (
    <div className={`reglages${sombre ? ' reglages-sombre' : ''}`}>
      {LANGUES.length > 1 && <label className="reglages-langue">
        <Icone nom="globe" taille={18} />
        <span className="sr-only">{t('langue.choisir')}</span>
        <select value={langue} onChange={(e) => setLangue(e.target.value)} aria-label={t('langue.choisir')}>
          {LANGUES.map((l) => <option key={l.code} value={l.code}>{l.court}</option>)}
        </select>
      </label>}
      <button
        type="button"
        className="reglages-theme"
        onClick={() => setTheme(versSombre ? 'sombre' : 'clair')}
        title={versSombre ? t('theme.sombre') : t('theme.clair')}
        aria-pressed={!versSombre}
      >
        <Icone nom={versSombre ? 'lune' : 'soleil'} taille={18} />
        <span className="sr-only">{versSombre ? t('theme.sombre') : t('theme.clair')}</span>
      </button>
    </div>
  )
}
