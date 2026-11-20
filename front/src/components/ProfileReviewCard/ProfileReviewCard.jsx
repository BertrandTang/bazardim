import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import { deleteProfileReview, updateProfileReview } from '../../utils/profileReviewsStorage.js';
import './ProfileReviewCard.css';

export default function ProfileReviewCard({
    review,
    currentUserId,
    targetLabel,
    targetUserId,
}) {
    const isOwner = !!currentUserId && String(review.authorUserId) === String(currentUserId);
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        rating: Number(review.rating || 0),
        comment: review.comment || '',
    });
    const [error, setError] = useState('');

    const handleStartEdit = () => {
        setEditValues({
            rating: Number(review.rating || 0),
            comment: review.comment || '',
        });
        setError('');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError('');
    };

    const handleSave = () => {
        if (!editValues.comment.trim()) {
            setError('Le commentaire est obligatoire.');
            return;
        }

        const success = updateProfileReview(
            review.id,
            {
                rating: editValues.rating,
                comment: editValues.comment,
            },
            currentUserId
        );

        if (!success) {
            setError('Impossible de modifier cet avis.');
            return;
        }

        setIsEditing(false);
        setError('');
    };

    const handleDelete = () => {
        const confirmed = window.confirm('Supprimer cet avis ?');
        if (!confirmed) return;

        const success = deleteProfileReview(review.id, currentUserId);
        if (!success) {
            setError('Impossible de supprimer cet avis.');
        }
    };

    return (
        <article className={`profile-review-card${isOwner ? ' profile-review-card--owned' : ''}`}>
            <div className="profile-review-head">
                <div className="profile-review-author">
                    <strong>{review.authorUsername}</strong>
                    {targetLabel && targetUserId ? (
                        <span className="profile-review-target">
                            sur{' '}
                            <RouterLink to={`/user/${targetUserId}`}>{targetLabel}</RouterLink>
                        </span>
                    ) : null}
                </div>
                {!isEditing ? (
                    <Rating value={Number(review.rating || 0)} readOnly size="small" />
                ) : null}
            </div>

            {isEditing ? (
                <Box className="profile-review-edit-form">
                    <Rating
                        value={editValues.rating}
                        onChange={(_, value) =>
                            setEditValues((prev) => ({ ...prev, rating: value || 0 }))
                        }
                    />
                    <TextField
                        label="Votre commentaire"
                        multiline
                        minRows={3}
                        fullWidth
                        value={editValues.comment}
                        onChange={(event) =>
                            setEditValues((prev) => ({ ...prev, comment: event.target.value }))
                        }
                    />
                    {error ? <div className="profile-review-error">{error}</div> : null}
                    <Box className="profile-review-actions">
                        <Button variant="contained" size="small" onClick={handleSave}>
                            Enregistrer
                        </Button>
                        <Button variant="text" size="small" onClick={handleCancelEdit}>
                            Annuler
                        </Button>
                    </Box>
                </Box>
            ) : (
                <p>{review.comment}</p>
            )}

            {isOwner && !isEditing ? (
                <Box className="profile-review-actions">
                    <Button variant="outlined" size="small" onClick={handleStartEdit}>
                        Modifier
                    </Button>
                    <Button variant="text" color="error" size="small" onClick={handleDelete}>
                        Supprimer
                    </Button>
                </Box>
            ) : null}

            {isOwner && !isEditing && error ? (
                <div className="profile-review-error">{error}</div>
            ) : null}
        </article>
    );
}
