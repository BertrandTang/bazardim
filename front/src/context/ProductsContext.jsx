import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  // Licences validées par un administrateur (les licences en attente n'apparaissent pas dans le menu).
  const [approvedLicences, setApprovedLicences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Message à afficher si la liste n'a pas pu être chargée (API arrêtée...).
  const [loadingError, setLoadingError] = useState('');

  // Chargement des produits et des licences une seule fois, au démarrage de l'application.
  // Promise.all lance les deux appels en même temps et attend qu'ils soient tous les deux terminés.
  useEffect(() => {
    Promise.all([api.fetchProducts(), api.fetchLicences()])
      .then(([loadedProducts, loadedLicences]) => {
        setProducts(loadedProducts);
        setApprovedLicences(loadedLicences);
      })
      .catch((error) => setLoadingError(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * Recharge la liste depuis l'API, par exemple après un paiement (les produits achetés sont devenus "vendus").
   * useCallback garde la même fonction d'un affichage à l'autre : elle peut ainsi être utilisée
   * dans un useEffect sans le relancer en boucle (voir la page OrderConfirmation).
   */
  const reloadProducts = useCallback(() => {
    return Promise.all([api.fetchProducts(), api.fetchLicences()]).then(([loadedProducts, loadedLicences]) => {
      setProducts(loadedProducts);
      setApprovedLicences(loadedLicences);
    });
  }, []);

  // Annonces encore en vente : celles qui n'ont pas de date de vente (sold_at).
  const availableProducts = products.filter((product) => !product.sold_at);

  // Licences du menu : les licences validées qui ont au moins une annonce encore en vente.
  const licences = approvedLicences.filter((licenceName) =>
    availableProducts.some((product) => product.licence_name === licenceName),
  );

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
    availableProducts,
    isLoading,
    loadingError,
    licences,
    findProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    reloadProducts,
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
