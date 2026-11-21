// Retour après la page de paiement : on attend que le serveur confirme le paiement
// (le webhook Konnect), puis on affiche le résultat. On ne croit jamais le navigateur.
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { usePanier } from '../../context/PanierContext'
import { dt } from '../../utils/format'

const ESSAIS_MAX = 15 // 15 × 2 s = 30 secondes d'attente au plus

export default function PaiementRetour() {
  const [params] = useSearchParams()
  const id = params.get('commande')
  const { vider } = usePanier()
  const [commande, setCommande] = useState(null)
  const [erreur, setErreur] = useState('')
  const [delaiDepasse, setDelaiDepasse] = useState(false)
  const panierVide = useRef(false)

  useEffect(() => {
    if (!id) return undefined
    let essais = 0
    let minuteur
    async function verifier() {
      try {
        const c = await api.getCommande(id)
        setCommande(c)
        if (c.statut === 'EN_ATTENTE_PAIEMENT') {
          essais += 1
          if (essais < ESSAIS_MAX) minuteur = setTimeout(verifier, 2000)
          else setDelaiDepasse(true)
        }
      } catch (err) {
        setErreur(err.message)
      }
    }
    verifier()
    return () => clearTimeout(minuteur)
  }, [id])

  // Paiement réussi : le panier a été commandé, on le vide (une seule fois)
  useEffect(() => {
    if (commande?.statut === 'PAYEE' && !panierVide.current) {
      panierVide.current = true
      vider()
    }
  }, [commande, vider])

  if (!id) return <div className="cs-error" role="alert">Commande inconnue.</div>
  if (erreur) return <div className="cs-error" role="alert">{erreur}</div>

  const statut = commande?.statut
  return (
    <div className="cs-card et-retour-paiement">
      {(!commande || statut === 'EN_ATTENTE_PAIEMENT') && !delaiDepasse && (
        <>
          <div className="et-rond et-rond-attente" aria-hidden="true">…</div>
          <h1>Vérification du paiement</h1>
          <p className="cs-sub">On attend la confirmation de Konnect. Ne ferme pas cette page.</p>
        </>
      )}
      {delaiDepasse && statut === 'EN_ATTENTE_PAIEMENT' && (
        <>
          <h1>Paiement pas encore confirmé</h1>
          <p className="cs-sub">La confirmation tarde. Tu peux suivre ta commande dans « Mes commandes ».</p>
          <Link to={`/commandes/${id}`} className="cs-btn primary">Voir ma commande</Link>
        </>
      )}
      {(statut === 'PAYEE' || statut === 'PRETE' || statut === 'RECUPEREE') && (
        <>
          <div className="et-rond et-rond-ok" aria-hidden="true">✓</div>
          <h1>Paiement réussi</h1>
          <p>Commande <b>{commande.code}</b> · {dt(commande.montantTotal)}</p>
          <p className="cs-sub">Un email de confirmation vient de t'être envoyé. Présente ton QR code au commerçant pour récupérer ta commande.</p>
          <Link to={`/commandes/${id}`} className="cs-btn primary">Voir mon QR code</Link>
        </>
      )}
      {statut === 'ANNULEE' && (
        <>
          <div className="et-rond et-rond-ko" aria-hidden="true">✕</div>
          <h1>Paiement échoué</h1>
          <p className="cs-sub">Aucun montant n'a été débité. La commande {commande.code} est annulée et ton panier est toujours là.</p>
          <Link to="/panier" className="cs-btn primary">Retour au panier</Link>
        </>
      )}
    </div>
  )
}
