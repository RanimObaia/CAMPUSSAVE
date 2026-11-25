// Cloche de l'en-tête : nombre de notifications non lues, mis à jour toutes les minutes
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useT } from '../context/PreferencesContext'
import Icone from './Icone'

export default function ClocheNotifications() {
  const t = useT()
  const { pathname } = useLocation()
  const [nonLues, setNonLues] = useState(0)
  useEffect(() => {
    let actif = true
    const charger = () => api.notifications().then((r) => { if (actif) setNonLues(r.nonLues) }).catch(() => {})
    charger()
    const minuteur = setInterval(charger, 60000)
    return () => { actif = false; clearInterval(minuteur) }
  }, [pathname])
  return (
    <NavLink to="/notifications" className="et-cloche" aria-label={`${t('nav.notifications')}${nonLues ? `, ${nonLues} non lue(s)` : ''}`}>
      <Icone nom="cloche" />
      {nonLues > 0 && <span className="et-badge" aria-hidden="true">{nonLues}</span>}
    </NavLink>
  )
}
