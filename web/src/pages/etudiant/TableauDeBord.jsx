// Tableau de bord de l'étudiant : ses chiffres, ses commandes à retirer, ses dernières commandes
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import Icone from '../../components/Icone'
import { useAuth } from '../../context/AuthContext'
import { Badge, Stat, Table } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'
import { heure } from '../../utils/categories'

export default function TableauDeBord() {
  const { user } = useAuth()
  useTitre('Tableau de bord')
  const stats = useChargement(() => api.studentStats())
  const commandes = useChargement(() => api.mesCommandes())
  const s = stats.data
  const liste = commandes.data || []
  const aRetirer = liste.filter((c) => c.statut === 'PAYEE' || c.statut === 'PRETE')
  const recentes = liste.slice(0, 5)

  return (
    <>
      <div>
        <h1>Mon tableau de bord</h1>
        <p className="cs-sub">Ton bilan sur CampusSave, {user?.prenom}.</p>
      </div>

      {(stats.erreur || commandes.erreur) && <div className="cs-error" role="alert">{stats.erreur || commandes.erreur}</div>}

      <div className="cs-grid">
        <Stat label="Commandes payées" valeur={s?.commandes ?? '—'} />
        <Stat label="Dépenses" valeur={s ? dt(s.depenses) : '—'} />
        <Stat label="Économies réalisées" valeur={s ? dt(s.economies) : '—'} note="par rapport aux prix initiaux" />
        <Stat label="Repas sauvés du gaspillage" valeur={s?.repasSauves ?? '—'} note={s?.kgSauves ? `≈ ${s.kgSauves} kg de nourriture` : undefined} />
      </div>

      {s && (
        <section className="impact cs-card" aria-label="Mon impact">
          <div className="impact-niveau">
            <span className="impact-sur">Niveau</span>
            <b>{s.niveau?.nom || 'Graine'}</b>
            {s.niveau?.suivant && (
              <>
                <div className="impact-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                  aria-valuenow={Math.round((s.repasSauves / (s.repasSauves + s.niveau.repasPourSuivant)) * 100)}>
                  <span style={{ width: `${Math.round((s.repasSauves / (s.repasSauves + s.niveau.repasPourSuivant)) * 100)}%` }} />
                </div>
                <span className="cs-sub">Encore {s.niveau.repasPourSuivant} repas pour passer « {s.niveau.suivant} »</span>
              </>
            )}
          </div>
          <ul className="impact-chiffres">
            <li><Icone nom="feuille" taille={26} /><b>{String(s.co2Evite ?? 0).replace('.', ',')} kg</b><span>de CO₂ évités</span></li>
            <li><Icone nom="PLATS" taille={26} /><b>{String(s.kgSauves ?? 0).replace('.', ',')} kg</b><span>de nourriture sauvée</span></li>
            <li><Icone nom="etoilePleine" taille={26} /><b>{s.ecoPoints ?? 0}</b><span>EcoPoints (+10 par repas)</span></li>
          </ul>
          <p className="cs-sub impact-note">Estimations : 0,4 kg de nourriture et 2,5 kg de CO₂ évités par repas sauvé.</p>
        </section>
      )}

      <h2>À retirer</h2>
      {commandes.data && aRetirer.length === 0 && (
        <div className="cs-card cs-empty">
          Aucune commande en attente de retrait. <Link to="/offres">Voir les offres</Link>
        </div>
      )}
      <ul className="et-lignes">
        {aRetirer.map((c) => (
          <li key={c.id}>
            <Link to={`/commandes/${c.id}`} className="et-ligne et-commande et-a-retirer">
              <div className="et-ligne-texte">
                <span className="et-ligne-titre">{c.commerce?.nom} · {c.code}</span>
                <span className="cs-sub">
                  {c.heureDebutRecuperation ? `Retrait de ${heure(c.heureDebutRecuperation)} à ${heure(c.heureFinRecuperation)} · ` : ''}{c.commerce?.adresse}
                </span>
              </div>
              <Badge type="commande" valeur={c.statut} />
              <span className="cs-btn primary">Voir le QR code</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Dernières commandes</h2>
      <Table
        colonnes={['Code', 'Commerce', 'Date', 'Montant', 'Statut']}
        vide="Tu n'as pas encore passé de commande."
        lignes={recentes.map((c) => [
          <Link key="code" to={`/commandes/${c.id}`}>{c.code}</Link>,
          c.commerce?.nom,
          dateHeure(c.dateCommande),
          dt(c.montantTotal),
          <Badge key="statut" type="commande" valeur={c.statut} />,
        ])}
      />
    </>
  )
}
