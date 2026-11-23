import { query, withTransaction } from '../config/database.js';

// Une commande avec ses lignes. json_agg regroupe les lignes (order_items) de chaque commande
// dans un tableau JSON "items" ; FILTER ignore la ligne vide d'une commande sans article.
const ORDER_SELECT = `
  SELECT
    orders.id,
    orders.buyer_id,
    orders.status,
    orders.total_price,
    orders.shipping_address,
    orders.stripe_session_id,
    orders.created_at,
    orders.paid_at,
    COALESCE(
      json_agg(
        json_build_object(
          'product_id', order_items.product_id,
          'product_title', order_items.product_title,
          'unit_price', order_items.unit_price,
          'quantity', order_items.quantity
        )
        ORDER BY order_items.id
      ) FILTER (WHERE order_items.id IS NOT NULL),
      '[]'
    ) AS items
  FROM orders
  LEFT JOIN order_items ON order_items.order_id = orders.id`;

/**
 * Crée une commande "en attente de paiement" et ses lignes, dans une transaction
 * (soit tout est enregistré, soit rien). Retourne l'id de la commande.
 */
export async function insertOrder({ buyerId, shippingAddress, totalPrice, lines }) {
  return withTransaction(async (transactionQuery) => {
    const rows = await transactionQuery(
      `INSERT INTO orders (buyer_id, shipping_address, total_price)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [buyerId, shippingAddress, totalPrice],
    );
    const orderId = rows[0].id;

    for (const line of lines) {
      await transactionQuery(
        `INSERT INTO order_items (order_id, product_id, product_title, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, line.productId, line.productTitle, line.unitPrice, line.quantity],
      );
    }
    return orderId;
  });
}

/** Retient l'identifiant de la session de paiement Stripe de la commande. */
export async function setOrderStripeSession(orderId, stripeSessionId) {
  await query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [stripeSessionId, orderId]);
}

/** Marque comme payée la commande liée à cette session Stripe (si elle ne l'est pas déjà). */
export async function markOrderAsPaid(stripeSessionId) {
  await query(
    `UPDATE orders SET status = 'paid', paid_at = now()
     WHERE stripe_session_id = $1 AND status = 'pending'`,
    [stripeSessionId],
  );
}

export async function deleteOrderById(orderId) {
  await query('DELETE FROM orders WHERE id = $1', [orderId]);
}

export async function findOrderById(orderId) {
  const rows = await query(`${ORDER_SELECT} WHERE orders.id = $1 GROUP BY orders.id`, [orderId]);
  return rows[0] ?? null;
}

/** Commandes d'un acheteur, de la plus récente à la plus ancienne. */
export async function findOrdersByBuyer(buyerId) {
  return query(
    `${ORDER_SELECT} WHERE orders.buyer_id = $1 GROUP BY orders.id ORDER BY orders.created_at DESC, orders.id DESC`,
    [buyerId],
  );
}
