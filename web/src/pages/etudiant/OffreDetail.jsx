// Détail d'une offre : commerce, description, prix, quantité restante, créneau de retrait
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { usePanier } from '../../context/PanierContext'
import Quantite from '../../components/Quantite'
import { dt } from '../../utils/format'
import { categorie, finDans, heure, reduction } from '../../utils/categories'
import Cloche from '../../components/Cloche'
import Icone from '../../components/Icone'

export default function OffreDetail() {
  const { id } = useParams()
  const { data: o, erreur, chargement } = useChargement(() => api.getOffreDetail(id), [id])
  const panier = usePanier()
  const [qte, setQte] = useState(1)
  const [ajoute, setAjoute] = useState(false)
  const [confirmeRemplacer, setConfirmeRemplacer] = useState(false) // panier d'un autre commerce

  if (erreur) {
    return (
      <>
        <Link to="/" className="et-retour"><Icone nom="fleche" taille={18} /> Toutes les offres</Link>
        <div className="cs-error" role="alert">{erreur}</div>
      </>
    )
  }
  if (chargement || !o) return <p className="cs-empty">Chargement…</p>

  const jour = new Date(o.heureDebutRecuperation).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Tunis' })
  const disponible = o.statut === 'ACTIVE' && o.quantiteDisponible > 0
  const fin = finDans(o.heureFinRecuperation)
  const dejaDansPanier = panier.quantiteDe(o.id)
  const resteAjoutable = o.quantiteDisponible - dejaDansPanier

  // Une commande = un seul commerce : on demande dans la page avant de remplacer le panier
  // (une boîte window.confirm peut être bloquée par le navigateur)
  function ajouterAuPanier(confirme = false) {
    if (panier.autreCommerce(o) && !confirme) {
      setConfirmeRemplacer(true)
      return
    }
    setConfirmeRemplacer(false)
    panier.ajouter(o, qte)
    setQte(1)
    setAjoute(true)
  }

  return (
    <>
      <Link to="/" className="et-retour"><Icone nom="fleche" taille={18} /> Toutes les offres</Link>

      <article className="et-detail">
        <Cloche code={o.categorie} photoUrl={o.photoUrl} taille="grande" remise={reduction(o)} />

        <div className="et-detail-texte">
          <span className="et-commerce">{o.commerce?.nom} · {categorie(o.categorie).label}</span>
          <h1>{o.titre}</h1>
          {o.description && <p>{o.description}</p>}

          <div className="et-prix et-prix-grand">
            <b>{dt(o.prixReduit)}</b>
            <s>{dt(o.prixInitial)}</s>
          </div>
          <span className="et-economie"><Icone nom="feuille" taille={16} /> Tu économises {dt(o.prixInitial - o.prixReduit)}</span>

          <dl className="et-liste-infos">
            <div><dt>Commerce</dt><dd>{o.commerce?.nom}</dd></div>
            <div><dt>Adresse</dt><dd>{o.commerce?.adresse}</dd></div>
            <div><dt>Retrait</dt><dd>{jour}, de {heure(o.heureDebutRecuperation)} à {heure(o.heureFinRecuperation)}{fin && <> · <span className={`et-fin${fin.urgent ? ' urgent' : ''}`}>se termine dans {fin.texte}</span></>}</dd></div>
            <div><dt>Disponibilité</dt><dd>{disponible ? `${o.quantiteDisponible} restante${o.quantiteDisponible > 1 ? 's' : ''}` : 'Épuisée'}</dd></div>
          </dl>

          {disponible && resteAjoutable > 0 && (
            <div className="et-ajout">
              <Quantite valeur={Math.min(qte, resteAjoutable)} max={resteAjoutable} onChange={(q) => { setQte(q); setAjoute(false) }} />
              <button type="button" className="cs-btn primary" onClick={() => ajouterAuPanier()}>
                Ajouter au panier · {dt(o.prixReduit * Math.min(qte, resteAjoutable))}
              </button>
            </div>
          )}
          {confirmeRemplacer && (
            <div className="et-confirmer" role="alertdialog" aria-labelledby="remplacer-titre">
              <p id="remplacer-titre"><b>Ton panier contient des offres de « {panier.commerce?.nom} ».</b> Une commande se fait chez un seul commerce : le vider pour ajouter celle-ci ?</p>
              <div className="et-confirmer-boutons">
                <button type="button" className="cs-btn" onClick={() => setConfirmeRemplacer(false)} autoFocus>Garder mon panier</button>
                <button type="button" className="cs-btn danger" onClick={() => ajouterAuPanier(true)}>Vider et ajouter</button>
              </div>
            </div>
          )}
          {disponible && resteAjoutable <= 0 && (
            <p className="cs-sub">Tu as déjà tout le stock disponible dans ton panier.</p>
          )}
          {ajoute && (
            <div className="cs-ok" role="status">
              Ajouté au panier. <Link to="/panier">Voir mon panier</Link>
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