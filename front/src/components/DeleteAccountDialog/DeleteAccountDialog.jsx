import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';
import PasswordField from '../PasswordField/PasswordField.jsx';
import { redirectTo } from '../../utils/redirect.js';

// Mot à recopier pour confirmer : évite une suppression par erreur (clic trop rapide).
const CONFIRMATION_WORD = 'SUPPRIMER';

/**
 * Bouton "Supprimer mon compte" + fenêtre de confirmation (pop-up).
 * Pour confirmer, l'utilisateur doit écrire SUPPRIMER et donner son mot de passe actuel
 * (l'API le demande : quelqu'un qui utilise un ordinateur resté connecté ne peut pas supprimer le compte).
 *
 * C'est le "droit à l'effacement" du RGPD : le compte et ses données sont supprimés définitivement.
 */
export default function DeleteAccountDialog() {
  const { deleteAccount } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Le bouton de suppression n'est actif que si le mot est EXACTEMENT recopié et le mot de passe saisi.
  const canDelete = confirmationText === CONFIRMATION_WORD && currentPassword !== '' && !isDeleting;

  /** Ferme la fenêtre et efface ce qui a été saisi. */
  function handleClose() {
    setIsOpen(false);
    setConfirmationText('');
    setCurrentPassword('');
    setErrorMessage('');
  }

  async function handleDelete(event) {
    event.preventDefault();
    setIsDeleting(true);
    try {
      await deleteAccount(currentPassword);
      // Le compte n'existe plus : on recharge le site sur l'accueil. Tout ce que l'application
      // gardait en mémoire sur l'ancien compte (favoris, messages...) est ainsi oublié d'un coup.
      redirectTo('/');
    } catch (error) {
      // Ex : "Mot de passe actuel incorrect."
      setErrorMessage(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button variant="outlined" color="error" onClick={() => setIsOpen(true)}>
        Supprimer mon compte
      </Button>

      {/* Dialog de Material UI : fenêtre par-dessus la page. Il gère l'accessibilité
          (le focus reste dans la fenêtre, la touche Échap la ferme). */}
      <Dialog open={isOpen} onClose={handleClose} aria-labelledby="delete-account-title">
        <form onSubmit={handleDelete} noValidate>
          <DialogTitle id="delete-account-title">Supprimer votre compte ?</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>
                Cette action est <strong>définitive</strong> : votre compte, vos annonces, vos favoris et vos messages
                seront supprimés. Vos commandes sont conservées pour la comptabilité, mais ne seront plus reliées à
                vous.
              </DialogContentText>
              <TextField
                label={`Écrivez ${CONFIRMATION_WORD} pour confirmer`}
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                autoComplete="off"
                fullWidth
                autoFocus
              />
              <PasswordField
                label="Mot de passe actuel"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                fullWidth
              />
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained" color="error" disabled={!canDelete}>
              Supprimer définitivement
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
