import { describe, expect, it } from 'vitest';
import { buildProductTitle } from '../src/utils/productTitle.js';

describe('buildProductTitle', () => {
  it('assemble type – personnage – édition', () => {
    expect(
      buildProductTitle({ category: 'FIGURINE ARTICULÉE', character_name: 'Vegeta', version: 'Super Saiyan Blue' }),
    ).toBe('Figurine articulée – Vegeta – Super Saiyan Blue');
  });

  it('utilise le fabricant quand il n’y a pas d’édition, puis seulement le personnage', () => {
    expect(
      buildProductTitle({ category: 'STATUE', character_name: 'Luffy', version: '', manufacturer: 'Bandai' }),
    ).toBe('Statue – Luffy – Bandai');
    expect(buildProductTitle({ category: 'FIGURINE', character_name: ' Sasuke ' })).toBe('Figurine – Sasuke');
  });
});
