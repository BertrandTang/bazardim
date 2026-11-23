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
      // La certification exige au moins 50 % de couverture des tests :
      // sous ce seuil, `npm run test:coverage` échoue, ce qui bloque aussi la CI.
      thresholds: { lines: 50, functions: 50, branches: 50, statements: 50 },
    },
  },
});
