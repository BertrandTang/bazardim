import { createContext, useContext } from 'react';
import figuresData from '../data/figures.json';
import useLocalStorageState from '../hooks/useLocalStorageState.js';

// ⚠️ TEMPORAIRE : en attendant le back-end, la liste des produits est initialisée
// avec figures.json puis sauvegardée dans le localStorage. Il faudra remplacer
// ces fonctions par des appels à l'API (GET/POST/PUT/DELETE /products).

const ProductsContext = createContext(null);

/**
 * Fournit la liste des produits et les fonctions pour la modifier (ajout, modification, suppression).
 */
export function ProductsProvider({ children }) {
  const [products, setProducts] = useLocalStorageState('products', figuresData.figures);

  // Liste des licences sans doublons ("One Piece", "Naruto"...).
  // `new Set()` supprime automatiquement les doublons, puis on le retransforme en tableau.
  const licences = [...new Set(products.map((product) => product.licence_name).filter(Boolean))];

  /** Retrouve un produit à partir de son identifiant. Retourne null s'il n'existe pas. */
  function findProductById(productId) {
    return products.find((product) => product.id === productId) ?? null;
  }

  function addProduct(newProduct) {
    setProducts((previousProducts) => [...previousProducts, newProduct]);
  }

  /** Remplace les champs listés dans `changes` sur le produit concerné. */
  function updateProduct(productId, changes) {
    const updatedAt = new Date().toISOString();
    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        product.id === productId ? { ...product, ...changes, updated_at: updatedAt } : product,
      ),
    );
  }

  function deleteProduct(productId) {
    setProducts((previousProducts) => previousProducts.filter((product) => product.id !== productId));
  }

  const contextValue = { products, licences, findProductById, addProduct, updateProduct, deleteProduct };
  return <ProductsContext.Provider value={contextValue}>{children}</ProductsContext.Provider>;
}

/** Hook à appeler dans un composant pour accéder aux produits. */
export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts doit être utilisé à l’intérieur de <ProductsProvider>');
  }
  return context;
}
