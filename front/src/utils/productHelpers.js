// Nombre d'images de démonstration disponibles dans /public/img (img_1.jpg à img_11.jpg).
const DEMO_IMAGE_COUNT = 11;

/**
 * Retourne l'adresse de l'image à afficher pour un produit.
 *
 * Les produits de démonstration n'ont pas d'image (image_url vide). Dans ce cas on choisit
 * une image de /public/img à partir de l'identifiant du produit, pour qu'un produit
 * ait toujours la même image.
 *
 * @param {object} product - Le produit à afficher.
 * @returns {string} L'adresse de l'image.
 */
export function getProductImage(product) {
  const image = product.image_url ?? '';
  const isUsableImage = image.startsWith('/') || image.startsWith('https://') || image.startsWith('http://');

  if (isUsableImage) {
    return image;
  }

  // L'identifiant 1 donne img_2.jpg, 11 donne img_1.jpg... (% = reste de la division).
  const imageNumber = (Number(product.id) % DEMO_IMAGE_COUNT) + 1;
  return `/img/img_${imageNumber}.jpg`;
}

/**
 * Cadrage de la photo d'un produit, à passer à la propriété CSS object-position.
 * Les photos remplissent un cadre plus large que haut (object-fit: cover) : une figurine photographiée
 * en hauteur est donc rognée en haut et en bas. Le vendeur choisit la partie visible (0 = haut, 100 = bas).
 *
 * @param {object} product - Le produit (ou les valeurs du formulaire).
 * @returns {string} Ex : "50% 20%" (centré horizontalement, 20 % depuis le haut).
 */
export function getImageObjectPosition(product) {
  return `50% ${product.image_position_y ?? 50}%`;
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
