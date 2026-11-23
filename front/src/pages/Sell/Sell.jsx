import { useNavigate } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductForm from '../../components/ProductForm/ProductForm.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import './Sell.css';

/** Page de mise en vente d'un produit (réservée aux utilisateurs connectés, voir RequireAuth). */
export default function Sell() {
  const navigate = useNavigate();
  const { addProduct } = useProducts();

  // Appelée par ProductForm quand le formulaire est valide. L'API crée l'annonce,
  // lui donne un identifiant et l'associe à l'utilisateur connecté.
  // En cas d'erreur, ProductForm affiche le message (voir son handleSubmit).
  async function handleCreateProduct(productFields) {
    const createdProduct = await addProduct(productFields);
    navigate(`/product/${createdProduct.id}`);
  }

  return (
    <section className="sell-page">
      <PageMetadata title="Vendre un produit" noIndex />
      <div className="sell-card">
        <h1>Mettre un produit en vente</h1>
        <p>Complète la fiche le plus précisément possible pour rassurer les acheteurs.</p>
        <ProductForm
          submitLabel="Publier le produit"
          onSubmit={handleCreateProduct}
          onCancel={() => navigate('/profile')}
        />
      </div>
    </section>
  );
}
