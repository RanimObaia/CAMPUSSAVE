import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Laisse passer uniquement les utilisateurs connectés, actifs, du bon rôle.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="cs"><p className="cs-empty">Chargement…</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.actif) return <Navigate to="/login" replace state={{ erreur: 'Compte suspendu.' }} />
  if (user.role !== role) return <Navigate to="/login" replace state={{ erreur: 'Accès refusé pour ce rôle.' }} />
  return <Outlet />
}
