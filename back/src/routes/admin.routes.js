import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middlewares/authentication.js';
import {
  addAlias,
  listLicences,
  mergeLicence,
  removeAlias,
  updateLicence,
} from '../controllers/licences.controller.js';

// Routes montées sur /api/admin (voir app.js) : réservées aux administrateurs.
// requireAuth vérifie que l'utilisateur est connecté (sinon 401),
// puis requireAdmin qu'il est administrateur (sinon 403).
const router = Router();

router.use(requireAuth, requireAdmin);

// Modération des licences saisies par les vendeurs.
router.get('/licences', listLicences);
router.patch('/licences/:id', updateLicence);
router.post('/licences/:id/merge', mergeLicence);
router.post('/licences/:id/aliases', addAlias);
router.delete('/licences/:id/aliases/:alias', removeAlias);

export default router;
