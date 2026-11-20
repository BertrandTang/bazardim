// Nombre d'images de démonstration disponibles dans /public/img (img_1.jpg à img_11.jpg).
const DEMO_IMAGE_COUNT = 11;

/**
 * Retourne l'adresse de l'image à afficher pour un produit.
 *
 * Les produits de démonstration (figures.json) pointent vers des images qui n'existent
 * pas encore ("url_image/..."). Dans ce cas on choisit une image de /public/img
 * à partir de l'identifiant du produit, pour qu'un produit ait toujours la même image.
 *
 * @param {object} product - Le produit à afficher.
 * @returns {string} L'adresse de l'image.
 */
export function getProductImage(product) {
  const image = product.img ?? '';
  const isUsableImage = image.startsWith('/') || image.startsWith('https://') || image.startsWith('http://');

  if (isUsableImage) {
    return image;
  }

  // On extrait le nombre contenu dans l'identifiant : "FIG007" donne 7.
  const idNumber = Number(String(product.id).match(/\d+/)?.[0] ?? 0);
  const imageNumber = (idNumber % DEMO_IMAGE_COUNT) + 1;
  return `/img/img_${imageNumber}.jpg`;
}

/**
 * Formate un prix pour l'affichage : 59.9 devient "59.90 €".
 *
 * @param {number} price - Le prix en euros.
 * @returns {string} Le prix formaté.
 */
export function formatPrice(price) {
  return `${Number(price).toFixed(2)} €`;
}
