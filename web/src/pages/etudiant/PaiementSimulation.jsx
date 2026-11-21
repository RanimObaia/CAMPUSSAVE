// Mode démo seulement : remplace la page de paiement Konnect, qu'on ne peut pas
// appeler sans backend. Elle joue le rôle de Konnect + du webhook.
// Avec le vrai backend, l'étudiant est envoyé sur la vraie page Konnect.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { USE_MOCK } from '../../config/constants'
import { dt } from '../../utils/format'
import '../../styles/etudiant.css'

export default function PaiementSimulation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [envoi, setEnvoi] = useState(false)
  const { data: c, erreur } = useChargement(() => api.getCommande(id), [id])

  if (!USE_MOCK) {
    return <div className="cs cs-login"><p>Cette page n'existe qu'en mode démo.</p></div>
  }

  async function terminer(reussi) {
    setEnvoi(true)
    await api.simulerResultatPaiement(id, reussi) // ce que ferait le webhook Konnect
    navigate(`/paiement/retour?commande=${id}`)
  }

  return (
    <div className="cs et-simu">
      <div className="et-simu-bandeau">Mode démo : paiement simulé. Avec le backend, cette étape se fait sur la page Konnect.</div>
      <div className="et-simu-carte">
        {erreur && <div className="cs-error" role="alert">{erreur}</div>}
        {!c && !erreur && <p className="cs-empty">Chargement…</p>}
        {c && (
          <>
            <p className="cs-sub">Paiement à CampusSave · commande {c.code}</p>
            <h1>{dt(c.montantTotal)}</h1>
            <p className="cs-sub">{c.commerce?.nom}</p>

            <div className="cs-field"><label htmlFor="num">Numéro de carte (test)</label>
              <input id="num" value="4242 4242 4242 4242" readOnly /></div>
            <div className="et-simu-ligne">
              <div className="cs-field"><label htmlFor="exp">Expiration</label><input id="exp" value="12/28" readOnly /></div>
              <div className="cs-field"><label htmlFor="cvc">CVC</label><input id="cvc" value="123" readOnly /></div>
            </div>

            <button type="button" className="cs-btn primary et-large" onClick={() => terminer(true)} disabled={envoi || c.statut !== 'EN_ATTENTE_PAIEMENT'}>
              Payer {dt(c.montantTotal)}
            </button>
            <button type="button" className="cs-btn danger et-large" onClick={() => terminer(false)} disabled={envoi || c.statut !== 'EN_ATTENTE_PAIEMENT'}>
              Simuler un paiement refusé
            </button>
            <Link to="/panier" className="et-retour et-centre">← Retour au panier</Link>
          </>
        )}
      </div>
    </div>
  )
}
