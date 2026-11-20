import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

// Configuration de l'analyse statique du code (lancée avec `npm run lint`).
export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Les fichiers de contexte exportent volontairement un composant (Provider) ET un hook (useXxx) ;
    // les utilitaires de test exportent des composants et des fonctions.
    files: ['src/context/**/*.jsx', 'src/test/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
