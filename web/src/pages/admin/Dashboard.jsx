// Vue globale de l'administrateur : chiffres clés, éléments à traiter, camemberts, 14 jours, meilleurs commerces
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Entete, Stat, Badge } from '../../components/ui'
import { Camembert, Courbe } from '../../components/Graphiques'
import { dt, dateHeure } from '../../utils/format'

const STATUT_CMD = {
  EN_ATTENTE_PAIEMENT: ['En attente de paiement', '#8d9a91'], PAYEE: ['Payée', 'var(--ble, #d9ad55)'], PRETE: ['Prête', '#4f8fa8'],
  RECUPEREE: ['Récupérée', 'var(--vert)'], ANNULEE: ['Annulée', 'var(--harissa)'],
}
const TYPE_COMMERCE = { RESTAURANT: 'Restaurants', CAFETERIA: 'Cafétérias', BOULANGERIE: 'Boulangeries', PATISSERIE: 'Pâtisseries' }
const CATEGORIE = { BOULANGERIE: 'Boulangerie', PLATS: 'Plats', PATISSERIE: 'Pâtisserie', BOISSONS: 'Boissons' }
const MOTIF = { QUALITE: 'Qualité', QUANTITE: 'Quantité', COMMERCE_FERME: 'Commerce fermé', PAIEMENT: 'Paiement', AUTRE: 'Autre' }

const jourCourt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
const traduire = (liste, noms) => (liste || []).map((x) => ({ libelle: noms[x.libelle] || x.libelle, valeur: x.valeur }))

export default function AdminDashboard() {
  useTitre('Vue globale')
  const { data: s, erreur } = useChargement(() => api.adminStatsDetail())
  const jours = s?.commandes.parJour || []
  const maxCmd = Math.max(1, ...jours.map((j) => j.commandes))
  const maxCa = Math.max(1, ...(s?.topCommerces || []).map((c) => c.chiffreAffaires))
  const aTraiter = s ? [
    [s.aTraiter.commercesEnAttente, 'commerce(s) à valider', '/admin/commerces'],
    [s.aTraiter.signalementsOuverts, 'signalement(s) ouvert(s)', '/admin/signalements'],
    [s.aTraiter.paiementsRefuses, 'paiement(s) refusé(s) à surveiller', '/admin/commandes'],
  ].filter(([n]) => n > 0) : []

  return (
    <>
      <Entete date titre="Vue globale" sous="Comptes, commerces, commandes et paiements de la plateforme."
        action={<Link className="cs-btn primary" to="/admin/commerces">Commerces à valider{s?.commerces.enAttente ? ` (${s.commerces.enAttente})` : ''}</Link>} />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      {s?.demo && <p className="cs-sub admin-demo">Mode démo : l'activité des 14 derniers jours est simulée pour illustrer le tableau de bord.</p>}

      {s && (
        <section className="cs-card admin-atraiter" aria-label="Éléments à traiter">
          <h2>À traiter</h2>
          {aTraiter.length === 0 ? <p className="cs-sub">Tout est à jour : rien en attente. ✓</p> : (
            <ul>{aTraiter.map(([n, texte, lien]) => (
              <li key={texte}><Link to={lien} className="admin-alerte"><b>{n}</b> {texte} →</Link></li>
            ))}</ul>
          )}
        </section>
      )}

      <div className="cs-grid admin-kpi">
        <Stat label="Utilisateurs" valeur={s?.utilisateurs.total ?? '—'}
          note={s ? `${s.utilisateurs.etudiants} étudiants · ${s.utilisateurs.commercants} commerçants` : ''} />
        <Stat label="Commerces validés" valeur={s?.commerces.valides ?? '—'}
          note={s ? `${s.commerces.enAttente} en attente · ${s.commerces.refuses} refusé(s)` : ''} />
        <Stat label="Commandes payées" valeur={s?.commandes.payees ?? '—'} note={s ? `${s.commandes.total} commandes au total` : ''} />
        <Stat label="Chiffre d'affaires" valeur={s ? dt(s.finance.volume) : '—'} note={s ? `Panier moyen ${dt(s.finance.panierMoyen)}` : ''} />
      </div>
      <div className="cs-grid admin-kpi">
        <Stat label="Repas sauvés" valeur={s?.impact.repasSauves ?? '—'} note={s ? `≈ ${s.impact.kgSauves} kg de nourriture` : ''} />
        <Stat label="CO₂ évité" valeur={s ? `${s.impact.co2Evite} kg` : '—'} note="estimation par repas sauvé" />
        <Stat label="Économies des étudiants" valeur={s ? dt(s.finance.economiesEtudiants) : '—'} note="prix initial − prix payé" />
        <Stat label="Taux de retrait" valeur={s?.tauxRetrait != null ? `${s.tauxRetrait} %` : '—'}
          note={s ? `${s.utilisateurs.nouveaux7j} nouveau(x) inscrit(s) cette semaine` : ''} />
      </div>

      {s && (
        <>
          <div className="admin-grille admin-camemberts">
            <Camembert titre="Commandes par statut" sous="Toutes les commandes enregistrées" unite="commandes"
              donnees={s.commandes.parStatut.map((x) => ({ libelle: STATUT_CMD[x.libelle]?.[0] || x.libelle, valeur: x.valeur, couleur: STATUT_CMD[x.libelle]?.[1] }))} />
            <Camembert titre="Utilisateurs" sous={`${s.utilisateurs.suspendus} compte(s) suspendu(s)`} unite="comptes"
              donnees={[{ libelle: 'Étudiants', valeur: s.utilisateurs.etudiants }, { libelle: 'Commerçants', valeur: s.utilisateurs.commercants }]} />
            <Camembert titre="Commerces partenaires" sous="Commerces validés, par type" unite="commerces"
              donnees={traduire(s.commerces.parType, TYPE_COMMERCE)} />
            <Camembert titre="Offres en ligne" sous={`${s.offres.actives} réservable(s) sur ${s.offres.total} offres`} unite="offres"
              centre={s.offres.actives} donnees={traduire(s.offres.parCategorie, CATEGORIE)} vide="Aucune offre réservable en ce moment." />
            <Camembert titre="Signalements" sous={`${s.signalements.traites} traité(s) · ${s.signalements.rejetes} rejeté(s)`} unite="signalements"
              donnees={traduire(s.signalements.parMotif, MOTIF)} vide="Aucun signalement : tout va bien. ✓" />
          </div>

          <div className="admin-grille admin-2col">
            <section className="cs-card stats-graphique">
              <h2>Commandes payées par jour</h2>
              <p className="cs-sub">{jours.reduce((n, j) => n + j.commandes, 0)} commandes sur les 14 derniers jours</p>
              <div className="barres" role="img" aria-label={jours.map((j) => `${jourCourt(j.jour)} : ${j.commandes}`).join(', ')}>
                {jours.map((j) => (
                  <div key={j.jour} className="barre">
                    <span className="barre-valeur">{j.commandes || ''}</span>
                    <span className="barre-trait" style={{ height: `${(j.commandes / maxCmd) * 100}%` }} />
                    <span className="barre-jour">{jourCourt(j.jour)}</span>
                  </div>
                ))}
              </div>
            </section>
            <Courbe titre="Chiffre d'affaires par jour" sous={`${dt(jours.reduce((n, j) => n + j.chiffreAffaires, 0))} sur les 14 derniers jours`}
              points={jours.map((j) => ({ etiquette: jourCourt(j.jour), valeur: j.chiffreAffaires }))} format={dt} />
          </div>

          <div className="admin-grille admin-2col">
            <section className="cs-card">
              <h2>Meilleurs commerces</h2>
              <p className="cs-sub">Classés par chiffre d'affaires</p>
              <ol className="admin-top">
                {s.topCommerces.map((c) => (
                  <li key={c.id}>
                    <span className="admin-top-nom">{c.nom}<small>{c.commandes} commande(s) · {c.repas} repas</small></span>
                    <span className="admin-top-barre" aria-hidden="true"><i style={{ width: `${(c.chiffreAffaires / maxCa) * 100}%` }} /></span>
                    <b>{dt(c.chiffreAffaires)}</b>
                  </li>
                ))}
              </ol>
              {s.topCommerces.length === 0 && <p className="cs-sub">Pas encore de vente.</p>}
            </section>
            <section className="cs-card">
              <h2>Dernières commandes</h2>
              <p className="cs-sub"><Link to="/admin/commandes">Voir toutes les commandes et paiements →</Link></p>
              <ul className="admin-recent">
                {s.dernieresCommandes.map((c) => (
                  <li key={c.id}>
                    <span><strong>{c.code}</strong><small>{c.commerce} · {dateHeure(c.dateCommande)}</small></span>
                    <b>{dt(c.montantTotal)}</b>
                    <Badge type="commande" valeur={c.statut} />
                  </li>
                ))}
              </ul>
              {s.dernieresCommandes.length === 0 && <p className="cs-sub">Aucune commande.</p>}
            </section>
          </div>
        </>
      )}

      <div className="cs-actions">
        <Link className="cs-btn" to="/admin/signalements">Signalements à traiter</Link>
        <Link className="cs-btn" to="/admin/offres">Modérer les offres</Link>
        <Link className="cs-btn" to="/admin/commandes">Commandes et paiements</Link>
      </div>
    </>
  )
}
