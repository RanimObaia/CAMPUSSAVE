// Page « Installer l'application » : application Android (APK), site installable sur téléphone (PWA),
// et un QR code pour ouvrir cette page directement sur son téléphone.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useTitre } from '../../hooks'
import { useInstallation } from '../../components/useInstallation'

// Adresse de l'APK : variable VITE_APK_URL (ex. une release GitHub), sinon le fichier /campussave.apk
// déposé dans web/public. Le bouton n'apparaît que si le fichier existe vraiment.
const APK_URL = import.meta.env.VITE_APK_URL || '/campussave.apk'

function useApkDisponible() {
  const [dispo, setDispo] = useState(false)
  useEffect(() => {
    let annule = false
    if (import.meta.env.VITE_APK_URL) { setDispo(true); return undefined }
    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => { if (!annule) setDispo(r.ok && !(r.headers.get('content-type') || '').includes('text/html')) })
      .catch(() => {})
    return () => { annule = true }
  }, [])
  return dispo
}

export default function Application() {
  useTitre('Installer l\'application', 'Installe CampusSave sur ton téléphone : application Android ou site installable.')
  const { possible, installee, installer } = useInstallation()
  const apk = useApkDisponible()
  const adresse = typeof window !== 'undefined' ? `${window.location.origin}/application` : ''

  return (
    <div className="pub-page">
      <h1>CampusSave sur ton téléphone</h1>
      <p className="pub-lead">Réserve tes paniers anti-gaspi et montre ton QR code au comptoir, directement depuis ton téléphone.</p>

      <section className="cs-card app-bloc">
        <h2>Application Android</h2>
        {apk ? (
          <>
            <p>Télécharge l'application, ouvre le fichier puis autorise l'installation depuis cette source si Android te le demande.</p>
            <div className="cs-actions">
              <a className="cs-btn primary" href={APK_URL} download>Télécharger l'application (APK)</a>
            </div>
          </>
        ) : (
          <p>Le fichier de l'application Android sera disponible ici très bientôt. En attendant, installe le site comme une application (ci-dessous).</p>
        )}
      </section>

      <section className="cs-card app-bloc">
        <h2>Installer le site comme une application</h2>
        {installee ? (
          <p>CampusSave est déjà installée sur cet appareil. Retrouve-la sur ton écran d'accueil.</p>
        ) : possible ? (
          <>
            <p>Un seul clic : CampusSave s'ajoute à ton écran d'accueil et s'ouvre en plein écran.</p>
            <div className="cs-actions">
              <button type="button" className="cs-btn primary" onClick={installer}>Installer l'application</button>
            </div>
          </>
        ) : (
          <ul className="app-etapes">
            <li><b>Android (Chrome)</b> : menu ⋮ puis « Installer l'application ».</li>
            <li><b>iPhone (Safari)</b> : bouton Partager puis « Sur l'écran d'accueil ».</li>
            <li><b>Ordinateur (Chrome, Edge)</b> : icône d'installation dans la barre d'adresse.</li>
          </ul>
        )}
      </section>

      <section className="cs-card app-bloc app-qr">
        <div>
          <h2>Ouvrir sur ton téléphone</h2>
          <p>Scanne ce QR code avec l'appareil photo de ton téléphone pour ouvrir cette page.</p>
        </div>
        {adresse && <QRCodeSVG value={adresse} size={132} level="M" title="QR code vers la page d'installation de CampusSave" />}
      </section>

      <div className="cs-actions">
        <Link to="/offres" className="cs-btn">Voir les offres</Link>
        <Link to="/aide" className="cs-btn">Besoin d'aide ?</Link>
      </div>
    </div>
  )
}
