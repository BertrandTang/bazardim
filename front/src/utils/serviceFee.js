/**
 * Frais de service de Bazardim, affichés dans le panier AVANT le paiement (obligation légale :
 * l'acheteur doit connaître le prix total avant de payer).
 *
 * Barème : 0,70 € fixe + 5 % du prix des articles.
 *
 * ⚠️ Même calcul que l'API (back/src/utils/serviceFee.js). Ce calcul sert uniquement à l'affichage :
 * le montant réellement payé est recalculé par l'API, le navigateur ne l'envoie jamais.
 */
const SERVICE_FEE_FIXED_IN_CENTS = 70;
const SERVICE_FEE_RATE = 0.05;

/** Texte du barème, affiché sous le total du panier. */
export const SERVICE_FEE_DESCRIPTION = '0,70 € + 5 % du prix des articles';

/**
 * @param {number} itemsTotal - Prix total des articles, en euros (ex : 40).
 * @returns {number} Les frais de service, en euros (ex : 2.7).
 */
export function computeServiceFee(itemsTotal) {
  // Calcul en centimes (nombres entiers) pour éviter les erreurs d'arrondi des nombres à virgule.
  const itemsTotalInCents = Math.round(itemsTotal * 100);
  return (SERVICE_FEE_FIXED_IN_CENTS + Math.round(itemsTotalInCents * SERVICE_FEE_RATE)) / 100;
}
