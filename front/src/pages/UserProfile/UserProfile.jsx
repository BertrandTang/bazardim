import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Avatar, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { fetchPublicProfile } from '../../services/api.js';
import './UserProfile.css';

/** Profil public d'un vendeur (adresse : /user/:id) : pseudo, photo et annonces. */
export default function UserProfile() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { products } = useProducts();

  // Profil chargé depuis l'API, avec l'identifiant auquel il correspond :
  // { userId: "3", seller: {...} } ou { userId: "3", seller: null } s'il est introuvable.
  const [loadedProfile, setLoadedProfile] = useState({ userId: null, seller: null });

  // Recharge le profil à chaque changement d'identifiant dans l'URL.
  useEffect(() => {
    fetchPublicProfile(id)
      .then((seller) => setLoadedProfile({ userId: id, seller }))
      .catch(() => setLoadedProfile({ userId: id, seller: null }));
  }, [id]);

  // Tant que la réponse correspondant à l'URL actuelle n'est pas arrivée, on patiente.
  if (loadedProfile.userId !== id) {
    return <p className="layout-loading">Chargement…</p>;
  }

  const seller = loadedProfile.seller;

  if (!seller) {
    return (
      <section className="user-profile-page">
        <PageMetadata title="Profil introuvable" noIndex />
        <Typography variant="h5" component="h1">
          Profil introuvable
        </Typography>
      </section>
    );
  }

  // Si l'utilisateur consulte son propre profil public, on l'envoie vers sa page "Mon profil".
  if (currentUser && currentUser.id === seller.id) {
    return <Navigate to="/profile" replace />;
  }

  const sellerProducts = products.filter((product) => product.owner_id === seller.id);

  return (
    <section className="user-profile-page">
      <PageMetadata
        title={`Profil de ${seller.username}`}
        description={`Annonces de ${seller.username}, vendeur sur Bazardim.`}
      />
      {/* L'API ne renvoie pas l'email : c'est une donnée personnelle (RGPD). */}
      <div className="user-profile-card">
        <Avatar src={seller.profile_image_url ?? ''} alt="" sx={{ width: 96, height: 96 }} />
        <h1>{seller.username}</h1>
      </div>

      <div className="user-profile-block">
        <Typography variant="h6" component="h2">
          Annonces de {seller.username}
        </Typography>
        {sellerProducts.length === 0 ? (
          <p>Aucune annonce en ligne.</p>
        ) : (
          <div className="user-profile-products">
            {sellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
