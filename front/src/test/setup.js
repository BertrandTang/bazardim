// Exécuté avant chaque fichier de test.
import '@testing-library/jest-dom/vitest'; // ajoute expect(...).toBeInTheDocument(), toHaveTextContent()...
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  // Retire les composants affichés par le test précédent.
  cleanup();
  // Chaque test repart d'un navigateur "vide" : comptes, panier, produits par défaut.
  localStorage.clear();
  // Annule les faux objets (fetch, window.confirm...) créés avec vi.spyOn / vi.stubGlobal.
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
