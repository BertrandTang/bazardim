import { beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../src/config/database.js';
import { sendEmail } from '../src/config/mailer.js';
import { TEST_PASSWORD, anonymous, createLoggedInUser, makeAdmin, useEmptyDatabase } from './helpers.js';
import request from 'supertest';
import app from '../src/app.js';

// L'envoi d'e-mails est simulé : on lit le code dans l'e-mail « envoyé », sans serveur d'e-mails.
vi.mock('../src/config/mailer.js', () => ({ sendEmail: vi.fn() }));

useEmptyDatabase();

beforeEach(() => {
  vi.resetAllMocks();
});

/** Code à 6 chiffres contenu dans le dernier e-mail envoyé. */
function lastEmailedCode() {
  const { text } = sendEmail.mock.calls.at(-1)[0];
  return text.match(/\b\d{6}\b/)[0];
}

/** Un utilisateur qui a activé la double authentification, puis s'est déconnecté. */
async function createUserWithTwoFactor() {
  const { agent, user } = await createLoggedInUser();
  await agent.patch('/api/users/me').send({ two_factor_enabled: true, current_password: TEST_PASSWORD }).expect(200);
  await agent.post('/api/auth/logout').expect(204);
  return { agent, user };
}

/** Première étape de la connexion avec un nouvel « agent » (navigateur vierge). */
async function startLogin(email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password: TEST_PASSWORD }).expect(200);
  return { agent, response };
}

describe('Double authentification par e-mail', () => {
  it('activer ou désactiver la double authentification demande le mot de passe actuel', async () => {
    const { agent } = await createLoggedInUser();
    await agent.patch('/api/users/me').send({ two_factor_enabled: true }).expect(403);
    const response = await agent
      .patch('/api/users/me')
      .send({ two_factor_enabled: true, current_password: TEST_PASSWORD })
      .expect(200);
    expect(response.body.two_factor_enabled).toBe(true);
    await agent.patch('/api/users/me').send({ two_factor_enabled: false }).expect(403);
  });

  it('demande un code envoyé par e-mail, puis connecte avec le bon code', async () => {
    const { user } = await createUserWithTwoFactor();
    const { agent, response } = await startLogin(user.email);

    // Mot de passe correct, mais pas encore connecté : un code a été envoyé à l'adresse du compte.
    expect(response.body).toEqual({ two_factor_required: true });
    expect((await agent.get('/api/auth/me')).body).toBeNull();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));

    // Le code n'est pas stocké en clair.
    const [storedCode] = await query('SELECT code_hash FROM two_factor_codes WHERE user_id = $1', [user.id]);
    expect(storedCode.code_hash).not.toBe(lastEmailedCode());

    await agent.post('/api/auth/login/verify').send({ code: '12345' }).expect(400);
    const connected = await agent.post('/api/auth/login/verify').send({ code: lastEmailedCode() }).expect(200);
    expect(connected.body.id).toBe(user.id);
    expect((await agent.get('/api/auth/me')).body.id).toBe(user.id);
  });

  it('refuse un mauvais code, puis annule le code après 5 essais', async () => {
    const { user } = await createUserWithTwoFactor();
    const { agent } = await startLogin(user.email);
    const goodCode = lastEmailedCode();
    const wrongCode = goodCode === '000000' ? '111111' : '000000';

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await agent.post('/api/auth/login/verify').send({ code: wrongCode }).expect(401);
      expect(response.body.error).toBe('Code incorrect.');
    }
    const blocked = await agent.post('/api/auth/login/verify').send({ code: wrongCode }).expect(401);
    expect(blocked.body.error).toContain('Trop de codes incorrects');
    // Même le bon code ne fonctionne plus : il faut recommencer la connexion.
    await agent.post('/api/auth/login/verify').send({ code: goodCode }).expect(401);
  });

  it('refuse un code expiré, un code déjà utilisé, ou sans être passé par le mot de passe', async () => {
    const { user } = await createUserWithTwoFactor();

    // Code expiré.
    const first = await startLogin(user.email);
    await query("UPDATE two_factor_codes SET expires_at = now() - interval '1 minute' WHERE user_id = $1", [user.id]);
    const expired = await first.agent.post('/api/auth/login/verify').send({ code: lastEmailedCode() }).expect(401);
    expect(expired.body.error).toContain('Code expiré');

    // Code déjà utilisé.
    const second = await startLogin(user.email);
    const code = lastEmailedCode();
    await second.agent.post('/api/auth/login/verify').send({ code }).expect(200);
    await second.agent.post('/api/auth/login/verify').send({ code }).expect(401);

    // Sans la première étape (pas de cookie temporaire).
    await anonymous().post('/api/auth/login/verify').send({ code }).expect(401);
  });

  it('le jeton temporaire « code attendu » ne permet pas d’être connecté', async () => {
    const { user } = await createUserWithTwoFactor();
    const { response } = await startLogin(user.email);
    const temporaryToken = response.headers['set-cookie']
      .find((cookie) => cookie.startsWith('bazardim_2fa='))
      .split(';')[0]
      .split('=')[1];

    // Copié dans le cookie de connexion, il est refusé.
    await anonymous().get('/api/likes').set('Cookie', `bazardim_token=${temporaryToken}`).expect(401);
  });

  it('est toujours demandée à un administrateur', async () => {
    const { user } = await createLoggedInUser();
    await makeAdmin(user.id);
    const { response } = await startLogin(user.email);
    expect(response.body).toEqual({ two_factor_required: true });
  });

  it('n’est pas demandée à un utilisateur qui ne l’a pas activée', async () => {
    const { user } = await createLoggedInUser();
    const { response } = await startLogin(user.email);
    expect(response.body.id).toBe(user.id);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('répond 503 si l’e-mail ne peut pas être envoyé', async () => {
    const { user } = await createUserWithTwoFactor();
    sendEmail.mockRejectedValue(new Error('Serveur SMTP injoignable'));
    const response = await anonymous()
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD })
      .expect(503);
    expect(response.body.error).toContain('Envoi du code');
  });
});
