import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import profilesData from '../../data/profiles.json';
import figuresData from '../../data/figures.json';
import { getAllProducts, subscribeToProductStorage } from '../../utils/productStorage.js';
import { addProfileReview, getReviewsForUser, subscribeToProfileReviews } from '../../utils/profileReviewsStorage.js';
import './UserProfile.css';

export default function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [productsVersion, setProductsVersion] = useState(0);
    const [reviewsVersion, setReviewsVersion] = useState(0);
    const [formValues, setFormValues] = useState({ rating: 5, comment: '' });
    const [error, setError] = useState('');

    const resolvedCurrentUserId = useMemo(() => {
        if (!user) return '';
        if (user.user_id) return String(user.user_id);

        const byEmail = (profilesData.profiles || []).find((item) => item.email && item.email === user.email);
        if (byEmail?.user_id) return String(byEmail.user_id);

        return '';
    }, [user]);

    useEffect(() => {
        return subscribeToProductStorage(() => {
            setProductsVersion((prev) => prev + 1);
        });
    }, []);

    useEffect(() => {
        return subscribeToProfileReviews(() => {
            setReviewsVersion((prev) => prev + 1);
        });
    }, []);

    const profileFromList = useMemo(
        () => (profilesData.profiles || []).find((item) => String(item.user_id) === String(id)) || null,
        [id]
    );

    const isOwnProfile = useMemo(() => {
        if (!user) return false;
        if (resolvedCurrentUserId && resolvedCurrentUserId === String(id)) return true;
        if (user.email && profileFromList?.email && user.email === profileFromList.email) return true;
        return false;
    }, [id, profileFromList?.email, resolvedCurrentUserId, user]);

    const profile = useMemo(() => {
        if (isOwnProfile && user) return user;
        return profileFromList;
    }, [isOwnProfile, profileFromList, user]);

    const userProducts = useMemo(() => {
        return getAllProducts(figuresData.figures || []).filter(
            (product) => String(product.owner_user_id ?? product.user_id) === String(id)
        );
    }, [id, productsVersion]);

    const reviews = useMemo(() => getReviewsForUser(id), [id, reviewsVersion]);

    const averageRating = useMemo(() => {
        if (!reviews.length) return 0;
        const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
        return total / reviews.length;
    }, [reviews]);

    const canReview = !!user && !isOwnProfile;

    const handleSubmitReview = (event) => {
        event.preventDefault();
        setError('');

        if (!user) {
            setError('Connectez-vous pour laisser un avis.');
            return;
        }

        if (isOwnProfile) {
            setError('Vous ne pouvez pas vous noter vous-meme.');
            return;
        }

        if (!formValues.comment.trim()) {
            setError('Le commentaire est obligatoire.');
            return;
        }

        const newReview = {
            id: `REV${Date.now()}`,
            targetUserId: String(id),
            authorUserId: resolvedCurrentUserId || String(user.user_id || ''),
            authorUsername: user.username || 'Utilisateur',
            rating: Number(formValues.rating) || 0,
            comment: formValues.comment.trim(),
            createdAt: new Date().toISOString(),
        };

        addProfileReview(newReview);
        setFormValues({ rating: 5, comment: '' });
    };

    if (!profile) {
        return (
            <Box className="user-profile-page">
                <Typography variant="h5">Profil introuvable</Typography>
            </Box>
        );
    }

    if (isOwnProfile) {
        return <Navigate to="/profile" replace />;
    }

    return (
        <Box className="user-profile-page">
            <Box className="user-profile-card">
                <Avatar src={profile.profile_img} sx={{ width: 96, height: 96 }} />
                <div>
                    <h1>{profile.username || 'Utilisateur'}</h1>
                    <p>{profile.email || 'Email non disponible'}</p>
                </div>
                <Box className="user-profile-rating-box">
                    <Rating value={Number(averageRating.toFixed(1))} precision={0.5} readOnly />
                    <span>{averageRating ? `${averageRating.toFixed(1)} / 5` : 'Aucune note'}</span>
                    <small>{reviews.length} avis</small>
                </Box>
                {user && String(user.user_id) === String(id) ? (
                    <Button variant="outlined" onClick={() => navigate('/profile')}>Modifier mon profil</Button>
                ) : null}
            </Box>

            {canReview ? (
                <Box className="user-review-form" component="form" onSubmit={handleSubmitReview}>
                    <Typography variant="h6">Laisser un avis</Typography>
                    <Rating
                        value={formValues.rating}
                        onChange={(_, value) => setFormValues((prev) => ({ ...prev, rating: value || 0 }))}
                    />
                    <TextField
                        label="Votre commentaire"
                        multiline
                        minRows={3}
                        fullWidth
                        value={formValues.comment}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, comment: event.target.value }))}
                    />
                    {error ? <div className="user-review-error">{error}</div> : null}
                    <Button variant="contained" type="submit">Publier l'avis</Button>
                </Box>
            ) : null}

            <Box className="user-reviews-list">
                <Typography variant="h6">Avis recents</Typography>
                {reviews.length === 0 ? (
                    <p>Aucun avis pour le moment.</p>
                ) : (
                    reviews
                        .slice()
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((review) => (
                            <article key={review.id} className="user-review-card">
                                <div className="user-review-head">
                                    <strong>{review.authorUsername}</strong>
                                    <Rating value={Number(review.rating || 0)} readOnly size="small" />
                                </div>
                                <p>{review.comment}</p>
                            </article>
                        ))
                )}
            </Box>

            <Box className="user-products-section">
                <Typography variant="h6">Annonces de {profile.username || 'cet utilisateur'}</Typography>
                {userProducts.length === 0 ? (
                    <p>Aucune annonce en ligne.</p>
                ) : (
                    <Box className="user-products-grid">
                        {userProducts.map((product) => (
                            <ProductCard key={product.id ?? product.product_id} product={product} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
