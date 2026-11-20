import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
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
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Un seul gestionnaire pour tous les champs : l'attribut `name` indique quel champ a changé.
  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateSignUp(formValues);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const isRegistered = register({
      username: formValues.username.trim(),
      email: formValues.email.trim().toLowerCase(),
      password: formValues.password,
    });
    if (!isRegistered) {
      setErrorMessage('Un compte existe déjà avec cet email.');
      return;
    }
    navigate('/profile');
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 2 }}>
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
            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete="new-password"
              helperText={`${MINIMUM_PASSWORD_LENGTH} caractères minimum`}
              required
              fullWidth
              value={formValues.password}
              onChange={handleChange}
            />
            <TextField
              label="Confirme ton mot de passe"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              fullWidth
              value={formValues.confirmPassword}
              onChange={handleChange}
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
