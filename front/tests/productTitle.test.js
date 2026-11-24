import { describe, expect, it } from 'vitest';
import { buildProductTitle } from '../src/utils/productTitle.js';

describe('buildProductTitle', () => {
  it('assemble « type – personnage (édition Ver.) »', () => {
    expect(
      buildProductTitle({
        category: 'FIGURINE',
        character_name: 'Roronoa Zoro',
        version: 'Wano',
        manufacturer: 'Banpresto',
      }),
    ).toBe('Figurine – Roronoa Zoro (Wano Ver.)');
  });

  it('n’ajoute pas « Ver. » s’il est déjà écrit', () => {
    expect(buildProductTitle({ category: 'FIGURINE', character_name: 'Zoro', version: 'Wano version' })).toBe(
      'Figurine – Zoro (Wano Ver.)',
    );
    expect(buildProductTitle({ category: 'FIGURINE', character_name: 'Zoro', version: 'Silver' })).toBe(
      'Figurine – Zoro (Silver Ver.)',
    );
  });

  it('utilise le fabricant quand il n’y a pas d’édition, puis seulement le personnage', () => {
    expect(
      buildProductTitle({ category: 'STATUE', character_name: 'Luffy', version: '', manufacturer: 'Bandai' }),
    ).toBe('Statue – Luffy (Bandai)');
    expect(buildProductTitle({ category: 'FIGURINE', character_name: ' Sasuke ' })).toBe('Figurine – Sasuke');
  });
});
