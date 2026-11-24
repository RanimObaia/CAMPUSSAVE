// Tableau de bord de l'étudiant : ses chiffres, ses commandes à retirer, ses dernières commandes
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement } from '../../hooks'
import { useAuth } from '../../context/AuthContext'
import { Badge, Stat, Table } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'
import { heure } from '../../utils/categories'

export default function TableauDeBord() {
  const { user } = useAuth()
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

      <h2>À retirer</h2>
      {commandes.data && aRetirer.length === 0 && (
        <div className="cs-card cs-empty">
          Aucune commande en attente de retrait. <Link to="/">Voir les offres</Link>
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
