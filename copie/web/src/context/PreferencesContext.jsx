// Préférences de l'interface, gardées dans le navigateur :
// langue (fr / ar / en, l'arabe s'affiche de droite à gauche), thème (clair / sombre)
// et choix de la bannière cookies.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUES, TEXTES } from '../i18n/textes'

const PreferencesContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => useContext(PreferencesContext)
// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useContext(PreferencesContext).t

function lire(cle, defaut) {
  try { return localStorage.getItem(cle) || defaut } catch { return defaut }
}
function ecrire(cle, valeur) {
  try { localStorage.setItem(cle, valeur) } catch { /* stockage indisponible : préférence gardée en mémoire */ }
}

const themeSysteme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair')
// Français par défaut ; l'arabe est proposé d'office aux navigateurs réglés en arabe
const langueNavigateur = () => ((navigator.language || 'fr').startsWith('ar') && TEXTES.ar ? 'ar' : 'fr')

export function PreferencesProvider({ children }) {
  const [langue, setLangueEtat] = useState(() => lire('campussave-langue', langueNavigateur()))
  const [theme, setThemeEtat] = useState(() => lire('campussave-theme', themeSysteme()))
  const [cookies, setCookiesEtat] = useState(() => lire('campussave-cookies', ''))

  useEffect(() => {
    const info = LANGUES.find((l) => l.code === langue) || LANGUES[0]
    document.documentElement.lang = langue
    document.documentElement.dir = info.rtl ? 'rtl' : 'ltr'
  }, [langue])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'sombre' ? '#0e1c16' : '#133B2C')
  }, [theme])

  const setLangue = useCallback((l) => { setLangueEtat(l); ecrire('campussave-langue', l) }, [])
  const setTheme = useCallback((t) => { setThemeEtat(t); ecrire('campussave-theme', t) }, [])
  const setCookies = useCallback((c) => { setCookiesEtat(c); ecrire('campussave-cookies', c) }, [])

  const t = useCallback((cle, vars = {}) => {
    const brut = TEXTES[langue]?.[cle] ?? TEXTES.fr[cle] ?? cle
    return brut.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
  }, [langue])

  const valeur = useMemo(() => ({ langue, setLangue, theme, setTheme, cookies, setCookies, t }), [langue, setLangue, theme, setTheme, cookies, setCookies, t])
  return <PreferencesContext.Provider value={valeur}>{children}</PreferencesContext.Provider>
}
