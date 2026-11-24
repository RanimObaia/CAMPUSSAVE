// Animations au scroll (même esprit que toogoodtogo.com) :
//  - <Revele> : apparition en fondu + glissement quand l'élément entre à l'écran
//  - <Parallaxe> : l'image se déplace plus lentement que la page et zoome légèrement
//  - useCompteur : les chiffres d'impact montent jusqu'à leur valeur
// Tout est coupé si l'utilisateur a demandé « réduire les animations ».
import { useEffect, useRef, useState } from 'react'

const reduit = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Revele({ children, delai = 0, sens = 'haut', className = '', as: Tag = 'div', ...reste }) {
  const ref = useRef(null)
  const [vu, setVu] = useState(() => reduit())
  useEffect(() => {
    if (vu || !ref.current) return undefined
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVu(true); obs.disconnect() }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [vu])
  return (
    <Tag ref={ref} className={`revele revele-${sens} ${vu ? 'vu' : ''} ${className}`} style={{ transitionDelay: `${delai}ms` }} {...reste}>
      {children}
    </Tag>
  )
}

export function Parallaxe({ src, alt = '', vitesse = 0.12, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduit()) return undefined
    let raf = 0
    const maj = () => {
      raf = 0
      const r = el.parentElement.getBoundingClientRect()
      const centre = r.top + r.height / 2 - window.innerHeight / 2
      const progres = Math.max(-1, Math.min(1, centre / window.innerHeight))
      el.style.transform = `translate3d(0, ${(-centre * vitesse).toFixed(1)}px, 0) scale(${(1.12 - Math.abs(progres) * 0.06).toFixed(3)})`
    }
    const surScroll = () => { if (!raf) raf = requestAnimationFrame(maj) }
    maj()
    window.addEventListener('scroll', surScroll, { passive: true })
    window.addEventListener('resize', surScroll)
    return () => { window.removeEventListener('scroll', surScroll); window.removeEventListener('resize', surScroll); if (raf) cancelAnimationFrame(raf) }
  }, [vitesse])
  return (
    <div className={`parallaxe ${className}`}>
      <img ref={ref} src={src} alt={alt} loading="lazy" />
    </div>
  )
}

// Compte de 0 à `cible` quand l'élément devient visible
export function Compteur({ cible, format = (n) => n }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (cible == null || !ref.current || reduit()) return undefined
    let raf = 0
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const debut = performance.now()
      const pas = (t) => {
        const p = Math.min(1, (t - debut) / 1400)
        setN(Math.round(cible * (1 - (1 - p) ** 3)))
        if (p < 1) raf = requestAnimationFrame(pas)
      }
      raf = requestAnimationFrame(pas)
    }, { threshold: 0.4 })
    obs.observe(ref.current)
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }, [cible])
  return <span ref={ref}>{cible == null ? '—' : format(reduit() ? cible : n)}</span>
}
