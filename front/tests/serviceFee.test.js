import { describe, expect, it } from 'vitest';
import { computeServiceFee } from '../src/utils/serviceFee.js';

describe('computeServiceFee', () => {
  it('ajoute 0,70 € fixe et 5 % du prix des articles', () => {
    expect(computeServiceFee(40)).toBe(2.7); // 0.70 + 2.00
    expect(computeServiceFee(0)).toBe(0.7);
  });

  it('arrondit au centime le plus proche (même résultat que l’API)', () => {
    expect(computeServiceFee(55.5)).toBe(3.48); // 0.70 + 2.775 arrondi à 2.78
    expect(computeServiceFee(134.98)).toBe(7.45); // 0.70 + 6.749 arrondi à 6.75
  });
});
