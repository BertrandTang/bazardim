import { describe, expect, it } from 'vitest';
import { anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

/** Crée un vendeur avec une annonce, et un acheteur. */
async function createSellerAndBuyer() {
  const seller = await createLoggedInUser();
  const buyer = await createLoggedInUser();
  const product = (await seller.agent.post('/api/products').send(buildProduct())).body;
  return { seller, buyer, product };
}

describe('Messagerie', () => {
  it('un acheteur écrit au vendeur à propos d’une annonce', async () => {
    const { seller, buyer, product } = await createSellerAndBuyer();

    const response = await buyer.agent
      .post('/api/messages')
      .send({ recipient_id: seller.user.id, product_id: product.id, content: '  Est-elle toujours dispo ?  ' })
      .expect(201);

    expect(response.body).toMatchObject({
      content: 'Est-elle toujours dispo ?',
      is_read: false,
      product_id: product.id,
      product_title: product.title,
      sender_id: buyer.user.id,
      sender_username: buyer.user.username,
      recipient_id: seller.user.id,
      recipient_username: seller.user.username,
    });
  });

  it('le message apparaît dans les reçus du vendeur et les envoyés de l’acheteur', async () => {
    const { seller, buyer, product } = await createSellerAndBuyer();
    await buyer.agent
      .post('/api/messages')
      .send({ recipient_id: seller.user.id, product_id: product.id, content: 'A' });

    const received = await seller.agent.get('/api/messages/received').expect(200);
    expect(received.body.map((message) => message.content)).toEqual(['A']);

    const sent = await buyer.agent.get('/api/messages/sent').expect(200);
    expect(sent.body.map((message) => message.content)).toEqual(['A']);

    // L'acheteur n'a rien reçu : chacun ne voit que ses propres messages.
    const buyerInbox = await buyer.agent.get('/api/messages/received').expect(200);
    expect(buyerInbox.body).toEqual([]);
  });

  it('refuse un message vide (400), à soi-même (400), à un inconnu (404) ou sur un produit inexistant (404)', async () => {
    const { seller, buyer } = await createSellerAndBuyer();
    await buyer.agent.post('/api/messages').send({ recipient_id: seller.user.id, content: '   ' }).expect(400);
    await buyer.agent.post('/api/messages').send({ recipient_id: buyer.user.id, content: 'Moi' }).expect(400);
    await buyer.agent.post('/api/messages').send({ recipient_id: 9999, content: 'Qui ?' }).expect(404);
    await buyer.agent
      .post('/api/messages')
      .send({ recipient_id: seller.user.id, product_id: 9999, content: 'Quoi ?' })
      .expect(404);
  });

  it('refuse un visiteur non connecté (401)', async () => {
    await anonymous().get('/api/messages/received').expect(401);
    await anonymous().post('/api/messages').send({ recipient_id: 1, content: 'Anonyme' }).expect(401);
  });

  it('seul le destinataire peut marquer un message comme lu', async () => {
    const { seller, buyer, product } = await createSellerAndBuyer();
    const message = (
      await buyer.agent
        .post('/api/messages')
        .send({ recipient_id: seller.user.id, product_id: product.id, content: 'A' })
    ).body;

    await buyer.agent.patch(`/api/messages/${message.id}/read`).expect(403);
    await seller.agent.patch(`/api/messages/${message.id}/read`).expect(204);
    await seller.agent.patch('/api/messages/9999/read').expect(404);

    const received = await seller.agent.get('/api/messages/received').expect(200);
    expect(received.body[0].is_read).toBe(true);
  });

  it('garde le message quand l’annonce est supprimée', async () => {
    const { seller, buyer, product } = await createSellerAndBuyer();
    await buyer.agent
      .post('/api/messages')
      .send({ recipient_id: seller.user.id, product_id: product.id, content: 'A' });

    await seller.agent.delete(`/api/products/${product.id}`).expect(204);

    const received = await seller.agent.get('/api/messages/received').expect(200);
    expect(received.body[0]).toMatchObject({ content: 'A', product_id: null, product_title: null });
  });
});
