import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLikes } from '../../context/LikesContext.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { formatPrice, getImageObjectPosition, getProductImage } from '../../utils/productHelpers.js';
import AddToCartButton from '../AddToCartButton/AddToCartButton.jsx';
import SellerLink from '../SellerLink/SellerLink.jsx';
import './ProductCard.css';

/**
 * Carte de présentation d'un produit, utilisée dans les listes de produits.
 *
 * Deux versions :
 * - par défaut : bouton favori + bouton "AJOUTER" au panier ;
 * - si `onEdit` et `onDelete` sont fournis (page "Mes produits") : boutons Modifier / Supprimer.
 *   Une annonce vendue ne peut plus être modifiée : à la place du bouton Modifier, on affiche
 *   la vente (`sale`, voir GET /api/orders/sales) : acheteur, adresse de livraison, et un bouton
 *   pour indiquer l'expédition (`onShip`).
 */
export default function ProductCard({ product, onEdit, onDelete, sale, onShip }) {
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
          <img
            src={getProductImage(product)}
            alt={product.title}
            loading="lazy"
            style={{ objectPosition: getImageObjectPosition(product) }}
          />
        </Link>
        {product.sold_at && <span className="product-sold-badge">Vendu</span>}
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

      {isOwnerView && product.sold_at && <SaleDetails sale={sale} onShip={onShip} />}

      <div className="product-bottom">
        <span className="product-price">{formatPrice(product.price)}</span>
        {isOwnerView ? (
          <div className="product-owner-actions">
            {/* Une annonce vendue ne peut plus être modifiée (l'API le refuse aussi). */}
            {!product.sold_at && (
              <button type="button" className="product-edit-button" onClick={() => onEdit(product)}>
                Modifier
              </button>
            )}
            <button type="button" className="product-delete-button" onClick={() => onDelete(product)}>
              Supprimer
            </button>
          </div>
        ) : (
          // Une annonce vendue ne peut plus être ajoutée au panier.
          !product.sold_at && <AddToCartButton productId={product.id} />
        )}
      </div>
    </article>
  );
}

/**
 * Encadré d'une annonce vendue, visible uniquement par le vendeur : à qui elle a été vendue,
 * à qui et où l'expédier (nom, adresse, téléphone pour le transporteur), puis le bouton « Marquer comme expédié » (ou la date d'expédition).
 */
function SaleDetails({ sale, onShip }) {
  // Les ventes sont encore en cours de chargement.
  if (!sale) {
    return null;
  }

  return (
    <div className="product-sale">
      <p>
        Vendu à{' '}
        {sale.buyer_username ? <Link to={`/user/${sale.buyer_id}`}>{sale.buyer_username}</Link> : 'un compte supprimé'}
      </p>
      <p>
        <strong>Livrer à :</strong> {sale.shipping_name}, {sale.shipping_address}
      </p>
      <p>
        <strong>Téléphone :</strong> {sale.shipping_phone}
      </p>
      {sale.shipped_at ? (
        <p className="product-sale-shipped">✓ Expédié le {formatDate(sale.shipped_at)}</p>
      ) : (
        <button type="button" className="product-ship-button" onClick={() => onShip(sale)}>
          Marquer comme expédié
        </button>
      )}
    </div>
  );
}
