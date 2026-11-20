import { createContext, useContext } from 'react';
import profilesData from '../data/profiles.json';
import useLocalStorageState from '../hooks/useLocalStorageState.js';

// ⚠️ TEMPORAIRE : en attendant le back-end, les comptes sont stockés dans le navigateur
// (localStorage) et les mots de passe sont en clair. Il faudra remplacer ces fonctions
// par des appels à l'API (ex : POST /auth/login, POST /auth/register).

// Un "contexte" permet de partager des données avec TOUS les composants de l'application
// sans devoir les passer de parent en enfant via les props.
const AuthContext = createContext(null);

/**
 * Fournit l'utilisateur connecté et les fonctions de connexion à toute l'application.
 * Tous les composants placés à l'intérieur de <AuthProvider> peuvent appeler useAuth().
 */
export function AuthProvider({ children }) {
  // Liste de tous les comptes : ceux du fichier JSON + ceux créés via l'inscription.
  const [users, setUsers] = useLocalStorageState('users', profilesData.profiles);

  // Identifiant de l'utilisateur connecté, ou null si personne n'est connecté.
  const [currentUserId, setCurrentUserId] = useLocalStorageState('currentUserId', null);

  // Pas besoin de useState ici : c'est une valeur recalculée à chaque affichage
  // à partir des deux états ci-dessus.
  const currentUser = users.find((user) => user.user_id === currentUserId) ?? null;

  /** Retrouve un utilisateur à partir de son identifiant (nombre ou texte venant de l'URL). */
  function findUserById(userId) {
    return users.find((user) => String(user.user_id) === String(userId)) ?? null;
  }

  /** Connecte l'utilisateur. Retourne true si l'email et le mot de passe sont corrects. */
  function login(email, password) {
    const matchingUser = users.find((user) => user.email === email && user.password === password);
    if (!matchingUser) {
      return false;
    }
    setCurrentUserId(matchingUser.user_id);
    return true;
  }

  function logout() {
    setCurrentUserId(null);
  }

  /** Crée un compte puis connecte l'utilisateur. Retourne false si l'email est déjà utilisé. */
  function register({ username, email, password }) {
    const emailAlreadyUsed = users.some((user) => user.email === email);
    if (emailAlreadyUsed) {
      return false;
    }

    const newUser = { user_id: Date.now(), username, email, password, profile_img: '' };
    // On passe une fonction à setUsers : React nous donne la liste actuelle
    // et on retourne la nouvelle liste (on ne modifie jamais l'ancienne directement).
    setUsers((previousUsers) => [...previousUsers, newUser]);
    setCurrentUserId(newUser.user_id);
    return true;
  }

  /** Met à jour les informations du compte connecté (pseudo, email, image...). */
  function updateCurrentUser(changes) {
    setUsers((previousUsers) =>
      previousUsers.map((user) => (user.user_id === currentUserId ? { ...user, ...changes } : user)),
    );
  }

  const contextValue = { currentUser, findUserById, login, logout, register, updateCurrentUser };
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
