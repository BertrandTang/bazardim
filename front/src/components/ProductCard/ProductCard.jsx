import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLikes } from '../../context/LikesContext.jsx';
import { formatPrice, getProductImage } from '../../utils/productHelpers.js';
import AddToCartButton from '../AddToCartButton/AddToCartButton.jsx';
import SellerLink from '../SellerLink/SellerLink.jsx';
import './ProductCard.css';

/**
 * Carte de présentation d'un produit, utilisée dans les listes de produits.
 *
 * Deux versions :
 * - par défaut : bouton favori + bouton "AJOUTER" au panier ;
 * - si `onEdit` et `onDelete` sont fournis (page "Mes produits") : boutons Modifier / Supprimer.
 */
export default function ProductCard({ product, onEdit, onDelete }) {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { isLiked, toggleLike } = useLikes();
  const navigate = useNavigate();

  const isOwnerView = Boolean(onEdit && onDelete);
  const liked = isLiked(product.id);
  const likeLabel = liked ? 'Retirer des favoris' : 'Ajouter aux favoris';
  const productUrl = `/product/${product.id}`;

  // Les favoris sont enregistrés sur le compte : un visiteur est d'abord envoyé vers la connexion.
  function handleLikeClick() {
    // Au tout début, on ne sait pas encore si quelqu'un est connecté : on ignore le clic.
    if (isAuthLoading) {
      return;
    }
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    toggleLike(product.id);
  }

  // Étiquettes colorées affichées sous le titre (on ignore celles qui sont vides).
  const labels = [
    { text: product.category, type: 'category' },
    { text: product.licence_name, type: 'licence' },
    { text: product.character_name, type: 'character' },
    { text: product.tags?.join(', '), type: 'custom' },
  ].filter((label) => label.text);

  return (
    <article className="product-card">
      <SellerLink userId={product.owner_id} username={product.owner_username} />

      <div className="product-image">
        <Link to={productUrl}>
          <img src={getProductImage(product)} alt={product.title} loading="lazy" />
        </Link>
        {!isOwnerView && (
          <button
            type="button"
            className={liked ? 'like-button active' : 'like-button'}
            aria-label={likeLabel}
            aria-pressed={liked}
            title={likeLabel}
            onClick={handleLikeClick}
          >
            {liked ? '♥' : '♡'}
          </button>
        )}
      </div>

      <h2 className="product-title">
        <Link to={productUrl}>{product.title}</Link>
      </h2>

      <div className="product-tags">
        {labels.map((label) => (
          <span key={label.type} className={`product-tag ${label.type}`}>
            {label.text}
          </span>
        ))}
      </div>

      <p className="product-description">{product.description}</p>
      <p className="product-manufacturer">Fabricant : {product.manufacturer || 'N/C'}</p>

      <div className="product-bottom">
        <span className="product-price">{formatPrice(product.price)}</span>
        {isOwnerView ? (
          <div className="product-owner-actions">
            <button type="button" className="product-edit-button" onClick={() => onEdit(product)}>
              Modifier
            </button>
            <button type="button" className="product-delete-button" onClick={() => onDelete(product)}>
              Supprimer
            </button>
          </div>
        ) : (
          <AddToCartButton productId={product.id} />
        )}
      </div>
    </article>
  );
}
