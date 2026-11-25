// Statistiques du commerçant : 14 derniers jours, repas sauvés, taux de retrait, note, meilleures offres
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Entete, Stat } from '../../components/ui'
import { dt } from '../../utils/format'
import { note } from '../../utils/categories'

const jourCourt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })

export default function Statistiques() {
  useTitre('Statistiques')
  const { data: s, erreur } = useChargement(() => api.merchantStatsDetail())
  const max = Math.max(1, ...(s?.parJour || []).map((j) => j.commandes))
  return (
    <>
      <Entete titre="Statistiques" sous="L'impact de votre commerce sur CampusSave." />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <div className="cs-grid">
        <Stat label="Repas sauvés" valeur={s?.repasSauves ?? '—'} note={s ? `≈ ${s.co2Evite} kg de CO₂ évités` : ''} />
        <Stat label="Chiffre d'affaires (14 j)" valeur={s ? dt(s.chiffreAffaires) : '—'} />
        <Stat label="Taux de retrait" valeur={s ? `${s.tauxRetrait} %` : '—'} note="commandes récupérées" />
        <Stat label="Note moyenne" valeur={s?.noteMoyenne != null ? `${note(s.noteMoyenne)} / 5` : '—'} note={s ? `${s.nbAvis} avis` : ''} />
      </div>

      <section className="cs-card stats-graphique">
        <h2>Commandes payées par jour</h2>
        <p className="cs-sub">{s ? `${s.commandes} commandes sur les 14 derniers jours` : ''}</p>
        <div className="barres" role="img" aria-label={(s?.parJour || []).map((j) => `${jourCourt(j.jour)} : ${j.commandes}`).join(', ')}>
          {(s?.parJour || []).map((j) => (
            <div key={j.jour} className="barre">
              <span className="barre-valeur">{j.commandes || ''}</span>
              <span className="barre-trait" style={{ height: `${(j.commandes / max) * 100}%` }} />
              <span className="barre-jour">{jourCourt(j.jour)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cs-card">
        <h2>Vos offres les plus sauvées</h2>
        <ol className="stats-top">
          {(s?.topOffres || []).map((o) => <li key={o.titre}><span>{o.titre}</span><b>{o.quantite}</b></li>)}
        </ol>
        {s?.topOffres?.length === 0 && <p className="cs-sub">Pas encore de vente.</p>}
      </section>
    </>
  )
}
