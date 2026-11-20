import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import AddToCartButton from '../../components/AddToCartButton/AddToCartButton.jsx';
import ProductForm from '../../components/ProductForm/ProductForm.jsx';
import SellerLink from '../../components/SellerLink/SellerLink.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { formatPrice, getProductImage } from '../../utils/productHelpers.js';
import './Product.css';

/** Transforme la taille { height, width, scale } en texte lisible : "18 cm • 25 cm • 1/8". */
function formatSize(size) {
  const parts = [
    size?.height && `${size.height} cm`,
    size?.width && `${size.width} cm`,
    size?.scale,
  ].filter(Boolean);
  return parts.join(' • ');
}

/** Page de détail d'un produit (adresse : /product/:id). Le vendeur peut y modifier ou supprimer son annonce. */
export default function Product() {
  // useParams lit la partie variable de l'URL : pour /product/FIG001, id vaut "FIG001".
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { findProductById, updateProduct, deleteProduct } = useProducts();

  // Le bouton "Modifier" de la page profil ouvre /product/:id?edit=1 :
  // dans ce cas on démarre directement en mode édition.
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');

  const product = findProductById(id);

  if (!product) {
    return (
      <section className="product-page">
        <h1>Produit introuvable</h1>
      </section>
    );
  }

  const isOwner = currentUser !== null && currentUser.user_id === product.owner_user_id;

  function handleSave(productFields) {
    updateProduct(product.id, productFields);
    setIsEditing(false);
  }

  function handleDelete() {
    if (window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
      deleteProduct(product.id);
      navigate('/profile');
    }
  }

  // Caractéristiques affichées sous la description ("N/C" = non communiqué).
  const specifications = [
    { label: 'Année', value: product.year_of_acquisition },
    { label: 'Fabricant', value: product.manufacturer },
    { label: 'Version', value: product.version },
    { label: 'Matière', value: product.material },
    { label: 'État figurine', value: product.state_of_wear },
    { label: 'Boîte', value: product.box ? 'Oui' : 'Non' },
    { label: 'État boîte', value: product.state_of_box },
    { label: 'EAN', value: product.EAN_number },
    { label: 'Taille', value: formatSize(product.size) },
  ];

  return (
    <section className="product-page">
      <article className="product-detail">
        <h1 className="product-detail-title">{product.title}</h1>

        <div className="product-detail-media">
          <img src={getProductImage(product)} alt={product.title} />
        </div>

        <SellerLink userId={product.owner_user_id} username={product.owner_username} />

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

        {isOwner && isEditing ? (
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
                  <Button variant="contained" className="button-gradient" onClick={() => setIsEditing(true)}>
                    Modifier
                  </Button>
                  <Button variant="outlined" color="error" onClick={handleDelete}>
                    Supprimer
                  </Button>
                </>
              ) : (
                <AddToCartButton productId={product.id} />
              )}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
