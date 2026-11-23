import { Link } from 'react-router-dom';
import './SellerLink.css';

/**
 * Pastille avec l'initiale + pseudo du vendeur, qui mène vers son profil public.
 * Utilisée sur les cartes produit et sur la page d'un produit.
 */
export default function SellerLink({ userId, username }) {
  const profileUrl = `/user/${userId}`;

  return (
    <Link to={profileUrl} className="seller-link">
      <span className="seller-link-avatar" aria-hidden="true">
        {username.charAt(0).toUpperCase()}
      </span>
      <span className="seller-link-username">{username}</span>
    </Link>
  );
}
