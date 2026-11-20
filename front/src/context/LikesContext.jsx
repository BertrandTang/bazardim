import { createContext, useContext } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState.js';
import { useAuth } from './AuthContext.jsx';

const LikesContext = createContext(null);

/**
 * Fournit les produits "likés" (favoris) de l'utilisateur connecté.
 * Chaque utilisateur a sa propre liste ; un visiteur non connecté utilise la liste "guest".
 */
export function LikesProvider({ children }) {
  const { currentUser } = useAuth();

  // Objet de la forme : { "101": ["FIG001", "FIG004"], "guest": ["FIG002"] }
  const [likedProductIdsByUser, setLikedProductIdsByUser] = useLocalStorageState('likesByUser', {});

  const userKey = currentUser ? String(currentUser.user_id) : 'guest';
  const likedProductIds = likedProductIdsByUser[userKey] ?? [];

  function isLiked(productId) {
    return likedProductIds.includes(productId);
  }

  /** Ajoute le produit aux favoris s'il n'y est pas, sinon le retire. */
  function toggleLike(productId) {
    setLikedProductIdsByUser((previousLikes) => {
      const userLikes = previousLikes[userKey] ?? [];
      const nextUserLikes = userLikes.includes(productId)
        ? userLikes.filter((likedProductId) => likedProductId !== productId)
        : [...userLikes, productId];
      return { ...previousLikes, [userKey]: nextUserLikes };
    });
  }

  const contextValue = { likedProductIds, isLiked, toggleLike };
  return <LikesContext.Provider value={contextValue}>{children}</LikesContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder aux favoris. */
export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes doit être utilisé à l’intérieur de <LikesProvider>');
  }
  return context;
}
