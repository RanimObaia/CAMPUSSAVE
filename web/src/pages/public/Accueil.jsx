// Page d'accueil publique (avant connexion) : promesse, compteurs d'impact,
// « comment ça marche » en 4 étapes, offres du moment, commerçants, application, FAQ.
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useChargement, useTitre } from '../../hooks'
import { usePreferences } from '../../context/PreferencesContext'
import { FAQ } from '../../contenu/faq'
import { dt } from '../../utils/format'
import { heure, reduction } from '../../utils/categories'
import Cloche from '../../components/Cloche'
import { ouvrirApplication } from '../../components/ouvrirApplication'
import Icone from '../../components/Icone'
import { Revele, Parallaxe, Compteur } from '../../components/Anime'

const PHOTOS_DEFILE = ['viennoiseries', 'makloub', 'baklawa', 'couscous', 'jus-orange', 'pizza', 'makroudh', 'brik', 'donuts', 'chapati']
const nb = (n) => new Intl.NumberFormat('fr').format(n)


export default function Accueil() {
  const navigate = useNavigate()
  const { t, langue } = usePreferences()
  useTitre(null, 'CampusSave : les invendus du jour des commerces autour de l\'ESSECT à moitié prix. Réserve, paie en ligne, récupère avec ton QR code.')
  const stats = useChargement(() => api.statsPubliques())
  const offres = useChargement(() => api.listOffers({ tri: 'remise' }))
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
        <div className="acc-hero-visuel acc-collage" aria-hidden="true">
          <Parallaxe src="/photos/viennoiseries.jpg" vitesse={0.06} className="c1" />
          <Parallaxe src="/photos/makloub.jpg" vitesse={0.16} className="c2" />
          <Parallaxe src="/photos/baklawa.jpg" vitesse={0.1} className="c3" />
          <span className="acc-pastille acc-p1">−60 %</span>
          <span className="acc-pastille acc-p2"><Icone nom="horloge" taille={16} /> 18:00 – 19:30</span>
        </div>
      </section>

      <div className="acc-defile" aria-hidden="true">
        <div className="acc-defile-piste">
          {[...PHOTOS_DEFILE, ...PHOTOS_DEFILE].map((p, i) => <img key={i} src={`/photos/${p}.jpg`} alt="" loading="lazy" />)}
        </div>
      </div>

      <section className="acc-compteurs" aria-label="Impact">
        <div><b><Compteur cible={s?.repasSauves} format={nb} /></b><span>{t('pub.compteurRepas')}</span></div>
        <div><b><Compteur cible={s?.commerces} format={nb} /></b><span>{t('pub.compteurCommerces')}</span></div>
        <div><b><Compteur cible={s?.etudiants} format={nb} /></b><span>{t('pub.compteurEtudiants')}</span></div>
        <div><b><Compteur cible={s?.co2Evite} format={nb} /></b><span>{t('pub.compteurCo2')}</span></div>
      </section>

      <section id="comment" className="acc-section">
        <Revele as="h2">{t('pub.etapesTitre')}</Revele>
        <ol className="acc-etapes">
          {etapes.map((e, i) => (
            <Revele as="li" key={e.n} delai={i * 120}>
              <span className="acc-etape-n">{e.n}</span>
              <Icone nom={e.i} taille={28} />
              <h3>{e.t}</h3>
              <p>{e.d}</p>
            </Revele>
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
            {offres.data.slice(0, 3).map((o, i) => (
              <Revele key={o.id} delai={i * 120} sens={i === 0 ? 'gauche' : i === 2 ? 'droite' : 'zoom'}>
              <Link to={`/offres/${o.id}`} className="acc-offre">
                <Cloche code={o.categorie} photoUrl={o.photoUrl} remise={reduction(o)} />
                <div>
                  <span className="et-commerce">{o.commerce?.nom}</span>
                  <h3>{o.titre}</h3>
                  <p><b>{dt(o.prixReduit)}</b> <s>{dt(o.prixInitial)}</s></p>
                  <span className="cs-sub"><Icone nom="horloge" taille={14} /> {heure(o.heureDebutRecuperation)} – {heure(o.heureFinRecuperation)}</span>
                </div>
              </Link>
              </Revele>
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

      <Revele as="section" sens="zoom" className="acc-bandeau">
        <div>
          <h2>{t('pub.commercantTitre')}</h2>
          <p>{t('pub.commercantTexte')}</p>
        </div>
        <Link to="/partenaires" className="cs-btn primary">{t('pub.ctaCommerce')}</Link>
      </Revele>

      <section className="acc-section acc-app">
        <div>
          <h2>{t('pub.appTitre')}</h2>
          <p>{t('pub.appTexte')}</p>
        </div>
        <a href="/application" className="cs-btn primary" onClick={(e) => { e.preventDefault(); ouvrirApplication({ aller: navigate }) }}>{t('pub.installer')}</a>
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
