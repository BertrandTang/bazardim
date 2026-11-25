import { z } from 'zod';
import { idSchema } from './common.validator.js';

/**
 * Numéro de téléphone français : 0 ou +33, puis 9 chiffres, groupés ou non par deux
 * (espaces, points ou tirets acceptés). Ex : "06 12 34 56 78", "+33 6 12 34 56 78".
 */
const FRENCH_PHONE_PATTERN = /^(?:\+33 ?|0)[1-9](?:[ .-]?\d{2}){4}$/;

/**
 * Corps de POST /api/orders : les annonces du panier et le destinataire du colis.
 * Exemple : { product_ids: [3, 8], shipping_name: "Marie Dupont", shipping_phone: "06 12 34 56 78",
 *             shipping_address: "10 Rue de Rivoli 75004 Paris" }
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
  shipping_name: z.string().trim().min(2, 'Le nom du destinataire est obligatoire.').max(100),
  shipping_phone: z
    .string()
    .trim()
    .regex(FRENCH_PHONE_PATTERN, 'Numéro de téléphone invalide (exemple : 06 12 34 56 78).'),
  shipping_address: z.string().trim().min(5, 'L’adresse de livraison est obligatoire.').max(300),
});
