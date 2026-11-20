import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { findUserById } from '../modules/users/users.repository.js';

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
 * Middleware qui protège une route : il vérifie le jeton du cookie puis place
 * l'utilisateur connecté dans `request.user`. Sinon, il répond 401.
 *
 * Utilisation : router.post('/products', requireAuth, createProduct);
 */
export async function requireAuth(request, response, next) {
  const token = request.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    throw new HttpError(401, 'Vous devez être connecté.');
  }

  let payload;
  try {
    // verify() contrôle la signature (le jeton n'a pas été modifié) et la date d'expiration.
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expirée ou invalide, reconnectez-vous.');
  }

  // On relit l'utilisateur en base : un compte supprimé ne doit plus avoir accès.
  const user = await findUserById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'Ce compte n’existe plus.');
  }

  request.user = user;
  next();
}

/** Vrai si l'utilisateur est le propriétaire de la ressource, ou un administrateur. */
export function isOwnerOrAdmin(user, ownerId) {
  return user.id === ownerId || user.role === 'admin';
}
