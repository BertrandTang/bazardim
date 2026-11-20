import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout/Layout.jsx';
import RequireAuth from '../components/RequireAuth.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { LikesProvider } from '../context/LikesContext.jsx';
import { ProductsProvider } from '../context/ProductsContext.jsx';
import { ReviewsProvider } from '../context/ReviewsContext.jsx';
import { CATEGORIES } from '../data/categories.js';
import Auth from '../pages/Auth/Auth.jsx';
import Cart from '../pages/Cart/Cart.jsx';
import Home from '../pages/Home/Home.jsx';
import Product from '../pages/Product/Product.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import Sell from '../pages/Sell/Sell.jsx';
import SignUp from '../pages/SignUp/SignUp.jsx';
import UserProfile from '../pages/UserProfile/UserProfile.jsx';

export default function App() {
  return (
    // Les "Providers" rendent les données partagées accessibles à toute l'application.
    // L'ordre compte : un Provider peut utiliser ceux qui l'entourent
    // (ex : CartProvider a besoin des produits, LikesProvider de l'utilisateur connecté).
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <LikesProvider>
            <ReviewsProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/licences" element={<Home />} />
                    {/* Une page par catégorie, générée à partir de la liste CATEGORIES */}
                    {CATEGORIES.map((category) => (
                      <Route
                        key={category.value}
                        path={category.path}
                        element={<Home category={category.value} />}
                      />
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
                  </Routes>
                </Layout>
              </BrowserRouter>
            </ReviewsProvider>
          </LikesProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
