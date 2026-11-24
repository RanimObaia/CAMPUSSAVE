// Devenir partenaire : page publique pour convaincre les commerçants de s'inscrire
import { Link } from 'react-router-dom'
import { useTitre } from '../../hooks'
import Icone from '../../components/Icone'

const AVANTAGES = [
  ['etiquette', 'Des revenus sur vos invendus', 'Ce qui partait à la poubelle devient du chiffre d\'affaires, payé en ligne avant le retrait.'],
  ['personnes', 'De nouveaux clients', 'Des centaines d\'étudiants à quelques minutes de votre commerce découvrent votre adresse.'],
  ['repeter', 'Deux minutes par jour', 'Publiez une offre, ou cochez « Republier chaque jour » et elle revient toute seule.'],
  ['graphique', 'Vos chiffres en direct', 'Repas sauvés, chiffre d\'affaires, taux de retrait et note moyenne dans votre tableau de bord.'],
]
const ETAPES = [
  'Créez votre compte commerçant (gratuit).',
  'Renseignez votre commerce : adresse, position sur la carte, horaires.',
  'L\'équipe CampusSave valide votre commerce, en général sous 48 heures.',
  'Publiez vos offres ; les étudiants paient en ligne et présentent un QR code au retrait.',
]

export default function Partenaires() {
  useTitre('Devenir partenaire', 'Commerçants autour de l\'ESSECT : vendez vos invendus du jour aux étudiants avec CampusSave. Inscription gratuite.')
  return (
    <div className="pub-page">
      <span className="acc-sur">Restaurants · cafétérias · boulangeries · pâtisseries</span>
      <h1>Vendez vos invendus du jour aux étudiants</h1>
      <p className="pub-lead">Inscription gratuite, aucun engagement. Vous fixez le prix, la quantité et le créneau de retrait.</p>
      <div className="cs-actions">
        <Link to="/inscription?role=merchant" className="cs-btn primary acc-cta">Inscrire mon commerce</Link>
        <Link to="/login" className="cs-btn acc-cta">J'ai déjà un compte</Link>
      </div>
      <ul className="partenaires-avantages">
        {AVANTAGES.map(([i, t, d]) => <li key={t} className="cs-card"><Icone nom={i} taille={28} /><h2>{t}</h2><p>{d}</p></li>)}
      </ul>
      <section>
        <h2>Comment ça se passe</h2>
        <ol className="partenaires-etapes">{ETAPES.map((e) => <li key={e}>{e}</li>)}</ol>
      </section>
      <section className="acc-bandeau">
        <div>
          <h2>Une question avant de vous lancer ?</h2>
          <p>Écrivez-nous en choisissant le sujet « Devenir partenaire ».</p>
        </div>
        <Link to="/contact" className="cs-btn primary">Nous contacter</Link>
      </section>
    </div>
  )
}
