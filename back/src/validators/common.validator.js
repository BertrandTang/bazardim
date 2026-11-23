import { z } from 'zod';

// Messages d'erreur de validation en français ("Trop petit : ..." au lieu de "Too small: ...").
z.config(z.locales.fr());

// Règles réutilisées par plusieurs validateurs.

/** Identifiant numérique venant de l'URL (toujours du texte, ex : "12") converti en nombre. */
export const idSchema = z.coerce.number().int().positive();

export const usernameSchema = z.string().trim().min(3).max(30);

/** Email nettoyé (espaces retirés, minuscules) puis vérifié. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email invalide'));

// bcrypt ignore tout ce qui dépasse 72 octets : on limite donc la longueur.
export const passwordSchema = z.string().min(8).max(72);

/**
 * Adresse d'une image DU SITE : une image envoyée par un utilisateur ("/uploads/abc.jpg",
 * voir la route POST /api/uploads) ou une image de démonstration ("/img/img_1.jpg").
 * Les liens vers d'autres sites sont refusés : on ne charge jamais d'image venant d'ailleurs.
 */
export const imageUrlSchema = z
  .string()
  .trim()
  .regex(/^\/(uploads|img)\/[\w.-]+$/, 'Choisissez une image depuis votre appareil.');
