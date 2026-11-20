import { useNavigate } from 'react-router-dom';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductForm from '../../components/ProductForm/ProductForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import './Sell.css';

/** Page de mise en vente d'un produit (réservée aux utilisateurs connectés, voir RequireAuth). */
export default function Sell() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addProduct } = useProducts();

  // Appelée par ProductForm quand le formulaire est valide.
  function handleCreateProduct(productFields) {
    const now = new Date().toISOString();
    const newProduct = {
      ...productFields,
      id: `USR${Date.now()}`, // identifiant temporaire : ce sera le rôle du back-end
      owner_user_id: currentUser.user_id,
      owner_username: currentUser.username,
      created_at: now,
      updated_at: now,
    };
    addProduct(newProduct);
    navigate(`/product/${newProduct.id}`);
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
