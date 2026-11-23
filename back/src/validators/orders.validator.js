import { z } from 'zod';
import { idSchema } from './common.validator.js';

/**
 * Corps de POST /api/orders : les annonces du panier et l'adresse de livraison.
 * Exemple : { product_ids: [3, 8], shipping_address: "10 Rue de Rivoli 75004 Paris" }
 *
 * Chaque annonce est une pièce unique : on envoie seulement leurs identifiants, sans quantité.
 * Le front n'envoie JAMAIS de prix : le back relit les prix dans la base,
 * sinon un utilisateur malin pourrait payer 1 € une figurine à 200 €.
 */
export const createOrderSchema = z.object({
  product_ids: z
    .array(idSchema)
    .min(1, 'Le panier est vide.')
    .max(50)
    .refine(
      (productIds) => new Set(productIds).size === productIds.length,
      'Une même annonce apparaît plusieurs fois.',
    ),
  shipping_address: z.string().trim().min(5, 'L’adresse de livraison est obligatoire.').max(300),
});
