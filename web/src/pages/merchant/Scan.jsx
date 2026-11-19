import { useState } from 'react'
import { api } from '../../services/api'
import { Entete, Badge } from '../../components/ui'
import { dt } from '../../utils/format'

// Validation d'un retrait : saisie (ou lecteur de QR code) du code de la commande.
// Un code déjà utilisé ou invalide est refusé par l'API (QR_DEJA_UTILISE, QR_INVALIDE).
export default function Scan() {
  const [code, setCode] = useState('')
  const [res, setRes] = useState(null)
  const [erreur, setErreur] = useState('')

  async function valider(e) {
    e.preventDefault()
    setRes(null); setErreur('')
    try { setRes(await api.validateQr(code)); setCode('') } catch (err) { setErreur(err.message) }
  }

  return (
    <>
      <Entete titre="Valider un retrait" sous="Saisissez le code affiché sous le QR code de l'étudiant" />
      <form className="cs-card" onSubmit={valider} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="cs-field"><label htmlFor="code">Code de la commande</label>
          <input id="code" placeholder="CS-2048" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus /></div>
        <button className="cs-btn primary">Valider le retrait</button>
        {erreur && <div className="cs-error" role="alert">{erreur}</div>}
        {res && (
          <div className="cs-ok" role="status">
            Commande <b>{res.code}</b> remise ({dt(res.montantTotal)}) — <Badge type="commande" valeur={res.statut} />
          </div>
        )}
      </form>
    </>
  )
}
