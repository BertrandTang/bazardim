import { describe, expect, it } from 'vitest';
import { anonymous } from './helpers.js';

describe('Documentation de l’API (OpenAPI / Swagger)', () => {
  it('sert la description OpenAPI au format JSON', async () => {
    const response = await anonymous().get('/api/docs.json').expect(200);
    expect(response.body.openapi).toBe('3.0.3');
    // Quelques routes importantes sont bien documentées.
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining(['/api/auth/login', '/api/products', '/api/orders', '/api/uploads']),
    );
  });

  it('sert la page interactive Swagger UI', async () => {
    const response = await anonymous().get('/api/docs/').expect(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('swagger-ui');
  });
});
