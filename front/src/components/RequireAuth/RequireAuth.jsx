import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Protège une page : si personne n'est connecté, on redirige vers la page de connexion.
 * On transmet la page demandée (`from`) pour pouvoir y revenir après la connexion.
 *
 * Utilisation : <RequireAuth><Profile /></RequireAuth>
 */
export default function RequireAuth({ children }) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  // Au chargement de l'application, on attend que l'API dise si quelqu'un est connecté
  // (sinon on redirigerait vers la connexion un utilisateur qui l'est déjà).
  if (isLoading) {
    return <p className="layout-loading">Chargement…</p>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}
