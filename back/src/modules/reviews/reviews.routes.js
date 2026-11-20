import { Router } from 'express';
import { requireAuth } from '../../middlewares/authentication.js';
import { createReview, deleteReview, listReviews, updateReview } from './reviews.controller.js';

// Routes montées sur /api/reviews (voir app.js).
const router = Router();

router.get('/', listReviews);
router.post('/', requireAuth, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
