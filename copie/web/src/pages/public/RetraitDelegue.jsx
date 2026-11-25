// Page ouverte par l'ami à qui l'étudiant a confié son retrait (lien secret, sans connexion)
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { heure } from '../../utils/categories'

export default function RetraitDelegue() {
  const { token } = useParams()
  useTitre('Retrait d\'une commande')
  const { data: c, erreur, chargement } = useChargement(() => api.voirDelegation(token), [token])
  if (chargement) return <p className="cs-empty">Chargement…</p>
  if (erreur) return <div className="pub-page"><div className="cs-error" role="alert">{erreur}</div></div>

  return (
    <div className="pub-page delegue">
      <h1>{c.nomDelegue ? `${c.nomDelegue}, ` : ''}tu récupères la commande de {c.prenomEtudiant || 'ton ami'}</h1>
      <div className="cs-card">
        <p><b>{c.commerce?.nom}</b>, {c.commerce?.adresse}</p>
        {c.heureDebutRecuperation && <p className="cs-sub">Retrait de {heure(c.heureDebutRecuperation)} à {heure(c.heureFinRecuperation)}</p>}
        <ul>{c.lignes.map((l) => <li key={l.titre}>{l.quantite} × {l.titre}</li>)}</ul>
      </div>
      {c.code ? (
        <div className="cs-card et-qr">
          <h2>QR code à présenter</h2>
          <div className="et-qr-code"><QRCodeSVG value={c.code} size={220} level="M" title={`QR code ${c.code}`} /></div>
          <p className="et-qr-texte">{c.code}</p>
          <p className="cs-sub">Montre ce code au commerçant : il le scanne et te remet la commande.</p>
        </div>
      ) : (
        <div className="cs-card"><p>Cette commande n'est plus à retirer ({c.statut === 'RECUPEREE' ? 'déjà récupérée' : 'annulée'}).</p></div>
      )}
    </div>
  )
}
