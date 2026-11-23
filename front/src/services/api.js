// Appels à l'API Bazardim (notre back-end, dossier back/).
// Tous les échanges avec le serveur passent par ce fichier : les composants n'appellent
// jamais fetch directement, ils utilisent les fonctions exportées ci-dessous.
// La liste des routes est dans back/README.md.

// En développement, Vite redirige /api vers http://localhost:3000 (voir vite.config.js).
const API_URL = '/api';

/** Erreur renvoyée par l'API, avec son code HTTP (401, 404...) et un message lisible. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Envoie une requête à l'API et retourne la réponse JSON.
 *
 * @param {string} path - Chemin de la route, ex : '/products'.
 * @param {object} [options]
 * @param {string} [options.method] - GET (par défaut), POST, PUT, PATCH ou DELETE.
 * @param {object} [options.body] - Données à envoyer (converties en JSON).
 * @returns {Promise<*>} Les données renvoyées par l'API (null pour une réponse vide).
 * @throws {ApiError} Si le serveur est injoignable ou répond avec une erreur.
 */
async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      // Envoie le cookie de connexion avec la requête (il est géré par le navigateur,
      // le JavaScript de la page ne peut pas le lire : voir back/src/middlewares/authentication.js).
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch échoue seulement quand le serveur ne répond pas du tout (réseau coupé, API arrêtée).
    throw new ApiError(0, 'Impossible de joindre le serveur. Réessayez dans quelques instants.');
  }

  // 204 = succès sans contenu (ex : après une suppression).
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, buildErrorMessage(data, response.status));
  }
  return data;
}

/**
 * Construit le message à afficher à partir de la réponse d'erreur de l'API :
 * { error: "Données invalides.", details: [{ field: "price", message: "..." }] }
 */
function buildErrorMessage(data, status) {
  if (!data?.error) {
    return `Erreur inattendue du serveur (code ${status}).`;
  }
  if (!data.details?.length) {
    return data.error;
  }
  const fieldErrors = data.details.map((detail) => `${detail.field} : ${detail.message}`);
  return `${data.error} ${fieldErrors.join(' ; ')}`;
}

// ----- Comptes et connexion -----

/** Utilisateur connecté, ou null si personne n'est connecté. */
export async function fetchCurrentUser() {
  try {
    return await request('/auth/me');
  } catch (error) {
    // 401 = pas de cookie de connexion valide : ce n'est pas une erreur, juste un visiteur.
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export function register({ username, email, password }) {
  return request('/auth/register', { method: 'POST', body: { username, email, password } });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

/** Profil public d'un vendeur (sans son email). */
export function fetchPublicProfile(userId) {
  return request(`/users/${userId}`);
}

/** Modifie le compte connecté. `changes` : username, email, profile_image_url, current_password, new_password. */
export function updateAccount(changes) {
  return request('/users/me', { method: 'PATCH', body: changes });
}

// ----- Annonces -----

/** Les 100 annonces les plus récentes (maximum autorisé par l'API en une requête). */
export function fetchProducts() {
  return request('/products?limit=100');
}

export function createProduct(productFields) {
  return request('/products', { method: 'POST', body: productFields });
}

export function updateProduct(productId, productFields) {
  return request(`/products/${productId}`, { method: 'PUT', body: productFields });
}

export function deleteProduct(productId) {
  return request(`/products/${productId}`, { method: 'DELETE' });
}

// ----- Favoris -----

/** Produits mis en favoris par l'utilisateur connecté. */
export function fetchLikedProducts() {
  return request('/likes');
}

export function likeProduct(productId) {
  return request(`/likes/${productId}`, { method: 'PUT' });
}

export function unlikeProduct(productId) {
  return request(`/likes/${productId}`, { method: 'DELETE' });
}

// ----- Messagerie -----

export function fetchReceivedMessages() {
  return request('/messages/received');
}

export function fetchSentMessages() {
  return request('/messages/sent');
}

/** Envoie un message. `message` : { recipient_id, product_id, content }. */
export function sendMessage(message) {
  return request('/messages', { method: 'POST', body: message });
}

export function markMessageAsRead(messageId) {
  return request(`/messages/${messageId}/read`, { method: 'PATCH' });
}
