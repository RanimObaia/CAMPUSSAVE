import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './styles/espace.css'
import './styles/public.css'
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
const PaiementSimulation = lazy(() => import('./pages/etudiant/PaiementSimulation'))
import PaiementRetour from './pages/etudiant/PaiementRetour'
import MesCommandes from './pages/etudiant/MesCommandes'
import CommandeDetail from './pages/etudiant/CommandeDetail'
import TableauDeBord from './pages/etudiant/TableauDeBord'
const MerchantDashboard = lazy(() => import('./pages/merchant/Dashboard'))
const Offers = lazy(() => import('./pages/merchant/Offers'))
const OfferForm = lazy(() => import('./pages/merchant/OfferForm'))
const Orders = lazy(() => import('./pages/merchant/Orders'))
const Scan = lazy(() => import('./pages/merchant/Scan'))
const Shop = lazy(() => import('./pages/merchant/Shop'))
const Profil = lazy(() => import('./pages/merchant/Profil'))
const Statistiques = lazy(() => import('./pages/merchant/Statistiques'))
import Favoris from './pages/etudiant/Favoris'
import Notifications from './pages/etudiant/Notifications'
import Parametres from './pages/etudiant/Parametres'
import PagePublique from './components/PagePublique'
import BanniereCookies from './components/BanniereCookies'
import ErreurPage from './components/ErreurPage'
import { PreferencesProvider } from './context/PreferencesContext'
import Accueil from './pages/public/Accueil'
const Aide = lazy(() => import('./pages/public/Aide'))
const Legal = lazy(() => import('./pages/public/Legal'))
const Contact = lazy(() => import('./pages/public/Contact'))
const APropos = lazy(() => import('./pages/public/APropos'))
const Partenaires = lazy(() => import('./pages/public/Partenaires'))
const Statut = lazy(() => import('./pages/public/Statut'))
const Application = lazy(() => import('./pages/public/Application'))
import Introuvable from './pages/public/Introuvable'
const RetraitDelegue = lazy(() => import('./pages/public/RetraitDelegue'))
const Signalements = lazy(() => import('./pages/admin/Signalements'))
const Moderation = lazy(() => import('./pages/admin/Moderation'))
const CommandesAdmin = lazy(() => import('./pages/admin/Commandes'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Shops = lazy(() => import('./pages/admin/Shops'))
const Users = lazy(() => import('./pages/admin/Users'))

const LIENS_COMMERCANT = [
  { to: '/commercant', label: 'Tableau de bord', end: true, icone: 'tableau' },
  { to: '/commercant/offres', label: 'Mes offres', icone: 'etiquette' },
  { to: '/commercant/commandes', label: 'Commandes', icone: 'ticket' },
  { to: '/commercant/statistiques', label: 'Statistiques', icone: 'graphique' },
  { to: '/commercant/retrait', label: 'Valider un retrait', icone: 'qr' },
  { to: '/commercant/commerce', label: 'Mon commerce', icone: 'boutique' },
  { to: '/commercant/profil', label: 'Mon profil', icone: 'personne' },
]
const LIENS_ADMIN = [
  { to: '/admin', label: 'Vue globale', end: true, icone: 'tableau' },
  { to: '/admin/commerces', label: 'Commerces', icone: 'boutique' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icone: 'personnes' },
  { to: '/admin/signalements', label: 'Signalements', icone: 'drapeau' },
  { to: '/admin/offres', label: 'Modération', icone: 'etiquette' },
  { to: '/admin/commandes', label: 'Commandes et paiements', icone: 'ticket' },
]

// Routes : pages publiques, espace étudiant (offres visibles sans compte), commerçant, administrateur.
export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErreurPage>
            <Suspense fallback={<div className="cs"><p className="cs-empty">Chargement…</p></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/inscription" element={<Inscription />} />

              {/* Pages publiques */}
              <Route element={<PagePublique />}>
                <Route path="/" element={<Accueil />} />
                <Route path="/aide" element={<Aide />} />
                <Route path="/legal/:page" element={<Legal />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/a-propos" element={<APropos />} />
                <Route path="/partenaires" element={<Partenaires />} />
                <Route path="/statut" element={<Statut />} />
                <Route path="/application" element={<Application />} />
                <Route path="/retrait/:token" element={<RetraitDelegue />} />
                <Route path="*" element={<Introuvable />} />
              </Route>

              {/* Espace étudiant (Eya) : les offres se consultent sans compte */}
              <Route element={<EtudiantLayout />}>
                <Route path="/offres" element={<OffresEtudiant />} />
                <Route path="/offres/:id" element={<OffreDetail />} />
                <Route element={<ProtectedRoute role={ROLES.STUDENT} />}>
                  <Route path="/panier" element={<Panier />} />
                  <Route path="/paiement/retour" element={<PaiementRetour />} />
                  <Route path="/commandes" element={<MesCommandes />} />
                  <Route path="/commandes/:id" element={<CommandeDetail />} />
                  <Route path="/tableau-de-bord" element={<TableauDeBord />} />
                  <Route path="/favoris" element={<Favoris />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/parametres" element={<Parametres />} />
                </Route>
              </Route>
              {/* Mode démo : page de paiement simulée, hors du menu étudiant */}
              <Route element={<ProtectedRoute role={ROLES.STUDENT} />}>
                <Route path="/paiement/simulation/:id" element={<PaiementSimulation />} />
              </Route>

              <Route element={<ProtectedRoute role={ROLES.MERCHANT} />}>
                <Route path="/commercant" element={<Layout titre="Espace commerçant" liens={LIENS_COMMERCANT} />}>
                  <Route index element={<MerchantDashboard />} />
                  <Route path="offres" element={<Offers />} />
                  <Route path="offres/nouvelle" element={<OfferForm />} />
                  <Route path="offres/:id" element={<OfferForm />} />
                  <Route path="commandes" element={<Orders />} />
                  <Route path="statistiques" element={<Statistiques />} />
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
                  <Route path="signalements" element={<Signalements />} />
                  <Route path="offres" element={<Moderation />} />
                  <Route path="commandes" element={<CommandesAdmin />} />
                </Route>
              </Route>
            </Routes>
            </Suspense>
            <BanniereCookies />
          </ErreurPage>
        </BrowserRouter>
      </AuthProvider>
    </PreferencesProvider>
  )
}
