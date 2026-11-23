import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/productHelpers.js';
import './OrderSummary.css';

// Texte affiché pour chaque statut de commande renvoyé par l'API.
const STATUS_LABELS = {
  pending: 'En attente de paiement',
  paid: 'Payée',
};

/** Formate une date de l'API ("2026-11-23T10:15:00Z") en texte français : "23/11/2026". */
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR');
}

/**
 * Récapitulatif d'une commande : date, statut, articles, adresse et total.
 * Utilisé sur la page de confirmation et dans l'onglet "Mes commandes" du profil.
 */
export default function OrderSummary({ order }) {
  return (
    <article className="order-summary">
      <header className="order-summary-header">
        <h2>
          Commande n° {order.id} du {formatDate(order.created_at)}
        </h2>
        <span className={`order-status ${order.status}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
      </header>

      <ul className="order-summary-items">
        {order.items.map((item, index) => (
          // L'annonce a pu être supprimée depuis (product_id vide) : on garde le titre copié à l'achat.
          <li key={item.product_id ?? `deleted-${index}`}>
            <span>
              {item.quantity} ×{' '}
              {item.product_id ? (
                <Link to={`/product/${item.product_id}`}>{item.product_title}</Link>
              ) : (
                item.product_title
              )}
            </span>
            <span>{formatPrice(item.unit_price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="order-summary-address">Livraison : {order.shipping_address}</p>
      <p className="order-summary-total">
        Total : <strong>{formatPrice(order.total_price)}</strong>
      </p>
    </article>
  );
}
