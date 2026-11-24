// Pages légales : /legal/mentions, /legal/cgu, /legal/confidentialite, /legal/cookies, /legal/annulation
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../context/PreferencesContext'
import { useTitre } from '../../hooks'
import { LEGAL } from '../../contenu/legal'

const ORDRE = ['mentions', 'cgu', 'confidentialite', 'cookies', 'annulation']

export default function Legal() {
  const { page } = useParams()
  const { langue, setCookies } = usePreferences()
  const contenu = LEGAL[page]
  useTitre(contenu?.titre)
  if (!contenu) return <Navigate to="/legal/mentions" replace />

  return (
    <div className="pub-page legal">
      <nav className="legal-onglets" aria-label="Pages légales">
        {ORDRE.map((p) => <Link key={p} to={`/legal/${p}`} aria-current={p === page ? 'page' : undefined}>{LEGAL[p].titre}</Link>)}
      </nav>
      <h1>{contenu.titre}</h1>
      <p className="cs-sub">Dernière mise à jour : {contenu.maj}</p>
      {langue !== 'fr' && <p className="auth-demo" lang="fr">{langue === 'ar' ? 'هذه النصوص متوفرة بالفرنسية.' : 'These texts are available in French.'}</p>}
      {contenu.sections.map(([titre, texte]) => (
        <section key={titre}>
          <h2>{titre}</h2>
          <p>{texte}</p>
        </section>
      ))}
      {page === 'cookies' && (
        <button type="button" className="cs-btn" onClick={() => setCookies('')}>Revoir mon choix sur la bannière</button>
      )}
    </div>
  )
}
