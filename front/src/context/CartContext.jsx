import { createContext, useCallback, useContext } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState.js';
import { useProducts } from './ProductsContext.jsx';

const CartContext = createContext(null);

/**
 * Fournit le panier à toute l'application.
 *
 * Chaque annonce est une pièce unique (comme sur Vinted) : le panier est donc une simple
 * liste d'identifiants d'annonces, sans quantité, par exemple [3, 8].
 * Il reste enregistré dans le navigateur (localStorage) : un visiteur peut le remplir sans être connecté.
 * Les informations du produit (titre, prix...) sont relues dans ProductsContext, ce qui évite
 * d'afficher un prix périmé si le vendeur modifie son annonce.
 */
export function CartProvider({ children }) {
  const { findProductById } = useProducts();
  const [cartProductIds, setCartProductIds] = useLocalStorageState('cartProductIds', []);

  // Produits complets du panier. Si une annonce a été supprimée ou vendue entre-temps, on l'ignore.
  const cartProducts = cartProductIds
    .map((productId) => findProductById(productId))
    .filter((product) => product !== null && !product.sold_at);

  // Total à payer : la somme des prix des annonces du panier.
  const totalPrice = cartProducts.reduce((total, product) => total + product.price, 0);

  function isInCart(productId) {
    return cartProductIds.includes(productId);
  }

  /** Ajoute une annonce au panier (sans effet si elle y est déjà : c'est une pièce unique). */
  function addToCart(productId) {
    setCartProductIds((previousIds) => (previousIds.includes(productId) ? previousIds : [...previousIds, productId]));
  }

  function removeFromCart(productId) {
    setCartProductIds((previousIds) => previousIds.filter((cartProductId) => cartProductId !== productId));
  }

  // useCallback garde la MÊME fonction d'un affichage à l'autre (au lieu d'en recréer une).
  // C'est nécessaire car la page de confirmation de commande l'utilise dans un useEffect :
  // une fonction recréée à chaque affichage relancerait cet effet en boucle.
  const clearCart = useCallback(() => setCartProductIds([]), [setCartProductIds]);

  const contextValue = { cartProducts, totalPrice, isInCart, addToCart, removeFromCart, clearCart };
  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder au panier. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé à l’intérieur de <CartProvider>');
  }
  return context;
}
