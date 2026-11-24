import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../src/config/database.js';
import { stripe } from '../src/config/stripe.js';
import { anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

// Stripe est simulé : les tests n'appellent jamais les serveurs de Stripe.
// vi.mock remplace le fichier src/config/stripe.js par cet objet, partout dans l'application.
vi.mock('../src/config/stripe.js', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  },
}));

useEmptyDatabase();

const SHIPPING_ADDRESS = '10 Rue de Rivoli 75004 Paris';

beforeEach(() => {
  vi.resetAllMocks();
  // Par défaut, Stripe crée une session de paiement fictive.
  stripe.checkout.sessions.create.mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/c/pay/cs_test_123',
  });
  // Par défaut, le paiement n'est pas encore fait quand on relit la commande.
  stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'unpaid' });
});

/** Un vendeur avec deux annonces (20 € et 35,50 €), et un acheteur. */
async function createSellerAndBuyer() {
  const seller = await createLoggedInUser();
  const buyer = await createLoggedInUser();
  const firstProduct = (await seller.agent.post('/api/products').send(buildProduct({ character_name: 'A', price: 20 })))
    .body;
  const secondProduct = (
    await seller.agent.post('/api/products').send(buildProduct({ character_name: 'B', price: 35.5 }))
  ).body;
  return { seller, buyer, firstProduct, secondProduct };
}

/** Passe une commande des produits A et B (renvoie la requête supertest). */
function placeOrder({ buyer, firstProduct, secondProduct }) {
  return buyer.agent.post('/api/orders').send({
    product_ids: [firstProduct.id, secondProduct.id],
    shipping_address: SHIPPING_ADDRESS,
  });
}

describe('Commandes et paiement Stripe', () => {
  it('crée la commande avec les prix de la base et renvoie l’adresse de la page de paiement', async () => {
    const context = await createSellerAndBuyer();

    const response = await placeOrder(context).expect(201);
    expect(response.body.checkout_url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');

    // Stripe a reçu les bons montants, en centimes, et une dernière ligne pour les frais de service :
    // 0,70 € + 5 % de 55,50 € (2,775 €, arrondi à 2,78 €) = 3,48 €.
    const stripeRequest = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(stripeRequest.line_items.map((line) => [line.price_data.unit_amount, line.quantity])).toEqual([
      [2000, 1],
      [3550, 1],
      [348, 1],
    ]);
    expect(stripeRequest.line_items[2].price_data.product_data.name).toBe('Frais de service Bazardim');
    expect(stripeRequest.success_url).toBe(
      `http://localhost:5173/commande/confirmation?order_id=${response.body.order_id}`,
    );

    // La commande est enregistrée "en attente", avec un total calculé par le serveur.
    const order = await context.buyer.agent.get(`/api/orders/${response.body.order_id}`).expect(200);
    expect(order.body).toMatchObject({
      status: 'pending',
      total_price: 58.98, // 55,50 € d'articles + 3,48 € de frais
      service_fee: 3.48,
      shipping_address: SHIPPING_ADDRESS,
    });
    expect(order.body.items).toEqual([
      { product_id: context.firstProduct.id, product_title: 'Figurine – A (Gear 5 Ver.)', price: 20, shipped_at: null },
      {
        product_id: context.secondProduct.id,
        product_title: 'Figurine – B (Gear 5 Ver.)',
        price: 35.5,
        shipped_at: null,
      },
    ]);
    expect(order.body).not.toHaveProperty('stripe_session_id');
  });

  it('ignore un prix ou des frais envoyés par le navigateur', async () => {
    const { buyer, firstProduct } = await createSellerAndBuyer();
    const response = await buyer.agent
      .post('/api/orders')
      .send({ product_ids: [firstProduct.id], price: 0.01, service_fee: 0, shipping_address: SHIPPING_ADDRESS })
      .expect(201);
    const order = await buyer.agent.get(`/api/orders/${response.body.order_id}`);
    // 20 € d'articles + frais calculés par le serveur (0,70 € + 5 % de 20 € = 1,70 €).
    expect(order.body.service_fee).toBe(1.7);
    expect(order.body.total_price).toBe(21.7);
  });

  it('refuse un panier vide, une adresse manquante, une annonce en double, inexistante ou à soi', async () => {
    const { seller, buyer, firstProduct } = await createSellerAndBuyer();
    const oneProduct = [firstProduct.id];

    await buyer.agent.post('/api/orders').send({ product_ids: [], shipping_address: SHIPPING_ADDRESS }).expect(400);
    await buyer.agent.post('/api/orders').send({ product_ids: oneProduct, shipping_address: '' }).expect(400);
    // La même annonce deux fois : refusé (pièce unique).
    await buyer.agent
      .post('/api/orders')
      .send({ product_ids: [firstProduct.id, firstProduct.id], shipping_address: SHIPPING_ADDRESS })
      .expect(400);
    await buyer.agent
      .post('/api/orders')
      .send({ product_ids: [9999], shipping_address: SHIPPING_ADDRESS })
      .expect(404);
    await seller.agent
      .post('/api/orders')
      .send({ product_ids: oneProduct, shipping_address: SHIPPING_ADDRESS })
      .expect(400);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('refuse un visiteur non connecté (401)', async () => {
    await anonymous().post('/api/orders').send({}).expect(401);
    await anonymous().get('/api/orders').expect(401);
  });

  it('supprime la commande et répond 502 si Stripe est indisponible', async () => {
    const context = await createSellerAndBuyer();
    stripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe en panne'));

    await placeOrder(context).expect(502);
    const orders = await context.buyer.agent.get('/api/orders').expect(200);
    expect(orders.body).toEqual([]);
  });

  it('confirme le paiement en interrogeant Stripe à l’affichage de la commande', async () => {
    const context = await createSellerAndBuyer();
    const { order_id: orderId } = (await placeOrder(context)).body;

    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'unpaid' });
    expect((await context.buyer.agent.get(`/api/orders/${orderId}`)).body.status).toBe('pending');

    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid' });
    const order = await context.buyer.agent.get(`/api/orders/${orderId}`).expect(200);
    expect(order.body.status).toBe('paid');
    expect(order.body.paid_at).not.toBeNull();
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123');
  });

  it('marque les annonces comme vendues une fois payées, et refuse ensuite de les commander', async () => {
    const context = await createSellerAndBuyer();
    const { order_id: orderId } = (await placeOrder(context)).body;

    // Tant que la commande n'est pas payée, l'annonce reste en vente.
    const beforePayment = await anonymous().get(`/api/products/${context.firstProduct.id}`);
    expect(beforePayment.body.sold_at).toBeNull();

    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid' });
    await context.buyer.agent.get(`/api/orders/${orderId}`).expect(200);

    const afterPayment = await anonymous().get(`/api/products/${context.firstProduct.id}`);
    expect(afterPayment.body.sold_at).not.toBeNull();

    // Un autre acheteur ne peut plus la commander.
    const otherBuyer = await createLoggedInUser();
    const response = await otherBuyer.agent
      .post('/api/orders')
      .send({ product_ids: [context.firstProduct.id], shipping_address: SHIPPING_ADDRESS })
      .expect(409);
    expect(response.body.error).toContain('vient d’être vendu');
  });

  it('une fois vendue, le vendeur voit l’acheteur et ne peut plus modifier l’annonce', async () => {
    const context = await createSellerAndBuyer();
    const { order_id: orderId } = (await placeOrder(context)).body;

    // Avant le paiement : aucune vente.
    expect((await context.seller.agent.get('/api/orders/sales').expect(200)).body).toEqual([]);

    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid' });
    await context.buyer.agent.get(`/api/orders/${orderId}`).expect(200);

    // Le vendeur voit le pseudo de l'acheteur pour ses deux annonces.
    const sales = (await context.seller.agent.get('/api/orders/sales').expect(200)).body;
    expect(sales).toHaveLength(2);
    expect(sales[0]).toMatchObject({ buyer_id: context.buyer.user.id, buyer_username: context.buyer.user.username });
    expect(sales.map((sale) => sale.product_id).sort()).toEqual(
      [context.firstProduct.id, context.secondProduct.id].sort(),
    );

    // L'acheteur, lui, n'a rien vendu.
    expect((await context.buyer.agent.get('/api/orders/sales')).body).toEqual([]);

    // L'annonce vendue ne peut plus être modifiée.
    const response = await context.seller.agent
      .put(`/api/products/${context.firstProduct.id}`)
      .send(buildProduct({ character_name: 'Nouveau personnage' }))
      .expect(409);
    expect(response.body.error).toContain('ne peut plus être modifiée');
  });

  it('le vendeur voit l’adresse de livraison et marque l’article comme expédié', async () => {
    const context = await createSellerAndBuyer();
    const { order_id: orderId } = (await placeOrder(context)).body;

    // Commande pas encore payée : impossible de marquer comme expédié.
    const firstItemId = (
      await query('SELECT id FROM order_items WHERE order_id = $1 ORDER BY id LIMIT 1', [orderId])
    )[0].id;
    await context.seller.agent.patch(`/api/orders/items/${firstItemId}/shipped`).expect(409);

    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid' });
    await context.buyer.agent.get(`/api/orders/${orderId}`).expect(200);

    // Le vendeur voit où expédier, et rien n'est encore expédié.
    const sale = (await context.seller.agent.get('/api/orders/sales')).body.find(
      (candidate) => candidate.product_id === context.firstProduct.id,
    );
    expect(sale).toMatchObject({ shipping_address: SHIPPING_ADDRESS, shipped_at: null });

    // Ni l'acheteur ni un inconnu ne peuvent marquer l'article comme expédié (404 : rien n'est révélé).
    await context.buyer.agent.patch(`/api/orders/items/${sale.order_item_id}/shipped`).expect(404);
    await anonymous().patch(`/api/orders/items/${sale.order_item_id}/shipped`).expect(401);
    await context.seller.agent.patch('/api/orders/items/999999/shipped').expect(404);

    // Le vendeur marque l'article comme expédié, une seule fois.
    const shipped = await context.seller.agent.patch(`/api/orders/items/${sale.order_item_id}/shipped`).expect(200);
    expect(shipped.body.shipped_at).not.toBeNull();
    await context.seller.agent.patch(`/api/orders/items/${sale.order_item_id}/shipped`).expect(409);

    // L'acheteur voit l'article expédié dans sa commande ; l'autre article ne l'est pas encore.
    const order = (await context.buyer.agent.get(`/api/orders/${orderId}`)).body;
    expect(order.items[0].shipped_at).not.toBeNull();
    expect(order.items[1].shipped_at).toBeNull();
  });

  it('une commande n’est visible que par son acheteur', async () => {
    const context = await createSellerAndBuyer();
    const { order_id: orderId } = (await placeOrder(context)).body;

    await context.seller.agent.get(`/api/orders/${orderId}`).expect(404);
    expect((await context.seller.agent.get('/api/orders')).body).toEqual([]);
    expect((await context.buyer.agent.get('/api/orders')).body).toHaveLength(1);
  });

  describe('webhook Stripe', () => {
    it('refuse un appel dont la signature est invalide (400)', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found');
      });
      await anonymous()
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send('{"type":"checkout.session.completed"}')
        .expect(400);
    });

    it('marque la commande comme payée quand Stripe confirme le paiement', async () => {
      const context = await createSellerAndBuyer();
      const { order_id: orderId } = (await placeOrder(context)).body;

      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123', payment_status: 'paid' } },
      });
      await anonymous()
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 'signature-de-test')
        .send('{}')
        .expect(200, { received: true });

      // La signature a été vérifiée avec le corps brut de la requête.
      const [rawBody, signature] = stripe.webhooks.constructEvent.mock.calls[0];
      expect(Buffer.isBuffer(rawBody)).toBe(true);
      expect(signature).toBe('signature-de-test');

      // Plus besoin d'interroger Stripe : la commande est déjà payée.
      const order = await context.buyer.agent.get(`/api/orders/${orderId}`);
      expect(order.body.status).toBe('paid');
      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();

      // Les produits de la commande sont marqués vendus.
      const product = await anonymous().get(`/api/products/${context.secondProduct.id}`);
      expect(product.body.sold_at).not.toBeNull();
    });
  });
});
