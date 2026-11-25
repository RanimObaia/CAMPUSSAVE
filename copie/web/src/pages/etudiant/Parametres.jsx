// Paramètres de l'étudiant : profil, notifications, langue, thème, signalements
import { useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useChargement, useTitre } from '../../hooks'
import { LANGUES } from '../../i18n/textes'
import { dateHeure } from '../../utils/format'

const NOTIFS = [
  ['favoris', 'Nouvelles offres de mes favoris'],
  ['rappels', 'Rappel 30 minutes avant mon retrait'],
  ['commandes', 'Paiement, commande prête, commande remise'],
]
const STATUT = { OUVERT: ['En cours', 'warn'], TRAITE: ['Traité', 'ok'], REJETE: ['Non retenu', ''] }

export default function Parametres() {
  const { user } = useAuth()
  const { langue, setLangue, theme, setTheme, t } = usePreferences()
  useTitre(t('nav.parametres'))
  const [profil, setProfil] = useState({ prenom: user?.prenom || '', nom: user?.nom || '', telephone: user?.telephone || '', etablissement: user?.etablissement || '' })
  const [notifs, setNotifs] = useState({ favoris: true, rappels: true, commandes: true, ...(user?.preferences?.notifications || {}) })
  const [message, setMessage] = useState({ ok: '', erreur: '' })
  const signalements = useChargement(() => api.mesSignalements())

  async function enregistrer(e) {
    e.preventDefault()
    setMessage({ ok: '', erreur: '' })
    try {
      const data = { ...profil, preferences: { langue, notifications: notifs } }
      if (!data.telephone) delete data.telephone
      const maj = await api.updateMe(data)
      Object.assign(user, maj)
      setMessage({ ok: 'Paramètres enregistrés.', erreur: '' })
    } catch (err) { setMessage({ ok: '', erreur: err.message }) }
  }

  return (
    <>
      <h1>{t('nav.parametres')}</h1>
      {message.ok && <div className="cs-ok" role="status">{message.ok}</div>}
      {message.erreur && <div className="cs-error" role="alert">{message.erreur}</div>}
      <form className="cs-form" onSubmit={enregistrer}>
        <h2 className="cs-field full">Profil</h2>
        <div className="cs-field"><label htmlFor="p-prenom">Prénom</label><input id="p-prenom" required value={profil.prenom} onChange={(e) => setProfil({ ...profil, prenom: e.target.value })} /></div>
        <div className="cs-field"><label htmlFor="p-nom">Nom</label><input id="p-nom" required value={profil.nom} onChange={(e) => setProfil({ ...profil, nom: e.target.value })} /></div>
        <div className="cs-field"><label htmlFor="p-tel">Téléphone</label><input id="p-tel" inputMode="numeric" pattern="\d{8}" value={profil.telephone} onChange={(e) => setProfil({ ...profil, telephone: e.target.value })} /></div>
        <div className="cs-field"><label htmlFor="p-etab">Établissement</label><input id="p-etab" value={profil.etablissement} onChange={(e) => setProfil({ ...profil, etablissement: e.target.value })} /></div>
        <div className="cs-field"><label>E-mail</label><input readOnly value={user?.email || ''} /></div>

        <fieldset className="cs-field full param-notifs">
          <legend>Notifications</legend>
          {NOTIFS.map(([cle, libelle]) => (
            <label key={cle} className="interrupteur">
              <input type="checkbox" checked={notifs[cle] !== false} onChange={(e) => setNotifs({ ...notifs, [cle]: e.target.checked })} />
              <span>{libelle}</span>
            </label>
          ))}
          <p className="cs-sub">Les e-mails de paiement (confirmation ou refus) sont toujours envoyés.</p>
        </fieldset>

        <div className="cs-field"><label htmlFor="p-langue">{t('langue.choisir')}</label>
          <select id="p-langue" value={langue} onChange={(e) => setLangue(e.target.value)}>{LANGUES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
        <div className="cs-field"><label htmlFor="p-theme">Thème</label>
          <select id="p-theme" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="clair">{t('theme.clair')}</option><option value="sombre">{t('theme.sombre')}</option></select></div>
        <div className="cs-field full"><button className="cs-btn primary">{t('commun.enregistrer')}</button></div>
      </form>

      <h2>Mes signalements</h2>
      {signalements.data?.length === 0 && <p className="cs-sub">Aucun signalement. En cas de problème, ouvre la commande et choisis « Signaler un problème ».</p>}
      <ul className="et-lignes">
        {signalements.data?.map((s) => (
          <li key={s.id} className="et-ligne">
            <div className="et-ligne-texte">
              <span className="et-ligne-titre">{s.codeCommande || 'Sans commande'} · {s.commerce?.nom || ''}</span>
              <span className="cs-sub">{dateHeure(s.date)} · {s.message}</span>
              {s.reponse && <span><b>Réponse :</b> {s.reponse}</span>}
            </div>
            <span className={`cs-badge ${STATUT[s.statut]?.[1] || ''}`}>{STATUT[s.statut]?.[0] || s.statut}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
