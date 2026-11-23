import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Button, Stack, TextField, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLikes } from '../../context/LikesContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import './Profile.css';

// Onglets du menu latéral. `component` est le composant affiché quand l'onglet est actif
// (ils sont définis plus bas dans ce fichier).
const SECTIONS = [
  { id: 'settings', label: 'Profil', component: SettingsSection },
  { id: 'products', label: 'Mes produits', component: MyProductsSection },
  { id: 'likes', label: 'Mes likes', component: MyLikesSection },
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
      <PageMetadata title={`Mon profil - ${activeSection.label}`} noIndex />
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
  const { currentUser, updateAccount } = useAuth();
  // Les noms des champs sont ceux attendus par l'API (PATCH /api/users/me).
  const [formValues, setFormValues] = useState({
    username: currentUser.username,
    email: currentUser.email,
    profile_image_url: currentUser.profile_image_url ?? '',
    current_password: '',
    new_password: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
    setIsSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const changes = {
      username: formValues.username.trim(),
      email: formValues.email.trim().toLowerCase(),
      profile_image_url: formValues.profile_image_url.trim(),
    };
    // Les mots de passe ne sont envoyés que s'ils ont été saisis.
    // L'API exige le mot de passe actuel pour changer d'email ou de mot de passe.
    if (formValues.current_password) {
      changes.current_password = formValues.current_password;
    }
    if (formValues.new_password) {
      changes.new_password = formValues.new_password;
    }

    try {
      await updateAccount(changes);
      setErrorMessage('');
      setIsSaved(true);
      // On vide les champs de mot de passe après l'enregistrement.
      setFormValues((previousValues) => ({ ...previousValues, current_password: '', new_password: '' }));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <Stack component="form" spacing={2} sx={{ maxWidth: 500 }} onSubmit={handleSubmit}>
      <Avatar src={formValues.profile_image_url} alt="" sx={{ width: 80, height: 80 }} />
      <TextField label="Pseudo" name="username" value={formValues.username} onChange={handleChange} />
      <TextField label="Email" name="email" type="email" value={formValues.email} onChange={handleChange} />
      <TextField
        label="Image de profil (URL)"
        name="profile_image_url"
        value={formValues.profile_image_url}
        onChange={handleChange}
      />
      <TextField
        label="Nouveau mot de passe"
        name="new_password"
        type="password"
        autoComplete="new-password"
        helperText="Laisser vide pour conserver le mot de passe actuel"
        value={formValues.new_password}
        onChange={handleChange}
      />
      <TextField
        label="Mot de passe actuel"
        name="current_password"
        type="password"
        autoComplete="current-password"
        helperText="Obligatoire pour changer d’email ou de mot de passe"
        value={formValues.current_password}
        onChange={handleChange}
      />
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
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
  const [deleteError, setDeleteError] = useState('');

  const myProducts = products.filter((product) => product.owner_id === currentUser.id);

  async function handleDelete(product) {
    if (!window.confirm(`Supprimer l'annonce « ${product.title} » ?`)) {
      return;
    }
    try {
      await deleteProduct(product.id);
      setDeleteError('');
    } catch (error) {
      setDeleteError(error.message);
    }
  }

  return (
    <>
      <Button className="button-gradient profile-add-product" variant="contained" onClick={() => navigate('/vendre')}>
        Ajouter un produit en vente
      </Button>
      {deleteError && <Alert severity="error">{deleteError}</Alert>}
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
