import { config } from '../config/config.js';
import { findAvailableProductsForSitemap } from '../models/products.model.js';

// Pages fixes du site, avec leur importance pour le référencement (priority, de 0 à 1)
// et leur fréquence de mise à jour (changefreq).
// ⚠️ Les adresses des catégories doivent rester identiques à front/src/data/categories.js.
const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/figurines', changefreq: 'daily', priority: '0.8' },
  { path: '/figurines-articulees', changefreq: 'daily', priority: '0.8' },
  { path: '/statue', changefreq: 'daily', priority: '0.8' },
  { path: '/licences', changefreq: 'weekly', priority: '0.6' },
  { path: '/signup', changefreq: 'monthly', priority: '0.3' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.1' },
  { path: '/confidentialite', changefreq: 'yearly', priority: '0.1' },
];

/** Une entrée <url> du plan du site. `lastmod` (date de dernière modification) est facultatif. */
function toSitemapEntry({ path, lastmod, changefreq, priority }) {
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${config.FRONT_URL}${path}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

/**
 * GET /sitemap.xml — plan du site pour les moteurs de recherche (Google, Bing...).
 *
 * Il est généré à chaque appel, à partir de la base : chaque annonce en vente y apparaît
 * (les annonces vendues en sont retirées). Les robots découvrent ainsi les nouvelles annonces
 * sans attendre de les trouver par des liens. L'adresse du site vient de FRONT_URL (.env).
 */
export async function getSitemap(request, response) {
  const products = await findAvailableProductsForSitemap();
  const productPages = products.map((product) => ({
    path: `/product/${product.id}`,
    // Format de date attendu par les sitemaps : AAAA-MM-JJ.
    lastmod: product.updated_at.toISOString().slice(0, 10),
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const entries = [...STATIC_PAGES, ...productPages].map(toSitemapEntry);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  response.type('application/xml').send(xml);
}
