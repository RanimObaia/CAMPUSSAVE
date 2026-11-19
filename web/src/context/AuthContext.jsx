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

  useEffect(() => {
    if (USE_MOCK) return undefined
    return onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser ? await api.getMe() : null)
      } catch {
        setUser(null)
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

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
