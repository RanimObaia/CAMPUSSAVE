// Panier : quantités + / −, sous-totaux, total, économie, vider le panier
import { Link } from 'react-router-dom'
import { usePanier } from '../../context/PanierContext'
import Quantite from '../../components/Quantite'
import { dt } from '../../utils/format'
import { categorie, heure } from '../../utils/categories'

export default function Panier() {
  const { lignes, commerce, total, economie, nbArticles, modifierQuantite, retirer, vider } = usePanier()

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
          <button type="button" className="cs-btn primary et-large" disabled title="Prochaine étape : paiement Konnect">
            Commander et payer
          </button>
          <p className="cs-sub et-petit">Le paiement en ligne arrive à la prochaine étape.</p>
          <button type="button" className="cs-btn danger et-large" onClick={confirmerVider}>Vider le panier</button>
        </aside>
      </div>
    </>
  )
}
