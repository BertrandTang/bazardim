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
