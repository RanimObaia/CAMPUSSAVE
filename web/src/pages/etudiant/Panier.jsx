// Panier : quantités + / −, sous-totaux, total, économie, vider le panier, commander et payer
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePanier } from '../../context/PanierContext'
import { api } from '../../services/api'
import Quantite from '../../components/Quantite'
import { dt } from '../../utils/format'
import { categorie, heure } from '../../utils/categories'

export default function Panier() {
  const { lignes, commerce, total, economie, nbArticles, modifierQuantite, retirer, vider } = usePanier()
  const navigate = useNavigate()
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  if (lignes.length === 0) {
    return (
      <>
        <h1>Mon panier</h1>
        <div className="cs-card cs-empty">
          <p>Ton panier est vide.</p>
          <Link to="/" className="cs-btn primary et-mt">Voir les offres</Link>
        </div>
      </>
    )
  }

  // 1. l'API crée la commande (prix et stock vérifiés, quantités réservées)
  // 2. l'API demande un lien de paiement à Konnect
  // 3. on envoie l'étudiant sur la page de paiement
  async function commanderEtPayer() {
    setErreur('')
    setEnvoi(true)
    try {
      const commande = await api.createOrder({
        commerceId: commerce.id,
        lignes: lignes.map((l) => ({ offreId: l.offre.id, quantite: l.quantite })),
      })
      const { payUrl } = await api.initPaiement(commande.id)
      if (payUrl.startsWith('/')) navigate(payUrl) // mode démo : page de paiement simulée
      else window.location.href = payUrl // vraie page Konnect
    } catch (err) {
      setErreur(err.message || 'La commande a échoué. Réessaie.')
      setEnvoi(false)
    }
  }

  function confirmerVider() {
    if (window.confirm('Vider tout le panier ?')) vider()
  }

  return (
    <>
      <div>
        <h1>Mon panier</h1>
        <p className="cs-sub">Retrait chez <b>{commerce?.nom}</b>, {commerce?.adresse}</p>
      </div>

      <div className="et-panier">
        <ul className="et-lignes">
          {lignes.map(({ offre: o, quantite }) => (
            <li key={o.id} className="et-ligne">
              <div className="et-ligne-icone" aria-hidden="true">{categorie(o.categorie).icone}</div>
              <div className="et-ligne-texte">
                <Link to={`/offres/${o.id}`} className="et-ligne-titre">{o.titre}</Link>
                <span className="cs-sub">
                  {dt(o.prixReduit)} l'unité · retrait {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}
                </span>
              </div>
              <Quantite
                valeur={quantite}
                max={o.quantiteDisponible}
                onChange={(q) => modifierQuantite(o.id, q)}
                label={`Quantité de ${o.titre}`}
              />
              <b className="et-ligne-total">{dt(o.prixReduit * quantite)}</b>
              <button type="button" className="et-retirer" onClick={() => retirer(o.id)} aria-label={`Retirer ${o.titre}`}>✕</button>
            </li>
          ))}
        </ul>

        <aside className="cs-card et-resume">
          <h2>Récapitulatif</h2>
          <div className="et-resume-ligne"><span>Articles</span><span>{nbArticles}</span></div>
          <div className="et-resume-ligne et-eco"><span>Tu économises</span><span>{dt(economie)}</span></div>
          <div className="et-resume-ligne et-total"><span>Total</span><b>{dt(total)}</b></div>
          {erreur && <div className="cs-error" role="alert">{erreur}</div>}
          <button type="button" className="cs-btn primary et-large" onClick={commanderEtPayer} disabled={envoi}>
            {envoi ? 'Préparation du paiement…' : `Commander et payer ${dt(total)}`}
          </button>
          <p className="cs-sub et-petit">Paiement sécurisé par carte avec Konnect.</p>
          <button type="button" className="cs-btn danger et-large" onClick={confirmerVider} disabled={envoi}>Vider le panier</button>
        </aside>
      </div>
    </>
  )
}
