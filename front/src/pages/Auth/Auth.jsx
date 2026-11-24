import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import PasswordField from '../../components/PasswordField/PasswordField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Page de connexion, en une ou deux étapes :
 * 1. email + mot de passe ;
 * 2. si la double authentification est active : le code à 6 chiffres reçu par e-mail.
 */
export default function Auth() {
  const { login, verifyLoginCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Un champ "contrôlé" : React garde la valeur dans un état, et le champ affiche cet état.
  // À chaque frappe, onChange met à jour l'état, ce qui réaffiche le champ avec la nouvelle valeur.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  // Vrai quand l'API a envoyé un code par e-mail : on affiche alors l'étape 2.
  const [isWaitingForCode, setIsWaitingForCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Si l'utilisateur a été redirigé ici par RequireAuth, on le renvoie ensuite vers la page demandée.
  const redirectPath = location.state?.from?.pathname ?? '/profile';

  /** Étape 1 : email et mot de passe. */
  async function handlePasswordSubmit(event) {
    event.preventDefault();
    try {
      const { twoFactorRequired } = await login(email.trim().toLowerCase(), password);
      setErrorMessage('');
      if (twoFactorRequired) {
        setIsWaitingForCode(true);
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      // Message renvoyé par l'API, ex : "Email ou mot de passe incorrect."
      setErrorMessage(error.message);
    }
  }

  /** Étape 2 : le code reçu par e-mail. */
  async function handleCodeSubmit(event) {
    event.preventDefault();
    try {
      await verifyLoginCode(code.trim());
      navigate(redirectPath, { replace: true });
    } catch (error) {
      // Ex : "Code incorrect." ou "Code expiré : reconnectez-vous pour en recevoir un nouveau."
      setErrorMessage(error.message);
    }
  }

  /** Revient à l'étape 1, par exemple pour recevoir un nouveau code. */
  function restartLogin() {
    setIsWaitingForCode(false);
    setCode('');
    setPassword('');
    setErrorMessage('');
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, px: 2 }}>
      <PageMetadata title="Connexion" description="Connectez-vous à votre compte Bazardim." noIndex />
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Connexion
        </Typography>

        {isWaitingForCode ? (
          <Box component="form" onSubmit={handleCodeSubmit} noValidate>
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                Pour protéger ton compte, un code à 6 chiffres vient d’être envoyé à <strong>{email}</strong>. Il est
                valable 10 minutes.
              </Typography>
              <TextField
                label="Code reçu par e-mail"
                required
                fullWidth
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
                // Clavier numérique sur téléphone ; one-time-code : le téléphone peut proposer le code reçu.
                slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 } }}
              />
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <Button type="submit" variant="contained" size="large" fullWidth>
                Valider le code
              </Button>
              <Button onClick={restartLogin}>Recevoir un nouveau code</Button>
            </Stack>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connecte-toi pour accéder à ton compte BAZARDIM.
            </Typography>
            <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
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
                <PasswordField
                  label="Mot de passe"
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
          </>
        )}
      </Paper>
    </Box>
  );
}
