import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import OrderSummary from '../../components/OrderSummary/OrderSummary.jsx';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { fetchOrder } from '../../services/api.js';
import './OrderConfirmation.css';

/**
 * Page où Stripe renvoie l'acheteur après le paiement : /commande/confirmation?order_id=12
 * (adresse "success_url" donnée à Stripe par le back-end).
 */
export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCart();
  const { reloadProducts } = useProducts();

  // Commande chargée depuis l'API (null tant que rien n'est chargé).
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  // Augmenter ce compteur relance le chargement (bouton "Vérifier à nouveau").
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    fetchOrder(orderId)
      .then((loadedOrder) => {
        setOrder(loadedOrder);
        // Paiement confirmé : le panier a été acheté, on peut le vider,
        // et on recharge les annonces (celles achetées sont maintenant "vendues").
        if (loadedOrder.status === 'paid') {
          clearCart();
          reloadProducts();
        }
      })
      .catch((error) => setErrorMessage(error.message));
  }, [orderId, reloadCount, clearCart, reloadProducts]);

  if (errorMessage) {
    return (
      <section className="order-confirmation-page">
        <PageMetadata title="Commande" noIndex />
        <h1>Commande introuvable</h1>
        <Alert severity="error">{errorMessage}</Alert>
      </section>
    );
  }

  if (!order) {
    return <p className="layout-loading">Chargement…</p>;
  }

  const isPaid = order.status === 'paid';

  return (
    <section className="order-confirmation-page">
      <PageMetadata title="Confirmation de commande" noIndex />
      <h1>{isPaid ? 'Merci pour votre commande !' : 'Paiement en cours de vérification'}</h1>

      {isPaid ? (
        <Alert severity="success">Votre paiement est confirmé. Commande n° {order.id}.</Alert>
      ) : (
        <Alert severity="info">
          Le paiement n’est pas encore confirmé par Stripe. Si vous venez de payer, patientez quelques secondes.
          <Button size="small" onClick={() => setReloadCount(reloadCount + 1)} sx={{ ml: 1 }}>
            Vérifier à nouveau
          </Button>
        </Alert>
      )}

      <OrderSummary order={order} />

      <p>
        Retrouvez vos commandes dans <Link to="/profile">votre profil</Link>, onglet « Mes commandes ».
      </p>
    </section>
  );
}
