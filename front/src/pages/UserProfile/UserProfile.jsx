import { Link, Navigate, useParams } from 'react-router-dom';
import { Avatar, Rating, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import ReviewCard from '../../components/ReviewCard/ReviewCard.jsx';
import ReviewForm from '../../components/ReviewForm/ReviewForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { useReviews } from '../../context/ReviewsContext.jsx';
import './UserProfile.css';

/** Profil public d'un vendeur (adresse : /user/:id) : note, avis et annonces. */
export default function UserProfile() {
  const { id } = useParams();
  const { currentUser, findUserById } = useAuth();
  const { products } = useProducts();
  const { getReviewsAbout, getAverageRating, addReview } = useReviews();

  const seller = findUserById(id);

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
  if (currentUser && currentUser.user_id === seller.user_id) {
    return <Navigate to="/profile" replace />;
  }

  const reviews = getReviewsAbout(seller.user_id);
  const averageRating = getAverageRating(seller.user_id);
  const sellerProducts = products.filter((product) => product.owner_user_id === seller.user_id);

  return (
    <section className="user-profile-page">
      <PageMetadata
        title={`Profil de ${seller.username}`}
        description={`Annonces et avis de ${seller.username}, vendeur sur Bazardim.`}
      />
      {/* L'email n'est volontairement pas affiché : c'est une donnée personnelle (RGPD). */}
      <div className="user-profile-card">
        <Avatar src={seller.profile_img} alt="" sx={{ width: 96, height: 96 }} />
        <h1>{seller.username}</h1>
        <div className="user-profile-rating">
          <Rating value={averageRating} precision={0.5} readOnly />
          <span>{averageRating ? `${averageRating.toFixed(1)} / 5` : 'Aucune note'}</span>
          <small>{reviews.length} avis</small>
        </div>
      </div>

      <div className="user-profile-block">
        <Typography variant="h6" component="h2">
          Laisser un avis
        </Typography>
        {currentUser ? (
          <ReviewForm
            submitLabel="Publier l’avis"
            onSubmit={(rating, comment) => addReview(seller.user_id, rating, comment)}
          />
        ) : (
          <p>
            <Link to="/auth">Connectez-vous</Link> pour laisser un avis.
          </p>
        )}
      </div>

      <div className="user-profile-block">
        <Typography variant="h6" component="h2">
          Avis récents
        </Typography>
        {reviews.length === 0 ? (
          <p>Aucun avis pour le moment.</p>
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
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
