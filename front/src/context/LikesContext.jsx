import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const LikesContext = createContext(null);

/**
 * Fournit les produits "likés" (favoris) de l'utilisateur connecté.
 * Les favoris sont enregistrés par l'API : il faut donc être connecté pour en ajouter.
 */
export function LikesProvider({ children }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? null;

  // On retient à quel utilisateur appartient la liste : { userId: 3, productIds: [1, 4] }.
  // Ainsi, après une déconnexion ou un changement de compte, on n'affiche jamais
  // les favoris de la personne précédente.
  const [likes, setLikes] = useState({ userId: null, productIds: [] });

  // Recharge les favoris à chaque fois que l'utilisateur connecté change
  // (c'est le rôle du tableau [currentUserId] : relancer l'effet quand cette valeur change).
  useEffect(() => {
    if (currentUserId === null) {
      return;
    }
    api
      .fetchLikedProducts()
      .then((likedProducts) =>
        setLikes({ userId: currentUserId, productIds: likedProducts.map((product) => product.id) }),
      )
      .catch(() => setLikes({ userId: currentUserId, productIds: [] }));
  }, [currentUserId]);

  // Valeur calculée : une liste vide si la liste chargée appartient à quelqu'un d'autre.
  const likedProductIds = likes.userId === currentUserId ? likes.productIds : [];

  function isLiked(productId) {
    return likedProductIds.includes(productId);
  }

  /** Ajoute le produit aux favoris s'il n'y est pas, sinon le retire. */
  async function toggleLike(productId) {
    if (isLiked(productId)) {
      await api.unlikeProduct(productId);
      setLikes((previousLikes) => ({
        ...previousLikes,
        productIds: previousLikes.productIds.filter((likedProductId) => likedProductId !== productId),
      }));
    } else {
      await api.likeProduct(productId);
      setLikes((previousLikes) => ({ ...previousLikes, productIds: [...previousLikes.productIds, productId] }));
    }
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
