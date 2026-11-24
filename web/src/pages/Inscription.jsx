// Page d'inscription (étudiant ou commerçant).
// 1. Envoie le formulaire à l'API : POST /auth/register
// 2. Connecte ensuite la personne, comme sur la page de connexion
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { ROLES } from '../config/constants'
import EcranAuth from '../components/EcranAuth'

const ACCUEIL = { merchant: '/commercant', admin: '/admin', student: '/' }

const VIDE = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  motDePasse: '',
  confirmation: '',
  role: ROLES.STUDENT,
  etablissement: 'ESSECT',
}

// Vérifications faites avant d'appeler l'API (mêmes règles que le backend)
function verifier(f) {
  if (!f.prenom.trim() || !f.nom.trim()) return 'Le nom et le prénom sont obligatoires.'
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Adresse e-mail invalide.'
  if (!/^\d{8}$/.test(f.telephone.trim())) return 'Le téléphone doit contenir 8 chiffres.'
  if (f.motDePasse.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (f.motDePasse !== f.confirmation) return 'Les deux mots de passe ne sont pas identiques.'
  return ''
}

export default function Inscription() {
  const { user, login } = useAuth()
  const [form, setForm] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  // Déjà connecté (par exemple juste après l'inscription) : on part vers son espace
  if (user?.actif) return <Navigate to={ACCUEIL[user.role] || '/'} replace />

  // Met à jour un seul champ du formulaire
  const changer = (champ) => (e) => setForm({ ...form, [champ]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const probleme = verifier(form)
    if (probleme) {
      setErreur(probleme)
      return
    }

    setErreur('')
    setEnvoi(true)
    try {
      const donnees = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        motDePasse: form.motDePasse,
        role: form.role,
      }
      if (form.role === ROLES.STUDENT && form.etablissement.trim()) {
        donnees.etablissement = form.etablissement.trim()
      }

      await api.register(donnees) // création du compte + profil + rôle
      await login(donnees.email, donnees.motDePasse) // connexion automatique
    } catch (err) {
      // L'API renvoie déjà un message en français (ex : EMAIL_DEJA_UTILISE)
      setErreur(err.message || "L'inscription a échoué. Réessaie.")
      setEnvoi(false)
    }
  }

  return (
    <EcranAuth>
      <form onSubmit={submit} noValidate>
        <h2>Créer un compte</h2>
        <p className="cs-sub">Rejoins CampusSave et sauve des repas à petit prix.</p>

        {erreur && <div className="cs-error" role="alert">{erreur}</div>}

        <fieldset className="cs-choix">
          <legend>Je suis</legend>
          <label>
            <input type="radio" name="role" value={ROLES.STUDENT}
              checked={form.role === ROLES.STUDENT} onChange={changer('role')} />
            Étudiant
          </label>
          <label>
            <input type="radio" name="role" value={ROLES.MERCHANT}
              checked={form.role === ROLES.MERCHANT} onChange={changer('role')} />
            Commerçant
          </label>
        </fieldset>

        <div className="auth-duo">
          <div className="cs-field"><label htmlFor="prenom">Prénom</label>
            <input id="prenom" autoComplete="given-name" value={form.prenom} onChange={changer('prenom')} /></div>
          <div className="cs-field"><label htmlFor="nom">Nom</label>
            <input id="nom" autoComplete="family-name" value={form.nom} onChange={changer('nom')} /></div>
        </div>
        <div className="cs-field"><label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={changer('email')} /></div>
        <div className="auth-duo">
          <div className="cs-field"><label htmlFor="tel">Téléphone (8 chiffres)</label>
            <input id="tel" type="tel" inputMode="numeric" maxLength={8} autoComplete="tel"
              value={form.telephone} onChange={changer('telephone')} /></div>
          {form.role === ROLES.STUDENT && (
            <div className="cs-field"><label htmlFor="etab">Établissement</label>
              <input id="etab" value={form.etablissement} onChange={changer('etablissement')} /></div>
          )}
        </div>

        <div className="auth-duo">
          <div className="cs-field"><label htmlFor="pw">Mot de passe</label>
            <input id="pw" type="password" autoComplete="new-password" aria-describedby="pw-aide" value={form.motDePasse} onChange={changer('motDePasse')} /></div>
          <div className="cs-field"><label htmlFor="pw2">Confirmation</label>
            <input id="pw2" type="password" autoComplete="new-password" value={form.confirmation} onChange={changer('confirmation')} /></div>
        </div>
        <p id="pw-aide" className="cs-sub auth-aide">6 caractères minimum.</p>

        <button className="cs-btn primary" disabled={envoi}>{envoi ? 'Création du compte…' : "S'inscrire"}</button>
        <p className="cs-sub">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </form>
    </EcranAuth>
  )
}
