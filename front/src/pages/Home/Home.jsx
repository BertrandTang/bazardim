import { useSearchParams } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import './Home.css';

/** Regroupe en un seul texte (en minuscules) tous les champs d'un produit sur lesquels on peut chercher. */
function getSearchableText(product) {
  return [
    product.title,
    product.description,
    product.category,
    product.licence_name,
    product.character_name,
    product.manufacturer,
    product.owner_username,
    ...(product.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Liste des produits, filtrée selon :
 * - la catégorie (prop `category`, fournie par la route, ex : /figurines) ;
 * - la licence (paramètre d'URL ?licence=One%20Piece) ;
 * - la recherche (paramètre d'URL ?q=luffy).
 */
export default function Home({ category }) {
  // Seules les annonces encore en vente sont proposées.
  const { availableProducts, isLoading, loadingError } = useProducts();
  const [searchParams] = useSearchParams();

  const licenceFilter = searchParams.get('licence') ?? '';
  const rawSearchText = (searchParams.get('q') ?? '').trim();
  const searchText = rawSearchText.toLowerCase();

  // Pas besoin de useState : la liste filtrée est recalculée à chaque affichage
  // à partir des produits et de l'URL.
  const filteredProducts = availableProducts.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const matchesLicence = !licenceFilter || product.licence_name === licenceFilter;
    const matchesSearch = !searchText || getSearchableText(product).includes(searchText);
    return matchesCategory && matchesLicence && matchesSearch;
  });

  // Titre principal de la page (<h1>), important pour le référencement et les lecteurs d'écran.
  const categoryLabel = CATEGORIES.find((categoryItem) => categoryItem.value === category)?.label;
  let pageTitle = '';
  if (categoryLabel) {
    pageTitle = `${categoryLabel} d’occasion`;
  } else if (licenceFilter) {
    pageTitle = `Figurines ${licenceFilter}`;
  }
  const heading = pageTitle || 'Figurines et statues de collection d’occasion';

  return (
    <section className="home-page">
      <PageMetadata
        title={pageTitle}
        description={`${heading} vendues par des collectionneurs sur Bazardim. ${availableProducts.length} annonces à découvrir.`}
      />
      <h1 className="home-title">{heading}</h1>
      {rawSearchText && (
        <p className="home-search-summary" role="status">
          {filteredProducts.length} résultat(s) pour « {rawSearchText} »
        </p>
      )}

      {isLoading && <p className="home-empty">Chargement des produits…</p>}
      {loadingError && (
        <p className="home-empty" role="alert">
          {loadingError}
        </p>
      )}
      {!isLoading && !loadingError && filteredProducts.length === 0 && (
        <p className="home-empty">Aucun produit ne correspond à votre recherche.</p>
      )}
      {filteredProducts.length > 0 && (
        <div className="home-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
