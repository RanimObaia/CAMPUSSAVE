import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles/espace.css'
import { AuthProvider } from './context/AuthContext'
import { ROLES } from './config/constants'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Inscription from './pages/Inscription'
import EtudiantLayout from './components/EtudiantLayout'
import OffresEtudiant from './pages/etudiant/Offres'
import OffreDetail from './pages/etudiant/OffreDetail'
import Panier from './pages/etudiant/Panier'
import PaiementSimulation from './pages/etudiant/PaiementSimulation'
import PaiementRetour from './pages/etudiant/PaiementRetour'
import MesCommandes from './pages/etudiant/MesCommandes'
import CommandeDetail from './pages/etudiant/CommandeDetail'
import TableauDeBord from './pages/etudiant/TableauDeBord'
import MerchantDashboard from './pages/merchant/Dashboard'
import Offers from './pages/merchant/Offers'
import OfferForm from './pages/merchant/OfferForm'
import Orders from './pages/merchant/Orders'
import Scan from './pages/merchant/Scan'
import Shop from './pages/merchant/Shop'
import Profil from './pages/merchant/Profil'
import AdminDashboard from './pages/admin/Dashboard'
import Shops from './pages/admin/Shops'
import Users from './pages/admin/Users'

const LIENS_COMMERCANT = [
  { to: '/commercant', label: 'Tableau de bord', end: true, icone: 'tableau' },
  { to: '/commercant/offres', label: 'Mes offres', icone: 'etiquette' },
  { to: '/commercant/commandes', label: 'Commandes', icone: 'ticket' },
  { to: '/commercant/retrait', label: 'Valider un retrait', icone: 'qr' },
  { to: '/commercant/commerce', label: 'Mon commerce', icone: 'boutique' },
  { to: '/commercant/profil', label: 'Mon profil', icone: 'personne' },
]
const LIENS_ADMIN = [
  { to: '/admin', label: 'Vue globale', end: true, icone: 'tableau' },
  { to: '/admin/commerces', label: 'Commerces', icone: 'boutique' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icone: 'personnes' },
]

// Routes des espaces étudiant, commerçant et administrateur.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          {/* Espace étudiant (Eya) */}
          <Route element={<ProtectedRoute role={ROLES.STUDENT} />}>
            <Route element={<EtudiantLayout />}>
              <Route path="/" element={<OffresEtudiant />} />
              <Route path="/offres/:id" element={<OffreDetail />} />
              <Route path="/panier" element={<Panier />} />
              <Route path="/paiement/retour" element={<PaiementRetour />} />
              <Route path="/commandes" element={<MesCommandes />} />
              <Route path="/commandes/:id" element={<CommandeDetail />} />
              <Route path="/tableau-de-bord" element={<TableauDeBord />} />
            </Route>
            {/* Mode démo : page de paiement simulée, hors du menu étudiant */}
            <Route path="/paiement/simulation/:id" element={<PaiementSimulation />} />
          </Route>
          <Route element={<ProtectedRoute role={ROLES.MERCHANT} />}>
            <Route path="/commercant" element={<Layout titre="Espace commerçant" liens={LIENS_COMMERCANT} />}>
              <Route index element={<MerchantDashboard />} />
              <Route path="offres" element={<Offers />} />
              <Route path="offres/nouvelle" element={<OfferForm />} />
              <Route path="offres/:id" element={<OfferForm />} />
              <Route path="commandes" element={<Orders />} />
              <Route path="retrait" element={<Scan />} />
              <Route path="commerce" element={<Shop />} />
              <Route path="profil" element={<Profil />} />
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
