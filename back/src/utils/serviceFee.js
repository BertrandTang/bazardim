/**
 * Frais de service de Bazardim : c'est ainsi que la plateforme gagne de l'argent (monétisation).
 * Ils sont payés par l'acheteur, en plus du prix des articles (même principe que la
 * « Protection acheteurs » de Vinted), et affichés dans le panier AVANT le paiement.
 *
 * Barème : 0,70 € fixe + 5 % du prix des articles.
 * Exemple : panier de 40 € → 0,70 € + 2,00 € = 2,70 € de frais → 42,70 € payés.
 *
 * ⚠️ Le front affiche le même calcul (front/src/utils/serviceFee.js), mais c'est CE calcul,
 * côté serveur, qui fait foi : le montant envoyé à Stripe ne vient jamais du navigateur.
 */

// Partie fixe, en centimes (70 centimes = 0,70 €).
export const SERVICE_FEE_FIXED_IN_CENTS = 70;

// Partie proportionnelle : 5 % du prix des articles.
export const SERVICE_FEE_RATE = 0.05;

/**
 * Calcule les frais de service d'une commande.
 * On compte en centimes (nombres entiers) pour éviter les erreurs d'arrondi des nombres à virgule.
 *
 * @param {number} itemsTotalInCents - Prix total des articles, en centimes.
 * @returns {number} Les frais, en centimes (arrondis au centime le plus proche).
 */
export function computeServiceFeeInCents(itemsTotalInCents) {
  return SERVICE_FEE_FIXED_IN_CENTS + Math.round(itemsTotalInCents * SERVICE_FEE_RATE);
}
