import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { LikesProvider } from '../context/LikesContext.jsx';
import { ProductsProvider } from '../context/ProductsContext.jsx';
import { ReviewsProvider } from '../context/ReviewsContext.jsx';

/** Les mêmes Providers que dans App.jsx, pour que les composants testés aient accès aux données. */
export function AllProviders({ children }) {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <LikesProvider>
            <ReviewsProvider>{children}</ReviewsProvider>
          </LikesProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

/** Affiche l'adresse courante : permet de vérifier qu'une redirection a bien eu lieu. */
function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname + location.search}</div>;
}

/**
 * Affiche un composant comme dans l'application : avec les Providers et un routeur.
 *
 * @param {React.ReactNode} ui - Le composant à tester.
 * @param {object} [options]
 * @param {string} [options.route] - Adresse de départ (ex : "/product/FIG001").
 * @param {string} [options.path] - Modèle de route du composant (ex : "/product/:id"), pour useParams.
 * @returns L'objet de Testing Library + `user` pour simuler clics et saisies.
 */
export function renderWithProviders(ui, { route = '/', path = '*' } = {}) {
  const user = userEvent.setup();
  const result = render(
    <AllProviders>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          {/* Toute autre adresse affiche une page factice : utile pour vérifier les redirections. */}
          <Route path="*" element={<p>Autre page</p>} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>
    </AllProviders>,
  );
  return { user, ...result };
}

/** Enregistre un utilisateur comme connecté avant d'afficher le composant (voir AuthContext). */
export function loginAs(userId) {
  localStorage.setItem('currentUserId', JSON.stringify(userId));
}
