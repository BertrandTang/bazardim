import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AllProviders } from './renderWithProviders.jsx';
import { useAuth } from '../src/context/AuthContext.jsx';
import { useCart } from '../src/context/CartContext.jsx';
import { useLikes } from '../src/context/LikesContext.jsx';
import { useProducts } from '../src/context/ProductsContext.jsx';

// renderHook exécute un hook comme s'il était dans un composant ;
// `wrapper` l'entoure des Providers de l'application.
function renderAllHooks() {
  return renderHook(() => ({ auth: useAuth(), cart: useCart(), likes: useLikes(), products: useProducts() }), {
    wrapper: AllProviders,
  });
}

describe('AuthContext', () => {
  it('connecte avec les bons identifiants, refuse les mauvais, puis déconnecte', () => {
    const { result } = renderAllHooks();

    act(() => expect(result.current.auth.login('collectionneurdu92@example.com', 'mauvais')).toBe(false));
    expect(result.current.auth.currentUser).toBeNull();

    act(() => expect(result.current.auth.login('collectionneurdu92@example.com', 'password123')).toBe(true));
    expect(result.current.auth.currentUser.username).toBe('CollectionneurDu92');

    act(() => result.current.auth.logout());
    expect(result.current.auth.currentUser).toBeNull();
  });

  it('inscrit un nouvel utilisateur mais refuse un email déjà utilisé', () => {
    const { result } = renderAllHooks();

    act(() => {
      expect(
        result.current.auth.register({ username: 'Doublon', email: 'admin@example.com', password: 'motdepasse' }),
      ).toBe(false);
    });
    act(() => {
      expect(
        result.current.auth.register({ username: 'Nouveau', email: 'nouveau@example.com', password: 'motdepasse' }),
      ).toBe(true);
    });
    expect(result.current.auth.currentUser.username).toBe('Nouveau');

    act(() => result.current.auth.updateCurrentUser({ username: 'Renommé' }));
    expect(result.current.auth.currentUser.username).toBe('Renommé');
    expect(result.current.auth.findUserById(result.current.auth.currentUser.user_id).username).toBe('Renommé');
  });
});

describe('ProductsContext', () => {
  it('ajoute, modifie et supprime un produit, et liste les licences sans doublon', () => {
    const { result } = renderAllHooks();
    const initialCount = result.current.products.products.length;
    expect(new Set(result.current.products.licences).size).toBe(result.current.products.licences.length);

    act(() =>
      result.current.products.addProduct({ id: 'TEST1', title: 'Test', price: 10, licence_name: 'Licence test' }),
    );
    expect(result.current.products.products).toHaveLength(initialCount + 1);
    expect(result.current.products.licences).toContain('Licence test');

    act(() => result.current.products.updateProduct('TEST1', { title: 'Modifié' }));
    expect(result.current.products.findProductById('TEST1').title).toBe('Modifié');

    act(() => result.current.products.deleteProduct('TEST1'));
    expect(result.current.products.findProductById('TEST1')).toBeNull();
  });
});

describe('CartContext', () => {
  it('ajoute des produits, change les quantités et calcule le total', () => {
    const { result } = renderAllHooks();

    act(() => result.current.cart.addToCart('FIG001')); // 59.99 €
    act(() => result.current.cart.addToCart('FIG001'));
    act(() => result.current.cart.addToCart('FIG002')); // 74.99 €
    expect(result.current.cart.itemCount).toBe(3);
    expect(result.current.cart.totalPrice).toBeCloseTo(59.99 * 2 + 74.99);

    act(() => result.current.cart.changeQuantity('FIG001', -2));
    expect(result.current.cart.cartLines.map((cartLine) => cartLine.product.id)).toEqual(['FIG002']);

    act(() => result.current.cart.removeFromCart('FIG002'));
    expect(result.current.cart.itemCount).toBe(0);
  });

  it('ignore les produits supprimés entre-temps et peut être vidé', () => {
    const { result } = renderAllHooks();
    act(() => result.current.cart.addToCart('FIG001'));
    act(() => result.current.cart.addToCart('FIG002'));

    act(() => result.current.products.deleteProduct('FIG001'));
    expect(result.current.cart.cartLines).toHaveLength(1);

    act(() => result.current.cart.clearCart());
    expect(result.current.cart.cartLines).toHaveLength(0);
  });
});

describe('LikesContext', () => {
  it('garde une liste de favoris séparée pour chaque utilisateur', () => {
    const { result } = renderAllHooks();

    act(() => result.current.likes.toggleLike('FIG001'));
    expect(result.current.likes.isLiked('FIG001')).toBe(true);

    act(() => result.current.auth.login('admin@example.com', 'admin123'));
    expect(result.current.likes.isLiked('FIG001')).toBe(false);

    act(() => result.current.likes.toggleLike('FIG002'));
    act(() => result.current.likes.toggleLike('FIG002'));
    expect(result.current.likes.likedProductIds).toEqual([]);
  });
});
