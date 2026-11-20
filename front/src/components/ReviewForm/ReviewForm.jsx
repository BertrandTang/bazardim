import { useState } from 'react';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import './ReviewForm.css';

/**
 * Formulaire d'avis (note sur 5 + commentaire), utilisé pour écrire et pour modifier un avis.
 *
 * @param {object} props
 * @param {number} [props.initialRating] - Note de départ.
 * @param {string} [props.initialComment] - Commentaire de départ.
 * @param {string} props.submitLabel - Texte du bouton de validation.
 * @param {Function} props.onSubmit - Appelée avec (note, commentaire) quand le formulaire est valide.
 * @param {Function} [props.onCancel] - Si fournie, affiche un bouton "Annuler".
 */
export default function ReviewForm({ initialRating = 5, initialComment = '', submitLabel, onSubmit, onCancel }) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [errorMessage, setErrorMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Le commentaire est obligatoire.');
      return;
    }
    setErrorMessage('');
    onSubmit(rating, comment.trim());
    // On vide le formulaire pour pouvoir écrire un nouvel avis.
    setRating(initialRating);
    setComment(initialComment);
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      {/* Le composant Rating renvoie null si on reclique sur la note déjà choisie : on garde alors 0. */}
      <Rating name="rating" value={rating} onChange={(event, newRating) => setRating(newRating ?? 0)} />
      <TextField
        label="Votre commentaire"
        multiline
        minRows={3}
        fullWidth
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="review-form-actions">
        <Button variant="contained" type="submit" size="small">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="text" size="small" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
