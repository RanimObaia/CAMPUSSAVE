// À propos : la mission et l'équipe du projet
import { Link } from 'react-router-dom'
import { useTitre } from '../../hooks'

const EQUIPE = [
  ['Ranim Obaia', 'Responsable du projet · backend'],
  ['Ines Hachana', 'Espace commerçant · administration · UML'],
  ['Eya Oueslati', 'Espace étudiant · paiement'],
  ['Ahmed', 'Commandes · QR code · notifications'],
  ['Azer', 'Application mobile Flutter'],
]

export default function APropos() {
  useTitre('À propos', 'CampusSave, projet étudiant de l\'ESSECT contre le gaspillage alimentaire autour du campus.')
  return (
    <div className="pub-page">
      <h1>À propos de CampusSave</h1>
      <p className="pub-lead">Chaque soir, des commerces autour du campus jettent des produits encore bons. Chaque midi, des étudiants cherchent à manger bien pour pas cher. CampusSave relie les deux.</p>
      <section>
        <h2>Notre mission</h2>
        <p>Réduire le gaspillage alimentaire autour de l'ESSECT en rendant les invendus du jour faciles à trouver, à payer et à récupérer. Chaque repas sauvé évite environ 2,5 kg de CO₂ (estimation reprise des données de Too Good To Go).</p>
      </section>
      <section>
        <h2>L'équipe</h2>
        <ul className="apropos-equipe">
          {EQUIPE.map(([nom, role]) => <li key={nom}><span className="cs-initiales" aria-hidden="true">{nom.split(' ').map((m) => m[0]).join('').slice(0, 2)}</span><b>{nom}</b><span className="cs-sub">{role}</span></li>)}
        </ul>
        <p className="cs-sub">Projet de 3e année Business Computing, École Supérieure des Sciences Économiques et Commerciales de Tunis.</p>
      </section>
      <div className="cs-actions">
        <Link to="/offres" className="cs-btn primary">Voir les offres</Link>
        <Link to="/contact" className="cs-btn">Nous écrire</Link>
      </div>
    </div>
  )
}
