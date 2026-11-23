// Exécuté avant chaque fichier de test.
import '@testing-library/jest-dom/vitest'; // ajoute expect(...).toBeInTheDocument(), toHaveTextContent()...
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { resetFakeApi } from './fakeApi.js';

// Dans tous les tests, src/services/api.js est remplacé par la fausse API (tests/fakeApi.js) :
// aucune requête ne part vers un vrai serveur.
vi.mock('../src/services/api.js', () => import('./fakeApi.js'));

beforeEach(() => {
  // Chaque test repart des données d'origine, sans personne de connecté.
  resetFakeApi();
});

afterEach(() => {
  // Retire les composants affichés par le test précédent.
  cleanup();
  // Vide le localStorage (panier, adresse de livraison).
  localStorage.clear();
  // Annule les faux objets (fetch, window.confirm...) créés avec vi.spyOn / vi.stubGlobal.
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
