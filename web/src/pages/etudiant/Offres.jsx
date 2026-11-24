// Liste des offres + recherche (par produit ou commerce, catégorie, prix maximum)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { dt } from '../../utils/format'
import { CATEGORIES_AFFICHAGE, finDans, heure, reduction } from '../../utils/categories'
import Cloche from '../../components/Cloche'
import Icone from '../../components/Icone'

// Prix maximum proposés (en millimes : 5000 = 5 DT)
const PRIX_MAX = [
  { valeur: '', label: 'Tous les prix' },
  { valeur: '3000', label: "Jusqu'à 3 DT" },
  { valeur: '5000', label: "Jusqu'à 5 DT" },
  { valeur: '10000', label: "Jusqu'à 10 DT" },
]

export default function Offres() {
  const { user } = useAuth()
  const [texte, setTexte] = useState('') // ce que l'étudiant tape
  const [q, setQ] = useState('') // le texte réellement envoyé à la recherche
  const [cat, setCat] = useState('')
  const [prixMax, setPrixMax] = useState('')

  // On attend 300 ms après la dernière touche avant de lancer la recherche
  useEffect(() => {
    const minuteur = setTimeout(() => setQ(texte), 300)
    return () => clearTimeout(minuteur)
  }, [texte])

  const { data: offres, erreur, chargement } = useChargement(
    () => api.listOffers({ q, categorie: cat, prixMax }),
    [q, cat, prixMax],
  )

  const filtresActifs = q || cat || prixMax
  function effacer() {
    setTexte(''); setQ(''); setCat(''); setPrixMax('')
  }

  const nb = offres?.length ?? 0

  return (
    <>
      <section className="et-hero">
        <div>
          <h1>Bonjour {user?.prenom}.</h1>
          <p className="cs-sub">Les invendus du jour des commerces autour de l'ESSECT, à prix réduit. Réserve, paie en ligne, récupère avec ton QR code.</p>
        </div>
        {offres && (
          <p className="et-compte" aria-live="polite">
            <b>{nb}</b>
            <span>offre{nb > 1 ? 's' : ''} à sauver</span>
          </p>
        )}
      </section>

      <form className="et-recherche" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icone nom="loupe" />
        <input
          type="search"
          className="et-input"
          placeholder="Couscous, viennoiseries, nom d'un commerce…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          aria-label="Rechercher un produit ou un commerce"
        />
        <select className="et-select" value={prixMax} onChange={(e) => setPrixMax(e.target.value)} aria-label="Prix maximum">
          {PRIX_MAX.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
        </select>
      </form>

      <div className="et-chips" role="group" aria-label="Catégories">
        <button type="button" className={cat === '' ? 'actif' : ''} aria-pressed={cat === ''} onClick={() => setCat('')}>Toutes</button>
        {Object.entries(CATEGORIES_AFFICHAGE).map(([code, c]) => (
          <button type="button" key={code} className={cat === code ? 'actif' : ''} aria-pressed={cat === code} onClick={() => setCat(code)}>
            <Icone nom={code} taille={18} /> {c.label}
          </button>
        ))}
      </div>

      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {chargement && !offres && <p className="cs-empty">Chargement des offres…</p>}

      {offres && offres.length === 0 && (
        <div className="cs-card cs-empty">
          {filtresActifs ? 'Aucune offre ne correspond à ta recherche.' : "Pas d'offre pour le moment. Les commerces publient leurs invendus en fin de journée : reviens un peu plus tard."}
          {filtresActifs && <div><button type="button" className="cs-btn et-mt" onClick={effacer}>Effacer les filtres</button></div>}
        </div>
      )}

      <div className="et-grille">
        {offres?.map((o) => {
          const fin = finDans(o.heureFinRecuperation)
          return (
            <Link key={o.id} to={`/offres/${o.id}`} className="et-carte">
              <Cloche code={o.categorie} photoUrl={o.photoUrl} remise={reduction(o)} />
              <div className="et-corps">
                <span className="et-commerce">{o.commerce?.nom}</span>
                <h2 className="et-titre">{o.titre}</h2>
                <div className="et-prix">
                  <b>{dt(o.prixReduit)}</b>
                  <s>{dt(o.prixInitial)}</s>
                </div>
                <div className="et-infos">
                  <span><Icone nom="horloge" taille={16} /> {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                  {fin && <span className={`et-fin${fin.urgent ? ' urgent' : ''}`}>Se termine dans {fin.texte}</span>}
                  <span>{o.quantiteDisponible} restante{o.quantiteDisponible > 1 ? 's' : ''}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
