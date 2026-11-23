import { useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';

/**
 * Petit formulaire pour écrire un message. Utilisé pour contacter un vendeur
 * (page d'un produit) et pour répondre à un message (page Messagerie).
 *
 * @param {object} props
 * @param {string} props.label - Libellé du champ de texte.
 * @param {string} props.submitLabel - Texte du bouton d'envoi.
 * @param {Function} props.onSend - Fonction async appelée avec le texte du message.
 *   Si elle lance une erreur (refus de l'API), son message est affiché.
 */
export default function MessageForm({ label, submitLabel, onSend }) {
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSent(false);

    if (!content.trim()) {
      setErrorMessage('Le message ne peut pas être vide.');
      return;
    }

    setErrorMessage('');
    setIsSending(true);
    try {
      await onSend(content.trim());
      setContent(''); // on vide le champ pour un éventuel nouveau message
      setIsSent(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      // "finally" s'exécute dans tous les cas, succès ou erreur.
      setIsSending(false);
    }
  }

  return (
    <Stack component="form" spacing={1.5} onSubmit={handleSubmit} noValidate>
      <TextField
        label={label}
        multiline
        minRows={3}
        fullWidth
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {isSent && <Alert severity="success">Message envoyé.</Alert>}
      <Button type="submit" variant="contained" disabled={isSending} sx={{ alignSelf: 'flex-start' }}>
        {submitLabel}
      </Button>
    </Stack>
  );
}
