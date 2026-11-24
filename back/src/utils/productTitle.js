/**
 * Titre d'une annonce, construit automatiquement à partir de ses caractéristiques :
 *
 *   <Type> – <Personnage> – <Édition>      "Figurine articulée – Vegeta – Super Saiyan Blue"
 *   <Type> – <Personnage> – <Fabricant>    s'il n'y a pas d'édition : "Statue – Luffy – Bandai"
 *   <Type> – <Personnage>                  s'il n'y a ni édition ni fabricant
 *
 * La licence n'est pas dans le titre : elle est déjà affichée sur la carte de l'annonce.
 *
 * Pourquoi ? Des titres homogènes, faciles à lire et à chercher, et pas de titres
 * du type « WOW RARE !!! ». Le vendeur ne saisit donc pas de titre : c'est l'API qui le calcule.
 * ⚠️ Le front affiche un aperçu avec le même calcul (front/src/utils/productTitle.js).
 */

// Nom affiché de chaque catégorie, au singulier.
export const CATEGORY_LABELS = {
  FIGURINE: 'Figurine',
  'FIGURINE ARTICULÉE': 'Figurine articulée',
  STATUE: 'Statue',
};

// Longueur maximale d'un titre (colonne products.title, VARCHAR(150)).
const MAXIMUM_TITLE_LENGTH = 150;

/**
 * @param {object} product - Les champs de l'annonce : category, character_name, version, manufacturer.
 * @returns {string} Le titre, ex : "Figurine – Sasuke Uchiha – Collector".
 */
export function buildProductTitle({ category, character_name: characterName, version, manufacturer }) {
  const parts = [CATEGORY_LABELS[category], characterName, version || manufacturer];
  // filter(Boolean) retire les morceaux vides (pas d'édition ni de fabricant).
  return parts.filter(Boolean).join(' – ').slice(0, MAXIMUM_TITLE_LENGTH);
}
