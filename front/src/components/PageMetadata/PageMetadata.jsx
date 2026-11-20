const SITE_NAME = 'Bazardim';
const DEFAULT_DESCRIPTION =
  'Bazardim, la marketplace entre collectionneurs : achetez et vendez figurines, figurines articulées et statues d’occasion.';

/**
 * Titre de l'onglet + balises de référencement (SEO) et de partage sur les réseaux sociaux
 * (Open Graph), propres à chaque page.
 *
 * Depuis React 19, on peut écrire <title> et <meta> n'importe où dans un composant :
 * React les déplace automatiquement dans le <head> de la page.
 *
 * @param {object} props
 * @param {string} [props.title] - Titre de la page ("Panier"...). Vide = page d'accueil.
 * @param {string} [props.description] - Résumé affiché par Google sous le lien (≈ 150 caractères).
 * @param {string} [props.image] - Image affichée lors d'un partage (Facebook, Discord...).
 * @param {boolean} [props.noIndex] - true pour demander aux moteurs de ne pas référencer la page
 *   (pages privées : panier, profil...).
 */
export default function PageMetadata({ title, description = DEFAULT_DESCRIPTION, image, noIndex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Figurines et statues de collection d’occasion`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={new URL(image, window.location.origin).href} />}
    </>
  );
}
