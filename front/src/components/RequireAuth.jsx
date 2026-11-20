import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Protège une page : si personne n'est connecté, on redirige vers la page de connexion.
 * On transmet la page demandée (`from`) pour pouvoir y revenir après la connexion.
 *
 * Utilisation : <RequireAuth><Profile /></RequireAuth>
 */
export default function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}
