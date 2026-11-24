import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { USE_MOCK } from '../config/constants'
import { auth } from '../services/firebase'
import { api } from '../services/api'

const AuthContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // profil renvoyé par GET /users/me
  const [loading, setLoading] = useState(!USE_MOCK)
  const [erreurConnexion, setErreurConnexion] = useState('') // message si le profil ne peut pas être chargé

  useEffect(() => {
    if (USE_MOCK) return undefined
    return onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser ? await api.getMe() : null)
        setErreurConnexion('')
      } catch (e) {
        // Connecté à Firebase mais profil illisible : on l'explique au lieu de rester bloqué
        setUser(null)
        setErreurConnexion(e.status
          ? `Connexion réussie, mais le serveur a refusé le profil : ${e.message}`
          : "Impossible de joindre le serveur (backend). Vérifie qu'il tourne sur le port 4000.")
        await signOut(auth).catch(() => {})
      }
      setLoading(false)
    })
  }, [])

  async function login(email, password) {
    if (USE_MOCK) {
      setUser(await api.getMe(email))
      return
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    if (!USE_MOCK) await signOut(auth)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, erreurConnexion }}>{children}</AuthContext.Provider>
}