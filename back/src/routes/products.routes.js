import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listLicences,
  listProducts,
  updateProduct,
} from '../controllers/products.controller.js';

// Routes montées sur /api (voir app.js).
const router = Router();

// Lecture : publique.
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.get('/licences', listLicences);

// Écriture : réservée aux utilisateurs connectés.
router.post('/products', requireAuth, createProduct);
router.put('/products/:id', requireAuth, updateProduct);
router.delete('/products/:id', requireAuth, deleteProduct);

export default router;
