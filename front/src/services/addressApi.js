// API tierce : service de géocodage de la Géoplateforme (IGN), qui remplace l'ancienne
// "API Adresse" (api-adresse.data.gouv.fr). Gratuite, sans clé, utilisable depuis le navigateur.
// Documentation : https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
const ADDRESS_API_URL = 'https://data.geopf.fr/geocodage/search';

// L'API refuse les recherches de moins de 3 caractères (erreur 400).
export const MINIMUM_SEARCH_LENGTH = 3;

/**
 * Cherche des adresses françaises correspondant au texte saisi.
 *
 * @param {string} searchText - Début d'adresse tapé par l'utilisateur ("10 rue de riv...").
 * @param {AbortSignal} [signal] - Permet d'annuler la requête si l'utilisateur continue de taper.
 * @returns {Promise<Array<{id: string, label: string, postcode: string, city: string}>>}
 * @throws {Error} Si le service ne répond pas correctement.
 */
export async function searchAddresses(searchText, signal) {
  // URLSearchParams encode correctement les espaces et les accents dans l'URL.
  const parameters = new URLSearchParams({
    q: searchText,
    autocomplete: '1',
    index: 'address',
    limit: '5',
  });

  const response = await fetch(`${ADDRESS_API_URL}?${parameters}`, { signal });
  if (!response.ok) {
    throw new Error(`Le service d'adresses a répondu ${response.status}`);
  }

  // La réponse est au format GeoJSON : chaque adresse est une "feature" avec des "properties".
  const data = await response.json();
  return data.features.map((feature) => ({
    id: feature.properties.id,
    label: feature.properties.label,
    postcode: feature.properties.postcode,
    city: feature.properties.city,
  }));
}
