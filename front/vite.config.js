import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration de Vite (serveur de développement + build de production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
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
