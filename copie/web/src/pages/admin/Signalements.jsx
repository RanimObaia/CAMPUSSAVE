// Signalements des étudiants : l'administrateur répond et clôt chaque demande
import { useState } from 'react'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Entete } from '../../components/ui'
import { dateHeure } from '../../utils/format'

const MOTIFS = { QUALITE: 'Qualité', QUANTITE: 'Quantité', COMMERCE_FERME: 'Commerce fermé', PAIEMENT: 'Paiement', AUTRE: 'Autre' }
const STATUTS = { OUVERT: ['À traiter', 'warn'], TRAITE: ['Traité', 'ok'], REJETE: ['Rejeté', ''] }

export default function Signalements() {
  useTitre('Signalements')
  const [filtre, setFiltre] = useState('OUVERT')
  const { data, erreur, recharger } = useChargement(() => api.adminSignalements(filtre), [filtre])
  const [reponses, setReponses] = useState({})

  async function traiter(s, statut) {
    await api.traiterSignalement(s.id, statut, reponses[s.id] || '')
    recharger()
  }

  return (
    <>
      <Entete titre="Signalements" sous="Réclamations des étudiants sur une commande ou un commerce." action={
        <select className="et-select" value={filtre} onChange={(e) => setFiltre(e.target.value)} aria-label="Filtrer">
          <option value="OUVERT">À traiter</option><option value="TRAITE">Traités</option><option value="REJETE">Rejetés</option><option value="">Tous</option>
        </select>
      } />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {data?.length === 0 && <div className="cs-card cs-empty">Aucun signalement.</div>}
      <ul className="signalements">
        {data?.map((s) => (
          <li key={s.id} className="cs-card">
            <div className="cs-top">
              <div>
                <h2>{MOTIFS[s.motif] || s.motif} · {s.codeCommande || 'sans commande'}</h2>
                <p className="cs-sub">{dateHeure(s.date)} · {s.emailEtudiant} {s.commerce?.nom && `· ${s.commerce.nom}`}</p>
              </div>
              <span className={`cs-badge ${STATUTS[s.statut]?.[1]}`}>{STATUTS[s.statut]?.[0]}</span>
            </div>
            <p>{s.message}</p>
            {s.reponse && <p className="cs-ok">Réponse : {s.reponse}</p>}
            {s.statut === 'OUVERT' && (
              <div className="signalement-reponse">
                <div className="cs-field"><label htmlFor={`r-${s.id}`}>Réponse à l'étudiant</label>
                  <textarea id={`r-${s.id}`} value={reponses[s.id] || ''} onChange={(e) => setReponses({ ...reponses, [s.id]: e.target.value })} placeholder="Ex. : remboursement validé, le commerce a été averti." /></div>
                <div className="cs-actions">
                  <button type="button" className="cs-btn primary" onClick={() => traiter(s, 'TRAITE')}>Marquer traité</button>
                  <button type="button" className="cs-btn danger" onClick={() => traiter(s, 'REJETE')}>Rejeter</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
