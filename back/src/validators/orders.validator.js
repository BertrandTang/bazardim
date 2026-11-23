import { z } from 'zod';
import { idSchema } from './common.validator.js';

/**
 * Corps de POST /api/orders : le contenu du panier et l'adresse de livraison.
 * Le front n'envoie JAMAIS de prix : le back relit les prix dans la base,
 * sinon un utilisateur malin pourrait payer 1 € une figurine à 200 €.
 */
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: idSchema,
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, 'Le panier est vide.')
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.product_id)).size === items.length,
      'Un même produit apparaît plusieurs fois.',
    ),
  shipping_address: z.string().trim().min(5, 'L’adresse de livraison est obligatoire.').max(300),
});
