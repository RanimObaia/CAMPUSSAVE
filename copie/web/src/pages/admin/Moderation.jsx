// Modération : l'administrateur voit toutes les offres et retire celles qui ne respectent pas les règles
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Entete, Table, Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

export default function Moderation() {
  useTitre('Modération des offres')
  const { data, erreur, recharger } = useChargement(() => api.adminOffres())
  async function retirer(o) {
    const motif = window.prompt(`Motif du retrait de « ${o.titre} » (envoyé au commerçant) :`, 'Description ou photo trompeuse')
    if (motif === null) return
    await api.retirerOffreAdmin(o.id, motif)
    recharger()
  }
  return (
    <>
      <Entete titre="Modération des offres" sous="Retirez une offre trompeuse ou non conforme : le commerçant est prévenu." />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Offre', 'Commerce', 'Prix', 'Retrait', 'Statut', 'Action']} vide="Aucune offre."
        lignes={(data || []).map((o) => [
          <strong key="t">{o.titre}</strong>,
          o.commerce?.nom,
          <span key="p">{dt(o.prixReduit)} <s>{dt(o.prixInitial)}</s></span>,
          dateHeure(o.heureDebutRecuperation),
          <Badge key="s" type="offre" valeur={o.statut} />,
          o.statut !== 'RETIREE' ? <button key="a" type="button" className="cs-btn danger" onClick={() => retirer(o)}>Retirer</button> : (o.motifRetrait || ''),
        ])} />
    </>
  )
}
