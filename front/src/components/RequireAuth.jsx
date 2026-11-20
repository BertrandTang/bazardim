// Ce composant protège une route : il vérifie si l'utilisateur est connecté.
// Si l'utilisateur n'est pas authentifié, il est redirigé vers la page de connexion.
// Sinon, il affiche les enfants (children) passés en props.
// Méthodes utilisées :
// - useAuth() : récupère l'utilisateur connecté depuis le contexte d'authentification
// - useLocation() : récupère la localisation actuelle pour rediriger après login
// - <Navigate /> : effectue la redirection vers /auth si non connecté

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}
