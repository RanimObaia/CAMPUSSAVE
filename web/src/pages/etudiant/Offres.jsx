// Liste des offres + recherche (par produit ou commerce, catégorie, prix maximum)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { dt } from '../../utils/format'
import { CATEGORIES_AFFICHAGE, categorie, heure, reduction } from '../../utils/categories'

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

  return (
    <>
      <div>
        <h1>Bonjour {user?.prenom} 👋</h1>
        <p className="cs-sub">Les invendus des commerces autour de l'ESSECT, à prix réduit.</p>
      </div>

      <section className="et-recherche" aria-label="Recherche">
        <input
          type="search"
          className="et-input"
          placeholder="Rechercher un produit ou un commerce…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          aria-label="Rechercher un produit ou un commerce"
        />
        <select className="et-input et-select" value={prixMax} onChange={(e) => setPrixMax(e.target.value)} aria-label="Prix maximum">
          {PRIX_MAX.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
        </select>
      </section>

      <div className="et-chips" role="group" aria-label="Catégories">
        <button type="button" className={cat === '' ? 'actif' : ''} onClick={() => setCat('')}>Toutes</button>
        {Object.entries(CATEGORIES_AFFICHAGE).map(([code, c]) => (
          <button type="button" key={code} className={cat === code ? 'actif' : ''} onClick={() => setCat(code)}>
            {c.icone} {c.label}
          </button>
        ))}
      </div>

      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {chargement && !offres && <p className="cs-empty">Chargement des offres…</p>}

      {offres && (
        <p className="cs-sub" aria-live="polite">
          {offres.length} offre{offres.length > 1 ? 's' : ''} disponible{offres.length > 1 ? 's' : ''}
        </p>
      )}

      {offres && offres.length === 0 && (
        <div className="cs-card cs-empty">
          Aucune offre ne correspond à ta recherche.
          {filtresActifs && <div><button type="button" className="cs-btn et-mt" onClick={effacer}>Effacer les filtres</button></div>}
        </div>
      )}

      <div className="et-grille">
        {offres?.map((o) => (
          <Link key={o.id} to={`/offres/${o.id}`} className="et-carte">
            <div className="et-visuel" aria-hidden="true">
              {o.photoUrl ? <img src={o.photoUrl} alt="" /> : <span>{categorie(o.categorie).icone}</span>}
              <b className="et-remise">-{reduction(o)} %</b>
            </div>
            <div className="et-corps">
              <span className="et-commerce">{o.commerce?.nom}</span>
              <h2 className="et-titre">{o.titre}</h2>
              <div className="et-prix">
                <b>{dt(o.prixReduit)}</b>
                <s>{dt(o.prixInitial)}</s>
              </div>
              <div className="et-infos">
                <span>🕒 {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                <span>Reste {o.quantiteDisponible}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
