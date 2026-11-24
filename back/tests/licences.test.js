import { describe, expect, it } from 'vitest';
import { query } from '../src/config/database.js';
import { normalizeText } from '../src/utils/normalizeText.js';
import { anonymous, buildProduct, createLoggedInUser, makeAdmin, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

/** Un vendeur et un administrateur connectés. */
async function createSellerAndAdmin() {
  const seller = await createLoggedInUser();
  const admin = await createLoggedInUser();
  await makeAdmin(admin.user.id);
  return { seller, admin };
}

/** Publie une annonce avec cette licence et renvoie l'annonce créée. */
async function publishWithLicence(seller, licenceName) {
  return (
    await seller.agent
      .post('/api/products')
      .send(buildProduct({ licence_name: licenceName }))
      .expect(201)
  ).body;
}

/** Licences vues par l'administrateur, indexées par nom. */
async function adminLicencesByName(admin) {
  const licences = (await admin.agent.get('/api/admin/licences').expect(200)).body;
  return Object.fromEntries(licences.map((licence) => [licence.name, licence]));
}

describe('normalizeText', () => {
  it('ignore les majuscules, les accents, la ponctuation et les espaces en trop', () => {
    expect(normalizeText('One Piece')).toBe('one piece');
    expect(normalizeText('  ONE-PIECE !')).toBe('one piece');
    expect(normalizeText('Pokémon')).toBe('pokemon');
    expect(normalizeText('転生したらスライムだった件')).toBe('転生したらスライムだった件');
    expect(normalizeText('!!!')).toBe('');
  });
});

describe('Licences saisies par les vendeurs', () => {
  it('reconnaît une licence existante malgré une autre écriture', async () => {
    const { seller } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'One Piece');
    const second = await publishWithLicence(seller, '  one-PIECE ');

    expect(second.licence_name).toBe('One Piece');
    expect((await query('SELECT count(*)::int AS count FROM licences'))[0].count).toBe(1);
  });

  it('crée une licence inconnue « en attente » : absente du menu tant qu’elle n’est pas validée', async () => {
    const { seller } = await createSellerAndAdmin();
    const product = await publishWithLicence(seller, 'Tensura');

    expect(product.licence_name).toBe('Tensura');
    expect((await anonymous().get('/api/licences')).body).toEqual([]);
  });

  it('refuse une licence sans lettre ni chiffre', async () => {
    const { seller } = await createSellerAndAdmin();
    await seller.agent
      .post('/api/products')
      .send(buildProduct({ licence_name: '!!!' }))
      .expect(400);
  });
});

describe('Modération des licences (administrateur)', () => {
  it('est réservée aux administrateurs', async () => {
    const { seller } = await createSellerAndAdmin();
    await anonymous().get('/api/admin/licences').expect(401);
    const response = await seller.agent.get('/api/admin/licences').expect(403);
    expect(response.body.error).toBe('Réservé aux administrateurs.');
  });

  it('liste les licences en attente d’abord, avec leur nombre d’annonces', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'One Piece');
    await query("UPDATE licences SET status = 'approved'");
    await publishWithLicence(seller, 'Tensura');
    await publishWithLicence(seller, 'tensura');

    const licences = (await admin.agent.get('/api/admin/licences')).body;
    expect(licences[0]).toMatchObject({ name: 'Tensura', status: 'pending', product_count: 2, aliases: [] });
    expect(licences[1]).toMatchObject({ name: 'One Piece', status: 'approved' });
  });

  it('valide une licence : elle apparaît dans le menu', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'Chainsaw Man');
    const { id } = (await adminLicencesByName(admin))['Chainsaw Man'];

    await admin.agent.patch(`/api/admin/licences/${id}`).send({ status: 'approved' }).expect(200);
    expect((await anonymous().get('/api/licences')).body).toEqual(['Chainsaw Man']);
  });

  it('renomme une licence : l’ancien nom devient un synonyme', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'dragon ball super');
    const { id } = (await adminLicencesByName(admin))['dragon ball super'];

    const renamed = await admin.agent
      .patch(`/api/admin/licences/${id}`)
      .send({ name: 'Dragon Ball Super' })
      .expect(200);
    expect(renamed.body.name).toBe('Dragon Ball Super');
    // Même nom normalisé : rien à retenir comme synonyme.
    expect((await adminLicencesByName(admin))['Dragon Ball Super'].aliases).toEqual([]);

    await admin.agent.patch(`/api/admin/licences/${id}`).send({ name: 'DB Super' }).expect(200);
    expect((await adminLicencesByName(admin))['DB Super'].aliases).toEqual(['dragon ball super']);
  });

  it('fusionne un doublon : annonces déplacées, et le nom devient un synonyme reconnu automatiquement', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'Moi, quand je me réincarne en Slime');
    const duplicateProduct = await publishWithLicence(seller, 'Tensura');
    const licences = await adminLicencesByName(admin);
    const target = licences['Moi, quand je me réincarne en Slime'];
    const duplicate = licences.Tensura;

    await admin.agent
      .post(`/api/admin/licences/${duplicate.id}/merge`)
      .send({ target_licence_id: duplicate.id })
      .expect(400);
    await admin.agent.post(`/api/admin/licences/${duplicate.id}/merge`).send({ target_licence_id: 999999 }).expect(404);
    await admin.agent
      .post(`/api/admin/licences/${duplicate.id}/merge`)
      .send({ target_licence_id: target.id })
      .expect(204);

    // L'annonce est passée dans la bonne licence, et le doublon a disparu.
    const moved = (await anonymous().get(`/api/products/${duplicateProduct.id}`)).body;
    expect(moved.licence_name).toBe('Moi, quand je me réincarne en Slime');
    const afterMerge = await adminLicencesByName(admin);
    expect(afterMerge.Tensura).toBeUndefined();
    expect(afterMerge['Moi, quand je me réincarne en Slime'].aliases).toEqual(['tensura']);

    // Le prochain vendeur qui tape « TENSURA » est rangé automatiquement dans la bonne licence.
    const next = await publishWithLicence(seller, 'TENSURA');
    expect(next.licence_name).toBe('Moi, quand je me réincarne en Slime');

    // La recherche « tensura » trouve aussi les annonces de la licence, grâce au synonyme.
    const results = (await anonymous().get('/api/products?search=tensura')).body;
    expect(results).toHaveLength(3);
  });

  it('ajoute et supprime un synonyme, en refusant les doublons', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'Demon Slayer');
    await publishWithLicence(seller, 'Naruto');
    const { id } = (await adminLicencesByName(admin))['Demon Slayer'];
    const naruto = (await adminLicencesByName(admin)).Naruto;

    const added = await admin.agent
      .post(`/api/admin/licences/${id}/aliases`)
      .send({ alias: 'Kimetsu no Yaiba' })
      .expect(201);
    expect(added.body.normalized_alias).toBe('kimetsu no yaiba');
    expect((await publishWithLicence(seller, 'kimetsu-no-yaiba')).licence_name).toBe('Demon Slayer');

    // Doublons refusés : déjà un synonyme de cette licence, nom d'une autre licence, synonyme d'une autre.
    await admin.agent.post(`/api/admin/licences/${id}/aliases`).send({ alias: 'KIMETSU NO YAIBA' }).expect(409);
    await admin.agent.post(`/api/admin/licences/${id}/aliases`).send({ alias: 'naruto' }).expect(409);
    await admin.agent.post(`/api/admin/licences/${naruto.id}/aliases`).send({ alias: 'kimetsu no yaiba' }).expect(409);
    // Renommer une licence avec le nom d'une autre : refusé (il faut fusionner).
    await admin.agent.patch(`/api/admin/licences/${naruto.id}`).send({ name: 'demon slayer' }).expect(409);

    await admin.agent.delete(`/api/admin/licences/${id}/aliases/kimetsu%20no%20yaiba`).expect(204);
    await admin.agent.delete(`/api/admin/licences/${id}/aliases/kimetsu%20no%20yaiba`).expect(404);
  });

  it('répond 404 pour une licence inexistante et 400 sans rien à modifier', async () => {
    const { seller, admin } = await createSellerAndAdmin();
    await publishWithLicence(seller, 'Bleach');
    const { id } = (await adminLicencesByName(admin)).Bleach;
    await admin.agent.patch('/api/admin/licences/999999').send({ status: 'approved' }).expect(404);
    await admin.agent.patch(`/api/admin/licences/${id}`).send({}).expect(400);
  });
});
