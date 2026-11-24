/**
 * Forme « normalisée » d'un texte, pour comparer deux écritures d'un même nom :
 * minuscules, sans accents, sans ponctuation et sans espaces en trop.
 *
 *   "One Piece", "one piece ", "ONE-PIECE", "One  Piece !"  →  "one piece"
 *   "Pokémon", "POKEMON"                                   →  "pokemon"
 *
 * Utilisée pour les licences : deux licences ne peuvent pas avoir la même forme normalisée
 * (colonne licences.normalized_name, UNIQUE), et les synonymes sont enregistrés sous cette forme.
 *
 * Les lettres de toutes les langues sont gardées (\p{L} : lettres latines, japonaises...),
 * pour qu'un nom écrit en japonais ne devienne pas une chaîne vide.
 */
export function normalizeText(text) {
  return (
    text
      // 1. Sépare chaque lettre de son accent : "é" devient "e" + accent.
      .normalize('NFD')
      // 2. Supprime les accents latins (bloc Unicode U+0300 à U+036F).
      .replace(/[̀-ͯ]/g, '')
      // 3. Recolle ce qui reste (utile pour les caractères japonais, ex : が).
      .normalize('NFC')
      .toLowerCase()
      // 4. Tout ce qui n'est ni une lettre ni un chiffre (ponctuation, espaces) devient un espace.
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  );
}
