// Notifications : offres des favoris, paiement, commande prête, rappels de retrait, réponses
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { useT } from '../../context/PreferencesContext'
import { dateHeure } from '../../utils/format'
import Icone from '../../components/Icone'

const ICONES = { OFFRE_FAVORI: 'coeurPlein', RAPPEL_RETRAIT: 'horloge', COMMANDE_PRETE: 'verifie', COMMANDE_REMISE: 'verifie', PAIEMENT_REUSSI: 'ticket', PAIEMENT_ECHOUE: 'info', SIGNALEMENT: 'drapeau' }

export default function Notifications() {
  const t = useT()
  useTitre(t('nav.notifications'))
  const { data, erreur, recharger } = useChargement(() => api.notifications())
  const liste = data?.notifications || []

  async function ouvrir(n) {
    if (!n.lu) { await api.notificationLue(n.id).catch(() => {}); recharger() }
  }
  async function toutLu() { await api.toutLu(); recharger() }

  return (
    <>
      <div className="cs-top">
        <div>
          <h1>{t('nav.notifications')}</h1>
          <p className="cs-sub">Choisis ce que tu reçois dans <Link to="/parametres">{t('nav.parametres')}</Link>.</p>
        </div>
        {data?.nonLues > 0 && <button type="button" className="cs-btn" onClick={toutLu}>Tout marquer comme lu</button>}
      </div>
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {data && liste.length === 0 && <div className="cs-card cs-empty">Aucune notification pour l'instant.</div>}
      <ul className="notifs">
        {liste.map((n) => {
          const lien = n.commandeId ? `/commandes/${n.commandeId}` : n.offreId ? `/offres/${n.offreId}` : null
          const contenu = (
            <>
              <span className="notif-icone"><Icone nom={ICONES[n.type] || 'cloche'} taille={20} /></span>
              <span className="notif-texte"><b>{n.titre}</b><span>{n.corps}</span><span className="cs-sub">{dateHeure(n.date)}</span></span>
              {!n.lu && <span className="notif-point" aria-label="non lue" />}
            </>
          )
          return (
            <li key={n.id} className={n.lu ? 'lu' : ''}>
              {lien ? <Link to={lien} onClick={() => ouvrir(n)}>{contenu}</Link> : <button type="button" onClick={() => ouvrir(n)}>{contenu}</button>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
