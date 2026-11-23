import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api.js';

const ProductsContext = createContext(null);

/**
 * Fournit la liste des produits (chargée depuis l'API) et les fonctions pour la modifier.
 *
 * Après chaque création / modification / suppression, on met à jour la liste locale
 * avec la réponse de l'API : toutes les pages affichent ainsi la bonne version sans recharger.
 */
export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Message à afficher si la liste n'a pas pu être chargée (API arrêtée...).
  const [loadingError, setLoadingError] = useState('');

  // Chargement des produits une seule fois, au démarrage de l'application.
  useEffect(() => {
    api
      .fetchProducts()
      .then((loadedProducts) => setProducts(loadedProducts))
      .catch((error) => setLoadingError(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Liste des licences sans doublons ("One Piece", "Naruto"...).
  // `new Set()` supprime automatiquement les doublons, puis on le retransforme en tableau.
  const licences = [...new Set(products.map((product) => product.licence_name).filter(Boolean))];

  /** Retrouve un produit à partir de son identifiant (nombre, ou texte venant de l'URL). */
  function findProductById(productId) {
    return products.find((product) => String(product.id) === String(productId)) ?? null;
  }

  /** Crée l'annonce via l'API et retourne le produit créé (avec son identifiant). */
  async function addProduct(productFields) {
    const createdProduct = await api.createProduct(productFields);
    // On passe une fonction à setProducts : React nous donne la liste actuelle
    // et on retourne la nouvelle liste (on ne modifie jamais l'ancienne directement).
    setProducts((previousProducts) => [createdProduct, ...previousProducts]);
    return createdProduct;
  }

  async function updateProduct(productId, productFields) {
    const updatedProduct = await api.updateProduct(productId, productFields);
    setProducts((previousProducts) =>
      previousProducts.map((product) => (product.id === productId ? updatedProduct : product)),
    );
  }

  async function deleteProduct(productId) {
    await api.deleteProduct(productId);
    setProducts((previousProducts) => previousProducts.filter((product) => product.id !== productId));
  }

  const contextValue = {
    products,
    isLoading,
    loadingError,
    licences,
    findProductById,
    addProduct,
    updateProduct,
    deleteProduct,
  };
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
