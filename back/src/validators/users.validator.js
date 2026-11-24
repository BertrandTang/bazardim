import { z } from 'zod';
import { emailSchema, imageUrlSchema, passwordSchema, usernameSchema } from './common.validator.js';

/** Corps de PATCH /api/users/me : tous les champs sont facultatifs. */
export const updateAccountSchema = z.strictObject({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  profile_image_url: imageUrlSchema.optional(),
  // Obligatoire pour changer d'email ou de mot de passe (vérifié dans le contrôleur).
  current_password: z.string().optional(),
  new_password: passwordSchema.optional(),
  // Activer / désactiver la double authentification par e-mail.
  two_factor_enabled: z.boolean().optional(),
});

/** Corps de DELETE /api/users/me : on redemande le mot de passe avant une suppression définitive. */
export const deleteAccountSchema = z.object({
  current_password: z.string().min(1),
});
