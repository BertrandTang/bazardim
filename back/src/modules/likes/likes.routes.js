import { Router } from 'express';
import { requireAuth } from '../../middlewares/authentication.js';
import { likeProduct, listLikedProducts, unlikeProduct } from './likes.controller.js';

// Routes montées sur /api/likes (voir app.js). Toutes demandent d'être connecté.
const router = Router();

router.use(requireAuth);
router.get('/', listLikedProducts);
router.put('/:productId', likeProduct);
router.delete('/:productId', unlikeProduct);

export default router;
