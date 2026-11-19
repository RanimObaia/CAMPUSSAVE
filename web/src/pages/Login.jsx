import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../config/constants'

const ACCUEIL = { merchant: '/commercant', admin: '/admin', student: '/' }

export default function Login() {
  const { user, login } = useAuth()
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
    <div className="cs cs-login">
      <form onSubmit={submit}>
        <h1>Connexion à CampusSave</h1>
        {USE_MOCK && <p className="cs-sub">Mode démo : utilise etudiant@demo.tn, merchant@demo.tn ou admin@demo.tn (mot de passe libre).</p>}
        {erreur && <div className="cs-error" role="alert">{erreur}</div>}
        <div className="cs-field"><label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="cs-field"><label htmlFor="pw">Mot de passe</label>
          <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="cs-btn primary" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
        <p className="cs-sub">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
      </form>
    </div>
  )
}
