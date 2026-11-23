import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import { uploadImage } from '../middlewares/imageUpload.js';
import { uploadImageFile } from '../controllers/uploads.controller.js';

// Routes montées sur /api/uploads (voir app.js).
const router = Router();

// requireAuth AVANT uploadImage : l'image d'un visiteur non connecté n'est même pas enregistrée.
router.post('/', requireAuth, uploadImage, uploadImageFile);

export default router;
