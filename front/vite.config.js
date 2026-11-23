import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration de Vite (serveur de développement + build de production).
export default defineConfig({
  plugins: [react()],
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
