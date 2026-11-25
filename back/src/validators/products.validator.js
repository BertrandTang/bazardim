import { z } from 'zod';
import { normalizeText } from '../utils/normalizeText.js';
import { buildProductTitle } from '../utils/productTitle.js';
import { idSchema, imageUrlSchema } from './common.validator.js';

export const CATEGORIES = ['FIGURINE', 'FIGURINE ARTICULÉE', 'STATUE'];

/** Texte facultatif : une chaîne vide ou absente est enregistrée comme NULL en base. */
function optionalText(maximumLength) {
  return z
    .string()
    .trim()
    .max(maximumLength)
    .optional()
    .transform((value) => value || null);
}

/** Nombre facultatif (ex : taille en cm) : absent = NULL en base. */
function optionalPositiveNumber(maximumValue) {
  return z.number().positive().max(maximumValue).nullable().default(null);
}

/**
 * Corps de POST /api/products et PUT /api/products/:id.
 * Pas de champ "title" : le titre est calculé à partir du type, du personnage, de l'édition
 * et du fabricant (voir utils/productTitle.js et le .transform à la fin). Un titre envoyé est ignoré.
 */
export const productSchema = z
  .object({
    description: z.string().trim().min(1).max(5000),
    price: z.number().positive().max(1_000_000),
    category: z.enum(CATEGORIES),
    // La licence doit contenir au moins une lettre ou un chiffre ("!!!" est refusé).
    licence_name: optionalText(100).refine(
      (licenceName) => licenceName === null || normalizeText(licenceName) !== '',
      'La licence doit contenir au moins une lettre ou un chiffre.',
    ),
    // Personnage obligatoire : il fait partie du titre de l'annonce.
    character_name: z.string().trim().min(1, 'Le personnage est obligatoire.').max(100),
    manufacturer: optionalText(100),
    version: optionalText(100),
    material: optionalText(100),
    state_of_wear: optionalText(50),
    has_box: z.boolean().default(false),
    state_of_box: optionalText(50),
    ean_code: z
      .string()
      .trim()
      .regex(/^(\d{8}|\d{13})?$/, 'Le code EAN doit contenir 8 ou 13 chiffres')
      .optional()
      .transform((value) => value || null),
    year_of_acquisition: z.number().int().min(1900).max(new Date().getFullYear()).nullable().default(null),
    height_cm: optionalPositiveNumber(1000),
    width_cm: optionalPositiveNumber(1000),
    scale: optionalText(20),
    // Photo obligatoire : une annonce sans photo n'inspire pas confiance.
    image_url: imageUrlSchema,
    // Cadrage vertical de la photo, en pourcentage (0 = haut, 100 = bas) ; centrée par défaut.
    image_position_y: z.number().int().min(0).max(100).default(50),
    // Tags en minuscules et sans doublons : ["SHF", "shf "] devient ["shf"].
    tags: z
      .array(z.string().trim().toLowerCase().min(1).max(30))
      .max(10)
      .default([])
      .transform((tags) => [...new Set(tags)]),
  })
  // Une fois les champs validés, on ajoute le titre calculé.
  .transform((fields) => ({ ...fields, title: buildProductTitle(fields) }));

/** Paramètres de recherche de GET /api/products (ils arrivent en texte dans l'URL). */
export const productFiltersSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  licence: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  owner_id: idSchema.optional(),
  // Pagination : on ne renvoie jamais toute la base d'un coup.
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
