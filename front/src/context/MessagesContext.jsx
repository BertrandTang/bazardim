import { createContext, useCallback, useContext, useState } from 'react';
import * as api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const MessagesContext = createContext(null);

/**
 * Fournit le nombre de messages non lus de l'utilisateur connecté,
 * affiché dans une pastille à côté du lien « Messages » de la barre de navigation.
 *
 * Il n'y a pas de mise à jour "en direct" : le nombre est redemandé à l'API à chaque
 * changement de page (voir NavBar) et quand on lit un message (voir la page Messages).
 */
export function MessagesProvider({ children }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? null;

  // On retient à quel utilisateur appartient le nombre : { userId: 3, count: 2 }.
  // Après une déconnexion ou un changement de compte, on n'affiche jamais celui de la personne précédente.
  const [unread, setUnread] = useState({ userId: null, count: 0 });

  /**
   * Redemande le nombre de messages non lus à l'API.
   * useCallback garde la même fonction tant que l'utilisateur ne change pas :
   * elle peut ainsi être utilisée dans un useEffect sans le relancer en boucle.
   */
  const refreshUnreadCount = useCallback(() => {
    if (currentUserId === null) {
      return;
    }
    api
      .fetchUnreadMessageCount()
      .then(({ count }) => setUnread({ userId: currentUserId, count }))
      // En cas d'erreur, on garde simplement l'ancien nombre : la pastille n'est pas indispensable.
      .catch(() => {});
  }, [currentUserId]);

  // Valeur calculée : 0 si le nombre chargé appartient à quelqu'un d'autre (ou à personne).
  const unreadCount = unread.userId === currentUserId ? unread.count : 0;

  const contextValue = { unreadCount, refreshUnreadCount };
  return <MessagesContext.Provider value={contextValue}>{children}</MessagesContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder au nombre de messages non lus. */
export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages doit être utilisé à l’intérieur de <MessagesProvider>');
  }
  return context;
}
