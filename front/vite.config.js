import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// Configuration de Vite (serveur de développement + build de production).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // `npm run build:analyze` génère dist/stats.html : une carte de ce qui pèse dans le bundle.
    mode === 'analyze' && visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  // Configuration des tests (Vitest réutilise la configuration de Vite).
  test: {
    // jsdom simule un navigateur (document, window, localStorage...) dans Node.js.
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
      reporter: ['text', 'html'],
      // La certification exige au moins 50 %. On vise plus haut (80 %) :
      // sous ce seuil, `npm run test:coverage` échoue, ce qui bloque aussi la CI.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Les bibliothèques changent rarement : on les met dans des fichiers à part,
        // que le navigateur garde en cache même quand le code de l'application change.
        manualChunks(modulePath) {
          if (modulePath.includes('node_modules/@mui') || modulePath.includes('node_modules/@emotion')) {
            return 'vendor-mui';
          }
          if (modulePath.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
