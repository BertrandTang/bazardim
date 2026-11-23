import { z } from 'zod';
import { idSchema } from './common.validator.js';

/** Corps de POST /api/messages. */
export const sendMessageSchema = z.object({
  recipient_id: idSchema,
  // Annonce concernée : facultative (null = message sans annonce).
  product_id: idSchema.nullable().default(null),
  content: z.string().trim().min(1, 'Le message ne peut pas être vide.').max(2000),
});
