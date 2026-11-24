// Détail d'une offre : commerce, description, prix, quantité restante, créneau de retrait
import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { usePanier } from '../../context/PanierContext'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../config/constants'
import Quantite from '../../components/Quantite'
import { dt, dateHeure } from '../../utils/format'
import { REGIMES, categorie, distance, finDans, heure, reduction } from '../../utils/categories'
import Cloche from '../../components/Cloche'
import Icone from '../../components/Icone'
import CoeurFavori from '../../components/CoeurFavori'
import { Note } from '../../components/Etoiles'

// La carte (Leaflet) n'est chargée que si on l'affiche
const CarteOffres = lazy(() => import('../../components/CarteOffres'))

export default function OffreDetail() {
  const { id } = useParams()
  const { data: o, erreur, chargement } = useChargement(() => api.getOffreDetail(id), [id])
  const avis = useChargement(() => (o?.commerce?.id ? api.avisCommerce(o.commerce.id) : Promise.resolve([])), [o?.commerce?.id])
  useTitre(o?.titre, o ? `${o.titre} chez ${o.commerce?.nom} : ${dt(o.prixReduit)} au lieu de ${dt(o.prixInitial)}. Retrait de ${heure(o.heureDebutRecuperation)} à ${heure(o.heureFinRecuperation)}.` : undefined)
  const { user } = useAuth()
  const navigate = useNavigate()
  const panier = usePanier()
  const [qte, setQte] = useState(1)
  const [ajoute, setAjoute] = useState(false)

  if (erreur) {
    return (
      <>
        <Link to="/offres" className="et-retour"><Icone nom="fleche" taille={18} /> Toutes les offres</Link>
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

  function ajouterAuPanier() {
    // Visiteur : on lui demande de se connecter avant de réserver
    if (!user) { navigate('/login', { state: { erreur: 'Connecte-toi pour réserver cette offre.' } }); return }
    if (user.role !== ROLES.STUDENT) { window.alert('Seuls les comptes étudiants peuvent réserver.'); return }
    // Une commande = un seul commerce : on demande avant de remplacer le panier
    if (panier.autreCommerce(o) &&
      !window.confirm(`Ton panier contient des offres de « ${panier.commerce.nom} ». Le vider pour ajouter celle-ci ?`)) return
    panier.ajouter(o, qte)
    setQte(1)
    setAjoute(true)
  }

  return (
    <>
      <Link to="/offres" className="et-retour"><Icone nom="fleche" taille={18} /> Toutes les offres</Link>

      <article className="et-detail">
        <Cloche code={o.categorie} photoUrl={o.photoUrl} taille="grande" remise={reduction(o)} />

        <div className="et-detail-texte">
          <div className="et-carte-tete">
            <span className="et-commerce">{o.commerce?.nom} · {categorie(o.categorie).label}</span>
            <Note valeur={o.commerce?.noteMoyenne} nb={o.commerce?.nbAvis} />
          </div>
          <h1>{o.titre}</h1>
          <CoeurFavori commerce={o.commerce} avecTexte />
          {o.description && <p>{o.description}</p>}

          <div className="et-prix et-prix-grand">
            <b>{dt(o.prixReduit)}</b>
            <s>{dt(o.prixInitial)}</s>
          </div>
          <span className="et-economie"><Icone nom="feuille" taille={16} /> Tu économises {dt(o.prixInitial - o.prixReduit)}</span>

          <dl className="et-liste-infos">
            <div><dt>Commerce</dt><dd>{o.commerce?.nom}</dd></div>
            <div><dt>Adresse</dt><dd>{o.commerce?.adresse}{o.distanceKm != null && <> · à {distance(o.distanceKm)} de l'ESSECT</>}</dd></div>
            {o.commerce?.horairesOuverture && <div><dt>Horaires</dt><dd>{o.commerce.horairesOuverture}</dd></div>}
            {o.regimes?.length > 0 && <div><dt>Préférences</dt><dd className="et-regimes">{o.regimes.map((r) => <span key={r}>{REGIMES[r] || r}</span>)}</dd></div>}
            <div><dt>Retrait</dt><dd>{jour}, de {heure(o.heureDebutRecuperation)} à {heure(o.heureFinRecuperation)}{fin && <> · <span className={`et-fin${fin.urgent ? ' urgent' : ''}`}>se termine dans {fin.texte}</span></>}</dd></div>
            <div><dt>Disponibilité</dt><dd>{disponible ? `${o.quantiteDisponible} restante${o.quantiteDisponible > 1 ? 's' : ''}` : 'Épuisée'}</dd></div>
          </dl>

          {disponible && resteAjoutable > 0 && (
            <div className="et-ajout">
              <Quantite valeur={Math.min(qte, resteAjoutable)} max={resteAjoutable} onChange={(q) => { setQte(q); setAjoute(false) }} />
              <button type="button" className="cs-btn primary" onClick={ajouterAuPanier}>
                {user ? 'Ajouter au panier' : 'Se connecter pour réserver'} · {dt(o.prixReduit * Math.min(qte, resteAjoutable))}
              </button>
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

      <section className="et-sous-sections">
        {o.commerce?.latitude != null && (
          <div>
            <h2>Où récupérer</h2>
            <Suspense fallback={null}><CarteOffres offres={[o]} hauteur={260} /></Suspense>
            <a className="cs-btn et-mt" href={`https://www.openstreetmap.org/directions?to=${o.commerce.latitude}%2C${o.commerce.longitude}`} target="_blank" rel="noreferrer">
              <Icone nom="lieu" taille={18} /> Itinéraire
            </a>
          </div>
        )}
        <div>
          <h2>Avis des étudiants</h2>
          {avis.data?.length === 0 && <p className="cs-sub">Pas encore d'avis : sois le premier à noter ce commerce après ton retrait.</p>}
          <ul className="avis-liste">
            {avis.data?.slice(0, 5).map((a) => (
              <li key={a.id}>
                <div className="avis-tete"><b>{a.prenomEtudiant}</b><Note valeur={a.note} petit /><span className="cs-sub">{dateHeure(a.date)}</span></div>
                {a.commentaire && <p>{a.commentaire}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
