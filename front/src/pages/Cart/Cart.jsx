import { useState } from 'react';
import { Link } from 'react-router-dom';
import AddressAutocomplete from '../../components/AddressAutocomplete/AddressAutocomplete.jsx';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import useLocalStorageState from '../../hooks/useLocalStorageState.js';
import { createOrder } from '../../services/api.js';
import { redirectTo } from '../../utils/redirect.js';
import { formatPrice, getProductImage } from '../../utils/productHelpers.js';
import { computeServiceFee, SERVICE_FEE_DESCRIPTION } from '../../utils/serviceFee.js';
import './Cart.css';

/** Page panier : liste des articles, adresse de livraison et total de la commande (frais de service compris). */
export default function Cart() {
  const { currentUser } = useAuth();
  const { cartProducts, totalPrice, removeFromCart, clearCart } = useCart();
  // Adresse de livraison choisie, gardée d'une visite à l'autre (null tant qu'aucune n'est choisie).
  const [shippingAddress, setShippingAddress] = useLocalStorageState('shippingAddress', null);
  const [orderError, setOrderError] = useState('');
  // Vrai pendant la création de la commande : évite un double clic sur "Commander".
  const [isOrdering, setIsOrdering] = useState(false);
  // Frais de service ajoutés au prix des articles (voir utils/serviceFee.js).
  const serviceFee = computeServiceFee(totalPrice);

  /**
   * Crée la commande puis envoie l'utilisateur sur la page de paiement de Stripe.
   * Le panier n'est vidé qu'une fois le paiement confirmé (page de confirmation) :
   * si l'utilisateur annule le paiement, il retrouve son panier intact.
   */
  async function handleOrder() {
    setOrderError('');
    setIsOrdering(true);
    try {
      const { checkout_url: checkoutUrl } = await createOrder({
        // On n'envoie que les identifiants des annonces : le back relit les prix.
        product_ids: cartProducts.map((product) => product.id),
        shipping_address: shippingAddress.label,
      });
      redirectTo(checkoutUrl);
    } catch (error) {
      setOrderError(error.message);
      setIsOrdering(false);
    }
  }

  if (cartProducts.length === 0) {
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
        {cartProducts.map((product) => (
          <li key={product.id} className="cart-item">
            <div className="cart-item-left">
              <div className="cart-item-thumbnail">
                <img src={getProductImage(product)} alt="" />
              </div>
              <div className="cart-item-info">
                <span className="cart-item-title">{product.title}</span>
                <span className="cart-item-seller">Vendu par {product.owner_username}</span>
              </div>
            </div>

            <div className="cart-item-right">
              <span className="cart-item-total">{formatPrice(product.price)}</span>
              <button
                type="button"
                className="cart-remove-button"
                aria-label={`Retirer ${product.title} du panier`}
                onClick={() => removeFromCart(product.id)}
              >
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
        {/* Détail du prix : <dl> (liste de définitions) associe chaque libellé (dt) à son montant (dd). */}
        <dl className="cart-summary-lines">
          <div>
            <dt>Articles</dt>
            <dd>{formatPrice(totalPrice)}</dd>
          </div>
          <div>
            <dt>Frais de service</dt>
            <dd>{formatPrice(serviceFee)}</dd>
          </div>
          <div className="cart-summary-total">
            <dt>Total</dt>
            <dd>{formatPrice(totalPrice + serviceFee)}</dd>
          </div>
        </dl>
        {currentUser ? (
          <button
            type="button"
            className="cart-checkout-button"
            onClick={handleOrder}
            disabled={!shippingAddress || isOrdering}
          >
            {isOrdering ? 'Redirection vers le paiement…' : 'Commander et payer'}
          </button>
        ) : (
          // `state` : après la connexion, l'utilisateur revient sur le panier (voir la page Auth).
          <Link to="/auth" state={{ from: { pathname: '/cart' } }} className="cart-checkout-button">
            Se connecter pour commander
          </Link>
        )}
      </div>
      {currentUser && !shippingAddress && (
        <p className="cart-hint">Choisissez une adresse de livraison pour pouvoir commander.</p>
      )}
      {orderError && (
        <p className="form-error" role="alert">
          {orderError}
        </p>
      )}
      <p className="cart-hint">Frais de service Bazardim : {SERVICE_FEE_DESCRIPTION}.</p>
      <p className="cart-hint">
        En commandant, vous acceptez les <Link to="/conditions-generales">conditions générales de vente</Link>.
      </p>
      <p className="cart-hint">
        Paiement sécurisé par Stripe (mode test : carte <code>4242 4242 4242 4242</code>, date future, CVC au choix).
      </p>
    </section>
  );
}
