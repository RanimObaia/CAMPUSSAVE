// Lecteur de QR code par la caméra (téléphone ou ordinateur). Appelle onCode(texte) à chaque QR code lu.
// Pendant "pause", la caméra reste allumée mais plus aucun code n'est lu.
// La caméra du navigateur exige https (ou localhost) : sinon on propose la photo ou la saisie du code.
import { useEffect, useRef, useState } from 'react'

function texteErreur(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return "Autorisez l'accès à la caméra dans votre navigateur, puis réessayez."
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'Aucune caméra détectée sur cet appareil.'
  if (err?.name === 'NotReadableError') return 'La caméra est utilisée par une autre application.'
  return 'Impossible de démarrer la caméra.'
}

export default function ScannerQr({ onCode, pause = false }) {
  const video = useRef(null)
  const canevas = useRef(null)
  const flux = useRef(null)
  const surCode = useRef(onCode)
  const enPause = useRef(pause)
  const [etat, setEtat] = useState('demarrage') // demarrage | actif | erreur | arret
  const [message, setMessage] = useState('')
  const [essai, setEssai] = useState(0)
  const [arret, setArret] = useState(false)

  useEffect(() => { surCode.current = onCode }, [onCode])
  useEffect(() => { enPause.current = pause }, [pause])

  useEffect(() => {
    if (arret) { setEtat('arret'); return undefined }
    let annule = false
    let image = 0
    setEtat('demarrage'); setMessage('')

    async function lancer() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEtat('erreur')
        setMessage("La caméra n'est pas accessible sur cette adresse (elle demande https). Prenez une photo du QR code ou saisissez le code.")
        return
      }
      try {
        const f = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false })
        if (annule) { f.getTracks().forEach((t) => t.stop()); return }
        flux.current = f
        const v = video.current
        v.srcObject = f
        await v.play()
        const { default: jsQR } = await import('jsqr')
        if (annule) return
        setEtat('actif')
        const c = canevas.current
        const ctx = c.getContext('2d', { willReadFrequently: true })
        let dernier = 0
        const boucle = (t) => {
          image = requestAnimationFrame(boucle)
          if (enPause.current || t - dernier < 120 || v.readyState < 2 || !v.videoWidth) return
          dernier = t
          const echelle = Math.min(1, 640 / v.videoWidth)
          c.width = Math.round(v.videoWidth * echelle)
          c.height = Math.round(v.videoHeight * echelle)
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const lu = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'dontInvert' })
          if (lu?.data) surCode.current(lu.data)
        }
        image = requestAnimationFrame(boucle)
      } catch (err) {
        if (!annule) { setEtat('erreur'); setMessage(texteErreur(err)) }
      }
    }
    lancer()
    return () => {
      annule = true
      cancelAnimationFrame(image)
      flux.current?.getTracks().forEach((t) => t.stop())
      flux.current = null
    }
  }, [essai, arret])

  // Plan B : lire le QR code sur une photo (appareil photo du téléphone ou fichier)
  async function lirePhoto(e) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    try {
      const [{ default: jsQR }, bitmap] = await Promise.all([import('jsqr'), createImageBitmap(fichier)])
      const c = document.createElement('canvas')
      const echelle = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
      c.width = Math.round(bitmap.width * echelle)
      c.height = Math.round(bitmap.height * echelle)
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(bitmap, 0, 0, c.width, c.height)
      const lu = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height)
      if (lu?.data) surCode.current(lu.data)
      else setMessage('Aucun QR code lisible sur cette photo. Rapprochez-vous et réessayez.')
    } catch {
      setMessage("Impossible de lire cette photo.")
    }
  }

  return (
    <div className="scan-lecteur">
      <div className="scan-video">
        <video ref={video} playsInline muted aria-label="Image de la caméra pour scanner le QR code" />
        <canvas ref={canevas} hidden />
        {etat === 'actif' && <div className="scan-cadre" aria-hidden="true" />}
        {etat !== 'actif' && (
          <p className="scan-etat" role="status">
            {etat === 'demarrage' && 'Démarrage de la caméra…'}
            {etat === 'arret' && 'Caméra arrêtée.'}
            {etat === 'erreur' && message}
          </p>
        )}
      </div>
      <div className="scan-actions">
        {arret
          ? <button type="button" className="cs-btn primary" onClick={() => setArret(false)}>Allumer la caméra</button>
          : etat === 'erreur'
            ? <button type="button" className="cs-btn" onClick={() => setEssai((n) => n + 1)}>Réessayer</button>
            : <button type="button" className="cs-btn" onClick={() => setArret(true)}>Arrêter la caméra</button>}
        <label className="cs-btn scan-photo">
          Photo du QR code
          <input type="file" accept="image/*" capture="environment" onChange={lirePhoto} hidden />
        </label>
      </div>
      {etat === 'actif' && message && <p className="cs-sub" role="status">{message}</p>}
    </div>
  )
}
