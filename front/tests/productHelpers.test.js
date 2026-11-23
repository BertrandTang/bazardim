import { describe, expect, it } from 'vitest';
import { formatPrice, getProductImage } from '../src/utils/productHelpers.js';

describe('getProductImage', () => {
  it('garde une image utilisable (URL http(s) ou chemin du site)', () => {
    expect(getProductImage({ id: 'FIG001', img: 'https://exemple.com/a.jpg' })).toBe('https://exemple.com/a.jpg');
    expect(getProductImage({ id: 'FIG001', img: '/img/img_3.jpg' })).toBe('/img/img_3.jpg');
  });

  it('choisit toujours la même image de démo quand l’image est absente ou inutilisable', () => {
    const product = { id: 'FIG007', img: 'url_image/vegeta.jpg' };
    expect(getProductImage(product)).toBe('/img/img_8.jpg');
    expect(getProductImage(product)).toBe(getProductImage(product));
    expect(getProductImage({ id: 'SANS-CHIFFRE' })).toBe('/img/img_1.jpg');
  });
});

describe('formatPrice', () => {
  it('affiche toujours deux décimales et le symbole euro', () => {
    expect(formatPrice(59.9)).toBe('59.90 €');
    expect(formatPrice('12')).toBe('12.00 €');
  });
});
