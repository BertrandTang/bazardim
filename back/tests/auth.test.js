import { describe, expect, it } from 'vitest';
import { TEST_PASSWORD, anonymous, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('POST /api/auth/register', () => {
  it('crée le compte, renvoie l’utilisateur sans mot de passe et dépose un cookie httpOnly', async () => {
    const response = await anonymous()
      .post('/api/auth/register')
      .send({ username: 'Collec92', email: '  Collec@Example.COM ', password: TEST_PASSWORD })
      .expect(201);

    expect(response.body).toMatchObject({ username: 'Collec92', email: 'collec@example.com', role: 'user' });
    expect(response.body).not.toHaveProperty('password_hash');
    expect(response.headers['set-cookie'][0]).toMatch(/bazardim_token=.+HttpOnly/);
  });

  it('refuse un email déjà utilisé (409)', async () => {
    await createLoggedInUser({ email: 'doublon@example.com' });
    const response = await anonymous()
      .post('/api/auth/register')
      .send({ username: 'autre', email: 'doublon@example.com', password: TEST_PASSWORD })
      .expect(409);
    expect(response.body.error).toBe('Un compte existe déjà avec cet email.');
  });

  it('refuse un pseudo déjà utilisé (409)', async () => {
    await createLoggedInUser({ username: 'pseudo' });
    const response = await anonymous()
      .post('/api/auth/register')
      .send({ username: 'pseudo', email: 'autre@example.com', password: TEST_PASSWORD })
      .expect(409);
    expect(response.body.error).toBe('Ce pseudo est déjà utilisé.');
  });

  it('détaille les champs invalides (400)', async () => {
    const response = await anonymous()
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'pas-un-email', password: 'court' })
      .expect(400);
    const invalidFields = response.body.details.map((detail) => detail.field);
    expect(invalidFields).toEqual(['username', 'email', 'password']);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte avec le bon mot de passe', async () => {
    await createLoggedInUser({ email: 'login@example.com', password: 'motdepasse' });
    const response = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'motdepasse' })
      .expect(200);
    expect(response.body.email).toBe('login@example.com');
    expect(response.headers['set-cookie'][0]).toMatch(/bazardim_token=/);
  });

  it('renvoie le même message pour un mauvais mot de passe ou un email inconnu (401)', async () => {
    await createLoggedInUser({ email: 'login@example.com' });
    const wrongPassword = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'mauvais' })
      .expect(401);
    const unknownEmail = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'inconnu@example.com', password: 'mauvais' })
      .expect(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });
});

describe('GET /api/auth/me et POST /api/auth/logout', () => {
  it('renvoie l’utilisateur connecté', async () => {
    const { agent, user } = await createLoggedInUser();
    const response = await agent.get('/api/auth/me').expect(200);
    expect(response.body.id).toBe(user.id);
  });

  it('répond 401 sans cookie', async () => {
    await anonymous().get('/api/auth/me').expect(401);
  });

  it('répond 401 avec un jeton falsifié', async () => {
    await anonymous().get('/api/auth/me').set('Cookie', 'bazardim_token=faux.jeton.signature').expect(401);
  });

  it('déconnecte : le cookie est supprimé', async () => {
    const { agent } = await createLoggedInUser();
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});
