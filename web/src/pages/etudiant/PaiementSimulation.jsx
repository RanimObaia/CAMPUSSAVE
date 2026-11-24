// Page de paiement de test : remplace la page Konnect
//  - en mode démo (sans backend) ;
//  - avec le backend en PAIEMENT_MODE=simulation (sandbox Konnect indisponible).
// Elle joue le rôle de la page Konnect : le serveur confirme ensuite la commande
// comme avec Konnect (vérification, QR code, email).
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { dt } from '../../utils/format'
import '../../styles/etudiant.css'

export default function PaiementSimulation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [envoi, setEnvoi] = useState(false)
  const [erreurPaiement, setErreurPaiement] = useState(null)
  const { data: c, erreur } = useChargement(() => api.getCommande(id), [id])

  // Comme Konnect : paiement réussi → le webhook confirme puis retour sur successUrl ;
  // paiement refusé → retour sur failUrl (&echec=1), sans rien confirmer
  async function terminer(reussi) {
    setEnvoi(true)
    try {
      if (reussi) {
        await api.simulerResultatPaiement(id, true)
        navigate(`/paiement/retour?commande=${id}`)
      } else {
        navigate(`/paiement/retour?commande=${id}&echec=1`)
      }
    } catch (e) {
      setErreurPaiement(e.message)
      setEnvoi(false)
    }
  }

  return (
    <div className="cs et-simu">
      <div className="et-simu-bandeau">Paiement de test : aucune carte réelle n'est débitée. En production, cette étape se fait sur la page de paiement sécurisée.</div>
      <div className="et-simu-carte">
        {(erreur || erreurPaiement) && <div className="cs-error" role="alert">{erreur || erreurPaiement}</div>}
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
