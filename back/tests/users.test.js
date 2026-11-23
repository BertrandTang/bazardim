import { describe, expect, it } from 'vitest';
import { TEST_PASSWORD, anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('GET /api/users/:id (profil public)', () => {
  it('ne révèle ni l’email ni le mot de passe', async () => {
    const { user } = await createLoggedInUser();
    const response = await anonymous().get(`/api/users/${user.id}`).expect(200);
    expect(response.body).toMatchObject({ id: user.id, username: user.username });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('répond 404 pour un utilisateur inexistant', async () => {
    await anonymous().get('/api/users/9999').expect(404);
  });
});

describe('PATCH /api/users/me', () => {
  it('modifie le pseudo et l’image sans redemander le mot de passe', async () => {
    const { agent } = await createLoggedInUser();
    const response = await agent
      .patch('/api/users/me')
      .send({ username: 'NouveauPseudo', profile_image_url: '/img/img_2.jpg' })
      .expect(200);
    expect(response.body).toMatchObject({ username: 'NouveauPseudo', profile_image_url: '/img/img_2.jpg' });
  });

  it('exige le mot de passe actuel pour changer de mot de passe', async () => {
    const { agent, user } = await createLoggedInUser({ password: 'ancienMotDePasse' });

    await agent.patch('/api/users/me').send({ new_password: 'nouveauMotDePasse' }).expect(403);
    await agent
      .patch('/api/users/me')
      .send({ current_password: 'ancienMotDePasse', new_password: 'nouveauMotDePasse' })
      .expect(200);

    await anonymous().post('/api/auth/login').send({ email: user.email, password: 'nouveauMotDePasse' }).expect(200);
  });

  it('exige le mot de passe actuel pour changer d’email', async () => {
    const { agent } = await createLoggedInUser();
    await agent.patch('/api/users/me').send({ email: 'nouveau@example.com' }).expect(403);
  });

  it('refuse les champs inconnus, comme une tentative de devenir administrateur (400)', async () => {
    const { agent } = await createLoggedInUser();
    await agent.patch('/api/users/me').send({ role: 'admin' }).expect(400);
  });
});

describe('DELETE /api/users/me', () => {
  it('supprime le compte et ses annonces après vérification du mot de passe', async () => {
    const { agent, user } = await createLoggedInUser();
    const product = (await agent.post('/api/products').send(buildProduct())).body;

    await agent.delete('/api/users/me').send({ current_password: 'mauvais' }).expect(403);
    await agent.delete('/api/users/me').send({ current_password: TEST_PASSWORD }).expect(204);

    await anonymous().get(`/api/users/${user.id}`).expect(404);
    await anonymous().get(`/api/products/${product.id}`).expect(404);
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('Divers', () => {
  it('GET /api/health vérifie la connexion à la base', async () => {
    await anonymous().get('/api/health').expect(200, { status: 'ok' });
  });

  it('répond 404 en JSON pour une route inconnue', async () => {
    const response = await anonymous().get('/api/inexistant').expect(404);
    expect(response.body.error).toBe('Route introuvable.');
  });

  it('envoie les en-têtes de sécurité et n’autorise que le front en CORS', async () => {
    const response = await anonymous().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });
});
