import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { CartProvider } from '../src/context/CartContext.jsx';
import { LikesProvider } from '../src/context/LikesContext.jsx';
import { MessagesProvider } from '../src/context/MessagesContext.jsx';
import { ProductsProvider } from '../src/context/ProductsContext.jsx';
import { setLoggedInUser } from './fakeApi.js';

/** Les mêmes Providers que dans App.jsx, pour que les composants testés aient accès aux données. */
export function AllProviders({ children }) {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <LikesProvider>
            <MessagesProvider>{children}</MessagesProvider>
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
 * @param {string} [options.route] - Adresse de départ (ex : "/product/1").
 * @param {string} [options.path] - Modèle de route du composant (ex : "/product/:id"), pour useParams.
 * @returns L'objet de Testing Library + `user` pour simuler clics et saisies.
 *   La fonction est async : à utiliser avec `await renderWithProviders(...)`.
 */
export async function renderWithProviders(ui, { route = '/', path = '*' } = {}) {
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
  await waitForDataToLoad();
  return { user, ...result };
}

/**
 * Laisse le temps aux Providers et aux pages de recevoir les réponses de la (fausse) API.
 * Au démarrage, plusieurs chargements s'enchaînent (utilisateur connecté, puis ses favoris...) :
 * on laisse donc passer quelques "tours" avant de commencer les vérifications.
 * `act` indique à React d'appliquer tous les changements d'état qui en résultent.
 */
export async function waitForDataToLoad() {
  for (let round = 0; round < 3; round += 1) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  }
}

/** Enregistre un utilisateur comme connecté avant d'afficher le composant (voir tests/fakeApi.js). */
export function loginAs(userId) {
  setLoggedInUser(userId);
}
