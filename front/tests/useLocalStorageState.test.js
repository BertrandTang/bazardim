import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useLocalStorageState from '../src/hooks/useLocalStorageState.js';

describe('useLocalStorageState', () => {
  it('utilise la valeur par défaut quand rien n’est sauvegardé', () => {
    const { result } = renderHook(() => useLocalStorageState('compteur', 0));
    expect(result.current[0]).toBe(0);
  });

  it('relit la valeur déjà sauvegardée', () => {
    localStorage.setItem('compteur', JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorageState('compteur', 0));
    expect(result.current[0]).toBe(42);
  });

  it('sauvegarde chaque nouvelle valeur dans le localStorage', () => {
    const { result } = renderHook(() => useLocalStorageState('compteur', 0));
    // act() attend que React ait fini de mettre à jour le composant.
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem('compteur')).toBe('5');
  });

  it('repart de la valeur par défaut si la sauvegarde est corrompue', () => {
    localStorage.setItem('compteur', '{pas du JSON');
    const { result } = renderHook(() => useLocalStorageState('compteur', 0));
    expect(result.current[0]).toBe(0);
  });
});
