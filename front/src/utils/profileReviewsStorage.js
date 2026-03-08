const PROFILE_REVIEWS_KEY = 'profileReviews';
const PROFILE_REVIEWS_EVENT = 'profile-reviews-updated';

function parseReviews(rawValue) {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function dispatchReviewsUpdate() {
    window.dispatchEvent(new CustomEvent(PROFILE_REVIEWS_EVENT));
}

export function getProfileReviews() {
    return parseReviews(localStorage.getItem(PROFILE_REVIEWS_KEY));
}

export function saveProfileReviews(reviews) {
    localStorage.setItem(PROFILE_REVIEWS_KEY, JSON.stringify(reviews));
    dispatchReviewsUpdate();
}

export function addProfileReview(review) {
    const current = getProfileReviews();
    saveProfileReviews([...current, review]);
}

export function subscribeToProfileReviews(onChange) {
    const handleStorage = () => onChange();
    const handleLocalUpdate = () => onChange();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROFILE_REVIEWS_EVENT, handleLocalUpdate);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(PROFILE_REVIEWS_EVENT, handleLocalUpdate);
    };
}

export function getReviewsForUser(userId) {
    const normalizedUserId = String(userId ?? '');
    return getProfileReviews().filter((review) => String(review.targetUserId) === normalizedUserId);
}

export function getAverageRatingForUser(userId) {
    const reviews = getReviewsForUser(userId);
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
}
