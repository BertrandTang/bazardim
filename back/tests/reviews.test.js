import { describe, expect, it } from 'vitest';
import { anonymous, createLoggedInUser, makeAdmin, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('Avis sur les vendeurs', () => {
  it('un utilisateur connecté peut noter un vendeur', async () => {
    const { user: seller } = await createLoggedInUser();
    const { agent, user: author } = await createLoggedInUser();

    const response = await agent
      .post('/api/reviews')
      .send({ seller_id: seller.id, rating: 4, comment: '  Très bon vendeur  ' })
      .expect(201);

    expect(response.body).toMatchObject({
      seller_id: seller.id,
      seller_username: seller.username,
      author_id: author.id,
      author_username: author.username,
      rating: 4,
      comment: 'Très bon vendeur',
    });
  });

  it('refuse de se noter soi-même (400), un vendeur inexistant (404) et une note hors 1-5 (400)', async () => {
    const { agent, user } = await createLoggedInUser();
    await agent.post('/api/reviews').send({ seller_id: user.id, rating: 5, comment: 'Moi' }).expect(400);
    await agent.post('/api/reviews').send({ seller_id: 9999, rating: 5, comment: 'Qui ?' }).expect(404);
    await agent.post('/api/reviews').send({ seller_id: 9999, rating: 6, comment: 'Trop' }).expect(400);
  });

  it('refuse un visiteur non connecté (401)', async () => {
    await anonymous().post('/api/reviews').send({ seller_id: 1, rating: 5, comment: 'Anonyme' }).expect(401);
  });

  it('liste les avis reçus et écrits, et calcule la note moyenne du profil public', async () => {
    const { user: seller } = await createLoggedInUser();
    const { agent: firstAgent, user: firstAuthor } = await createLoggedInUser();
    const { agent: secondAgent } = await createLoggedInUser();
    await firstAgent.post('/api/reviews').send({ seller_id: seller.id, rating: 5, comment: 'Parfait' });
    await secondAgent.post('/api/reviews').send({ seller_id: seller.id, rating: 2, comment: 'Bof' });

    const received = await anonymous().get(`/api/reviews?seller_id=${seller.id}`).expect(200);
    expect(received.body.map((review) => review.comment)).toEqual(['Bof', 'Parfait']);

    const written = await anonymous().get(`/api/reviews?author_id=${firstAuthor.id}`).expect(200);
    expect(written.body).toHaveLength(1);

    const profile = await anonymous().get(`/api/users/${seller.id}`).expect(200);
    expect(profile.body).toMatchObject({ average_rating: 3.5, review_count: 2 });

    await anonymous().get('/api/reviews').expect(400);
  });

  it('seul l’auteur peut modifier son avis', async () => {
    const { user: seller } = await createLoggedInUser();
    const { agent: authorAgent } = await createLoggedInUser();
    const { agent: otherAgent } = await createLoggedInUser();
    const review = (await authorAgent.post('/api/reviews').send({ seller_id: seller.id, rating: 3, comment: 'Moyen' }))
      .body;

    await otherAgent.put(`/api/reviews/${review.id}`).send({ rating: 1, comment: 'Piraté' }).expect(403);
    const response = await authorAgent
      .put(`/api/reviews/${review.id}`)
      .send({ rating: 4, comment: 'Finalement bien' })
      .expect(200);
    expect(response.body).toMatchObject({ rating: 4, comment: 'Finalement bien' });
  });

  it('l’auteur ou un administrateur peut supprimer un avis, pas les autres', async () => {
    const { user: seller } = await createLoggedInUser();
    const { agent: authorAgent } = await createLoggedInUser();
    const { agent: otherAgent } = await createLoggedInUser();
    const { agent: adminAgent, user: admin } = await createLoggedInUser();
    await makeAdmin(admin.id);

    const firstReview = (await authorAgent.post('/api/reviews').send({ seller_id: seller.id, rating: 5, comment: 'A' }))
      .body;
    const secondReview = (
      await authorAgent.post('/api/reviews').send({ seller_id: seller.id, rating: 5, comment: 'B' })
    ).body;

    await otherAgent.delete(`/api/reviews/${firstReview.id}`).expect(403);
    await authorAgent.delete(`/api/reviews/${firstReview.id}`).expect(204);
    await adminAgent.delete(`/api/reviews/${secondReview.id}`).expect(204);
    await authorAgent.delete(`/api/reviews/${secondReview.id}`).expect(404);
  });
});
