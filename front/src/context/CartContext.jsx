import { createContext, useContext } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState.js';
import { useProducts } from './ProductsContext.jsx';

const CartContext = createContext(null);

/**
 * Fournit le panier à toute l'application.
 *
 * Le panier ne stocke que l'identifiant du produit et la quantité : { productId, quantity }.
 * Les informations du produit (titre, prix...) sont relues dans ProductsContext, ce qui évite
 * d'afficher un prix périmé si le vendeur modifie son annonce.
 */
export function CartProvider({ children }) {
  const { findProductById } = useProducts();
  const [cartItems, setCartItems] = useLocalStorageState('cartItems', []);

  // On associe chaque ligne du panier à son produit complet.
  // Si un produit a été supprimé entre-temps, on l'ignore.
  const cartLines = cartItems
    .map((cartItem) => ({ product: findProductById(cartItem.productId), quantity: cartItem.quantity }))
    .filter((cartLine) => cartLine.product !== null);

  // Nombre total d'articles (affiché dans la pastille de la barre de navigation).
  const itemCount = cartLines.reduce((total, cartLine) => total + cartLine.quantity, 0);
  const totalPrice = cartLines.reduce((total, cartLine) => total + cartLine.product.price * cartLine.quantity, 0);

  /** Ajoute un exemplaire du produit (ou augmente sa quantité s'il est déjà dans le panier). */
  function addToCart(productId) {
    setCartItems((previousItems) => {
      const isAlreadyInCart = previousItems.some((cartItem) => cartItem.productId === productId);
      if (!isAlreadyInCart) {
        return [...previousItems, { productId, quantity: 1 }];
      }
      return previousItems.map((cartItem) =>
        cartItem.productId === productId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
      );
    });
  }

  /** Ajoute (+1) ou retire (-1) des exemplaires. Une ligne qui tombe à 0 est supprimée. */
  function changeQuantity(productId, quantityChange) {
    setCartItems((previousItems) =>
      previousItems
        .map((cartItem) =>
          cartItem.productId === productId ? { ...cartItem, quantity: cartItem.quantity + quantityChange } : cartItem,
        )
        .filter((cartItem) => cartItem.quantity > 0),
    );
  }

  function removeFromCart(productId) {
    setCartItems((previousItems) => previousItems.filter((cartItem) => cartItem.productId !== productId));
  }

  function clearCart() {
    setCartItems([]);
  }

  const contextValue = {
    cartLines,
    itemCount,
    totalPrice,
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
  };
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
