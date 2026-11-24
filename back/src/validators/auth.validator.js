import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from './common.validator.js';

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

/** Corps de POST /api/auth/login/verify : le code à 6 chiffres reçu par e-mail. */
export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Le code contient 6 chiffres.'),
});
