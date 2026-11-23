/**
 * Charge complètement une nouvelle page : la page de paiement de Stripe, ou l'accueil du site
 * après la suppression d'un compte (le site repart alors de zéro).
 * (Pour changer de page normalement À L'INTÉRIEUR du site, on utilise navigate() de React Router.)
 *
 * Cette ligne est dans son propre fichier pour que les tests puissent la remplacer :
 * le navigateur simulé des tests ne sait pas changer de site.
 *
 * @param {string} url - Adresse, ex : "https://checkout.stripe.com/..." ou "/".
 */
export function redirectTo(url) {
  window.location.assign(url);
}
