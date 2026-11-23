import { describe, expect, it } from 'vitest';
import { anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

// Petite "image" PNG : les 8 premiers octets d'un fichier PNG suffisent pour ces tests.
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('Envoi d’images', () => {
  it('enregistre une image et renvoie son adresse, puis la sert', async () => {
    const { agent } = await createLoggedInUser();

    // .attach() envoie un fichier comme un formulaire HTML (multipart/form-data), dans le champ "image".
    const response = await agent
      .post('/api/uploads')
      .attach('image', PNG_BYTES, { filename: 'figurine.png', contentType: 'image/png' })
      .expect(201);

    // Nom aléatoire (et non "figurine.png"), avec la bonne extension.
    expect(response.body.image_url).toMatch(/^\/uploads\/[\w-]+\.png$/);

    const image = await anonymous().get(response.body.image_url).expect(200);
    expect(image.headers['content-type']).toBe('image/png');
  });

  it('refuse un fichier qui n’est pas une image acceptée (400)', async () => {
    const { agent } = await createLoggedInUser();
    const response = await agent
      .post('/api/uploads')
      .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'piege.html', contentType: 'text/html' })
      .expect(400);
    expect(response.body.error).toContain('JPEG, PNG ou WebP');
  });

  it('refuse une image de plus de 2 Mo (400)', async () => {
    const { agent } = await createLoggedInUser();
    const tooBigImage = Buffer.alloc(2 * 1024 * 1024 + 1);
    const response = await agent
      .post('/api/uploads')
      .attach('image', tooBigImage, { filename: 'enorme.jpg', contentType: 'image/jpeg' })
      .expect(400);
    expect(response.body.error).toBe('Image trop lourde : 2 Mo maximum.');
  });

  it('refuse un envoi sans image (400) et un visiteur non connecté (401)', async () => {
    const { agent } = await createLoggedInUser();
    await agent.post('/api/uploads').field('autre', 'valeur').expect(400);
    await anonymous()
      .post('/api/uploads')
      .attach('image', PNG_BYTES, { filename: 'figurine.png', contentType: 'image/png' })
      .expect(401);
  });

  it('une annonce exige une photo du site, pas un lien vers un autre site', async () => {
    const { agent } = await createLoggedInUser();
    await agent
      .post('/api/products')
      .send(buildProduct({ image_url: undefined }))
      .expect(400);
    await agent
      .post('/api/products')
      .send(buildProduct({ image_url: 'https://autre-site.com/a.jpg' }))
      .expect(400);
    await agent
      .post('/api/products')
      .send(buildProduct({ image_url: '/uploads/photo.jpg' }))
      .expect(201);
  });
});
