import { HttpError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import {
  clearAuthCookie,
  clearTwoFactorCookie,
  findLoggedInUser,
  findUserIdAwaitingTwoFactor,
  setAuthCookie,
  setTwoFactorCookie,
} from '../middlewares/authentication.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';
import { MAXIMUM_CODE_ATTEMPTS, requiresTwoFactor, sendTwoFactorCode } from '../utils/twoFactor.js';
import { findCredentialsByEmail, findUserById, insertUser } from '../models/users.model.js';
import { deleteTwoFactorCode, findTwoFactorCode, incrementTwoFactorAttempts } from '../models/twoFactorCodes.model.js';
import { loginSchema, registerSchema, twoFactorCodeSchema } from '../validators/auth.validator.js';

/** POST /api/auth/register — crée un compte puis connecte l'utilisateur. */
export async function register(request, response) {
  const { username, email, password } = registerSchema.parse(request.body);
  // Si l'email ou le pseudo existe déjà, PostgreSQL refuse l'insertion (contrainte UNIQUE)
  // et le gestionnaire d'erreurs répond 409 avec un message adapté.
  const user = await insertUser({ username, email, passwordHash: await hashPassword(password) });
  setAuthCookie(response, user.id);
  response.status(201).json(user);
}

/**
 * POST /api/auth/login — vérifie l'email et le mot de passe.
 * - Sans double authentification : l'utilisateur est connecté (cookie) et reçoit son compte.
 * - Avec double authentification : un code est envoyé par e-mail et la réponse est
 *   { two_factor_required: true }. L'utilisateur n'est PAS encore connecté : il doit envoyer
 *   le code à POST /api/auth/login/verify.
 */
export async function login(request, response) {
  const { email, password } = loginSchema.parse(request.body);
  const credentials = await findCredentialsByEmail(email);
  const isPasswordCorrect = credentials !== null && (await verifyPassword(password, credentials.password_hash));

  // Même message que l'email existe ou non : on ne révèle pas quels emails sont inscrits.
  if (!isPasswordCorrect) {
    throw new HttpError(401, 'Email ou mot de passe incorrect.');
  }

  const user = await findUserById(credentials.id);
  if (requiresTwoFactor(user)) {
    try {
      await sendTwoFactorCode(user);
    } catch (error) {
      // Serveur d'e-mails injoignable : on ne peut pas envoyer le code, donc pas de connexion.
      logger.error(error);
      await deleteTwoFactorCode(user.id);
      throw new HttpError(503, 'Envoi du code de connexion impossible, réessayez dans quelques minutes.');
    }
    setTwoFactorCookie(response, user.id);
    return response.json({ two_factor_required: true });
  }

  setAuthCookie(response, user.id);
  response.json(user);
}

/**
 * POST /api/auth/login/verify — deuxième étape de la connexion : vérifie le code reçu par e-mail.
 * Le code est valable 10 minutes, ne sert qu'une fois, et est annulé après 5 mauvais essais.
 */
export async function verifyLoginCode(request, response) {
  const { code } = twoFactorCodeSchema.parse(request.body);

  // Qui attend son code ? (cookie temporaire déposé par login)
  const userId = findUserIdAwaitingTwoFactor(request);
  const storedCode = userId ? await findTwoFactorCode(userId) : null;
  if (!storedCode || storedCode.is_expired) {
    if (userId) {
      await deleteTwoFactorCode(userId);
    }
    clearTwoFactorCookie(response);
    throw new HttpError(401, 'Code expiré : reconnectez-vous pour en recevoir un nouveau.');
  }

  if (!(await verifyPassword(code, storedCode.code_hash))) {
    const attemptCount = await incrementTwoFactorAttempts(userId);
    if (attemptCount >= MAXIMUM_CODE_ATTEMPTS) {
      await deleteTwoFactorCode(userId);
      clearTwoFactorCookie(response);
      throw new HttpError(401, 'Trop de codes incorrects : reconnectez-vous pour en recevoir un nouveau.');
    }
    throw new HttpError(401, 'Code incorrect.');
  }

  // Bon code : il est supprimé (usage unique) et l'utilisateur est enfin connecté.
  await deleteTwoFactorCode(userId);
  clearTwoFactorCookie(response);
  setAuthCookie(response, userId);
  response.json(await findUserById(userId));
}

/** POST /api/auth/logout — supprime le cookie de connexion. */
export function logout(request, response) {
  clearAuthCookie(response);
  response.status(204).end();
}

/**
 * GET /api/auth/me — renvoie l'utilisateur connecté, ou null pour un visiteur.
 *
 * Le front appelle cette route à chaque ouverture du site pour savoir si quelqu'un est connecté.
 * Un visiteur n'est pas une erreur : on répond 200 avec null plutôt que 401
 * (sinon le navigateur affiche une erreur rouge dans la console à chaque visite).
 */
export async function getCurrentUser(request, response) {
  response.json(await findLoggedInUser(request));
}
