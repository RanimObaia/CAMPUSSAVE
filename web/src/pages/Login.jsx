import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../config/constants'
import EcranAuth from '../components/EcranAuth'

const ACCUEIL = { merchant: '/commercant', admin: '/admin', student: '/' }

export default function Login() {
  const { user, login, erreurConnexion } = useAuth()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState(state?.erreur || '')
  const [envoi, setEnvoi] = useState(false)

  if (user?.actif) return <Navigate to={ACCUEIL[user.role] || '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setErreur(''); setEnvoi(true)
    try { await login(email, password) } catch { setErreur('Identifiants incorrects.') }
    setEnvoi(false)
  }

  return (
    <EcranAuth>
      <form onSubmit={submit}>
        <h2>Content de te revoir</h2>
        <p className="cs-sub">Étudiant, commerçant ou administrateur : connecte-toi à ton espace.</p>
        {USE_MOCK && <p className="auth-demo">Mode démo : etudiant@demo.tn, merchant@demo.tn ou admin@demo.tn, avec n'importe quel mot de passe.</p>}
        {(erreur || erreurConnexion) && <div className="cs-error" role="alert">{erreur || erreurConnexion}</div>}
        <div className="cs-field"><label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="cs-field"><label htmlFor="pw">Mot de passe</label>
          <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="cs-btn primary" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
        <p className="cs-sub">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
      </form>
    </EcranAuth>
  )
}