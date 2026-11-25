import { useState } from 'react'
import { api } from '../../services/api'
import { useTitre } from '../../hooks'
import { Entete, Badge } from '../../components/ui'
import ScannerQr from '../../components/ScannerQr'
import { dt } from '../../utils/format'

// Validation d'un retrait : on scanne le QR code de l'étudiant avec la caméra (téléphone ou ordinateur),
// ou on saisit le code écrit sous le QR code. Un code déjà utilisé ou invalide est refusé par l'API
// (QR_DEJA_UTILISE, QR_INVALIDE).
export default function Scan() {
  useTitre('Valider un retrait')
  const [code, setCode] = useState('')
  const [res, setRes] = useState(null)
  const [erreur, setErreur] = useState('')
  const [pause, setPause] = useState(false)
  const [enCours, setEnCours] = useState(false)

  // Le QR code d'une commande contient son code (CS-XXXXXX) : on l'extrait même s'il est entouré d'autre texte.
  async function valider(texte, depuisCamera = false) {
    const brut = String(texte).trim()
    const code = (brut.match(/CS-[A-Z0-9]+/i)?.[0] || brut).toUpperCase()
    if (!code || enCours) return
    setEnCours(true); setRes(null); setErreur('')
    if (depuisCamera) setPause(true) // on arrête de lire tant que le résultat est affiché
    try {
      setRes(await api.validateQr(code)); setCode('')
      navigator.vibrate?.(80)
    } catch (err) { setErreur(err.message) } finally { setEnCours(false) }
  }

  function suivant() { setRes(null); setErreur(''); setPause(false) }

  return (
    <>
      <Entete titre="Valider un retrait" sous="Scannez le QR code de l'étudiant, ou saisissez le code écrit dessous." />
      <div className="scan-page">
        <section className="cs-card" aria-label="Scanner le QR code">
          <ScannerQr pause={pause} onCode={(t) => valider(t, true)} />
          <div className="scan-resultat" aria-live="polite">
            {enCours && <p className="cs-sub">Vérification…</p>}
            {erreur && <div className="cs-error" role="alert">{erreur}</div>}
            {res && (
              <div className="cs-ok" role="status">
                Commande <b>{res.code}</b> remise ({dt(res.montantTotal)}) — <Badge type="commande" valeur={res.statut} />
              </div>
            )}
            {pause && !enCours && <button type="button" className="cs-btn primary" onClick={suivant}>Scanner le suivant</button>}
          </div>
        </section>

        <form className="cs-card cs-scan" onSubmit={(e) => { e.preventDefault(); valider(code) }}>
          <div className="cs-field"><label htmlFor="code">Ou saisissez le code de la commande</label>
            <input id="code" placeholder="CS-7KQ3PX" autoComplete="off" autoCapitalize="characters" spellCheck={false} required value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <button className="cs-btn primary" disabled={enCours}>Valider le retrait</button>
        </form>
      </div>
    </>
  )
}
