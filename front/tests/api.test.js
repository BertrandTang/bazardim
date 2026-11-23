import { describe, expect, it, vi } from 'vitest';

// Dans les autres tests, src/services/api.js est remplacé par la fausse API (voir setup.js).
// Ici on veut tester le VRAI fichier : vi.importActual contourne ce remplacement.
// C'est `fetch` (la fonction du navigateur qui envoie les requêtes) que l'on simule.
const api = await vi.importActual('../src/services/api.js');

/** Simule une réponse HTTP de l'API. */
function mockFetchResponse(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('services/api.js', () => {
  it('envoie le cookie de connexion et les données en JSON', async () => {
    const fetchMock = mockFetchResponse(201, { id: 12, title: 'Luffy' });

    const product = await api.createProduct({ title: 'Luffy' });

    expect(product).toEqual({ id: 12, title: 'Luffy' });
    expect(fetchMock).toHaveBeenCalledWith('/api/products', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Luffy' }),
    });
  });

  it('transforme une erreur de l’API en message lisible, avec le détail des champs', async () => {
    mockFetchResponse(400, {
      error: 'Données invalides.',
      details: [{ field: 'price', message: 'Trop petit' }],
    });
    await expect(api.createProduct({})).rejects.toMatchObject({
      status: 400,
      message: 'Données invalides. price : Trop petit',
    });
  });

  it('gère une réponse vide (204) et une erreur sans message', async () => {
    mockFetchResponse(204);
    await expect(api.deleteProduct(1)).resolves.toBeNull();

    mockFetchResponse(500, null);
    await expect(api.fetchProducts()).rejects.toThrow('Erreur inattendue du serveur (code 500).');
  });

  it('affiche un message clair quand le serveur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.fetchProducts()).rejects.toThrow('Impossible de joindre le serveur');
  });

  it('renvoie null pour un visiteur, et une erreur si le serveur échoue', async () => {
    mockFetchResponse(200, null);
    await expect(api.fetchCurrentUser()).resolves.toBeNull();

    mockFetchResponse(500, { error: 'Erreur interne du serveur.' });
    await expect(api.fetchCurrentUser()).rejects.toThrow('Erreur interne du serveur.');
  });
});
