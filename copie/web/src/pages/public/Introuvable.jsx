import { Link } from 'react-router-dom'
import { useT } from '../../context/PreferencesContext'
import { useTitre } from '../../hooks'
import { Assiette } from '../../components/Logo'

export default function Introuvable() {
  const t = useT()
  useTitre(t('p404.titre'))
  return (
    <div className="pub-page introuvable">
      <Assiette taille={120} />
      <h1>404 · {t('p404.titre')}</h1>
      <p className="cs-sub">{t('p404.texte')}</p>
      <div className="cs-actions">
        <Link to="/" className="cs-btn primary">{t('p404.accueil')}</Link>
        <Link to="/offres" className="cs-btn">{t('nav.offres')}</Link>
      </div>
    </div>
  )
}
