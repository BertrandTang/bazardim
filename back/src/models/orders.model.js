import { query, withTransaction } from '../config/database.js';

// Une commande avec ses articles. json_agg regroupe les articles (order_items) de chaque commande
// dans un tableau JSON "items" ; FILTER ignore la ligne vide d'une commande sans article.
const ORDER_SELECT = `
  SELECT
    orders.id,
    orders.buyer_id,
    orders.status,
    orders.total_price,
    orders.service_fee,
    orders.shipping_address,
    orders.stripe_session_id,
    orders.created_at,
    orders.paid_at,
    COALESCE(
      json_agg(
        json_build_object(
          'product_id', order_items.product_id,
          'product_title', order_items.product_title,
          'price', order_items.price,
          'shipped_at', order_items.shipped_at
        )
        ORDER BY order_items.id
      ) FILTER (WHERE order_items.id IS NOT NULL),
      '[]'
    ) AS items
  FROM orders
  LEFT JOIN order_items ON order_items.order_id = orders.id`;

/**
 * Crée une commande "en attente de paiement" et ses articles, dans une transaction
 * (soit tout est enregistré, soit rien). Retourne l'id de la commande.
 */
export async function insertOrder({ buyerId, shippingAddress, totalPrice, serviceFee, lines }) {
  return withTransaction(async (transactionQuery) => {
    const rows = await transactionQuery(
      `INSERT INTO orders (buyer_id, shipping_address, total_price, service_fee)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [buyerId, shippingAddress, totalPrice, serviceFee],
    );
    const orderId = rows[0].id;

    for (const line of lines) {
      await transactionQuery(
        `INSERT INTO order_items (order_id, product_id, product_title, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, line.productId, line.productTitle, line.price],
      );
    }
    return orderId;
  });
}

/** Retient l'identifiant de la session de paiement Stripe de la commande. */
export async function setOrderStripeSession(orderId, stripeSessionId) {
  await query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [stripeSessionId, orderId]);
}

/**
 * Marque comme payée la commande liée à cette session Stripe (si elle ne l'est pas déjà),
 * puis marque ses produits comme vendus. Les deux se font dans une transaction :
 * on ne peut pas avoir une commande payée dont les produits seraient encore en vente.
 */
export async function markOrderAsPaid(stripeSessionId) {
  await withTransaction(async (transactionQuery) => {
    const paidOrders = await transactionQuery(
      `UPDATE orders SET status = 'paid', paid_at = now()
       WHERE stripe_session_id = $1 AND status = 'pending'
       RETURNING id`,
      [stripeSessionId],
    );
    // Commande déjà payée (ou inconnue) : rien d'autre à faire.
    if (paidOrders.length === 0) {
      return;
    }
    await transactionQuery(
      `UPDATE products SET sold_at = now()
       WHERE sold_at IS NULL
         AND id IN (SELECT product_id FROM order_items WHERE order_id = $1)`,
      [paidOrders[0].id],
    );
  });
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

/**
 * Ventes d'un vendeur : pour chacune de ses annonces vendues (commande payée), qui l'a achetée, quand,
 * où l'expédier et si elle a déjà été expédiée.
 * LEFT JOIN sur users : si l'acheteur a supprimé son compte (buyer_id vide), la vente reste listée,
 * avec un pseudo vide.
 */
export async function findSalesBySeller(sellerId) {
  return query(
    `SELECT
       order_items.id AS order_item_id,
       order_items.product_id,
       orders.buyer_id,
       users.username AS buyer_username,
       orders.shipping_address,
       orders.paid_at,
       order_items.shipped_at
     FROM order_items
     JOIN orders ON orders.id = order_items.order_id
     JOIN products ON products.id = order_items.product_id
     LEFT JOIN users ON users.id = orders.buyer_id
     WHERE products.owner_id = $1 AND orders.status = 'paid'
     ORDER BY orders.paid_at DESC`,
    [sellerId],
  );
}

/**
 * Une ligne de commande avec ce qu'il faut pour vérifier qui peut la marquer comme expédiée :
 * le vendeur de l'annonce (owner_id), le statut de la commande et la date d'expédition.
 */
export async function findOrderItemForShipping(orderItemId) {
  const rows = await query(
    `SELECT order_items.id, order_items.shipped_at, orders.status, products.owner_id
     FROM order_items
     JOIN orders ON orders.id = order_items.order_id
     JOIN products ON products.id = order_items.product_id
     WHERE order_items.id = $1`,
    [orderItemId],
  );
  return rows[0] ?? null;
}

/** Enregistre la date d'expédition d'une ligne de commande et la renvoie. */
export async function markOrderItemAsShipped(orderItemId) {
  const rows = await query(
    'UPDATE order_items SET shipped_at = now() WHERE id = $1 RETURNING id AS order_item_id, shipped_at',
    [orderItemId],
  );
  return rows[0];
}
