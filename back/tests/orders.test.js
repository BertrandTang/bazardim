import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  const firstProduct = (await seller.agent.post('/api/products').send(buildProduct({ title: 'A', price: 20 }))).body;
  const secondProduct = (await seller.agent.post('/api/products').send(buildProduct({ title: 'B', price: 35.5 }))).body;
  return { seller, buyer, firstProduct, secondProduct };
}

/** Passe une commande : 2 × produit A + 1 × produit B (renvoie la requête supertest). */
function placeOrder({ buyer, firstProduct, secondProduct }) {
  return buyer.agent.post('/api/orders').send({
    items: [
      { product_id: firstProduct.id, quantity: 2 },
      { product_id: secondProduct.id, quantity: 1 },
    ],
    shipping_address: SHIPPING_ADDRESS,
  });
}

describe('Commandes et paiement Stripe', () => {
  it('crée la commande avec les prix de la base et renvoie l’adresse de la page de paiement', async () => {
    const context = await createSellerAndBuyer();

    const response = await placeOrder(context).expect(201);
    expect(response.body.checkout_url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');

    // Stripe a reçu les bons montants, en centimes.
    const stripeRequest = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(stripeRequest.line_items.map((line) => [line.price_data.unit_amount, line.quantity])).toEqual([
      [2000, 2],
      [3550, 1],
    ]);
    expect(stripeRequest.success_url).toBe(
      `http://localhost:5173/commande/confirmation?order_id=${response.body.order_id}`,
    );

    // La commande est enregistrée "en attente", avec un total calculé par le serveur.
    const order = await context.buyer.agent.get(`/api/orders/${response.body.order_id}`).expect(200);
    expect(order.body).toMatchObject({ status: 'pending', total_price: 75.5, shipping_address: SHIPPING_ADDRESS });
    expect(order.body.items).toHaveLength(2);
    expect(order.body).not.toHaveProperty('stripe_session_id');
  });

  it('ignore un prix envoyé par le navigateur', async () => {
    const { buyer, firstProduct } = await createSellerAndBuyer();
    const response = await buyer.agent
      .post('/api/orders')
      .send({ items: [{ product_id: firstProduct.id, quantity: 1, price: 0.01 }], shipping_address: SHIPPING_ADDRESS })
      .expect(201);
    const order = await buyer.agent.get(`/api/orders/${response.body.order_id}`);
    expect(order.body.total_price).toBe(20);
  });

  it('refuse un panier vide, une adresse manquante, un produit inexistant ou sa propre annonce', async () => {
    const { seller, buyer, firstProduct } = await createSellerAndBuyer();
    const oneItem = [{ product_id: firstProduct.id, quantity: 1 }];

    await buyer.agent.post('/api/orders').send({ items: [], shipping_address: SHIPPING_ADDRESS }).expect(400);
    await buyer.agent.post('/api/orders').send({ items: oneItem, shipping_address: '' }).expect(400);
    await buyer.agent
      .post('/api/orders')
      .send({ items: [{ product_id: 9999, quantity: 1 }], shipping_address: SHIPPING_ADDRESS })
      .expect(404);
    await seller.agent.post('/api/orders').send({ items: oneItem, shipping_address: SHIPPING_ADDRESS }).expect(400);
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
      .send({ items: [{ product_id: context.firstProduct.id, quantity: 1 }], shipping_address: SHIPPING_ADDRESS })
      .expect(409);
    expect(response.body.error).toContain('vient d’être vendu');
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
