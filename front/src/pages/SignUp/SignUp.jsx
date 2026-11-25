import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import PasswordField from '../../components/PasswordField/PasswordField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const MINIMUM_PASSWORD_LENGTH = 8;

/** Retourne un message d'erreur si le formulaire est invalide, sinon une chaîne vide. */
function validateSignUp(formValues) {
  if (!formValues.username.trim() || !formValues.email.trim()) {
    return 'Le pseudo et l’email sont obligatoires.';
  }
  if (formValues.password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MINIMUM_PASSWORD_LENGTH} caractères.`;
  }
  if (formValues.password !== formValues.confirmPassword) {
    return 'Les deux mots de passe ne correspondent pas.';
  }
  if (!formValues.acceptTerms) {
    return 'Tu dois accepter les conditions générales et la politique de confidentialité.';
  }
  return '';
}

/** Page d'inscription. */
export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Un seul gestionnaire pour tous les champs : l'attribut `name` indique quel champ a changé.
  // Pour la case à cocher, la valeur utile est `checked` (true / false) et non `value`.
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Vérification rapide dans le navigateur ; l'API refait toutes les vérifications.
    const validationError = validateSignUp(formValues);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      await register({
        username: formValues.username.trim(),
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      });
      navigate('/profile');
    } catch (error) {
      // Message renvoyé par l'API, ex : "Un compte existe déjà avec cet email."
      setErrorMessage(error.message);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 2 }}>
      <PageMetadata
        title="Inscription"
        description="Créez votre compte Bazardim gratuitement pour vendre et acheter des figurines de collection."
      />
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 480, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Inscription
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Crée ton compte BAZARDIM pour commencer.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Pseudo"
              name="username"
              autoComplete="username"
              required
              fullWidth
              value={formValues.username}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              fullWidth
              value={formValues.email}
              onChange={handleChange}
            />
            <PasswordField
              label="Mot de passe"
              name="password"
              autoComplete="new-password"
              helperText={`${MINIMUM_PASSWORD_LENGTH} caractères minimum`}
              required
              fullWidth
              value={formValues.password}
              onChange={handleChange}
            />
            <PasswordField
              label="Confirme ton mot de passe"
              name="confirmPassword"
              autoComplete="new-password"
              required
              fullWidth
              value={formValues.confirmPassword}
              onChange={handleChange}
            />
            {/* Liens ouverts dans un nouvel onglet : le formulaire déjà rempli n'est pas perdu. */}
            <FormControlLabel
              control={
                <Checkbox name="acceptTerms" checked={formValues.acceptTerms} onChange={handleChange} required />
              }
              label={
                <Typography variant="body2" component="span">
                  J’accepte les{' '}
                  <Link to="/conditions-generales" target="_blank" rel="noopener noreferrer">
                    conditions générales d’utilisation et de vente
                  </Link>{' '}
                  et la{' '}
                  <Link to="/confidentialite" target="_blank" rel="noopener noreferrer">
                    politique de confidentialité
                  </Link>
                  .
                </Typography>
              }
            />
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <Button type="submit" variant="contained" size="large" fullWidth>
              S’inscrire
            </Button>
            <Typography variant="body2" align="center">
              Déjà inscrit ? <Link to="/auth">Connecte-toi</Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
