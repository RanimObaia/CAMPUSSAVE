// Centre d'aide : questions fréquentes par thème + recherche + lien vers le contact
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../../context/PreferencesContext'
import { useTitre } from '../../hooks'
import { FAQ, GROUPES_FAQ } from '../../contenu/faq'
import Icone from '../../components/Icone'

export default function Aide() {
  const { langue, t } = usePreferences()
  useTitre(t('foot.faq'), 'Questions fréquentes sur CampusSave : réservation, paiement Konnect, retrait avec QR code, remboursement, commerçants.')
  const [q, setQ] = useState('')
  const liste = FAQ[langue] || FAQ.fr
  const groupes = GROUPES_FAQ[langue] || GROUPES_FAQ.fr
  const filtre = q.trim().toLowerCase()
  const visibles = liste.filter((f) => !filtre || `${f.q} ${f.r}`.toLowerCase().includes(filtre))

  return (
    <div className="pub-page">
      <h1>{t('foot.faq')}</h1>
      <form className="et-recherche" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icone nom="loupe" />
        <input className="et-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Paiement, QR code, remboursement…" aria-label="Rechercher dans l'aide" />
      </form>
      {Object.entries(groupes).map(([g, titre]) => {
        const qs = visibles.filter((f) => f.g === g)
        if (!qs.length) return null
        return (
          <section key={g} className="faq-groupe">
            <h2>{titre}</h2>
            <div className="faq">
              {qs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.r}</p></details>)}
            </div>
          </section>
        )
      })}
      {visibles.length === 0 && <p className="cs-empty">Aucune réponse trouvée.</p>}
      <div className="cs-card pub-encart">
        <h2>Tu n'as pas trouvé ta réponse ?</h2>
        <p className="cs-sub">Écris-nous, l'équipe répond sous 72 heures. Pour un problème de commande, utilise « Signaler un problème » dans la commande.</p>
        <div className="cs-actions">
          <Link to="/contact" className="cs-btn primary">{t('foot.contact')}</Link>
          <Link to="/legal/annulation" className="cs-btn">{t('foot.annulation')}</Link>
        </div>
      </div>
    </div>
  )
}
