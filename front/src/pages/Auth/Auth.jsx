import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';

/** Page de connexion. */
export default function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Un champ "contrôlé" : React garde la valeur dans un état, et le champ affiche cet état.
  // À chaque frappe, onChange met à jour l'état, ce qui réaffiche le champ avec la nouvelle valeur.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Si l'utilisateur a été redirigé ici par RequireAuth, on le renvoie ensuite vers la page demandée.
  const redirectPath = location.state?.from?.pathname ?? '/profile';

  function handleSubmit(event) {
    event.preventDefault();
    const isLoggedIn = login(email.trim().toLowerCase(), password);
    if (isLoggedIn) {
      navigate(redirectPath, { replace: true });
    } else {
      setErrorMessage('Email ou mot de passe incorrect.');
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 2 }}>
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Connexion
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connecte-toi pour accéder à ton compte BAZARDIM.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              fullWidth
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <Button type="submit" variant="contained" size="large" fullWidth>
              Se connecter
            </Button>
            <Typography variant="body2" align="center">
              Pas encore de compte ? <Link to="/signup">Inscris-toi</Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
