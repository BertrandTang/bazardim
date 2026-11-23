import { describe, expect, it } from 'vitest';
import { query } from '../src/config/database.js';
import { anonymous, buildProduct, createLoggedInUser, useEmptyDatabase } from './helpers.js';

useEmptyDatabase();

describe('GET /sitemap.xml', () => {
  it('liste les pages fixes et les annonces en vente, mais pas les annonces vendues', async () => {
    const { agent } = await createLoggedInUser();
    const available = (await agent.post('/api/products').send(buildProduct({ title: 'En vente' }))).body;
    const sold = (await agent.post('/api/products').send(buildProduct({ title: 'Vendue' }))).body;
    await query('UPDATE products SET sold_at = now() WHERE id = $1', [sold.id]);

    const response = await anonymous().get('/sitemap.xml').expect(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.text).toContain('<loc>http://localhost:5173/</loc>');
    expect(response.text).toContain('<loc>http://localhost:5173/figurines</loc>');
    expect(response.text).toContain(`<loc>http://localhost:5173/product/${available.id}</loc>`);
    expect(response.text).not.toContain(`/product/${sold.id}<`);
    // Date de dernière modification au format AAAA-MM-JJ.
    expect(response.text).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});
