import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles/espace.css'
import { AuthProvider } from './context/AuthContext'
import { ROLES } from './config/constants'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import MerchantDashboard from './pages/merchant/Dashboard'
import Offers from './pages/merchant/Offers'
import OfferForm from './pages/merchant/OfferForm'
import Orders from './pages/merchant/Orders'
import Scan from './pages/merchant/Scan'
import Shop from './pages/merchant/Shop'
import AdminDashboard from './pages/admin/Dashboard'
import Shops from './pages/admin/Shops'
import Users from './pages/admin/Users'

const LIENS_COMMERCANT = [
  { to: '/commercant', label: 'Tableau de bord', end: true },
  { to: '/commercant/offres', label: 'Mes offres' },
  { to: '/commercant/commandes', label: 'Commandes' },
  { to: '/commercant/retrait', label: 'Valider un retrait' },
  { to: '/commercant/commerce', label: 'Mon commerce' },
]
const LIENS_ADMIN = [
  { to: '/admin', label: 'Vue globale', end: true },
  { to: '/admin/commerces', label: 'Commerces' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
]

// Routes des espaces commerçant et administrateur.
// L'espace étudiant (Eya) s'ajoute ici avec ses propres routes, par exemple sous "/".
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute role={ROLES.MERCHANT} />}>
            <Route path="/commercant" element={<Layout titre="Espace commerçant" liens={LIENS_COMMERCANT} />}>
              <Route index element={<MerchantDashboard />} />
              <Route path="offres" element={<Offers />} />
              <Route path="offres/nouvelle" element={<OfferForm />} />
              <Route path="offres/:id" element={<OfferForm />} />
              <Route path="commandes" element={<Orders />} />
              <Route path="retrait" element={<Scan />} />
              <Route path="commerce" element={<Shop />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute role={ROLES.ADMIN} />}>
            <Route path="/admin" element={<Layout titre="Espace administrateur" liens={LIENS_ADMIN} />}>
              <Route index element={<AdminDashboard />} />
              <Route path="commerces" element={<Shops />} />
              <Route path="utilisateurs" element={<Users />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
