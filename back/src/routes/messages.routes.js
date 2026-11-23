import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import {
  getUnreadCount,
  listReceivedMessages,
  listSentMessages,
  markAsRead,
  sendMessage,
} from '../controllers/messages.controller.js';

// Routes montées sur /api/messages (voir app.js). Toutes demandent d'être connecté.
const router = Router();

router.use(requireAuth);
router.get('/received', listReceivedMessages);
router.get('/sent', listSentMessages);
router.get('/unread-count', getUnreadCount);
router.post('/', sendMessage);
router.patch('/:id/read', markAsRead);

export default router;
