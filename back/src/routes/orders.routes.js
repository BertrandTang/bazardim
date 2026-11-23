import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import { createOrder, getOrder, listOrders, listSales } from '../controllers/orders.controller.js';

// Routes montées sur /api/orders (voir app.js). Toutes demandent d'être connecté.
// Le webhook Stripe est à part, dans app.js, car il a besoin du corps brut de la requête.
const router = Router();

router.use(requireAuth);
router.get('/', listOrders);
// "/sales" AVANT "/:id" : sinon Express prendrait "sales" pour un identifiant de commande.
router.get('/sales', listSales);
router.get('/:id', getOrder);
router.post('/', createOrder);

export default router;
