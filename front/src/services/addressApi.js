// API tierce : "API Adresse (Base Adresse Nationale - BAN)", l'API officielle de l'État
// pour rechercher une adresse française, produite par l'IGN (partenaire : ANCT).
// - Fiche officielle : https://www.data.gouv.fr/dataservices/api-adresse-base-adresse-nationale-ban
// - Documentation : https://adresse.data.gouv.fr/outils/api-doc/adresse
// - Accès ouvert, sans clé ; limite de 50 appels par seconde et par adresse IP.
// Elle est hébergée sur la Géoplateforme de l'IGN, d'où l'adresse data.geopf.fr.
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
