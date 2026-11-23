// Fausse API utilisée par les tests du front, à la place de src/services/api.js (voir setup.js).
//
// Pourquoi ? Les tests du front doivent vérifier l'interface, sans dépendre d'un serveur lancé
// ni d'une base de données. Ce fichier exporte les MÊMES fonctions que src/services/api.js,
// mais elles lisent et modifient des données gardées en mémoire (copiées de fixtures.js).
// Les règles importantes de la vraie API sont reproduites (connexion, droits du propriétaire...).
// La vraie API est testée de son côté, dans back/tests/.
import { PRODUCTS, TEST_PASSWORD, USERS } from './fixtures.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// État de la fausse base de données, remis à zéro avant chaque test (resetFakeApi).
let database;

/** Remet les données d'origine : appelé avant chaque test dans setup.js. */
export function resetFakeApi() {
  // structuredClone fait une copie complète : les tests ne modifient jamais fixtures.js.
  database = {
    // Chaque compte reçoit le mot de passe de test.
    users: USERS.map((user) => ({ ...user, password: TEST_PASSWORD })),
    // Au départ, toutes les annonces sont en vente (sold_at vide).
    products: PRODUCTS.map((product) => ({ ...product, sold_at: null })),
    likes: [], // { userId, productId }
    messages: [],
    orders: [],
    loggedInUserId: null,
  };
}

/** Simule un utilisateur déjà connecté (cookie de connexion présent) avant d'afficher un composant. */
export function setLoggedInUser(userId) {
  database.loggedInUserId = userId;
}

/** Ajoute un message directement dans la fausse base (pour préparer un test). */
export function addFakeMessage(message) {
  database.messages.push({
    id: database.messages.length + 1,
    is_read: false,
    created_at: new Date().toISOString(),
    ...message,
  });
}

// ----- Outils internes -----

/** Ce que l'API renvoie pour un compte : jamais le mot de passe. */
function toAccount(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    profile_image_url: user.profile_image_url,
    role: user.role,
  };
}

function getLoggedInUser() {
  const user = database.users.find((candidate) => candidate.id === database.loggedInUserId);
  if (!user) {
    throw new ApiError(401, 'Vous devez être connecté.');
  }
  return user;
}

function findProduct(productId) {
  const product = database.products.find((candidate) => candidate.id === Number(productId));
  if (!product) {
    throw new ApiError(404, 'Produit introuvable.');
  }
  return product;
}

function checkOwner(product, user) {
  if (product.owner_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Vous ne pouvez modifier que vos propres annonces.');
  }
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

/** Message complété avec les pseudos et le titre de l'annonce, comme le renvoie l'API. */
function toMessageResponse(message) {
  const findUsername = (userId) => database.users.find((user) => user.id === userId)?.username;
  return {
    ...message,
    sender_username: findUsername(message.sender_id),
    recipient_username: findUsername(message.recipient_id),
    product_title: database.products.find((product) => product.id === message.product_id)?.title ?? null,
  };
}

// ----- Comptes et connexion -----

export async function fetchCurrentUser() {
  const user = database.users.find((candidate) => candidate.id === database.loggedInUserId);
  return user ? toAccount(user) : null;
}

export async function login(email, password) {
  const user = database.users.find((candidate) => candidate.email === email && candidate.password === password);
  if (!user) {
    throw new ApiError(401, 'Email ou mot de passe incorrect.');
  }
  database.loggedInUserId = user.id;
  return toAccount(user);
}

export async function register({ username, email, password }) {
  if (database.users.some((user) => user.email === email)) {
    throw new ApiError(409, 'Un compte existe déjà avec cet email.');
  }
  const user = { id: nextId(database.users), username, email, password, profile_image_url: null, role: 'user' };
  database.users.push(user);
  database.loggedInUserId = user.id;
  return toAccount(user);
}

export async function logout() {
  database.loggedInUserId = null;
  return null;
}

export async function fetchPublicProfile(userId) {
  const user = database.users.find((candidate) => candidate.id === Number(userId));
  if (!user) {
    throw new ApiError(404, 'Utilisateur introuvable.');
  }
  return { id: user.id, username: user.username, profile_image_url: user.profile_image_url };
}

export async function updateAccount(changes) {
  const user = getLoggedInUser();
  const isChangingEmail = changes.email !== undefined && changes.email !== user.email;
  if ((isChangingEmail || changes.new_password) && changes.current_password !== user.password) {
    throw new ApiError(403, 'Mot de passe actuel incorrect.');
  }
  user.username = changes.username ?? user.username;
  user.email = changes.email ?? user.email;
  user.profile_image_url = changes.profile_image_url ?? user.profile_image_url;
  user.password = changes.new_password ?? user.password;
  return toAccount(user);
}

export async function deleteAccount(currentPassword) {
  const user = getLoggedInUser();
  if (currentPassword !== user.password) {
    throw new ApiError(403, 'Mot de passe actuel incorrect.');
  }
  database.users = database.users.filter((candidate) => candidate.id !== user.id);
  database.loggedInUserId = null;
  return null;
}

/** Vrai si le compte existe encore (pour vérifier une suppression dans un test). */
export function fakeUserExists(userId) {
  return database.users.some((user) => user.id === userId);
}

// ----- Annonces -----

export async function fetchProducts() {
  return structuredClone(database.products);
}

export async function createProduct(productFields) {
  const user = getLoggedInUser();
  const product = { ...productFields, id: nextId(database.products), owner_id: user.id, owner_username: user.username };
  database.products.push(product);
  return structuredClone(product);
}

export async function updateProduct(productId, productFields) {
  const product = findProduct(productId);
  checkOwner(product, getLoggedInUser());
  Object.assign(product, productFields);
  return structuredClone(product);
}

export async function deleteProduct(productId) {
  const product = findProduct(productId);
  checkOwner(product, getLoggedInUser());
  database.products = database.products.filter((candidate) => candidate.id !== product.id);
  return null;
}

// ----- Favoris -----

export async function fetchLikedProducts() {
  const user = getLoggedInUser();
  const likedIds = database.likes.filter((like) => like.userId === user.id).map((like) => like.productId);
  return database.products.filter((product) => likedIds.includes(product.id));
}

export async function likeProduct(productId) {
  const user = getLoggedInUser();
  findProduct(productId);
  database.likes.push({ userId: user.id, productId });
  return null;
}

export async function unlikeProduct(productId) {
  const user = getLoggedInUser();
  database.likes = database.likes.filter((like) => !(like.userId === user.id && like.productId === productId));
  return null;
}

// ----- Commandes et paiement -----

/** Marque une commande comme payée et ses produits comme vendus (simule la confirmation de Stripe). */
export function markFakeOrderAsPaid(orderId) {
  const order = database.orders.find((candidate) => candidate.id === orderId);
  order.status = 'paid';
  order.paid_at = new Date().toISOString();
  for (const item of order.items) {
    findProduct(item.product_id).sold_at = order.paid_at;
  }
}

/** Marque directement une annonce comme vendue (pour préparer un test). */
export function markFakeProductAsSold(productId) {
  findProduct(productId).sold_at = new Date().toISOString();
}

export async function createOrder({ product_ids: productIds, shipping_address: shippingAddress }) {
  const user = getLoggedInUser();
  if (productIds.length === 0) {
    throw new ApiError(400, 'Le panier est vide.');
  }
  const orderItems = productIds.map((productId) => {
    const product = findProduct(productId);
    if (product.sold_at) {
      throw new ApiError(409, `« ${product.title} » vient d’être vendu, retirez-le de votre panier.`);
    }
    if (product.owner_id === user.id) {
      throw new ApiError(400, `Vous ne pouvez pas acheter votre propre annonce (« ${product.title} »).`);
    }
    return { product_id: product.id, product_title: product.title, price: product.price };
  });
  const totalInCents = orderItems.reduce((total, item) => total + Math.round(item.price * 100), 0);
  const order = {
    id: nextId(database.orders),
    buyer_id: user.id,
    status: 'pending',
    total_price: totalInCents / 100,
    shipping_address: shippingAddress,
    created_at: new Date().toISOString(),
    paid_at: null,
    items: orderItems,
  };
  database.orders.push(order);
  return { order_id: order.id, checkout_url: `https://checkout.stripe.com/c/pay/fausse-session-${order.id}` };
}

export async function fetchOrders() {
  const user = getLoggedInUser();
  return structuredClone(database.orders.filter((order) => order.buyer_id === user.id));
}

export async function fetchOrder(orderId) {
  const user = getLoggedInUser();
  const order = database.orders.find((candidate) => candidate.id === Number(orderId) && candidate.buyer_id === user.id);
  if (!order) {
    throw new ApiError(404, 'Commande introuvable.');
  }
  return structuredClone(order);
}

// ----- Messagerie -----

export async function fetchReceivedMessages() {
  const user = getLoggedInUser();
  return database.messages.filter((message) => message.recipient_id === user.id).map(toMessageResponse);
}

export async function fetchSentMessages() {
  const user = getLoggedInUser();
  return database.messages.filter((message) => message.sender_id === user.id).map(toMessageResponse);
}

export async function fetchUnreadMessageCount() {
  const user = getLoggedInUser();
  const count = database.messages.filter((message) => message.recipient_id === user.id && !message.is_read).length;
  return { count };
}

export async function sendMessage({ recipient_id: recipientId, product_id: productId, content }) {
  const user = getLoggedInUser();
  if (recipientId === user.id) {
    throw new ApiError(400, 'Vous ne pouvez pas vous envoyer un message.');
  }
  const message = {
    id: nextId(database.messages),
    sender_id: user.id,
    recipient_id: recipientId,
    product_id: productId,
    content,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  database.messages.push(message);
  return toMessageResponse(message);
}

export async function markMessageAsRead(messageId) {
  const message = database.messages.find((candidate) => candidate.id === messageId);
  message.is_read = true;
  return null;
}
