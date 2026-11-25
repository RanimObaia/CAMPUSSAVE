// Application installable (PWA) : récupère l'événement « beforeinstallprompt »
// du navigateur pour afficher notre propre bouton « Installer ».
import { useEffect, useState } from 'react'

let evenementGarde = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    evenementGarde = e
  })
}

export function useInstallation() {
  const [possible, setPossible] = useState(Boolean(evenementGarde))
  const [installee, setInstallee] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches)

  useEffect(() => {
    const avant = (e) => { e.preventDefault(); evenementGarde = e; setPossible(true) }
    const apres = () => { setInstallee(true); setPossible(false) }
    window.addEventListener('beforeinstallprompt', avant)
    window.addEventListener('appinstalled', apres)
    return () => {
      window.removeEventListener('beforeinstallprompt', avant)
      window.removeEventListener('appinstalled', apres)
    }
  }, [])

  async function installer() {
    if (!evenementGarde) return false
    evenementGarde.prompt()
    const { outcome } = await evenementGarde.userChoice
    evenementGarde = null
    setPossible(false)
    return outcome === 'accepted'
  }

  return { possible, installee, installer }
}
