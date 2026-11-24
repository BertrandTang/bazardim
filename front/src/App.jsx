import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import RequireAuth from './components/RequireAuth/RequireAuth.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LikesProvider } from './context/LikesContext.jsx';
import { MessagesProvider } from './context/MessagesContext.jsx';
import { ProductsProvider } from './context/ProductsContext.jsx';
import { CATEGORIES } from './data/categories.js';
import Home from './pages/Home/Home.jsx';

// Chargement à la demande ("code splitting") : le code de ces pages n'est téléchargé
// que lorsque l'utilisateur les ouvre. La page d'accueil, elle, est chargée tout de suite.
// Pendant le téléchargement, <Suspense> (dans Layout.jsx) affiche "Chargement…".
const AdminLicences = lazy(() => import('./pages/AdminLicences/AdminLicences.jsx'));
const Auth = lazy(() => import('./pages/Auth/Auth.jsx'));
const LegalNotice = lazy(() => import('./pages/Legal/LegalNotice.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy.jsx'));
const TermsAndConditions = lazy(() => import('./pages/Legal/TermsAndConditions.jsx'));
const Cart = lazy(() => import('./pages/Cart/Cart.jsx'));
const Messages = lazy(() => import('./pages/Messages/Messages.jsx'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound.jsx'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation/OrderConfirmation.jsx'));
const Product = lazy(() => import('./pages/Product/Product.jsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.jsx'));
const Sell = lazy(() => import('./pages/Sell/Sell.jsx'));
const SignUp = lazy(() => import('./pages/SignUp/SignUp.jsx'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile.jsx'));

export default function App() {
  return (
    // Les "Providers" rendent les données partagées accessibles à toute l'application.
    // L'ordre compte : un Provider peut utiliser ceux qui l'entourent
    // (ex : CartProvider a besoin des produits, LikesProvider de l'utilisateur connecté).
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <LikesProvider>
            <MessagesProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/licences" element={<Home />} />
                    {/* Une page par catégorie, générée à partir de la liste CATEGORIES */}
                    {CATEGORIES.map((category) => (
                      <Route key={category.value} path={category.path} element={<Home category={category.value} />} />
                    ))}
                    <Route path="/product/:id" element={<Product />} />
                    <Route path="/user/:id" element={<UserProfile />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Pages réservées aux utilisateurs connectés */}
                    <Route
                      path="/vendre"
                      element={
                        <RequireAuth>
                          <Sell />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <RequireAuth>
                          <Profile />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/commande/confirmation"
                      element={
                        <RequireAuth>
                          <OrderConfirmation />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <RequireAuth>
                          <Messages />
                        </RequireAuth>
                      }
                    />

                    {/* Administration : la page vérifie elle-même que l'utilisateur est administrateur. */}
                    <Route
                      path="/admin/licences"
                      element={
                        <RequireAuth>
                          <AdminLicences />
                        </RequireAuth>
                      }
                    />
                    <Route path="/mentions-legales" element={<LegalNotice />} />
                    <Route path="/confidentialite" element={<PrivacyPolicy />} />
                    <Route path="/conditions-generales" element={<TermsAndConditions />} />

                    {/* "*" correspond à toutes les adresses qui n'ont pas de route : page 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </MessagesProvider>
          </LikesProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
