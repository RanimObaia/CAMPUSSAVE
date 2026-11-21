// Détail d'une offre : commerce, description, prix, quantité restante, créneau de retrait
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { usePanier } from '../../context/PanierContext'
import Quantite from '../../components/Quantite'
import { dt } from '../../utils/format'
import { categorie, heure, reduction } from '../../utils/categories'

export default function OffreDetail() {
  const { id } = useParams()
  const { data: o, erreur, chargement } = useChargement(() => api.getOffreDetail(id), [id])
  const panier = usePanier()
  const [qte, setQte] = useState(1)
  const [ajoute, setAjoute] = useState(false)

  if (erreur) {
    return (
      <>
        <Link to="/" className="et-retour">← Retour aux offres</Link>
        <div className="cs-error" role="alert">{erreur}</div>
      </>
    )
  }
  if (chargement || !o) return <p className="cs-empty">Chargement…</p>

  const jour = new Date(o.heureDebutRecuperation).toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long' })
  const disponible = o.statut === 'ACTIVE' && o.quantiteDisponible > 0
  const dejaDansPanier = panier.quantiteDe(o.id)
  const resteAjoutable = o.quantiteDisponible - dejaDansPanier

  function ajouterAuPanier() {
    // Une commande = un seul commerce : on demande avant de remplacer le panier
    if (panier.autreCommerce(o) &&
      !window.confirm(`Ton panier contient des offres de « ${panier.commerce.nom} ». Le vider pour ajouter celle-ci ?`)) return
    panier.ajouter(o, qte)
    setQte(1)
    setAjoute(true)
  }

  return (
    <>
      <Link to="/" className="et-retour">← Retour aux offres</Link>

      <article className="et-detail">
        <div className="et-visuel et-visuel-grand" aria-hidden="true">
          {o.photoUrl ? <img src={o.photoUrl} alt="" /> : <span>{categorie(o.categorie).icone}</span>}
          <b className="et-remise">-{reduction(o)} %</b>
        </div>

        <div className="et-detail-texte">
          <span className="et-commerce">{categorie(o.categorie).label}</span>
          <h1>{o.titre}</h1>
          {o.description && <p>{o.description}</p>}

          <div className="et-prix et-prix-grand">
            <b>{dt(o.prixReduit)}</b>
            <s>{dt(o.prixInitial)}</s>
          </div>
          <p className="cs-sub">Tu économises {dt(o.prixInitial - o.prixReduit)}.</p>

          <dl className="et-liste-infos">
            <div><dt>Commerce</dt><dd>{o.commerce?.nom}</dd></div>
            <div><dt>Adresse</dt><dd>{o.commerce?.adresse}</dd></div>
            <div><dt>Retrait</dt><dd>{jour}, de {heure(o.heureDebutRecuperation)} à {heure(o.heureFinRecuperation)}</dd></div>
            <div><dt>Disponibilité</dt><dd>{disponible ? `${o.quantiteDisponible} restante${o.quantiteDisponible > 1 ? 's' : ''}` : 'Épuisée'}</dd></div>
          </dl>

          {disponible && resteAjoutable > 0 && (
            <div className="et-ajout">
              <Quantite valeur={Math.min(qte, resteAjoutable)} max={resteAjoutable} onChange={(q) => { setQte(q); setAjoute(false) }} />
              <button type="button" className="cs-btn primary" onClick={ajouterAuPanier}>
                Ajouter au panier · {dt(o.prixReduit * Math.min(qte, resteAjoutable))}
              </button>
            </div>
          )}
          {disponible && resteAjoutable <= 0 && (
            <p className="cs-sub">Tu as déjà tout le stock disponible dans ton panier.</p>
          )}
          {ajoute && (
            <div className="cs-ok" role="status">
              Ajouté au panier ✓ <Link to="/panier">Voir mon panier</Link>
            </div>
          )}
          {!ajoute && dejaDansPanier > 0 && (
            <p className="cs-sub">Déjà {dejaDansPanier} dans ton panier.</p>
          )}
        </div>
      </article>
    </>
  )
}
