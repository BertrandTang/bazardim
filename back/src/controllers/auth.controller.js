import { HttpError } from '../utils/errors.js';
import { clearAuthCookie, findLoggedInUser, setAuthCookie } from '../middlewares/authentication.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';
import { findCredentialsByEmail, findUserById, insertUser } from '../models/users.model.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

/** POST /api/auth/register — crée un compte puis connecte l'utilisateur. */
export async function register(request, response) {
  const { username, email, password } = registerSchema.parse(request.body);
  // Si l'email ou le pseudo existe déjà, PostgreSQL refuse l'insertion (contrainte UNIQUE)
  // et le gestionnaire d'erreurs répond 409 avec un message adapté.
  const user = await insertUser({ username, email, passwordHash: await hashPassword(password) });
  setAuthCookie(response, user.id);
  response.status(201).json(user);
}

/** POST /api/auth/login — vérifie l'email et le mot de passe puis connecte l'utilisateur. */
export async function login(request, response) {
  const { email, password } = loginSchema.parse(request.body);
  const credentials = await findCredentialsByEmail(email);
  const isPasswordCorrect = credentials !== null && (await verifyPassword(password, credentials.password_hash));

  // Même message que l'email existe ou non : on ne révèle pas quels emails sont inscrits.
  if (!isPasswordCorrect) {
    throw new HttpError(401, 'Email ou mot de passe incorrect.');
  }

  setAuthCookie(response, credentials.id);
  response.json(await findUserById(credentials.id));
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
