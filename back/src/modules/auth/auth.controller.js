import { HttpError } from '../../errors.js';
import { clearAuthCookie, setAuthCookie } from '../../middlewares/authentication.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { findCredentialsByEmail, findUserById, insertUser } from '../users/users.repository.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

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

/** GET /api/auth/me — renvoie l'utilisateur connecté (placé dans request.user par requireAuth). */
export function getCurrentUser(request, response) {
  response.json(request.user);
}
