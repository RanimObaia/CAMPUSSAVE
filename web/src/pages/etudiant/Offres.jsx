// Offres du jour : recherche, catégories, filtres avancés (prix, distance, créneau,
// préférence alimentaire, type de commerce), tri, vue liste ou carte, position de l'étudiant.
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { dt } from '../../utils/format'
import { CATEGORIES_AFFICHAGE, REGIMES, TYPES, distance, finDans, heure, reduction } from '../../utils/categories'
import Cloche from '../../components/Cloche'
import Icone from '../../components/Icone'
import CoeurFavori from '../../components/CoeurFavori'
import { Note } from '../../components/Etoiles'

// La carte (Leaflet) n'est chargée que si on l'affiche
const CarteOffres = lazy(() => import('../../components/CarteOffres'))

const PRIX_MAX = ['', '3000', '5000', '10000']
const DISTANCES = ['', '0.5', '1', '3']
const TRIS = ['fin', 'distance', 'prix', 'note', 'remise']
const CRENEAUX = ['', 'maintenant', 'midi', 'soir']
const CLES = ['cat', 'prixMax', 'distanceMax', 'creneau', 'regime', 'type', 'tri', 'vue']

export default function Offres() {
  const { user } = useAuth()
  const { t } = usePreferences()
  useTitre(t('nav.offres'), 'Les offres anti-gaspi du jour autour de l\'ESSECT : plats, viennoiseries, pâtisseries, boissons à prix réduit.')
  // Les filtres vivent dans l'adresse (/offres?tri=distance&vue=carte) : on peut partager ou revenir en arrière
  const [params, setParams] = useSearchParams()
  const f = Object.fromEntries(CLES.map((k) => [k, params.get(k) || '']))
  const vue = f.vue || 'liste'
  const changer = (cle, valeur) => {
    const p = new URLSearchParams(params)
    if (valeur) p.set(cle, valeur); else p.delete(cle)
    setParams(p, { replace: true })
  }

  const [texte, setTexte] = useState(params.get('q') || '')
  const [q, setQ] = useState(texte)
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [position, setPosition] = useState(null)
  const [erreurPosition, setErreurPosition] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(() => setQ(texte), 300)
    return () => clearTimeout(minuteur)
  }, [texte])

  const { data: offres, erreur, chargement } = useChargement(
    () => api.listOffers({
      q, categorie: f.cat, prixMax: f.prixMax, distanceMax: f.distanceMax, creneau: f.creneau,
      regime: f.regime, typeCommerce: f.type, tri: f.tri, lat: position?.lat, lng: position?.lng,
    }),
    [q, f.cat, f.prixMax, f.distanceMax, f.creneau, f.regime, f.type, f.tri, position],
  )

  function maPosition() {
    setErreurPosition('')
    if (!navigator.geolocation) { setErreurPosition('Ton navigateur ne donne pas la position.'); return }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); if (!f.tri) changer('tri', 'distance') },
      () => setErreurPosition('Position refusée : les distances sont calculées depuis l\'ESSECT.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const nbFiltres = ['prixMax', 'distanceMax', 'creneau', 'regime', 'type'].filter((k) => f[k]).length
  const filtresActifs = q || f.cat || nbFiltres
  function effacer() {
    setTexte(''); setQ('')
    const p = new URLSearchParams()
    if (f.vue) p.set('vue', f.vue)
    setParams(p, { replace: true })
  }
  const nb = offres?.length ?? 0

  return (
    <>
      <section className="et-hero">
        <div>
          <h1>{user?.prenom ? t('off.bonjour', { prenom: user.prenom }) : t('nav.offres')}</h1>
          <p className="cs-sub">{t('off.sous')}</p>
        </div>
        {offres && (
          <p className="et-compte" aria-live="polite">
            <b>{nb}</b>
            <span>{t('off.aSauver')}</span>
          </p>
        )}
      </section>

      <form className="et-recherche" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icone nom="loupe" />
        <input
          type="search"
          className="et-input"
          placeholder={t('off.recherche')}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          aria-label={t('off.recherche')}
        />
        <select className="et-select" value={f.tri} onChange={(e) => changer('tri', e.target.value)} aria-label={t('off.trier')}>
          {TRIS.map((tri) => <option key={tri} value={tri === 'fin' ? '' : tri}>{t(`off.tri.${tri}`)}</option>)}
        </select>
        <button type="button" className={`et-filtres-bouton${nbFiltres ? ' actif' : ''}`} aria-expanded={filtresOuverts} aria-controls="filtres" onClick={() => setFiltresOuverts(!filtresOuverts)}>
          <Icone nom="filtre" taille={18} /> {t('off.filtres')}{nbFiltres > 0 && <span className="et-badge">{nbFiltres}</span>}
        </button>
      </form>

      {filtresOuverts && (
        <div id="filtres" className="et-filtres cs-card">
          <label className="cs-field"><span>{t('off.prix')}</span>
            <select value={f.prixMax} onChange={(e) => changer('prixMax', e.target.value)}>
              {PRIX_MAX.map((p) => <option key={p} value={p}>{p ? `≤ ${dt(p)}` : t('off.tous')}</option>)}
            </select></label>
          <label className="cs-field"><span>{t('off.distance')}</span>
            <select value={f.distanceMax} onChange={(e) => changer('distanceMax', e.target.value)}>
              {DISTANCES.map((d) => <option key={d} value={d}>{d ? `≤ ${distance(Number(d))}` : t('off.tous')}</option>)}
            </select></label>
          <label className="cs-field"><span>{t('off.creneau')}</span>
            <select value={f.creneau} onChange={(e) => changer('creneau', e.target.value)}>
              {CRENEAUX.map((c) => <option key={c} value={c}>{c ? t(`off.creneau.${c}`) : t('off.tous')}</option>)}
            </select></label>
          <label className="cs-field"><span>{t('off.regime')}</span>
            <select value={f.regime} onChange={(e) => changer('regime', e.target.value)}>
              <option value="">{t('off.tous')}</option>
              {Object.entries(REGIMES).map(([code, l]) => <option key={code} value={code}>{l}</option>)}
            </select></label>
          <label className="cs-field"><span>{t('off.type')}</span>
            <select value={f.type} onChange={(e) => changer('type', e.target.value)}>
              <option value="">{t('off.tous')}</option>
              {Object.entries(TYPES).map(([code, l]) => <option key={code} value={code}>{l}</option>)}
            </select></label>
          <div className="et-position">
            <button type="button" className="cs-btn" onClick={maPosition}><Icone nom="cible" taille={18} /> {t('off.maPosition')}</button>
            <span className="cs-sub">{position ? t('off.positionMoi') : t('off.positionEssect')}</span>
          </div>
          {erreurPosition && <p className="cs-sub et-plein">{erreurPosition}</p>}
        </div>
      )}

      <div className="et-barre">
        <div className="et-chips" role="group" aria-label="Catégories">
          <button type="button" className={f.cat === '' ? 'actif' : ''} aria-pressed={f.cat === ''} onClick={() => changer('cat', '')}>{t('off.toutes')}</button>
          {Object.entries(CATEGORIES_AFFICHAGE).map(([code, c]) => (
            <button type="button" key={code} className={f.cat === code ? 'actif' : ''} aria-pressed={f.cat === code} onClick={() => changer('cat', code)}>
              <Icone nom={code} taille={18} /> {c.label}
            </button>
          ))}
        </div>
        <div className="et-vues" role="group" aria-label="Affichage">
          <button type="button" aria-pressed={vue === 'liste'} className={vue === 'liste' ? 'actif' : ''} onClick={() => changer('vue', '')}><Icone nom="liste" taille={18} /> {t('off.liste')}</button>
          <button type="button" aria-pressed={vue === 'carte'} className={vue === 'carte' ? 'actif' : ''} onClick={() => changer('vue', 'carte')}><Icone nom="carte" taille={18} /> {t('off.carte')}</button>
        </div>
      </div>

      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {chargement && !offres && <p className="cs-empty">{t('commun.chargement')}</p>}

      {offres && offres.length === 0 && (
        <div className="cs-card cs-empty">
          {filtresActifs ? t('off.aucune') : t('off.vide')}
          {filtresActifs && <div><button type="button" className="cs-btn et-mt" onClick={effacer}>{t('off.effacer')}</button></div>}
        </div>
      )}

      {vue === 'carte' && offres && <Suspense fallback={<p className="cs-empty">Chargement de la carte…</p>}><CarteOffres offres={offres} position={position} /></Suspense>}

      {vue === 'liste' && (
        <div className="et-grille">
          {offres?.map((o) => {
            const fin = finDans(o.heureFinRecuperation)
            return (
              <Link key={o.id} to={`/offres/${o.id}`} className="et-carte">
                <Cloche code={o.categorie} photoUrl={o.photoUrl} remise={reduction(o)} />
                <div className="et-corps">
                  <div className="et-carte-tete">
                    <span className="et-commerce">{o.commerce?.nom}</span>
                    <CoeurFavori commerce={o.commerce} />
                  </div>
                  <h2 className="et-titre">{o.titre}</h2>
                  <div className="et-prix">
                    <b>{dt(o.prixReduit)}</b>
                    <s>{dt(o.prixInitial)}</s>
                    <Note valeur={o.commerce?.noteMoyenne} nb={o.commerce?.nbAvis} petit />
                  </div>
                  <div className="et-infos">
                    <span><Icone nom="horloge" taille={16} /> {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                    {o.distanceKm != null && <span><Icone nom="lieu" taille={16} /> {distance(o.distanceKm)}</span>}
                    {fin && <span className={`et-fin${fin.urgent ? ' urgent' : ''}`}>{t('off.finDans', { temps: fin.texte })}</span>}
                    <span>{t('off.restantes', { n: o.quantiteDisponible })}</span>
                  </div>
                  {o.regimes?.length > 0 && (
                    <div className="et-regimes">{o.regimes.map((r) => <span key={r}>{REGIMES[r] || r}</span>)}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
