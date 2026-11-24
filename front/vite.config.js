import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * CSP (Content Security Policy) : la liste des sources que le navigateur a le droit de charger.
 * Si un pirate réussissait à glisser un script dans la page (faille XSS), le navigateur
 * refuserait de l'exécuter, car il ne vient pas d'une source autorisée.
 */
const CONTENT_SECURITY_POLICY = [
  // Par défaut : uniquement notre propre site.
  "default-src 'self'",
  // Scripts : uniquement les fichiers JavaScript du site (aucun script écrit dans la page).
  "script-src 'self'",
  // Styles : 'unsafe-inline' est nécessaire, car Material UI ajoute ses styles directement dans la page.
  "style-src 'self' 'unsafe-inline'",
  // Images : celles du site ; data: pour les petites images que Vite intègre directement au code.
  "img-src 'self' data:",
  "font-src 'self' data:",
  // Appels réseau (fetch) : notre API (même adresse) et l'API Adresse de l'État (panier).
  "connect-src 'self' https://data.geopf.fr",
  // Aucun plugin (Flash...), et on interdit de changer l'adresse de base des liens.
  "object-src 'none'",
  "base-uri 'self'",
  // Les formulaires ne peuvent être envoyés qu'à notre site.
  "form-action 'self'",
].join('; ');

/**
 * Petit plugin Vite : ajoute la CSP en tête de index.html, UNIQUEMENT pour le build de production.
 * En développement, Vite injecte ses propres scripts dans la page (rechargement à chaud) :
 * une CSP aussi stricte les bloquerait.
 *
 * En production, la CSP pourra aussi être envoyée par le serveur web, en en-tête HTTP
 * (indispensable pour la règle frame-ancestors, qui ne fonctionne pas dans une balise <meta>).
 */
function contentSecurityPolicyPlugin() {
  return {
    name: 'bazardim-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// Configuration de Vite (serveur de développement + build de production).
export default defineConfig({
  plugins: [react(), contentSecurityPolicyPlugin()],
  server: {
    port: 5173,
    open: true,
    // En développement, le front (port 5173) et l'API (port 3000) tournent séparément.
    // Le "proxy" transmet à l'API toutes les requêtes qui commencent par /api :
    // pour le navigateur, tout vient de la même adresse (pas de souci de CORS ni de cookie).
    proxy: {
      '/api': 'http://localhost:3000',
      // Images envoyées par les utilisateurs, enregistrées par l'API (dossier back/uploads/).
      '/uploads': 'http://localhost:3000',
      // Plan du site, généré par l'API à partir des annonces en vente.
      '/sitemap.xml': 'http://localhost:3000',
    },
  },
  // Configuration des tests (Vitest réutilise la configuration de Vite).
  test: {
    // jsdom simule un navigateur (document, window, localStorage...) dans Node.js.
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx'],
      reporter: ['text', 'html'],
      // La certification exige au moins 50 % de couverture des tests :
      // sous ce seuil, `npm run test:coverage` échoue, ce qui bloque aussi la CI.
      thresholds: { lines: 50, functions: 50, branches: 50, statements: 50 },
    },
  },
});
