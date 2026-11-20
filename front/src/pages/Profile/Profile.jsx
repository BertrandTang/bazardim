import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Button, Rating, Stack, TextField, Typography } from '@mui/material';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import ReviewCard from '../../components/ReviewCard/ReviewCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLikes } from '../../context/LikesContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { useReviews } from '../../context/ReviewsContext.jsx';
import './Profile.css';

// Onglets du menu latéral. `component` est le composant affiché quand l'onglet est actif
// (ils sont définis plus bas dans ce fichier).
const SECTIONS = [
  { id: 'settings', label: 'Profil', component: SettingsSection },
  { id: 'products', label: 'Mes produits', component: MyProductsSection },
  { id: 'likes', label: 'Mes likes', component: MyLikesSection },
  { id: 'reviews', label: 'Avis', component: MyReviewsSection },
];

/** Page "Mon profil" (réservée aux utilisateurs connectés, voir RequireAuth). */
export default function Profile() {
  const { logout } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState('settings');

  const activeSection = SECTIONS.find((section) => section.id === activeSectionId);
  // Une variable dont le nom commence par une majuscule peut être utilisée comme une balise JSX.
  const ActiveSectionComponent = activeSection.component;

  return (
    <div className="profile-page">
      <nav className="profile-sidebar" aria-label="Sections du profil">
        <Stack spacing={1}>
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant={section.id === activeSectionId ? 'contained' : 'text'}
              aria-current={section.id === activeSectionId ? 'page' : undefined}
              onClick={() => setActiveSectionId(section.id)}
            >
              {section.label}
            </Button>
          ))}
          <Button color="error" onClick={logout}>
            Déconnexion
          </Button>
        </Stack>
      </nav>

      <section className="profile-content">
        <Typography variant="h6" component="h1" gutterBottom>
          {activeSection.label}
        </Typography>
        <ActiveSectionComponent />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet "Profil" : modification des informations du compte           */
/* ------------------------------------------------------------------ */
function SettingsSection() {
  const { currentUser, updateCurrentUser } = useAuth();
  const [formValues, setFormValues] = useState({
    username: currentUser.username,
    email: currentUser.email,
    profile_img: currentUser.profile_img,
    newPassword: '',
  });
  const [isSaved, setIsSaved] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
    setIsSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const changes = {
      username: formValues.username.trim(),
      email: formValues.email.trim().toLowerCase(),
      profile_img: formValues.profile_img.trim(),
    };
    // On ne change le mot de passe que si un nouveau a été saisi.
    if (formValues.newPassword) {
      changes.password = formValues.newPassword;
    }
    updateCurrentUser(changes);
    setFormValues((previousValues) => ({ ...previousValues, newPassword: '' }));
    setIsSaved(true);
  }

  return (
    <Stack component="form" spacing={2} sx={{ maxWidth: 500 }} onSubmit={handleSubmit}>
      <Avatar src={formValues.profile_img} alt="" sx={{ width: 80, height: 80 }} />
      <TextField label="Pseudo" name="username" value={formValues.username} onChange={handleChange} />
      <TextField label="Email" name="email" type="email" value={formValues.email} onChange={handleChange} />
      <TextField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        helperText="Laisser vide pour conserver le mot de passe actuel"
        value={formValues.newPassword}
        onChange={handleChange}
      />
      <TextField
        label="Image de profil (URL)"
        name="profile_img"
        value={formValues.profile_img}
        onChange={handleChange}
      />
      {isSaved && <Alert severity="success">Profil mis à jour.</Alert>}
      <Button type="submit" variant="contained">
        Enregistrer
      </Button>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet "Mes produits" : annonces publiées par l'utilisateur          */
/* ------------------------------------------------------------------ */
function MyProductsSection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { products, deleteProduct } = useProducts();

  const myProducts = products.filter((product) => product.owner_user_id === currentUser.user_id);

  function handleDelete(product) {
    if (window.confirm(`Supprimer l'annonce « ${product.title} » ?`)) {
      deleteProduct(product.id);
    }
  }

  return (
    <>
      <Button className="button-gradient profile-add-product" variant="contained" onClick={() => navigate('/vendre')}>
        Ajouter un produit en vente
      </Button>
      {myProducts.length === 0 ? (
        <p className="profile-empty">Vous n’avez encore aucune annonce.</p>
      ) : (
        <div className="profile-grid">
          {myProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => navigate(`/product/${product.id}?edit=1`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet "Mes likes" : produits mis en favoris                         */
/* ------------------------------------------------------------------ */
function MyLikesSection() {
  const { products } = useProducts();
  const { likedProductIds } = useLikes();

  const likedProducts = products.filter((product) => likedProductIds.includes(product.id));

  if (likedProducts.length === 0) {
    return <p className="profile-empty">Vous n’avez aucun like pour le moment.</p>;
  }

  return (
    <div className="profile-grid">
      {likedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet "Avis" : avis reçus et avis écrits par l'utilisateur          */
/* ------------------------------------------------------------------ */
function MyReviewsSection() {
  const { currentUser, findUserById } = useAuth();
  const { getReviewsAbout, getReviewsWrittenBy, getAverageRating } = useReviews();

  const receivedReviews = getReviewsAbout(currentUser.user_id);
  const writtenReviews = getReviewsWrittenBy(currentUser.user_id);
  const averageRating = getAverageRating(currentUser.user_id);

  return (
    <div className="profile-reviews">
      <div className="profile-reviews-summary">
        <Rating value={averageRating} precision={0.5} readOnly />
        <span>{averageRating ? `${averageRating.toFixed(1)} / 5` : 'Aucune note'}</span>
        <small>{receivedReviews.length} avis reçus</small>
      </div>

      {receivedReviews.length === 0 ? (
        <p className="profile-empty">Aucun avis reçu pour le moment.</p>
      ) : (
        <div className="profile-reviews-list">
          {receivedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <Typography variant="h6" component="h2" sx={{ mt: 3 }} gutterBottom>
        Mes avis laissés
      </Typography>
      {writtenReviews.length === 0 ? (
        <p className="profile-empty">Vous n’avez pas encore laissé d’avis.</p>
      ) : (
        <div className="profile-reviews-list">
          {writtenReviews.map((review) => (
            <ReviewCard key={review.id} review={review} targetUser={findUserById(review.targetUserId)} />
          ))}
        </div>
      )}
    </div>
  );
}
