import { useEffect, useState } from 'react';

/**
 * Fonctionne exactement comme `useState`, mais la valeur est aussi sauvegardée
 * dans le localStorage du navigateur : elle survit donc à un rechargement de la page.
 *
 * Exemple d'utilisation :
 *   const [cartItems, setCartItems] = useLocalStorageState('cartItems', []);
 *
 * Rappel sur useState : `useState` crée une "variable d'état". Quand on appelle
 * la fonction `setXxx`, React met à jour la valeur ET réaffiche le composant.
 *
 * @param {string} storageKey - Nom de la clé utilisée dans le localStorage.
 * @param {*} defaultValue - Valeur utilisée si rien n'est encore sauvegardé.
 * @returns {[*, Function]} La valeur actuelle et la fonction pour la modifier (comme useState).
 */
export default function useLocalStorageState(storageKey, defaultValue) {
  // On passe une fonction à useState : elle n'est exécutée qu'une seule fois,
  // au premier affichage. On en profite pour lire la valeur déjà sauvegardée.
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(storageKey);
      return savedValue !== null ? JSON.parse(savedValue) : defaultValue;
    } catch {
      // JSON invalide ou localStorage inaccessible (navigation privée...) : on repart de zéro.
      return defaultValue;
    }
  });

  // useEffect exécute ce code APRÈS l'affichage, à chaque fois que `value` change :
  // on recopie alors la nouvelle valeur dans le localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Stockage plein ou bloqué : l'application continue de fonctionner sans sauvegarde.
    }
  }, [storageKey, value]);

  return [value, setValue];
}
