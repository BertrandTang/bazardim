import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import { deleteAccount, getPublicProfile, updateAccount } from '../controllers/users.controller.js';

// Routes montées sur /api/users (voir app.js).
const router = Router();

router.get('/:id', getPublicProfile);
router.patch('/me', requireAuth, updateAccount);
router.delete('/me', requireAuth, deleteAccount);

export default router;
