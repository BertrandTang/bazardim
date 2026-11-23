/**
 * Quitte notre site pour aller sur une autre adresse, par exemple la page de paiement de Stripe.
 * (Pour changer de page À L'INTÉRIEUR du site, on utilise navigate() de React Router.)
 *
 * Cette ligne est dans son propre fichier pour que les tests puissent la remplacer :
 * le navigateur simulé des tests ne sait pas changer de site.
 *
 * @param {string} url - Adresse complète, ex : "https://checkout.stripe.com/...".
 */
export function redirectTo(url) {
  window.location.assign(url);
}
