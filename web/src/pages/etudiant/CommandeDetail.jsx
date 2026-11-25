// Détail d'une commande : articles, total, retrait, QR code (plein écran au comptoir),
// délégation à un ami, avis après le retrait, signalement d'un problème.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'
import { heure } from '../../utils/categories'
import QrPleinEcran, { Glisser } from '../../components/QrPleinEcran'
import { ChoixEtoiles } from '../../components/Etoiles'
import Icone from '../../components/Icone'

const MOTIFS = {
  QUALITE: 'Produit de mauvaise qualité',
  QUANTITE: 'Quantité incomplète',
  COMMERCE_FERME: 'Commerce fermé pendant le créneau',
  PAIEMENT: 'Problème de paiement',
  AUTRE: 'Autre',
}

export default function CommandeDetail() {
  const { id } = useParams()
  const { data: c, erreur, chargement, recharger } = useChargement(() => api.getCommande(id), [id])
  useTitre(c ? `Commande ${c.code}` : 'Commande')
  const [plein, setPlein] = useState(false)

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
      {plein && <QrPleinEcran commande={c} onFermer={() => setPlein(false)} />}

      <div className="et-panier">
        <div className="et-colonne">
          <div className="cs-card et-detail-commande">
            <div className="cs-top">
              <div>
                <h1>Commande {c.code}</h1>
                <p className="cs-sub">Passée le {dateHeure(c.dateCommande)}</p>
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
            <div className="et-resume-ligne et-total"><span>{c.statut === 'ANNULEE' ? 'Total (non débité)' : 'Total payé'}</span><b>{dt(c.montantTotal)}</b></div>

            <dl className="et-liste-infos">
              <div><dt>Commerce</dt><dd>{c.commerce?.nom}</dd></div>
              <div><dt>Adresse</dt><dd>{c.commerce?.adresse}</dd></div>
              {c.heureDebutRecuperation && (
                <div><dt>Retrait</dt><dd>de {heure(c.heureDebutRecuperation)} à {heure(c.heureFinRecuperation)}</dd></div>
              )}
              {c.paiement?.reference && <div><dt>Paiement</dt><dd>Réf. {c.paiement.reference}{c.paiement.statut === 'ECHOUE' && ' · refusé'}</dd></div>}
              {(c.emailEnvoye || c.emailEchecEnvoye) && (
                <div><dt>E-mail</dt><dd>{c.emailEnvoye ? 'Confirmation envoyée' : '« Paiement non abouti » envoyé'}{c.emailEtudiant && ` à ${c.emailEtudiant}`}</dd></div>
              )}
            </dl>
          </div>

          {aRetirer && <Delegation commande={c} onChange={recharger} />}
          {c.statut === 'RECUPEREE' && !c.avisDonne && <Avis commande={c} onFini={recharger} />}
          {c.statut === 'RECUPEREE' && c.avisDonne && <p className="cs-ok">Merci pour ton avis sur {c.commerce?.nom} !</p>}
          <Signalement commande={c} />
        </div>

        <aside className="cs-card et-qr">
          {aRetirer && (
            <>
              <h2>Ton QR code</h2>
              <div className="et-qr-code">
                <QRCodeSVG value={c.code} size={200} level="M" title={`QR code de la commande ${c.code}`} />
              </div>
              <p className="et-qr-texte">{c.code}</p>
              <Glisser onFini={() => setPlein(true)} />
              <button type="button" className="cs-btn et-qr-bouton" onClick={() => setPlein(true)}><Icone nom="plein" taille={18} /> Afficher en grand</button>
              <p className="cs-sub et-petit">Au comptoir, glisse le curseur : le code s'affiche en plein écran et ton écran reste allumé.</p>
            </>
          )}
          {c.statut === 'RECUPEREE' && <><div className="et-rond et-rond-ok" aria-hidden="true">✓</div><h2>Commande récupérée</h2><p className="cs-sub">Bon appétit !</p></>}
          {c.statut === 'EN_ATTENTE_PAIEMENT' && <><h2>Paiement en attente</h2><p className="cs-sub">Le QR code apparaîtra dès que le paiement sera confirmé.</p></>}
          {c.statut === 'ANNULEE' && <><div className="et-rond et-rond-ko" aria-hidden="true">✕</div><h2>Commande annulée</h2><p className="cs-sub">{c.motifAnnulation === 'PAIEMENT_EXPIRE' ? 'Le délai de paiement est dépassé.' : "Le paiement n'a pas abouti."} Aucun montant n'a été débité.</p></>}
        </aside>
      </div>
    </>
  )
}

// Confier le retrait à un ami : lien secret à partager
function Delegation({ commande, onChange }) {
  const [nom, setNom] = useState('')
  const [lien, setLien] = useState(commande.delegation?.token ? `${window.location.origin}/retrait/${commande.delegation.token}` : '')
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState('')

  async function creer(e) {
    e.preventDefault()
    setErreur('')
    try {
      const r = await api.deleguer(commande.id, nom)
      setLien(r.lien)
    } catch (err) { setErreur(err.message) }
  }
  async function partager() {
    const texte = `Tu peux récupérer ma commande CampusSave chez ${commande.commerce?.nom} : ${lien}`
    if (navigator.share) { navigator.share({ title: 'Retrait CampusSave', text: texte, url: lien }).catch(() => {}); return }
    try { await navigator.clipboard.writeText(lien); setCopie(true) } catch { setCopie(false) }
  }
  async function annuler() {
    await api.annulerDelegation(commande.id)
    setLien('')
    onChange()
  }

  return (
    <details className="cs-card et-encart" open={Boolean(lien)}>
      <summary><Icone nom="partage" taille={18} /> Confier le retrait à un ami</summary>
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {!lien ? (
        <form onSubmit={creer} className="et-encart-form">
          <p className="cs-sub">Tu ne peux pas y aller ? Crée un lien : ton ami y verra le QR code à présenter.</p>
          <div className="cs-field"><label htmlFor="ami">Prénom de ton ami (facultatif)</label><input id="ami" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} /></div>
          <button className="cs-btn primary">Créer le lien</button>
        </form>
      ) : (
        <div className="et-encart-form">
          <div className="cs-field"><label htmlFor="lien">Lien à envoyer</label><input id="lien" readOnly value={lien} onFocus={(e) => e.target.select()} /></div>
          <div className="cs-actions">
            <button type="button" className="cs-btn primary" onClick={partager}>{navigator.share ? 'Partager' : 'Copier le lien'}</button>
            <a className="cs-btn" href={`https://wa.me/?text=${encodeURIComponent(`Récupère ma commande CampusSave : ${lien}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <button type="button" className="cs-btn danger" onClick={annuler}>Annuler le lien</button>
          </div>
          {copie && <p className="cs-ok" role="status">Lien copié.</p>}
        </div>
      )}
    </details>
  )
}

// Noter le commerce après le retrait
function Avis({ commande, onFini }) {
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState('')
  async function envoyer(e) {
    e.preventDefault()
    if (!note) { setErreur('Choisis une note de 1 à 5.'); return }
    try { await api.donnerAvis(commande.id, { note, commentaire }); onFini() } catch (err) { setErreur(err.message) }
  }
  return (
    <form className="cs-card et-encart et-encart-form" onSubmit={envoyer}>
      <h2>Comment était ta commande chez {commande.commerce?.nom} ?</h2>
      <ChoixEtoiles valeur={note} onChange={setNote} />
      <div className="cs-field"><label htmlFor="com">Commentaire (facultatif)</label>
        <textarea id="com" maxLength={500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Quantité, fraîcheur, accueil…" /></div>
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <button className="cs-btn primary">Publier mon avis</button>
    </form>
  )
}

// Signaler un problème (réclamation traitée par l'administration)
function Signalement({ commande }) {
  const [motif, setMotif] = useState('QUALITE')
  const [message, setMessage] = useState('')
  const [etat, setEtat] = useState({ ok: false, erreur: '' })
  async function envoyer(e) {
    e.preventDefault()
    try {
      await api.signaler({ commandeId: commande.id, motif, message })
      setEtat({ ok: true, erreur: '' })
    } catch (err) { setEtat({ ok: false, erreur: err.message }) }
  }
  if (etat.ok) return <p className="cs-ok" role="status">Signalement envoyé. L'équipe te répond sous 72 heures (notification et Paramètres).</p>
  return (
    <details className="cs-card et-encart">
      <summary><Icone nom="drapeau" taille={18} /> Signaler un problème</summary>
      <form className="et-encart-form" onSubmit={envoyer}>
        <div className="cs-field"><label htmlFor="motif">Motif</label>
          <select id="motif" value={motif} onChange={(e) => setMotif(e.target.value)}>{Object.entries(MOTIFS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="cs-field"><label htmlFor="msg">Décris le problème</label>
          <textarea id="msg" required minLength={10} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        {etat.erreur && <div className="cs-error" role="alert">{etat.erreur}</div>}
        <button className="cs-btn primary">Envoyer</button>
        <p className="cs-sub et-petit"><Link to="/legal/annulation">Règles d'annulation et de remboursement</Link></p>
      </form>
    </details>
  )
}
