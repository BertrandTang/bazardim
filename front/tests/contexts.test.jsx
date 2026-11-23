import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PRODUCTS, TEST_PASSWORD } from './fixtures.js';
import { AllProviders, loginAs, waitForDataToLoad } from './renderWithProviders.jsx';
import { useAuth } from '../src/context/AuthContext.jsx';
import { useCart } from '../src/context/CartContext.jsx';
import { useLikes } from '../src/context/LikesContext.jsx';
import { useProducts } from '../src/context/ProductsContext.jsx';

// renderHook exécute un hook comme s'il était dans un composant ;
// `wrapper` l'entoure des Providers de l'application.
// On attend ensuite la fin des chargements depuis la (fausse) API.
async function renderAllHooks() {
  const hooks = renderHook(() => ({ auth: useAuth(), cart: useCart(), likes: useLikes(), products: useProducts() }), {
    wrapper: AllProviders,
  });
  await waitForDataToLoad();
  return hooks;
}

describe('AuthContext', () => {
  it('connecte avec les bons identifiants, refuse les mauvais, puis déconnecte', async () => {
    const { result } = await renderAllHooks();
    expect(result.current.auth.isLoading).toBe(false);
    expect(result.current.auth.currentUser).toBeNull();

    // Une fonction async qui échoue "rejette" sa promesse : on le vérifie avec .rejects.
    await expect(result.current.auth.login('collectionneurdu92@example.com', 'mauvais')).rejects.toThrow(
      'Email ou mot de passe incorrect.',
    );
    expect(result.current.auth.currentUser).toBeNull();

    await act(() => result.current.auth.login('collectionneurdu92@example.com', TEST_PASSWORD));
    expect(result.current.auth.currentUser.username).toBe('CollectionneurDu92');

    await act(() => result.current.auth.logout());
    expect(result.current.auth.currentUser).toBeNull();
  });

  it('reconnaît un utilisateur déjà connecté au chargement de l’application', async () => {
    loginAs(1);
    const { result } = await renderAllHooks();
    expect(result.current.auth.currentUser).toMatchObject({ id: 1, username: 'CollectionneurDu92' });
  });

  it('inscrit un nouvel utilisateur, refuse un email déjà utilisé, puis modifie le compte', async () => {
    const { result } = await renderAllHooks();

    await expect(
      result.current.auth.register({ username: 'Doublon', email: 'admin@example.com', password: 'motdepasse' }),
    ).rejects.toThrow('Un compte existe déjà avec cet email.');

    await act(() =>
      result.current.auth.register({ username: 'Nouveau', email: 'nouveau@example.com', password: 'motdepasse' }),
    );
    expect(result.current.auth.currentUser.username).toBe('Nouveau');

    await act(() => result.current.auth.updateAccount({ username: 'Renommé' }));
    expect(result.current.auth.currentUser.username).toBe('Renommé');
  });
});

describe('ProductsContext', () => {
  it('charge les produits et liste les licences sans doublon', async () => {
    const { result } = await renderAllHooks();
    expect(result.current.products.isLoading).toBe(false);
    expect(result.current.products.products).toHaveLength(PRODUCTS.length);
    expect(new Set(result.current.products.licences).size).toBe(result.current.products.licences.length);
  });

  it('ajoute, modifie et supprime un produit', async () => {
    loginAs(1);
    const { result } = await renderAllHooks();

    let createdProduct;
    await act(async () => {
      createdProduct = await result.current.products.addProduct({
        title: 'Test',
        price: 10,
        licence_name: 'Licence test',
      });
    });
    expect(result.current.products.products).toHaveLength(PRODUCTS.length + 1);
    expect(result.current.products.licences).toContain('Licence test');

    await act(() => result.current.products.updateProduct(createdProduct.id, { title: 'Modifié' }));
    expect(result.current.products.findProductById(createdProduct.id).title).toBe('Modifié');

    await act(() => result.current.products.deleteProduct(createdProduct.id));
    expect(result.current.products.findProductById(createdProduct.id)).toBeNull();
  });

  it('refuse de supprimer l’annonce d’un autre utilisateur', async () => {
    loginAs(1);
    const { result } = await renderAllHooks();
    // Le produit 2 appartient à l'utilisateur 2.
    await expect(result.current.products.deleteProduct(2)).rejects.toThrow('vos propres annonces');
    expect(result.current.products.findProductById(2)).not.toBeNull();
  });
});

describe('CartContext', () => {
  it('ajoute des annonces (une seule fois chacune), calcule le total et en retire', async () => {
    const { result } = await renderAllHooks();

    act(() => result.current.cart.addToCart(1)); // 59.99 €
    act(() => result.current.cart.addToCart(1)); // déjà dans le panier : sans effet (pièce unique)
    act(() => result.current.cart.addToCart(2)); // 74.99 €
    expect(result.current.cart.cartProducts.map((product) => product.id)).toEqual([1, 2]);
    expect(result.current.cart.isInCart(1)).toBe(true);
    expect(result.current.cart.totalPrice).toBeCloseTo(59.99 + 74.99);

    act(() => result.current.cart.removeFromCart(1));
    expect(result.current.cart.cartProducts.map((product) => product.id)).toEqual([2]);
    expect(result.current.cart.isInCart(1)).toBe(false);
  });

  it('ignore les produits supprimés entre-temps et peut être vidé', async () => {
    loginAs(1);
    const { result } = await renderAllHooks();
    act(() => result.current.cart.addToCart(1));
    act(() => result.current.cart.addToCart(2));

    // Le produit 1 appartient à l'utilisateur 1, qui le supprime.
    await act(() => result.current.products.deleteProduct(1));
    expect(result.current.cart.cartProducts).toHaveLength(1);

    act(() => result.current.cart.clearCart());
    expect(result.current.cart.cartProducts).toHaveLength(0);
  });
});

describe('LikesContext', () => {
  it('garde une liste de favoris séparée pour chaque utilisateur', async () => {
    loginAs(1);
    const { result } = await renderAllHooks();

    await act(() => result.current.likes.toggleLike(1));
    expect(result.current.likes.isLiked(1)).toBe(true);

    // Un autre utilisateur se connecte : il ne voit pas les favoris du premier.
    await act(() => result.current.auth.login('admin@example.com', TEST_PASSWORD));
    await waitForDataToLoad();
    expect(result.current.likes.isLiked(1)).toBe(false);

    await act(() => result.current.likes.toggleLike(2));
    await act(() => result.current.likes.toggleLike(2));
    expect(result.current.likes.likedProductIds).toEqual([]);

    // Le premier utilisateur retrouve ses favoris en se reconnectant.
    await act(() => result.current.auth.login('collectionneurdu92@example.com', TEST_PASSWORD));
    await waitForDataToLoad();
    expect(result.current.likes.likedProductIds).toEqual([1]);
  });
});
