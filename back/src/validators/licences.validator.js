import { z } from 'zod';
import { normalizeText } from '../utils/normalizeText.js';
import { idSchema } from './common.validator.js';

/** Nom de licence ou synonyme : au moins une lettre ou un chiffre ("!!!" est refusé). */
const licenceNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((name) => normalizeText(name) !== '', 'Le nom doit contenir au moins une lettre ou un chiffre.');

/** Corps de PATCH /api/admin/licences/:id : renommer et/ou valider. */
export const updateLicenceSchema = z
  .strictObject({
    name: licenceNameSchema.optional(),
    status: z.literal('approved').optional(),
  })
  .refine((changes) => changes.name !== undefined || changes.status !== undefined, 'Rien à modifier.');

/** Corps de POST /api/admin/licences/:id/merge : la licence dans laquelle fusionner. */
export const mergeLicenceSchema = z.object({ target_licence_id: idSchema });

/** Corps de POST /api/admin/licences/:id/aliases : le synonyme à ajouter. */
export const aliasSchema = z.object({ alias: licenceNameSchema });
