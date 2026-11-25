import { useCallback, useEffect, useState } from 'react'

// Charge des données et expose { data, erreur, chargement, recharger }.
export function useChargement(fn, deps = []) {
  const [data, setData] = useState(null)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const charger = useCallback(fn, deps)
  const recharger = useCallback(() => {
    setChargement(true)
    charger().then((d) => { setData(d); setErreur('') }).catch((e) => setErreur(e.message)).finally(() => setChargement(false))
  }, [charger])
  useEffect(() => { recharger() }, [recharger])
  return { data, erreur, chargement, recharger }
}

// Titre de l'onglet + description (référencement et partage) pour chaque page
export function useTitre(titre, description) {
  useEffect(() => {
    document.title = titre ? `${titre} · CampusSave` : 'CampusSave · Repas anti-gaspi près de l\'ESSECT'
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [titre, description])
}
