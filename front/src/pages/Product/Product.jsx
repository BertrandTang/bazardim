import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import AddToCartButton from '../../components/AddToCartButton/AddToCartButton.jsx';
import MessageForm from '../../components/MessageForm/MessageForm.jsx';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductForm from '../../components/ProductForm/ProductForm.jsx';
import SellerLink from '../../components/SellerLink/SellerLink.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { sendMessage } from '../../services/api.js';
import { formatPrice, getProductImage } from '../../utils/productHelpers.js';
import './Product.css';

/** Transforme la taille du produit en texte lisible : "18 cm • 25 cm • 1/8". */
function formatSize(product) {
  const parts = [
    product.height_cm && `${product.height_cm} cm`,
    product.width_cm && `${product.width_cm} cm`,
    product.scale,
  ].filter(Boolean);
  return parts.join(' • ');
}

/**
 * Données structurées (format JSON-LD, vocabulaire schema.org) décrivant le produit.
 * Google les lit pour afficher le prix et l'état directement dans ses résultats de recherche.
 * https://developers.google.com/search/docs/appearance/structured-data/product
 */
function buildStructuredData(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: new URL(getProductImage(product), window.location.origin).href,
    sku: String(product.id),
    ...(product.ean_code && { gtin13: product.ean_code }),
    ...(product.manufacturer && { brand: { '@type': 'Brand', name: product.manufacturer } }),
    offers: {
      '@type': 'Offer',
      price: Number(product.price).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      itemCondition:
        product.state_of_wear === 'Neuf' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      seller: { '@type': 'Person', name: product.owner_username },
    },
  };
}

/**
 * Page de détail d'un produit (adresse : /product/:id).
 * Le vendeur peut y modifier ou supprimer son annonce ; les autres utilisateurs peuvent le contacter.
 */
export default function Product() {
  // useParams lit la partie variable de l'URL : pour /product/12, id vaut "12".
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { findProductById, isLoading, updateProduct, deleteProduct } = useProducts();

  // Le bouton "Modifier" de la page profil ouvre /product/:id?edit=1 :
  // dans ce cas on démarre directement en mode édition.
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [deleteError, setDeleteError] = useState('');

  const product = findProductById(id);

  if (isLoading) {
    return <p className="layout-loading">Chargement…</p>;
  }

  if (!product) {
    return (
      <section className="product-page">
        <PageMetadata title="Produit introuvable" noIndex />
        <h1>Produit introuvable</h1>
      </section>
    );
  }

  const isOwner = currentUser !== null && currentUser.id === product.owner_id;

  // En cas d'erreur de l'API, ProductForm affiche le message (voir son handleSubmit).
  async function handleSave(productFields) {
    await updateProduct(product.id, productFields);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
      return;
    }
    try {
      await deleteProduct(product.id);
      navigate('/profile');
    } catch (error) {
      setDeleteError(error.message);
    }
  }

  /** Envoie un message au vendeur à propos de cette annonce. */
  async function handleContactSeller(content) {
    await sendMessage({ recipient_id: product.owner_id, product_id: product.id, content });
  }

  // Caractéristiques affichées sous la description ("N/C" = non communiqué).
  const specifications = [
    { label: 'Année', value: product.year_of_acquisition },
    { label: 'Fabricant', value: product.manufacturer },
    { label: 'Version', value: product.version },
    { label: 'Matière', value: product.material },
    { label: 'État figurine', value: product.state_of_wear },
    { label: 'Boîte', value: product.has_box ? 'Oui' : 'Non' },
    { label: 'État boîte', value: product.state_of_box },
    { label: 'EAN', value: product.ean_code },
    { label: 'Taille', value: formatSize(product) },
  ];

  return (
    <section className="product-page">
      <PageMetadata
        title={product.title}
        description={`${product.description.slice(0, 140)} - ${formatPrice(product.price)} sur Bazardim.`}
        image={getProductImage(product)}
      />
      {/* JSON.stringify produit le texte ; on remplace "<" pour qu'un titre contenant
          "</script>" ne puisse jamais fermer la balise (protection XSS). */}
      <script type="application/ld+json">
        {JSON.stringify(buildStructuredData(product)).replaceAll('<', '\\u003c')}
      </script>
      <article className="product-detail">
        <h1 className="product-detail-title">{product.title}</h1>

        <div className="product-detail-media">
          <img src={getProductImage(product)} alt={product.title} />
          {product.sold_at && <span className="product-sold-badge">Vendu</span>}
        </div>

        <SellerLink userId={product.owner_id} username={product.owner_username} />

        <div className="product-tags">
          {product.category && <span className="product-tag category">{product.category}</span>}
          {product.licence_name && <span className="product-tag licence">{product.licence_name}</span>}
          {product.character_name && <span className="product-tag character">{product.character_name}</span>}
          {product.tags?.map((tag) => (
            <span key={tag} className="product-tag custom">
              {tag}
            </span>
          ))}
        </div>

        {/* Une annonce vendue ne peut plus être modifiée (l'API le refuse aussi). */}
        {isOwner && isEditing && !product.sold_at ? (
          <ProductForm
            initialProduct={product}
            submitLabel="Enregistrer"
            onSubmit={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <p className="product-detail-description">{product.description}</p>

            <dl className="product-detail-specifications">
              {specifications.map((specification) => (
                <div key={specification.label}>
                  <dt>{specification.label} :</dt>
                  <dd>{specification.value || 'N/C'}</dd>
                </div>
              ))}
            </dl>

            <div className="product-detail-bottom">
              <span className="product-price">{formatPrice(product.price)}</span>
              {isOwner ? (
                <>
                  {!product.sold_at && (
                    <Button variant="contained" className="button-gradient" onClick={() => setIsEditing(true)}>
                      Modifier
                    </Button>
                  )}
                  <Button variant="outlined" color="error" onClick={handleDelete}>
                    Supprimer
                  </Button>
                </>
              ) : (
                // Une annonce vendue ne peut plus être ajoutée au panier.
                !product.sold_at && <AddToCartButton productId={product.id} />
              )}
            </div>
            {deleteError && (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            )}
          </>
        )}

        {/* Contacter le vendeur : uniquement pour les autres utilisateurs que le vendeur. */}
        {!isOwner && (
          <section className="product-contact" aria-labelledby="product-contact-title">
            <h2 id="product-contact-title">Contacter le vendeur</h2>
            {currentUser ? (
              <MessageForm
                label={`Votre message à ${product.owner_username}`}
                submitLabel="Envoyer"
                onSend={handleContactSeller}
              />
            ) : (
              <p>
                <Link to="/auth">Connectez-vous</Link> pour poser une question au vendeur.
              </p>
            )}
          </section>
        )}
      </article>
    </section>
  );
}
