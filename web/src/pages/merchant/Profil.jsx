
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Entete } from '../../components/ui'

export default function Profil() {
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState('')
  const [erreur, setErreur] = useState('')

  // Charger les informations du commerçant
  useEffect(() => {
    api.getMe()
      .then(setF)
      .catch((e) => setErreur(e.message))
  }, [])

  // Modifier les champs du formulaire
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
  }

  // Enregistrer les modifications
  async function submit(e) {
    e.preventDefault()
    setMsg('')
    setErreur('')

    try {
      const updated = await api.updateMe({
        nom: f.nom,
        prenom: f.prenom,
        telephone: f.telephone,
      })

      setF(updated)
      setMsg('Profil enregistré.')
    } catch (err) {
      setErreur(err.message)
    }
  }

  // Afficher le chargement
  if (!f) {
    return (
      <>
        <Entete titre="Mon profil" />
        {erreur
          ? <div className="cs-error" role="alert">{erreur}</div>
          : <p className="cs-empty">Chargement…</p>}
      </>
    )
  }

  return (
    <>
      <Entete titre="Mon profil" />

      <form className="cs-form" onSubmit={submit}>
        {erreur && (
          <div className="cs-error cs-field full" role="alert">
            {erreur}
          </div>
        )}

        {msg && (
          <div className="cs-ok cs-field full" role="status">
            {msg}
          </div>
        )}

        <div className="cs-field">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            required
            value={f.nom || ''}
            onChange={set('nom')}
          />
        </div>

        <div className="cs-field">
          <label htmlFor="prenom">Prénom</label>
          <input
            id="prenom"
            required
            value={f.prenom || ''}
            onChange={set('prenom')}
          />
        </div>

        <div className="cs-field">
          <label htmlFor="telephone">Téléphone</label>
          <input
            id="telephone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            minLength={8}
            required
            value={f.telephone || ''}
            onChange={set('telephone')}
            placeholder="Exemple : 22123456"
          />
        </div>

        <div className="cs-field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={f.email || ''}
            readOnly
          />
        </div>

        <div className="cs-field">
          <label htmlFor="role">Rôle</label>
          <input
            id="role"
            value={f.role === 'merchant' ? 'Commerçant' : f.role || ''}
            readOnly
          />
        </div>

        <div className="cs-field full">
          <button type="submit" className="cs-btn primary">
            Enregistrer
          </button>
        </div>
      </form>
    </>
  )
}
