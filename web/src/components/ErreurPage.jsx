// Filet de sécurité : une erreur dans une page affiche un message au lieu d'un écran blanc
import { Component } from 'react'

export default class ErreurPage extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, info) {
    console.error('Erreur dans la page :', erreur, info.componentStack)
  }

  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <div className="cs cs-erreur-page">
        <div className="cs-card">
          <h1>Oups, quelque chose s'est mal passé</h1>
          <p className="cs-sub">La page a rencontré une erreur. Recharge-la ; si le problème continue, écris-nous depuis la page Contact.</p>
          <div className="cs-actions">
            <button type="button" className="cs-btn primary" onClick={() => window.location.reload()}>Recharger la page</button>
            <a className="cs-btn" href="/">Retour à l'accueil</a>
          </div>
        </div>
      </div>
    )
  }
}
