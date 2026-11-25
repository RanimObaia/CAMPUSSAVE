// Retrait sans friction : on glisse le curseur au comptoir, le QR code s'affiche en plein écran
// avec le temps restant du créneau ; l'écran reste allumé (Wake Lock) tant qu'il est affiché.
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { finDans, heure } from '../utils/categories'

export function Glisser({ onFini, texte = 'Glisse pour afficher au comptoir' }) {
  const [valeur, setValeur] = useState(0)
  return (
    <label className="glisser">
      <span className="sr-only">{texte}</span>
      <input
        type="range" min="0" max="100" value={valeur}
        onChange={(e) => {
          const v = Number(e.target.value)
          setValeur(v)
          if (v >= 92) { onFini(); setValeur(0) }
        }}
        onPointerUp={() => valeur < 92 && setValeur(0)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFini() } }}
        aria-valuetext={texte}
      />
      <span className="glisser-texte" aria-hidden="true">{texte} →</span>
    </label>
  )
}

export default function QrPleinEcran({ commande, onFermer }) {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), 15000)
    let verrou = null
    navigator.wakeLock?.request('screen').then((v) => { verrou = v }).catch(() => {})
    const echap = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => { clearInterval(minuteur); verrou?.release().catch(() => {}); window.removeEventListener('keydown', echap) }
  }, [onFermer])

  const fin = commande.heureFinRecuperation ? finDans(commande.heureFinRecuperation, maintenant) : null
  const avant = commande.heureDebutRecuperation && new Date(commande.heureDebutRecuperation).getTime() > maintenant
  return (
    <div className="qr-plein" role="dialog" aria-modal="true" aria-label={`QR code de la commande ${commande.code}`}>
      <p className="qr-plein-commerce">{commande.commerce?.nom}</p>
      <div className="qr-plein-code"><QRCodeSVG value={commande.code} size={Math.min(320, window.innerWidth - 80)} level="M" /></div>
      <p className="qr-plein-texte">{commande.code}</p>
      <p className="qr-plein-creneau">
        {avant ? `Retrait à partir de ${heure(commande.heureDebutRecuperation)}` : fin ? `Créneau : encore ${fin.texte}` : 'Créneau terminé'}
      </p>
      <ul className="qr-plein-lignes">{commande.lignes.map((l) => <li key={l.offreId || l.titre}>{l.quantite} × {l.titre}</li>)}</ul>
      <button type="button" className="cs-btn qr-plein-fermer" onClick={onFermer} autoFocus>Fermer</button>
    </div>
  )
}
