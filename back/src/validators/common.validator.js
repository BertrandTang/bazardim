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

/** Adresse d'image : URL http(s) ou chemin du site ("/img/..."). Vide = pas d'image. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === '' || /^(https?:\/\/|\/)/.test(value),
    'L’image doit être une URL http(s) ou un chemin commençant par /',
  );
