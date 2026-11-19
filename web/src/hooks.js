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
