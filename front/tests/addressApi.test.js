import { describe, expect, it, vi } from 'vitest';
import { searchAddresses } from '../src/services/addressApi.js';

// On ne contacte jamais la vraie API dans les tests : on remplace fetch par une fausse fonction.
function mockFetchResponse(response) {
  const fakeFetch = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fakeFetch);
  return fakeFetch;
}

describe('searchAddresses', () => {
  it('interroge l’API de la Géoplateforme et simplifie la réponse GeoJSON', async () => {
    const fakeFetch = mockFetchResponse({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              id: '75104_8249_00010',
              label: '10 Rue de Rivoli 75004 Paris',
              postcode: '75004',
              city: 'Paris',
            },
          },
        ],
      }),
    });

    const addresses = await searchAddresses('10 rue de rivoli');

    expect(addresses).toEqual([
      { id: '75104_8249_00010', label: '10 Rue de Rivoli 75004 Paris', postcode: '75004', city: 'Paris' },
    ]);
    const calledUrl = fakeFetch.mock.calls[0][0];
    expect(calledUrl).toContain('https://data.geopf.fr/geocodage/search?');
    expect(calledUrl).toContain('q=10+rue+de+rivoli');
  });

  it('lance une erreur si le service répond en erreur', async () => {
    mockFetchResponse({ ok: false, status: 503 });
    await expect(searchAddresses('10 rue')).rejects.toThrow('503');
  });
});
