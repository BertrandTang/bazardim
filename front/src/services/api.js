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
 * @param {object|FormData} [options.body] - Données à envoyer : un objet (converti en JSON)
 *   ou un FormData (formulaire avec fichier, pour envoyer une image).
 * @returns {Promise<*>} Les données renvoyées par l'API (null pour une réponse vide).
 * @throws {ApiError} Si le serveur est injoignable ou répond avec une erreur.
 */
async function request(path, { method = 'GET', body } = {}) {
  // Un FormData (fichier) est envoyé tel quel : le navigateur choisit lui-même le bon format.
  const isFormData = body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      // Envoie le cookie de connexion avec la requête (il est géré par le navigateur,
      // le JavaScript de la page ne peut pas le lire : voir back/src/middlewares/authentication.js).
      credentials: 'include',
      headers: body && !isFormData ? { 'Content-Type': 'application/json' } : undefined,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
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

/** Utilisateur connecté, ou null si personne n'est connecté (l'API renvoie null pour un visiteur). */
export function fetchCurrentUser() {
  return request('/auth/me');
}

/**
 * Première étape de la connexion. Renvoie le compte, ou { two_factor_required: true } si un code
 * a été envoyé par e-mail (double authentification) : il faut alors appeler verifyLoginCode.
 */
export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

/** Deuxième étape de la connexion (double authentification) : le code à 6 chiffres reçu par e-mail. */
export function verifyLoginCode(code) {
  return request('/auth/login/verify', { method: 'POST', body: { code } });
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

/** Supprime définitivement le compte connecté (le mot de passe actuel est exigé par l'API). */
export function deleteAccount(currentPassword) {
  return request('/users/me', { method: 'DELETE', body: { current_password: currentPassword } });
}

// ----- Images -----

/**
 * Envoie une image (fichier choisi par l'utilisateur) et retourne son adresse sur le site.
 * @param {File} imageFile - Le fichier, ex : celui d'un <input type="file">.
 * @returns {Promise<{image_url: string}>} Ex : { image_url: "/uploads/abc.jpg" }.
 */
export function uploadImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile); // "image" : nom du champ attendu par l'API (multer)
  return request('/uploads', { method: 'POST', body: formData });
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

// ----- Commandes et paiement -----

/**
 * Crée une commande et la page de paiement Stripe.
 * `order` : { product_ids: [3, 8], shipping_address }. Chaque annonce est une pièce unique,
 * donc pas de quantité. Aucun prix n'est envoyé : le back relit les prix dans la base.
 * @returns {Promise<{order_id: number, checkout_url: string}>}
 */
export function createOrder(order) {
  return request('/orders', { method: 'POST', body: order });
}

/** Commandes de l'utilisateur connecté. */
export function fetchOrders() {
  return request('/orders');
}

/** Ventes de l'utilisateur connecté : qui a acheté chacune de ses annonces. */
export function fetchSales() {
  return request('/orders/sales');
}

/** Le vendeur indique qu'il a expédié un article vendu (orderItemId = order_item_id d'une vente). */
export function markItemAsShipped(orderItemId) {
  return request(`/orders/items/${orderItemId}/shipped`, { method: 'PATCH' });
}

/** Une commande (le back vérifie auprès de Stripe si elle a été payée). */
export function fetchOrder(orderId) {
  return request(`/orders/${orderId}`);
}

// ----- Messagerie -----

export function fetchReceivedMessages() {
  return request('/messages/received');
}

export function fetchSentMessages() {
  return request('/messages/sent');
}

/** Nombre de messages reçus non lus : { count: 2 }. */
export function fetchUnreadMessageCount() {
  return request('/messages/unread-count');
}

/** Envoie un message. `message` : { recipient_id, product_id, content }. */
export function sendMessage(message) {
  return request('/messages', { method: 'POST', body: message });
}

export function markMessageAsRead(messageId) {
  return request(`/messages/${messageId}/read`, { method: 'PATCH' });
}
