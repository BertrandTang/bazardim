import { useCart } from '../../context/CartContext.jsx';
import './AddToCartButton.css';

/**
 * Bouton "AJOUTER" qui met l'annonce dans le panier.
 * Une annonce est une pièce unique : une fois dans le panier, le bouton affiche
 * "DANS LE PANIER" et ne peut plus être cliqué.
 */
export default function AddToCartButton({ productId }) {
  const { isInCart, addToCart } = useCart();
  const isAlreadyInCart = isInCart(productId);

  return (
    <div className="add-to-cart">
      <button
        type="button"
        className="add-to-cart-button"
        onClick={() => addToCart(productId)}
        disabled={isAlreadyInCart}
      >
        {isAlreadyInCart ? 'DANS LE PANIER' : 'AJOUTER'}
      </button>
      {/* aria-live : les lecteurs d'écran annoncent ce texte quand il apparaît (après le clic). */}
      <span className="visually-hidden" aria-live="polite">
        {isAlreadyInCart ? 'Ajouté au panier' : ''}
      </span>
    </div>
  );
}
