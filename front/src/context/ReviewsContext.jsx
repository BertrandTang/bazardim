import { createContext, useContext } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState.js';
import { useAuth } from './AuthContext.jsx';

// ⚠️ TEMPORAIRE : les avis sont stockés dans le localStorage en attendant le back-end.
// La vérification "seul l'auteur peut modifier son avis" devra aussi être faite côté serveur.

const ReviewsContext = createContext(null);

/** Trie une liste d'avis du plus récent au plus ancien (sans modifier la liste d'origine). */
function sortNewestFirst(reviews) {
  return [...reviews].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
}

/**
 * Fournit les avis laissés sur les profils vendeurs.
 * Un avis a la forme : { id, targetUserId, authorUserId, authorUsername, rating, comment, createdAt }
 */
export function ReviewsProvider({ children }) {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useLocalStorageState('profileReviews', []);

  /** Avis reçus par un utilisateur, du plus récent au plus ancien. */
  function getReviewsAbout(userId) {
    return sortNewestFirst(reviews.filter((review) => String(review.targetUserId) === String(userId)));
  }

  /** Avis écrits par un utilisateur, du plus récent au plus ancien. */
  function getReviewsWrittenBy(userId) {
    return sortNewestFirst(reviews.filter((review) => String(review.authorUserId) === String(userId)));
  }

  /** Note moyenne reçue par un utilisateur (0 s'il n'a aucun avis). */
  function getAverageRating(userId) {
    const receivedReviews = getReviewsAbout(userId);
    if (receivedReviews.length === 0) {
      return 0;
    }
    const ratingsSum = receivedReviews.reduce((total, review) => total + review.rating, 0);
    return ratingsSum / receivedReviews.length;
  }

  /** Vérifie que l'utilisateur connecté est bien l'auteur de l'avis. */
  function isAuthorOf(review) {
    return currentUser !== null && String(review.authorUserId) === String(currentUser.user_id);
  }

  /** Publie un avis de l'utilisateur connecté sur le profil `targetUserId`. */
  function addReview(targetUserId, rating, comment) {
    const newReview = {
      id: `REV${Date.now()}`,
      targetUserId: String(targetUserId),
      authorUserId: String(currentUser.user_id),
      authorUsername: currentUser.username,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    setReviews((previousReviews) => [...previousReviews, newReview]);
  }

  function updateReview(reviewId, rating, comment) {
    const updatedAt = new Date().toISOString();
    setReviews((previousReviews) =>
      previousReviews.map((review) =>
        review.id === reviewId && isAuthorOf(review) ? { ...review, rating, comment, updatedAt } : review,
      ),
    );
  }

  function deleteReview(reviewId) {
    setReviews((previousReviews) =>
      previousReviews.filter((review) => !(review.id === reviewId && isAuthorOf(review))),
    );
  }

  const contextValue = {
    getReviewsAbout,
    getReviewsWrittenBy,
    getAverageRating,
    isAuthorOf,
    addReview,
    updateReview,
    deleteReview,
  };
  return <ReviewsContext.Provider value={contextValue}>{children}</ReviewsContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder aux avis. */
export function useReviews() {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews doit être utilisé à l’intérieur de <ReviewsProvider>');
  }
  return context;
}
