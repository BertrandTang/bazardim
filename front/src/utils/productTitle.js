/**
 * Titre d'une annonce, construit à partir de ses caractéristiques (aperçu dans le formulaire de vente) :
 *
 *   <Type> – <Personnage> (<Édition> Ver.)   "Figurine – Roronoa Zoro (Wano Ver.)"
 *   <Type> – <Personnage> (<Fabricant>)      s'il n'y a pas d'édition
 *   <Type> – <Personnage>                    s'il n'y a ni édition ni fabricant
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

// « Ver. », « ver », « version » écrit à la fin de l'édition par le vendeur (pour ne pas l'écrire deux fois).
const VERSION_SUFFIX = /\s*\b(ver\.?|version)\s*$/i;

/**
 * @param {object} product - category, character_name, version, manufacturer.
 * @returns {string} Le titre, ex : "Figurine – Sasuke Uchiha (Collector Ver.)".
 */
export function buildProductTitle({ category, character_name: characterName, version, manufacturer }) {
  const title = [CATEGORY_LABELS[category], characterName?.trim()].filter(Boolean).join(' – ');

  // Entre parenthèses : l'édition suivie de « Ver. », ou à défaut le fabricant, ou rien.
  const edition = version ? version.trim().replace(VERSION_SUFFIX, '') : '';
  const details = edition ? `${edition} Ver.` : manufacturer?.trim();

  return details ? `${title} (${details})` : title;
}
