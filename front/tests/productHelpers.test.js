import { describe, expect, it } from 'vitest';
import { formatPrice, getImageObjectPosition, getProductImage } from '../src/utils/productHelpers.js';

describe('getImageObjectPosition', () => {
  it('centre la photo par défaut et applique le cadrage vertical choisi', () => {
    expect(getImageObjectPosition({})).toBe('50% 50%');
    expect(getImageObjectPosition({ image_position_y: 0 })).toBe('50% 0%');
    expect(getImageObjectPosition({ image_position_y: 20 })).toBe('50% 20%');
  });
});

describe('getProductImage', () => {
  it('garde une image utilisable (URL http(s) ou chemin du site)', () => {
    expect(getProductImage({ id: 1, image_url: 'https://exemple.com/a.jpg' })).toBe('https://exemple.com/a.jpg');
    expect(getProductImage({ id: 1, image_url: '/img/img_3.jpg' })).toBe('/img/img_3.jpg');
  });

  it('choisit toujours la même image de démo quand l’image est absente ou inutilisable', () => {
    const product = { id: 7, image_url: null };
    expect(getProductImage(product)).toBe('/img/img_8.jpg');
    expect(getProductImage(product)).toBe(getProductImage(product));
    expect(getProductImage({ id: 11, image_url: 'pas-une-url.jpg' })).toBe('/img/img_1.jpg');
  });
});

describe('formatPrice', () => {
  it('affiche toujours deux décimales et le symbole euro', () => {
    expect(formatPrice(59.9)).toBe('59.90 €');
    expect(formatPrice('12')).toBe('12.00 €');
  });
});
