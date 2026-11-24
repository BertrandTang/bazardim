import { config } from '../config/config.js';
import { stripe } from '../config/stripe.js';
import { HttpError } from '../utils/errors.js';
import { computeServiceFeeInCents } from '../utils/serviceFee.js';
import { idSchema } from '../validators/common.validator.js';
import { createOrderSchema } from '../validators/orders.validator.js';
import {
  deleteOrderById,
  findOrderById,
  findOrdersByBuyer,
  findOrderItemForShipping,
  findSalesBySeller,
  insertOrder,
  markOrderAsPaid,
  markOrderItemAsShipped,
  setOrderStripeSession,
} from '../models/orders.model.js';
import { findProductById } from '../models/products.model.js';

/**
 * Convertit un prix en centimes (nombre entier). Stripe compte en centimes,
 * et calculer en entiers évite les erreurs d'arrondi des nombres à virgule (0.1 + 0.2 = 0.30000000000000004).
 */
function toCents(price) {
  return Math.round(price * 100);
}

/** Ce qu'on renvoie au front : tout sauf l'identifiant interne de la session Stripe. */
function toOrderResponse(order) {
  const orderResponse = { ...order }; // copie, pour ne pas modifier l'objet d'origine
  delete orderResponse.stripe_session_id;
  return orderResponse;
}

/** Retrouve une commande de l'utilisateur connecté (404 si elle n'existe pas ou appartient à quelqu'un d'autre). */
async function findOwnOrder(request) {
  const orderId = idSchema.parse(request.params.id);
  const order = await findOrderById(orderId);
  // Même réponse si la commande n'existe pas ou n'est pas la sienne : on ne révèle rien.
  if (!order || order.buyer_id !== request.user.id) {
    throw new HttpError(404, 'Commande introuvable.');
  }
  return order;
}

/**
 * POST /api/orders — crée la commande et la page de paiement Stripe.
 * Réponse : { order_id, checkout_url } ; le front redirige l'utilisateur vers checkout_url.
 */
export async function createOrder(request, response) {
  const { product_ids: productIds, shipping_address: shippingAddress } = createOrderSchema.parse(request.body);

  // 1. On relit chaque produit en base : titre et prix viennent de NOTRE base, pas du navigateur.
  const lines = [];
  for (const productId of productIds) {
    const product = await findProductById(productId);
    if (!product) {
      throw new HttpError(404, 'Un produit de votre panier n’est plus en vente.');
    }
    if (product.sold_at) {
      throw new HttpError(409, `« ${product.title} » vient d’être vendu, retirez-le de votre panier.`);
    }
    if (product.owner_id === request.user.id) {
      throw new HttpError(400, `Vous ne pouvez pas acheter votre propre annonce (« ${product.title} »).`);
    }
    lines.push({ productId: product.id, productTitle: product.title, price: product.price });
  }

  // 2. Montants calculés côté serveur, en centimes : prix des articles + frais de service.
  const itemsTotalInCents = lines.reduce((total, line) => total + toCents(line.price), 0);
  const serviceFeeInCents = computeServiceFeeInCents(itemsTotalInCents);
  const orderId = await insertOrder({
    buyerId: request.user.id,
    shippingAddress,
    totalPrice: (itemsTotalInCents + serviceFeeInCents) / 100,
    serviceFee: serviceFeeInCents / 100,
    lines,
  });

  // 3. Création de la page de paiement chez Stripe ("Checkout") : la carte bancaire
  //    est saisie sur le site de Stripe, elle ne passe jamais par notre serveur.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        ...lines.map((line) => ({
          quantity: 1, // pièce unique
          price_data: {
            currency: 'eur',
            unit_amount: toCents(line.price),
            product_data: { name: line.productTitle },
          },
        })),
        // Dernière ligne : les frais de service, affichés à part sur la page de paiement.
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: serviceFeeInCents,
            product_data: { name: 'Frais de service Bazardim' },
          },
        },
      ],
      customer_email: request.user.email,
      // Permet de retrouver la commande à partir de la session Stripe.
      client_reference_id: String(orderId),
      // Pages où Stripe renvoie l'utilisateur après le paiement ou s'il annule.
      success_url: `${config.FRONT_URL}/commande/confirmation?order_id=${orderId}`,
      cancel_url: `${config.FRONT_URL}/cart`,
    });
  } catch {
    // Stripe injoignable ou clé invalide : on supprime la commande qui ne pourra pas être payée.
    await deleteOrderById(orderId);
    throw new HttpError(502, 'Le service de paiement est indisponible, réessayez plus tard.');
  }

  await setOrderStripeSession(orderId, session.id);
  response.status(201).json({ order_id: orderId, checkout_url: session.url });
}

/** GET /api/orders — commandes de l'utilisateur connecté. */
export async function listOrders(request, response) {
  const orders = await findOrdersByBuyer(request.user.id);
  response.json(orders.map(toOrderResponse));
}

/**
 * GET /api/orders/sales — ventes de l'utilisateur connecté : qui a acheté chacune de ses annonces.
 * Seul le vendeur voit le pseudo de l'acheteur (il n'apparaît pas sur l'annonce publique).
 */
export async function listSales(request, response) {
  response.json(await findSalesBySeller(request.user.id));
}

/**
 * PATCH /api/orders/items/:id/shipped — le vendeur indique qu'il a expédié un article vendu.
 * L'acheteur le voit ensuite dans « Mes commandes » (« Expédié le ... »).
 */
export async function markAsShipped(request, response) {
  const orderItemId = idSchema.parse(request.params.id);
  const item = await findOrderItemForShipping(orderItemId);

  // Article inexistant, ou qui n'est pas une annonce de cet utilisateur : même réponse 404,
  // pour ne rien révéler des commandes des autres.
  if (!item || item.owner_id !== request.user.id) {
    throw new HttpError(404, 'Vente introuvable.');
  }
  if (item.status !== 'paid') {
    throw new HttpError(409, 'La commande n’est pas encore payée : l’article ne peut pas être expédié.');
  }
  if (item.shipped_at) {
    throw new HttpError(409, 'Cet article est déjà marqué comme expédié.');
  }

  response.json(await markOrderItemAsShipped(orderItemId));
}

/**
 * GET /api/orders/:id — une commande de l'utilisateur connecté (page de confirmation).
 * Si elle est encore "en attente", on demande à Stripe si le paiement a abouti :
 * le paiement est ainsi confirmé même sans webhook (pratique en local).
 */
export async function getOrder(request, response) {
  let order = await findOwnOrder(request);

  if (order.status === 'pending' && order.stripe_session_id) {
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (session.payment_status === 'paid') {
      await markOrderAsPaid(order.stripe_session_id);
      order = await findOrderById(order.id);
    }
  }
  response.json(toOrderResponse(order));
}

/**
 * POST /api/stripe/webhook — Stripe nous prévient qu'un paiement a abouti.
 * C'est la confirmation la plus fiable : elle arrive même si l'acheteur ferme son navigateur
 * avant de revenir sur le site.
 */
export async function handleStripeWebhook(request, response) {
  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, 'Webhook Stripe non configuré (STRIPE_WEBHOOK_SECRET).');
  }

  // On vérifie la signature envoyée par Stripe : sans cela, n'importe qui pourrait
  // appeler cette adresse et faire passer une commande pour payée.
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.body, // corps BRUT de la requête (voir app.js) : nécessaire pour vérifier la signature
      request.headers['stripe-signature'],
      config.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new HttpError(400, 'Signature Stripe invalide.');
  }

  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    await markOrderAsPaid(event.data.object.id);
  }
  // On répond toujours 200 aux événements valides, sinon Stripe les renverrait.
  response.json({ received: true });
}
