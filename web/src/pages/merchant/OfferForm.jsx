import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { CATEGORIES, libelle } from '../../config/constants'
import { Entete } from '../../components/ui'
import { fromMillimes, toInputDateTime, toMillimes } from '../../utils/format'
import { REGIMES } from '../../utils/categories'

const VIDE = { titre: '', description: '', categorie: 'PLATS', prixInitial: '', prixReduit: '', quantiteDisponible: 1, heureDebutRecuperation: '', heureFinRecuperation: '', regimes: [], recurrente: false, photoUrl: '' }

// Création et modification d'une offre (règles du cahier des charges : prix réduit < prix initial, stock >= 0, fin > début).
export default function OfferForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const [f, setF] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getOffer(id).then((o) => setF({ ...o, prixInitial: fromMillimes(o.prixInitial), prixReduit: fromMillimes(o.prixReduit), heureDebutRecuperation: toInputDateTime(o.heureDebutRecuperation), heureFinRecuperation: toInputDateTime(o.heureFinRecuperation) }))
      .catch((e) => setErreur(e.message))
  }, [id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const basculerRegime = (r) => setF({ ...f, regimes: (f.regimes || []).includes(r) ? f.regimes.filter((x) => x !== r) : [...(f.regimes || []), r] })

  async function submit(e) {
    e.preventDefault()
    const prixInitial = toMillimes(f.prixInitial)
    const prixReduit = toMillimes(f.prixReduit)
    const quantiteDisponible = Number(f.quantiteDisponible)
    if (!(prixReduit > 0) || prixReduit >= prixInitial) return setErreur('Le prix réduit doit être positif et inférieur au prix initial.')
    if (!Number.isInteger(quantiteDisponible) || quantiteDisponible < 0) return setErreur('La quantité doit être un entier positif ou nul.')
    if (new Date(f.heureFinRecuperation) <= new Date(f.heureDebutRecuperation)) return setErreur("L'heure de fin doit suivre l'heure de début.")
    const photoUrl = (f.photoUrl || '').trim()
    if (photoUrl && !/^https:\/\/\S+$/i.test(photoUrl)) return setErreur('La photo doit être une adresse https://.')
    const data = { titre: f.titre.trim(), description: f.description, categorie: f.categorie, prixInitial, prixReduit, quantiteDisponible, heureDebutRecuperation: new Date(f.heureDebutRecuperation).toISOString(), heureFinRecuperation: new Date(f.heureFinRecuperation).toISOString(), regimes: f.regimes || [], recurrente: Boolean(f.recurrente), photoUrl }
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
          <select id="cat" value={f.categorie} onChange={set('categorie')}>{CATEGORIES.map((c) => <option key={c} value={c}>{libelle(c)}</option>)}</select></div>
        <div className="cs-field"><label htmlFor="qte">Quantité disponible</label><input id="qte" type="number" min="0" step="1" required value={f.quantiteDisponible} onChange={set('quantiteDisponible')} /></div>
        <div className="cs-field"><label htmlFor="pi">Prix initial (DT)</label><input id="pi" inputMode="decimal" required value={f.prixInitial} onChange={set('prixInitial')} /></div>
        <div className="cs-field"><label htmlFor="pr">Prix réduit (DT)</label><input id="pr" inputMode="decimal" required value={f.prixReduit} onChange={set('prixReduit')} /></div>
        <div className="cs-field"><label htmlFor="d">Début du retrait</label><input id="d" type="datetime-local" required value={f.heureDebutRecuperation} onChange={set('heureDebutRecuperation')} /></div>
        <div className="cs-field"><label htmlFor="e">Fin du retrait</label><input id="e" type="datetime-local" required value={f.heureFinRecuperation} onChange={set('heureFinRecuperation')} /></div>
        <div className="cs-field full">
          <label htmlFor="photo">Photo du produit (lien https, facultatif)</label>
          <input id="photo" type="url" inputMode="url" placeholder="https://…" value={f.photoUrl || ''} onChange={set('photoUrl')} aria-describedby="photo-aide" />
          <small id="photo-aide" className="cs-sub">Collez le lien d'une photo en ligne. Sans photo, l'offre affiche l'icône de sa catégorie.</small>
          {/^https:\/\/\S+$/i.test((f.photoUrl || '').trim()) && (
            <img src={f.photoUrl.trim()} alt="Aperçu de la photo" style={{ marginTop: 8, width: 160, height: 120, objectFit: 'cover', borderRadius: 12 }} onError={(e) => { e.currentTarget.style.display = 'none' }} onLoad={(e) => { e.currentTarget.style.display = '' }} />
          )}
        </div>
        <fieldset className="cs-field full cs-cases">
          <legend>Préférences alimentaires (les étudiants peuvent filtrer)</legend>
          {Object.entries(REGIMES).map(([code, l]) => (
            <label key={code}><input type="checkbox" checked={(f.regimes || []).includes(code)} onChange={() => basculerRegime(code)} /> {l}</label>
          ))}
        </fieldset>
        <label className="cs-field full interrupteur">
          <input type="checkbox" checked={Boolean(f.recurrente)} onChange={(e) => setF({ ...f, recurrente: e.target.checked })} />
          <span><b>Republier chaque jour</b> aux mêmes heures, avec la même quantité (vous pouvez l'arrêter à tout moment)</span>
        </label>
        <div className="cs-actions cs-field full">
          <button className="cs-btn primary" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          <button type="button" className="cs-btn" onClick={() => nav('/commercant/offres')}>Annuler</button>
        </div>
      </form>
    </>
  )
}
