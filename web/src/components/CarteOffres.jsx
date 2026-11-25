// Carte des commerces (OpenStreetMap + Leaflet) : un repère par commerce avec ses offres,
// le campus ESSECT, et la position de l'étudiant s'il l'a partagée.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dt } from '../utils/format'
import { distance, heure } from '../utils/categories'
import { Note } from './Etoiles'

const ESSECT = { lat: 36.7907, lng: 10.1786 }

const repere = (html, classe) => L.divIcon({ html, className: `carte-repere ${classe}`, iconSize: [40, 46], iconAnchor: [20, 44] })

export default function CarteOffres({ offres, position, hauteur = 460 }) {
  const div = useRef(null)
  const carte = useRef(null)
  const couche = useRef(null)
  const [choisi, setChoisi] = useState(null)

  // Offres regroupées par commerce (un seul repère par adresse)
  const commerces = useMemo(() => {
    const parId = new Map()
    for (const o of offres) {
      if (o.commerce?.latitude == null) continue
      const c = parId.get(o.commerce.id) || { ...o.commerce, distanceKm: o.distanceKm, offres: [] }
      c.offres.push(o)
      parId.set(o.commerce.id, c)
    }
    return [...parId.values()]
  }, [offres])

  useEffect(() => {
    if (carte.current || !div.current) return undefined
    carte.current = L.map(div.current, { scrollWheelZoom: false }).setView([ESSECT.lat, ESSECT.lng], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(carte.current)
    L.marker([ESSECT.lat, ESSECT.lng], { icon: repere('<span>ESSECT</span>', 'carte-campus'), title: 'Campus ESSECT' }).addTo(carte.current)
    couche.current = L.layerGroup().addTo(carte.current)
    return () => { carte.current.remove(); carte.current = null }
  }, [])

  useEffect(() => {
    if (!couche.current) return
    couche.current.clearLayers()
    const points = [[ESSECT.lat, ESSECT.lng]]
    for (const c of commerces) {
      const m = L.marker([c.latitude, c.longitude], {
        icon: repere(`<b>${c.offres.length}</b>`, 'carte-commerce'),
        title: c.nom,
        keyboard: true,
      })
      m.on('click', () => setChoisi(c))
      m.addTo(couche.current)
      points.push([c.latitude, c.longitude])
    }
    if (position) {
      L.circleMarker([position.lat, position.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#2f6fdf', fillOpacity: 1 })
        .bindTooltip('Toi')
        .addTo(couche.current)
      points.push([position.lat, position.lng])
    }
    if (points.length > 1) carte.current.fitBounds(points, { padding: [40, 40], maxZoom: 17 })
  }, [commerces, position])

  return (
    <div className="carte-bloc">
      <div ref={div} className="carte" style={{ height: hauteur }} role="region" aria-label="Carte des commerces" />
      {choisi ? (
        <div className="cs-card carte-fiche">
          <div className="carte-fiche-tete">
            <div>
              <h2>{choisi.nom}</h2>
              <p className="cs-sub">{choisi.adresse}{choisi.distanceKm != null && ` · ${distance(choisi.distanceKm)}`}</p>
            </div>
            <Note valeur={choisi.noteMoyenne} nb={choisi.nbAvis} />
          </div>
          <ul className="carte-offres">
            {choisi.offres.map((o) => (
              <li key={o.id}>
                <Link to={`/offres/${o.id}`}>
                  <span>{o.titre}</span>
                  <span className="cs-sub">{heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                  <b>{dt(o.prixReduit)}</b>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="cs-btn" onClick={() => setChoisi(null)}>Fermer</button>
        </div>
      ) : (
        <p className="cs-sub carte-aide">Touche un repère pour voir les offres du commerce. Le chiffre indique le nombre d'offres.</p>
      )}
      {/* Accès clavier et lecteur d'écran : la même information en liste */}
      <ul className="sr-only">
        {commerces.map((c) => <li key={c.id}>{c.nom} : {c.offres.length} offre(s){c.distanceKm != null && `, à ${distance(c.distanceKm)}`}</li>)}
      </ul>
    </div>
  )
}
