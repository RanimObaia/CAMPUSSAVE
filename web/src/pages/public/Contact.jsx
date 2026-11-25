// Formulaire de contact : enregistré par l'API et transmis par e-mail à l'équipe
import { useState } from 'react'
import { api } from '../../services/api'
import { useTitre } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { USE_MOCK } from '../../config/constants'

const SUJETS = ['Question sur une commande', 'Paiement ou remboursement', 'Devenir partenaire', 'Mes données personnelles', 'Autre']

export default function Contact() {
  useTitre('Contact', 'Contacter l\'équipe CampusSave : question, paiement, partenariat, données personnelles.')
  const { user } = useAuth()
  const [form, setForm] = useState({ nom: user ? `${user.prenom} ${user.nom}` : '', email: user?.email || '', sujet: SUJETS[0], message: '' })
  const [etat, setEtat] = useState({ envoi: false, ok: false, erreur: '' })
  const changer = (champ) => (e) => setForm({ ...form, [champ]: e.target.value })

  async function envoyer(e) {
    e.preventDefault()
    setEtat({ envoi: true, ok: false, erreur: '' })
    try {
      await api.contact(form)
      setEtat({ envoi: false, ok: true, erreur: '' })
      setForm({ ...form, message: '' })
    } catch (err) {
      setEtat({ envoi: false, ok: false, erreur: err.message })
    }
  }

  return (
    <div className="pub-page">
      <h1>Contact</h1>
      <p className="cs-sub">L'équipe CampusSave répond sous 72 heures. Pour une commande, indique son code (CS-…).</p>
      {etat.ok && <div className="cs-ok" role="status">Message envoyé, merci ! {USE_MOCK && '(Mode démo : rien n\'est réellement envoyé.)'}</div>}
      {etat.erreur && <div className="cs-error" role="alert">{etat.erreur}</div>}
      <form className="cs-form" onSubmit={envoyer}>
        <div className="cs-field"><label htmlFor="c-nom">Nom</label><input id="c-nom" required minLength={2} value={form.nom} onChange={changer('nom')} autoComplete="name" /></div>
        <div className="cs-field"><label htmlFor="c-email">E-mail</label><input id="c-email" type="email" required value={form.email} onChange={changer('email')} autoComplete="email" /></div>
        <div className="cs-field full"><label htmlFor="c-sujet">Sujet</label>
          <select id="c-sujet" value={form.sujet} onChange={changer('sujet')}>{SUJETS.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="cs-field full"><label htmlFor="c-msg">Message</label>
          <textarea id="c-msg" required minLength={10} maxLength={2000} value={form.message} onChange={changer('message')} /></div>
        <div className="cs-field full"><button className="cs-btn primary" disabled={etat.envoi}>{etat.envoi ? 'Envoi…' : 'Envoyer le message'}</button></div>
      </form>
    </div>
  )
}
