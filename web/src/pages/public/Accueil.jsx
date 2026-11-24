// Page d'accueil publique (avant connexion) : promesse, compteurs d'impact,
// « comment ça marche » en 4 étapes, offres du moment, commerçants, application, FAQ.
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { usePreferences } from '../../context/PreferencesContext'
import { useInstallation } from '../../components/useInstallation'
import { FAQ } from '../../contenu/faq'
import { dt } from '../../utils/format'
import { heure, reduction } from '../../utils/categories'
import { Assiette } from '../../components/Logo'
import Cloche from '../../components/Cloche'
import Icone from '../../components/Icone'

const nombre = (n, langue) => (n == null ? '—' : new Intl.NumberFormat(langue === 'ar' ? 'ar-TN' : langue).format(n))

export default function Accueil() {
  const { t, langue } = usePreferences()
  useTitre(null, 'CampusSave : les invendus du jour des commerces autour de l\'ESSECT à moitié prix. Réserve, paie en ligne, récupère avec ton QR code.')
  const stats = useChargement(() => api.statsPubliques())
  const offres = useChargement(() => api.listOffers({ tri: 'remise' }))
  const { possible, installer } = useInstallation()
  const s = stats.data
  const etapes = [
    { n: 1, t: t('pub.e1t'), d: t('pub.e1'), i: 'loupe' },
    { n: 2, t: t('pub.e2t'), d: t('pub.e2'), i: 'panier' },
    { n: 3, t: t('pub.e3t'), d: t('pub.e3'), i: 'qr' },
    { n: 4, t: t('pub.e4t'), d: t('pub.e4'), i: 'feuille' },
  ]

  return (
    <>
      <section className="acc-hero">
        <div className="acc-hero-texte">
          <span className="acc-sur">Montfleury · Tunis</span>
          <h1>{t('pub.titre')}</h1>
          <p>{t('pub.sous')}</p>
          <div className="cs-actions">
            <Link to="/offres" className="cs-btn primary acc-cta">{t('pub.cta')}</Link>
            <Link to="/partenaires" className="cs-btn acc-cta">{t('pub.ctaCommerce')}</Link>
          </div>
        </div>
        <div className="acc-hero-visuel" aria-hidden="true">
          <Assiette taille={300} className="acc-assiette" />
          <span className="acc-pastille acc-p1">−60 %</span>
          <span className="acc-pastille acc-p2"><Icone nom="horloge" taille={16} /> 18:00 – 19:30</span>
        </div>
      </section>

      <section className="acc-compteurs" aria-label="Impact">
        <div><b>{nombre(s?.repasSauves, langue)}</b><span>{t('pub.compteurRepas')}</span></div>
        <div><b>{nombre(s?.commerces, langue)}</b><span>{t('pub.compteurCommerces')}</span></div>
        <div><b>{nombre(s?.etudiants, langue)}</b><span>{t('pub.compteurEtudiants')}</span></div>
        <div><b>{nombre(s?.co2Evite, langue)}</b><span>{t('pub.compteurCo2')}</span></div>
      </section>

      <section id="comment" className="acc-section">
        <h2>{t('pub.etapesTitre')}</h2>
        <ol className="acc-etapes">
          {etapes.map((e) => (
            <li key={e.n}>
              <span className="acc-etape-n">{e.n}</span>
              <Icone nom={e.i} taille={28} />
              <h3>{e.t}</h3>
              <p>{e.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {offres.data?.length > 0 && (
        <section className="acc-section">
          <div className="acc-titre-ligne">
            <h2>{t('pub.cta')}</h2>
            <Link to="/offres">{t('nav.offres')} →</Link>
          </div>
          <div className="acc-offres">
            {offres.data.slice(0, 3).map((o) => (
              <Link key={o.id} to={`/offres/${o.id}`} className="acc-offre">
                <Cloche code={o.categorie} photoUrl={o.photoUrl} remise={reduction(o)} />
                <div>
                  <span className="et-commerce">{o.commerce?.nom}</span>
                  <h3>{o.titre}</h3>
                  <p><b>{dt(o.prixReduit)}</b> <s>{dt(o.prixInitial)}</s></p>
                  <span className="cs-sub"><Icone nom="horloge" taille={14} /> {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="acc-section acc-pourquoi">
        <h2>{t('pub.pourquoi')}</h2>
        <ul>
          <li><Icone nom="etiquette" taille={26} />{t('pub.p1')}</li>
          <li><Icone nom="lieu" taille={26} />{t('pub.p2')}</li>
          <li><Icone nom="feuille" taille={26} />{t('pub.p3')}</li>
        </ul>
      </section>

      <section className="acc-bandeau">
        <div>
          <h2>{t('pub.commercantTitre')}</h2>
          <p>{t('pub.commercantTexte')}</p>
        </div>
        <Link to="/partenaires" className="cs-btn primary">{t('pub.ctaCommerce')}</Link>
      </section>

      <section className="acc-section acc-app">
        <div>
          <h2>{t('pub.appTitre')}</h2>
          <p>{t('pub.appTexte')}</p>
        </div>
        {possible && <button type="button" className="cs-btn primary" onClick={installer}>{t('pub.installer')}</button>}
      </section>

      <section className="acc-section">
        <div className="acc-titre-ligne">
          <h2>{t('pub.faqTitre')}</h2>
          <Link to="/aide">{t('pub.faqTout')} →</Link>
        </div>
        <div className="faq">
          {(FAQ[langue] || FAQ.fr).filter((f) => f.g !== 'commercant').slice(0, 4).map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.r}</p></details>
          ))}
        </div>
      </section>
    </>
  )
}
