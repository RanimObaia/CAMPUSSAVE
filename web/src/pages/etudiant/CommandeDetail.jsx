// Détail d'une commande : articles, total, retrait et QR code à présenter au commerçant
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'
import { heure } from '../../utils/categories'

export default function CommandeDetail() {
  const { id } = useParams()
  const { data: c, erreur, chargement } = useChargement(() => api.getCommande(id), [id])

  if (erreur) {
    return (
      <>
        <Link to="/commandes" className="et-retour">← Mes commandes</Link>
        <div className="cs-error" role="alert">{erreur}</div>
      </>
    )
  }
  if (chargement || !c) return <p className="cs-empty">Chargement…</p>

  const aRetirer = c.statut === 'PAYEE' || c.statut === 'PRETE'

  return (
    <>
      <Link to="/commandes" className="et-retour">← Mes commandes</Link>

      <div className="et-panier">
        <div className="cs-card et-detail-commande">
          <div className="cs-top">
            <div>
              <h1>Commande {c.code}</h1>
              <p className="cs-sub">Passée le {dateHeure(c.createdAt)}</p>
            </div>
            <Badge type="commande" valeur={c.statut} />
          </div>

          <table>
            <thead><tr><th>Article</th><th>Quantité</th><th>Prix unitaire</th><th>Sous-total</th></tr></thead>
            <tbody>
              {c.lignes.map((l) => (
                <tr key={l.offreId || l.titre}>
                  <td>{l.titre}</td><td>{l.quantite}</td><td>{dt(l.prixUnitaire)}</td><td>{dt(l.prixUnitaire * l.quantite)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="et-resume-ligne et-total"><span>Total payé</span><b>{dt(c.montantTotal)}</b></div>

          <dl className="et-liste-infos">
            <div><dt>Commerce</dt><dd>{c.commerce?.nom}</dd></div>
            <div><dt>Adresse</dt><dd>{c.commerce?.adresse}</dd></div>
            {c.heureDebutRecuperation && (
              <div><dt>Retrait</dt><dd>de {heure(c.heureDebutRecuperation)} à {heure(c.heureFinRecuperation)}</dd></div>
            )}
            {c.paiement?.reference && <div><dt>Paiement</dt><dd>Réf. {c.paiement.reference}</dd></div>}
          </dl>
        </div>

        <aside className="cs-card et-qr">
          {aRetirer && (
            <>
              <h2>Ton QR code</h2>
              <div className="et-qr-code">
                <QRCodeSVG value={c.code} size={200} level="M" title={`QR code de la commande ${c.code}`} />
              </div>
              <p className="et-qr-texte">{c.code}</p>
              <p className="cs-sub et-petit">Montre-le au commerçant. Il le scanne et la commande est remise.</p>
            </>
          )}
          {c.statut === 'RECUPEREE' && <><div className="et-rond et-rond-ok" aria-hidden="true">✓</div><h2>Commande récupérée</h2><p className="cs-sub">Bon appétit !</p></>}
          {c.statut === 'EN_ATTENTE_PAIEMENT' && <><h2>Paiement en attente</h2><p className="cs-sub">Le QR code apparaîtra dès que le paiement sera confirmé.</p></>}
          {c.statut === 'ANNULEE' && <><div className="et-rond et-rond-ko" aria-hidden="true">✕</div><h2>Commande annulée</h2><p className="cs-sub">Le paiement n'a pas abouti. Aucun montant n'a été débité.</p></>}
        </aside>
      </div>
    </>
  )
}
