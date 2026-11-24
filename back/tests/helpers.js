import request from 'supertest';
import { afterAll, beforeEach } from 'vitest';
import app from '../src/app.js';
import { closeDatabase, query } from '../src/config/database.js';

/**
 * À appeler en haut de chaque fichier de test : chaque test démarre avec une base vide,
 * et les connexions sont fermées à la fin du fichier.
 */
export function useEmptyDatabase() {
  beforeEach(async () => {
    // TRUNCATE vide les tables ; CASCADE vide aussi celles qui en dépendent (produits, likes...).
    await query('TRUNCATE users, licences, tags RESTART IDENTITY CASCADE');
  });
  afterAll(async () => {
    await closeDatabase();
  });
}

/** Mot de passe des comptes créés pendant les tests (faux mot de passe, propre aux tests). */
export const TEST_PASSWORD = 'mot-de-passe-de-test';

let createdUserCount = 0;

/**
 * Inscrit un nouvel utilisateur et retourne un "agent" supertest qui garde son cookie
 * de connexion : les requêtes faites avec cet agent sont donc authentifiées.
 */
export async function createLoggedInUser(overrides = {}) {
  createdUserCount += 1;
  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/register')
    .send({
      username: `user${createdUserCount}`,
      email: `user${createdUserCount}@example.com`,
      password: TEST_PASSWORD,
      ...overrides,
    })
    .expect(201);
  return { agent, user: response.body };
}

export async function makeAdmin(userId) {
  await query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
}

/** Requête sans être connecté. */
export function anonymous() {
  return request(app);
}

/**
 * Produit valide, à compléter ou modifier dans chaque test.
 * Pas de titre : l'API le calcule (« Figurine – Monkey D. Luffy – Gear 5 »).
 */
export function buildProduct(overrides = {}) {
  return {
    description: 'Figurine en excellent état.',
    price: 49.9,
    category: 'FIGURINE',
    licence_name: 'One Piece',
    character_name: 'Monkey D. Luffy',
    version: 'Gear 5',
    has_box: true,
    image_url: '/uploads/photo-de-test.jpg',
    tags: ['bandai', 'SHF'],
    ...overrides,
  };
}
