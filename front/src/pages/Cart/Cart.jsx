import AddressAutocomplete from '../../components/AddressAutocomplete/AddressAutocomplete.jsx';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { useCart } from '../../context/CartContext.jsx';
import useLocalStorageState from '../../hooks/useLocalStorageState.js';
import { formatPrice, getProductImage } from '../../utils/productHelpers.js';
import './Cart.css';

/** Page panier : liste des articles, modification des quantités et total de la commande. */
export default function Cart() {
  const { cartLines, totalPrice, changeQuantity, removeFromCart, clearCart } = useCart();
  // Adresse de livraison choisie, gardée d'une visite à l'autre (null tant qu'aucune n'est choisie).
  const [shippingAddress, setShippingAddress] = useLocalStorageState('shippingAddress', null);

  if (cartLines.length === 0) {
    return (
      <section className="cart-page">
        <PageMetadata title="Panier" noIndex />
        <h1>Panier</h1>
        <p className="cart-empty">Votre panier est vide.</p>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <PageMetadata title="Panier" noIndex />
      <div className="cart-header">
        <h1>Panier</h1>
        <button type="button" className="cart-clear-button" onClick={clearCart}>
          Vider le panier
        </button>
      </div>

      <ul className="cart-list">
        {cartLines.map(({ product, quantity }) => (
          <li key={product.id} className="cart-item">
            <div className="cart-item-left">
              <div className="cart-item-thumbnail">
                {quantity > 1 && <span className="cart-quantity-badge">x{quantity}</span>}
                <img src={getProductImage(product)} alt="" />
              </div>
              <div className="cart-item-info">
                <span className="cart-item-title">{product.title}</span>
                <span className="cart-item-unit-price">{formatPrice(product.price)} / unité</span>
              </div>
            </div>

            <div className="cart-item-right">
              <div className="cart-quantity-controls">
                <button
                  type="button"
                  className="cart-quantity-button"
                  aria-label={`Retirer un exemplaire de ${product.title}`}
                  onClick={() => changeQuantity(product.id, -1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="cart-quantity-value">{quantity}</span>
                <button
                  type="button"
                  className="cart-quantity-button"
                  aria-label={`Ajouter un exemplaire de ${product.title}`}
                  onClick={() => changeQuantity(product.id, +1)}
                >
                  +
                </button>
              </div>
              <span className="cart-item-total">{formatPrice(product.price * quantity)}</span>
              <button type="button" className="cart-remove-button" onClick={() => removeFromCart(product.id)}>
                Retirer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="cart-shipping" aria-labelledby="cart-shipping-title">
        <h2 id="cart-shipping-title">Livraison</h2>
        <AddressAutocomplete value={shippingAddress} onChange={setShippingAddress} />
      </section>

      <div className="cart-summary">
        <span className="cart-summary-label">Total commande</span>
        <span className="cart-summary-value">{formatPrice(totalPrice)}</span>
        {/* TODO : brancher le paiement (Stripe) une fois le back-end en place */}
        <button type="button" className="cart-checkout-button" disabled>
          Commander (bientôt disponible)
        </button>
      </div>
    </section>
  );
}
