// État du service : le site répond-il, l'API répond-elle, en combien de temps
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useTitre } from '../../hooks'
import { USE_MOCK, API_URL } from '../../config/constants'

export default function Statut() {
  useTitre('État du service')
  const [api_, setApi] = useState({ etat: 'verif' })
  useEffect(() => {
    const debut = performance.now()
    api.sante()
      .then((r) => setApi({ etat: 'ok', ms: Math.round(performance.now() - debut), heure: r.time }))
      .catch((e) => setApi({ etat: 'ko', erreur: e.message }))
  }, [])
  const lignes = [
    ['Site web', 'ok', 'En ligne'],
    ['API CampusSave', api_.etat, api_.etat === 'ok' ? `Répond en ${api_.ms} ms` : api_.etat === 'ko' ? `Injoignable (${api_.erreur})` : 'Vérification…'],
    ['Paiement Konnect', USE_MOCK ? 'warn' : api_.etat, USE_MOCK ? 'Mode démo : paiement simulé' : 'Vérifié à chaque paiement'],
  ]
  return (
    <div className="pub-page">
      <h1>État du service</h1>
      <p className="cs-sub">{USE_MOCK ? 'Mode démo (données fictives, aucun serveur).' : `Serveur : ${API_URL}`}</p>
      <ul className="statut">
        {lignes.map(([nom, etat, texte]) => (
          <li key={nom} className={`statut-${etat}`}><span className="statut-point" aria-hidden="true" /><b>{nom}</b><span>{texte}</span></li>
        ))}
      </ul>
    </div>
  )
}
