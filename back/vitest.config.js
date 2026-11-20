import { defineConfig } from 'vitest/config';
import { TEST_ENVIRONMENT } from './tests/testEnvironment.js';

export default defineConfig({
  test: {
    env: TEST_ENVIRONMENT,
    globalSetup: './tests/globalSetup.js',
    // Tous les fichiers de test partagent la même base : on les exécute l'un après l'autre.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
      reporter: ['text', 'html'],
      // La certification exige au moins 50 % de couverture. On vise plus haut (80 %) :
      // sous ce seuil, `npm run test:coverage` échoue, ce qui bloque aussi la CI.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
