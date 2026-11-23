import { describe, expect, it } from 'vitest';
import { anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('Favoris (likes)', () => {
  it('ajoute, liste et retire un favori ; liker deux fois n’a pas d’effet', async () => {
    const { agent } = await createLoggedInUser();
    const product = (await agent.post('/api/products').send(buildProduct())).body;

    await agent.put(`/api/likes/${product.id}`).expect(204);
    await agent.put(`/api/likes/${product.id}`).expect(204);

    const liked = await agent.get('/api/likes').expect(200);
    expect(liked.body.map((likedProduct) => likedProduct.id)).toEqual([product.id]);

    await agent.delete(`/api/likes/${product.id}`).expect(204);
    expect((await agent.get('/api/likes')).body).toEqual([]);
  });

  it('répond 404 pour un produit inexistant et 401 sans connexion', async () => {
    const { agent } = await createLoggedInUser();
    await agent.put('/api/likes/9999').expect(404);
    await anonymous().get('/api/likes').expect(401);
  });
});
