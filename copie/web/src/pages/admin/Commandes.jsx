// Suivi des commandes et des paiements Konnect (dont les e-mails envoyés)
import { useState } from 'react'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { Entete, Table, Badge } from '../../components/ui'
import { dt, dateHeure } from '../../utils/format'

const PAIEMENT = { INITIE: ['Lancé', 'warn'], REUSSI: ['Réussi', 'ok'], ECHOUE: ['Refusé', 'bad'] }

export default function Commandes() {
  useTitre('Commandes et paiements')
  const { data, erreur } = useChargement(() => api.adminCommandes())
  const [statut, setStatut] = useState('')
  const liste = (data || []).filter((c) => !statut || c.statut === statut)
  return (
    <>
      <Entete titre="Commandes et paiements" sous="Toutes les commandes, leur paiement Konnect et l'e-mail envoyé." action={
        <select className="et-select" value={statut} onChange={(e) => setStatut(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option><option value="EN_ATTENTE_PAIEMENT">En attente</option><option value="PAYEE">Payées</option>
          <option value="PRETE">Prêtes</option><option value="RECUPEREE">Récupérées</option><option value="ANNULEE">Annulées</option>
        </select>
      } />
      {erreur && <div className="cs-error" role="alert">{erreur}</div>}
      <Table colonnes={['Code', 'Commerce', 'Date', 'Montant', 'Commande', 'Paiement', 'E-mail']} vide="Aucune commande."
        lignes={liste.map((c) => {
          const p = PAIEMENT[c.paiement?.statut]
          return [
            <strong key="c">{c.code}</strong>, c.commerce?.nom || '—', dateHeure(c.dateCommande), dt(c.montantTotal),
            <Badge key="s" type="commande" valeur={c.statut} />,
            p ? <span key="p" className={`cs-badge ${p[1]}`}>{p[0]}</span> : '—',
            c.emailEnvoye ? 'Confirmation' : c.emailEchecEnvoye ? 'Refus' : '—',
          ]
        })} />
    </>
  )
}
