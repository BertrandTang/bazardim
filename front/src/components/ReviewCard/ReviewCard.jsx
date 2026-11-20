import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import { useReviews } from '../../context/ReviewsContext.jsx';
import ReviewForm from '../ReviewForm/ReviewForm.jsx';
import './ReviewCard.css';

/**
 * Affiche un avis. Si l'utilisateur connecté en est l'auteur, il peut le modifier ou le supprimer.
 *
 * @param {object} props
 * @param {object} props.review - L'avis à afficher.
 * @param {object} [props.targetUser] - Si fourni, affiche "sur <pseudo du vendeur>" (utile dans "Mes avis laissés").
 */
export default function ReviewCard({ review, targetUser }) {
  const { isAuthorOf, updateReview, deleteReview } = useReviews();
  const [isEditing, setIsEditing] = useState(false);
  const canManage = isAuthorOf(review);

  function handleUpdate(newRating, newComment) {
    updateReview(review.id, newRating, newComment);
    setIsEditing(false);
  }

  function handleDelete() {
    // window.confirm affiche une boîte de dialogue native "OK / Annuler".
    if (window.confirm('Supprimer cet avis ?')) {
      deleteReview(review.id);
    }
  }

  return (
    <article className={canManage ? 'review-card review-card-owned' : 'review-card'}>
      <div className="review-card-header">
        <div className="review-card-author">
          <strong>{review.authorUsername}</strong>
          {targetUser && (
            <span className="review-card-target">
              sur <Link to={`/user/${targetUser.user_id}`}>{targetUser.username}</Link>
            </span>
          )}
        </div>
        {!isEditing && <Rating value={review.rating} readOnly size="small" />}
      </div>

      {isEditing ? (
        <ReviewForm
          initialRating={review.rating}
          initialComment={review.comment}
          submitLabel="Enregistrer"
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <p>{review.comment}</p>
      )}

      {canManage && !isEditing && (
        <div className="review-card-actions">
          <Button variant="outlined" size="small" onClick={() => setIsEditing(true)}>
            Modifier
          </Button>
          <Button variant="text" color="error" size="small" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      )}
    </article>
  );
}
