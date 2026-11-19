import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { CATEGORIES } from '../../config/constants'
import { Entete } from '../../components/ui'
import { fromMillimes, toInputDateTime, toMillimes } from '../../utils/format'

const VIDE = { titre: '', description: '', categorie: 'PLATS', prixInitial: '', prixReduit: '', quantiteDisponible: 1, debutRecuperation: '', finRecuperation: '' }

// Création et modification d'une offre (règles du cahier des charges : prix réduit < prix initial, stock >= 0, fin > début).
export default function OfferForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const [f, setF] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getOffer(id).then((o) => setF({ ...o, prixInitial: fromMillimes(o.prixInitial), prixReduit: fromMillimes(o.prixReduit), debutRecuperation: toInputDateTime(o.debutRecuperation), finRecuperation: toInputDateTime(o.finRecuperation) }))
      .catch((e) => setErreur(e.message))
  }, [id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const prixInitial = toMillimes(f.prixInitial)
    const prixReduit = toMillimes(f.prixReduit)
    const quantiteDisponible = Number(f.quantiteDisponible)
    if (!(prixReduit > 0) || prixReduit >= prixInitial) return setErreur('Le prix réduit doit être positif et inférieur au prix initial.')
    if (!Number.isInteger(quantiteDisponible) || quantiteDisponible < 0) return setErreur('La quantité doit être un entier positif ou nul.')
    if (new Date(f.finRecuperation) <= new Date(f.debutRecuperation)) return setErreur("L'heure de fin doit suivre l'heure de début.")
    const data = { titre: f.titre.trim(), description: f.description, categorie: f.categorie, prixInitial, prixReduit, quantiteDisponible, debutRecuperation: new Date(f.debutRecuperation).toISOString(), finRecuperation: new Date(f.finRecuperation).toISOString() }
    setErreur(''); setEnvoi(true)
    try {
      await (id ? api.updateOffer(id, data) : api.createOffer(data))
      nav('/commercant/offres')
    } catch (err) { setErreur(err.message); setEnvoi(false) }
  }

  return (
    <>
      <Entete titre={id ? "Modifier l'offre" : 'Publier une offre'} />
      <form className="cs-form" onSubmit={submit}>
        {erreur && <div className="cs-error cs-field full" role="alert">{erreur}</div>}
        <div className="cs-field full"><label htmlFor="titre">Titre</label><input id="titre" required value={f.titre} onChange={set('titre')} /></div>
        <div className="cs-field full"><label htmlFor="desc">Description</label><textarea id="desc" rows={3} value={f.description} onChange={set('description')} /></div>
        <div className="cs-field"><label htmlFor="cat">Catégorie</label>
          <select id="cat" value={f.categorie} onChange={set('categorie')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="cs-field"><label htmlFor="qte">Quantité disponible</label><input id="qte" type="number" min="0" step="1" required value={f.quantiteDisponible} onChange={set('quantiteDisponible')} /></div>
        <div className="cs-field"><label htmlFor="pi">Prix initial (DT)</label><input id="pi" inputMode="decimal" required value={f.prixInitial} onChange={set('prixInitial')} /></div>
        <div className="cs-field"><label htmlFor="pr">Prix réduit (DT)</label><input id="pr" inputMode="decimal" required value={f.prixReduit} onChange={set('prixReduit')} /></div>
        <div className="cs-field"><label htmlFor="d">Début du retrait</label><input id="d" type="datetime-local" required value={f.debutRecuperation} onChange={set('debutRecuperation')} /></div>
        <div className="cs-field"><label htmlFor="e">Fin du retrait</label><input id="e" type="datetime-local" required value={f.finRecuperation} onChange={set('finRecuperation')} /></div>
        <div className="cs-actions cs-field full">
          <button className="cs-btn primary" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          <button type="button" className="cs-btn" onClick={() => nav('/commercant/offres')}>Annuler</button>
        </div>
      </form>
    </>
  )
}
