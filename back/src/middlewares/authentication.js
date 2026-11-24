import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { HttpError } from '../utils/errors.js';
import { findUserById } from '../models/users.model.js';

const AUTH_COOKIE_NAME = 'bazardim_token';
const SESSION_DURATION_IN_SECONDS = 7 * 24 * 60 * 60; // 7 jours

// Le jeton de connexion est rangé dans un cookie :
// - httpOnly : le JavaScript de la page ne peut pas le lire (protège contre le vol par XSS) ;
// - secure : envoyé uniquement en HTTPS (activé en production) ;
// - sameSite "lax" : le navigateur ne l'envoie pas lors d'un formulaire posté depuis un autre site (CSRF).
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/',
};

/** Crée un jeton JWT signé pour l'utilisateur et le dépose dans un cookie. */
export function setAuthCookie(response, userId) {
  const token = jwt.sign({}, config.JWT_SECRET, {
    subject: String(userId),
    expiresIn: SESSION_DURATION_IN_SECONDS,
  });
  response.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_DURATION_IN_SECONDS * 1000 });
}

export function clearAuthCookie(response) {
  response.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
}

/**
 * Lit le cookie de connexion et retrouve l'utilisateur connecté.
 * Retourne { user } si la session est valide, sinon { user: null, reason } avec la raison.
 */
async function readSession(request) {
  const token = request.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    return { user: null, reason: 'Vous devez être connecté.' };
  }

  let payload;
  try {
    // verify() contrôle la signature (le jeton n'a pas été modifié) et la date d'expiration.
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    return { user: null, reason: 'Session expirée ou invalide, reconnectez-vous.' };
  }

  // On relit l'utilisateur en base : un compte supprimé ne doit plus avoir accès.
  const user = await findUserById(payload.sub);
  if (!user) {
    return { user: null, reason: 'Ce compte n’existe plus.' };
  }
  return { user };
}

/**
 * Middleware qui protège une route : il vérifie le jeton du cookie puis place
 * l'utilisateur connecté dans `request.user`. Sinon, il répond 401.
 *
 * Utilisation : router.post('/products', requireAuth, createProduct);
 */
export async function requireAuth(request, response, next) {
  const { user, reason } = await readSession(request);
  if (!user) {
    throw new HttpError(401, reason);
  }
  request.user = user;
  next();
}

/**
 * Middleware à placer APRÈS requireAuth : réserve une route aux administrateurs (sinon 403).
 *
 * Utilisation : router.use(requireAuth, requireAdmin);
 */
export function requireAdmin(request, response, next) {
  if (request.user.role !== 'admin') {
    throw new HttpError(403, 'Réservé aux administrateurs.');
  }
  next();
}

/** Utilisateur connecté, ou null pour un visiteur (sans lever d'erreur). */
export async function findLoggedInUser(request) {
  const { user } = await readSession(request);
  return user;
}

/** Vrai si l'utilisateur est le propriétaire de la ressource, ou un administrateur. */
export function isOwnerOrAdmin(user, ownerId) {
  return user.id === ownerId || user.role === 'admin';
}
