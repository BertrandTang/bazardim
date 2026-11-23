import { HttpError } from '../utils/errors.js';
import { clearAuthCookie } from '../middlewares/authentication.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';
import { idSchema } from '../validators/common.validator.js';
import { deleteAccountSchema, updateAccountSchema } from '../validators/users.validator.js';
import { deleteUserById, findPasswordHashById, findPublicProfileById, updateUserById } from '../models/users.model.js';

/** Lance une erreur 403 si `password` n'est pas le mot de passe actuel de l'utilisateur. */
async function checkCurrentPassword(userId, password) {
  const passwordHash = await findPasswordHashById(userId);
  const isCorrect = Boolean(password) && (await verifyPassword(password, passwordHash));
  if (!isCorrect) {
    throw new HttpError(403, 'Mot de passe actuel incorrect.');
  }
}

/** GET /api/users/:id — profil public d'un vendeur. */
export async function getPublicProfile(request, response) {
  const userId = idSchema.parse(request.params.id);
  const profile = await findPublicProfileById(userId);
  if (!profile) {
    throw new HttpError(404, 'Utilisateur introuvable.');
  }
  response.json(profile);
}

/** PATCH /api/users/me — modifie le compte de l'utilisateur connecté. */
export async function updateAccount(request, response) {
  const changes = updateAccountSchema.parse(request.body);
  const isChangingEmail = changes.email !== undefined && changes.email !== request.user.email;
  const isChangingPassword = changes.new_password !== undefined;

  // Changer d'email ou de mot de passe est sensible : si quelqu'un utilise un ordinateur
  // resté connecté, il ne doit pas pouvoir s'approprier le compte.
  if (isChangingEmail || isChangingPassword) {
    await checkCurrentPassword(request.user.id, changes.current_password);
  }

  const updatedUser = await updateUserById(request.user.id, {
    username: changes.username,
    email: changes.email,
    profileImageUrl: changes.profile_image_url,
    passwordHash: isChangingPassword ? await hashPassword(changes.new_password) : undefined,
  });
  response.json(updatedUser);
}

/** DELETE /api/users/me — suppression définitive du compte (droit à l'effacement, RGPD). */
export async function deleteAccount(request, response) {
  const { current_password: currentPassword } = deleteAccountSchema.parse(request.body);
  await checkCurrentPassword(request.user.id, currentPassword);
  await deleteUserById(request.user.id);
  clearAuthCookie(response);
  response.status(204).end();
}
