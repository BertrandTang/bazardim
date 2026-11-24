/**
 * Titre d'une annonce, construit à partir de ses caractéristiques (aperçu dans le formulaire de vente) :
 *
 *   <Type> – <Personnage> – <Édition>      "Figurine articulée – Vegeta – Super Saiyan Blue"
 *   <Type> – <Personnage> – <Fabricant>    s'il n'y a pas d'édition
 *   <Type> – <Personnage>                  s'il n'y a ni édition ni fabricant
 *
 * ⚠️ Même calcul que l'API (back/src/utils/productTitle.js). Ici, il sert uniquement à l'APERÇU :
 * le titre enregistré est toujours calculé par l'API, le navigateur ne l'envoie pas.
 */

// Nom affiché de chaque catégorie, au singulier.
const CATEGORY_LABELS = {
  FIGURINE: 'Figurine',
  'FIGURINE ARTICULÉE': 'Figurine articulée',
  STATUE: 'Statue',
};

/**
 * @param {object} product - category, character_name, version, manufacturer.
 * @returns {string} Le titre, ex : "Figurine – Sasuke Uchiha – Collector".
 */
export function buildProductTitle({ category, character_name: characterName, version, manufacturer }) {
  const parts = [CATEGORY_LABELS[category], characterName?.trim(), version?.trim() || manufacturer?.trim()];
  // filter(Boolean) retire les morceaux vides (pas d'édition ni de fabricant).
  return parts.filter(Boolean).join(' – ');
}
