/**
 * Catégories de produits proposées sur le site.
 * Cette liste est la seule source de vérité : la barre de navigation,
 * les routes et le formulaire de vente l'utilisent tous.
 *
 * - value : valeur enregistrée dans le produit (champ `category`)
 * - label : texte affiché à l'utilisateur
 * - path  : adresse de la page qui liste les produits de cette catégorie
 */
export const CATEGORIES = [
  { value: 'FIGURINE', label: 'Figurines', path: '/figurines' },
  { value: 'FIGURINE ARTICULÉE', label: 'Figurines articulées', path: '/figurines-articulees' },
  { value: 'STATUE', label: 'Statues', path: '/statue' },
];
