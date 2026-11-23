import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import { createOrder, getOrder, listOrders } from '../controllers/orders.controller.js';

// Routes montées sur /api/orders (voir app.js). Toutes demandent d'être connecté.
// Le webhook Stripe est à part, dans app.js, car il a besoin du corps brut de la requête.
const router = Router();

router.use(requireAuth);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);

export default router;
