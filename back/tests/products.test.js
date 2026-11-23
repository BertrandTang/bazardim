import { describe, expect, it } from 'vitest';
import { anonymous, buildProduct, createLoggedInUser, makeAdmin, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('POST /api/products', () => {
  it('crée une annonce appartenant à l’utilisateur connecté', async () => {
    const { agent, user } = await createLoggedInUser();
    const response = await agent.post('/api/products').send(buildProduct()).expect(201);

    expect(response.body).toMatchObject({
      title: 'Figurine Luffy Gear 5',
      price: 49.9,
      licence_name: 'One Piece',
      owner_id: user.id,
      owner_username: user.username,
      // tags mis en minuscules et triés
      tags: ['bandai', 'shf'],
      // champ facultatif absent => null
      manufacturer: null,
    });
  });

  it('refuse un visiteur non connecté (401)', async () => {
    await anonymous().post('/api/products').send(buildProduct()).expect(401);
  });

  it('refuse un prix négatif, une catégorie inconnue et une image javascript: (400)', async () => {
    const { agent } = await createLoggedInUser();
    const response = await agent
      .post('/api/products')
      .send(buildProduct({ price: -5, category: 'VOITURE', image_url: 'javascript:alert(1)' }))
      .expect(400);
    const invalidFields = response.body.details.map((detail) => detail.field);
    expect(invalidFields).toEqual(expect.arrayContaining(['price', 'category', 'image_url']));
  });

  it('refuse un JSON mal formé (400)', async () => {
    const { agent } = await createLoggedInUser();
    await agent.post('/api/products').set('Content-Type', 'application/json').send('{"title":').expect(400);
  });
});

describe('GET /api/products', () => {
  async function createCatalog() {
    const { agent, user } = await createLoggedInUser();
    await agent.post('/api/products').send(buildProduct({ title: 'Luffy', category: 'FIGURINE' }));
    await agent
      .post('/api/products')
      .send(buildProduct({ title: 'Goku', category: 'STATUE', licence_name: 'Dragon Ball', tags: ['ichiban'] }));
    await agent.post('/api/products').send(buildProduct({ title: 'Naruto', licence_name: 'Naruto', tags: [] }));
    return user;
  }

  it('liste tous les produits, du plus récent au plus ancien', async () => {
    await createCatalog();
    const response = await anonymous().get('/api/products').expect(200);
    expect(response.body.map((product) => product.title)).toEqual(['Naruto', 'Goku', 'Luffy']);
  });

  it('filtre par catégorie, licence, recherche texte (y compris les tags) et vendeur', async () => {
    const owner = await createCatalog();
    const titlesFor = async (queryString) =>
      (await anonymous().get(`/api/products?${queryString}`).expect(200)).body.map((product) => product.title);

    expect(await titlesFor('category=STATUE')).toEqual(['Goku']);
    expect(await titlesFor('licence=One%20Piece')).toEqual(['Luffy']);
    expect(await titlesFor('search=GOK')).toEqual(['Goku']);
    expect(await titlesFor('search=ichiban')).toEqual(['Goku']);
    expect(await titlesFor(`owner_id=${owner.id}&limit=2`)).toEqual(['Naruto', 'Goku']);
  });

  it('refuse un filtre invalide (400)', async () => {
    await anonymous().get('/api/products?limit=1000').expect(400);
  });

  it('renvoie un produit par son id, 404 s’il n’existe pas', async () => {
    const { agent } = await createLoggedInUser();
    const created = (await agent.post('/api/products').send(buildProduct())).body;
    await anonymous().get(`/api/products/${created.id}`).expect(200);
    await anonymous().get('/api/products/9999').expect(404);
    await anonymous().get('/api/products/abc').expect(400);
  });

  it('liste les licences utilisées', async () => {
    await createCatalog();
    const response = await anonymous().get('/api/licences').expect(200);
    expect(response.body).toEqual(['Dragon Ball', 'Naruto', 'One Piece']);
  });
});

describe('PUT et DELETE /api/products/:id', () => {
  it('le propriétaire peut modifier son annonce (tags remplacés)', async () => {
    const { agent } = await createLoggedInUser();
    const created = (await agent.post('/api/products').send(buildProduct())).body;

    const response = await agent
      .put(`/api/products/${created.id}`)
      .send(buildProduct({ title: 'Titre modifié', price: 10, tags: ['nouveau'] }))
      .expect(200);
    expect(response.body).toMatchObject({ title: 'Titre modifié', price: 10, tags: ['nouveau'] });
  });

  it('un autre utilisateur ne peut ni modifier ni supprimer (403)', async () => {
    const { agent: ownerAgent } = await createLoggedInUser();
    const { agent: otherAgent } = await createLoggedInUser();
    const created = (await ownerAgent.post('/api/products').send(buildProduct())).body;

    await otherAgent.put(`/api/products/${created.id}`).send(buildProduct()).expect(403);
    await otherAgent.delete(`/api/products/${created.id}`).expect(403);
  });

  it('le propriétaire peut supprimer son annonce', async () => {
    const { agent } = await createLoggedInUser();
    const created = (await agent.post('/api/products').send(buildProduct())).body;
    await agent.delete(`/api/products/${created.id}`).expect(204);
    await anonymous().get(`/api/products/${created.id}`).expect(404);
  });

  it('un administrateur peut supprimer n’importe quelle annonce (modération)', async () => {
    const { agent: ownerAgent } = await createLoggedInUser();
    const { agent: adminAgent, user: admin } = await createLoggedInUser();
    await makeAdmin(admin.id);
    const created = (await ownerAgent.post('/api/products').send(buildProduct())).body;
    await adminAgent.delete(`/api/products/${created.id}`).expect(204);
  });

  it('répond 404 pour un produit inexistant', async () => {
    const { agent } = await createLoggedInUser();
    await agent.delete('/api/products/9999').expect(404);
  });
});
