import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api.js';

// Un "contexte" permet de partager des données avec TOUS les composants de l'application
// sans devoir les passer de parent en enfant via les props.
const AuthContext = createContext(null);

/**
 * Fournit l'utilisateur connecté et les fonctions de connexion à toute l'application.
 * Tous les composants placés à l'intérieur de <AuthProvider> peuvent appeler useAuth().
 *
 * La connexion est gérée par l'API : elle dépose un cookie "httpOnly" dans le navigateur.
 * Le front ne voit jamais ce cookie ni le mot de passe : il garde seulement l'utilisateur
 * renvoyé par l'API ({ id, username, email, profile_image_url, role }).
 */
export function AuthProvider({ children }) {
  // Utilisateur connecté, ou null pour un visiteur.
  const [currentUser, setCurrentUser] = useState(null);
  // Vrai tant qu'on ne sait pas encore si quelqu'un est connecté (réponse de l'API en attente).
  const [isLoading, setIsLoading] = useState(true);

  // useEffect avec [] : exécuté une seule fois, après le premier affichage.
  // On demande à l'API qui est connecté (le cookie a pu être déposé lors d'une visite précédente).
  useEffect(() => {
    api
      .fetchCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Les fonctions suivantes sont "async" : elles attendent la réponse de l'API.
  // En cas d'erreur (mauvais mot de passe, email déjà pris...), l'API renvoie un message
  // et la fonction lance une erreur que la page attrape (try/catch) pour l'afficher.

  async function login(email, password) {
    const user = await api.login(email, password);
    setCurrentUser(user);
  }

  async function register({ username, email, password }) {
    const user = await api.register({ username, email, password });
    setCurrentUser(user);
  }

  async function logout() {
    await api.logout();
    setCurrentUser(null);
  }

  /** Met à jour le compte connecté (pseudo, email, image, mot de passe). */
  async function updateAccount(changes) {
    const user = await api.updateAccount(changes);
    setCurrentUser(user);
  }

  /** Supprime définitivement le compte connecté, puis "déconnecte" l'application. */
  async function deleteAccount(currentPassword) {
    await api.deleteAccount(currentPassword);
    setCurrentUser(null);
  }

  const contextValue = { currentUser, isLoading, login, logout, register, updateAccount, deleteAccount };
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder à l'utilisateur connecté et aux fonctions d'authentification. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>');
  }
  return context;
}
