// Écran partagé de connexion et d'inscription :
// à gauche, ce que fait CampusSave ; à droite, le formulaire.
import Logo, { Assiette } from './Logo'

export default function EcranAuth({ children }) {
  return (
    <div className="cs auth">
      <section className="auth-recit">
        <Logo />
        <div>
          <h1>Le bon repas, au bon prix, avant qu'il ne soit jeté.</h1>
          <p>Les restaurants et cafétérias autour de l'ESSECT vendent leurs invendus du jour à prix réduit.</p>
        </div>
        <ol className="auth-etapes">
          <li><b>1</b><span>Choisis une offre près du campus et réserve-la.</span></li>
          <li><b>2</b><span>Paie en ligne, en toute sécurité, avec Konnect.</span></li>
          <li><b>3</b><span>Présente ton QR code au commerçant et récupère ton repas.</span></li>
        </ol>
        <Assiette className="auth-assiette" taille={340} />
      </section>
      <section className="auth-form">{children}</section>
    </div>
  )
}
