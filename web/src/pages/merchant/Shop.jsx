import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { TYPES_COMMERCE } from '../../config/constants'
import { Entete, Badge } from '../../components/ui'

export default function Shop() {
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => { api.getMyShop().then(setF).catch((e) => setErreur(e.message)) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMsg(''); setErreur('')
    try { setF(await api.saveShop({ ...f, latitude: Number(f.latitude), longitude: Number(f.longitude) })); setMsg('Commerce enregistré.') } catch (err) { setErreur(err.message) }
  }

  if (!f) return <>{erreur ? <div className="cs-error" role="alert">{erreur}</div> : <p className="cs-empty">Chargement…</p>}</>
  return (
    <>
      <Entete titre="Mon commerce" sous={<>Statut : <Badge type="commerce" valeur={f.statutValidation} /></>} />
      {f.statutValidation !== 'VALIDE' && <div className="cs-error">Vous pourrez publier des offres une fois votre commerce validé par l'administrateur.</div>}
      <form className="cs-form" onSubmit={submit}>
        {erreur && <div className="cs-error cs-field full" role="alert">{erreur}</div>}
        {msg && <div className="cs-ok cs-field full" role="status">{msg}</div>}
        <div className="cs-field"><label htmlFor="nom">Nom</label><input id="nom" required value={f.nom} onChange={set('nom')} /></div>
        <div className="cs-field"><label htmlFor="type">Type</label>
          <select id="type" value={f.type} onChange={set('type')}>{TYPES_COMMERCE.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="cs-field full"><label htmlFor="adr">Adresse</label><input id="adr" required value={f.adresse} onChange={set('adresse')} /></div>
        <div className="cs-field"><label htmlFor="lat">Latitude</label><input id="lat" type="number" step="any" required value={f.latitude} onChange={set('latitude')} /></div>
        <div className="cs-field"><label htmlFor="lng">Longitude</label><input id="lng" type="number" step="any" required value={f.longitude} onChange={set('longitude')} /></div>
        <div className="cs-field full"><label htmlFor="hor">Horaires d'ouverture</label><input id="hor" value={f.horaires || ''} onChange={set('horaires')} /></div>
        <div className="cs-field full"><label htmlFor="d">Description</label><textarea id="d" rows={3} value={f.description || ''} onChange={set('description')} /></div>
        <div className="cs-field full"><button className="cs-btn primary">Enregistrer</button></div>
      </form>
    </>
  )
}
