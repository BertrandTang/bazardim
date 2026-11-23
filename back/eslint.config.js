import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

// Configuration de l'analyse statique du code (lancée avec `npm run lint`).
export default defineConfig([
  globalIgnores(['coverage']),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Les gestionnaires d'erreurs Express doivent déclarer `next` même s'ils ne l'utilisent pas.
      'no-unused-vars': ['error', { argsIgnorePattern: '^next$' }],
    },
  },
]);
