import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { config } from '../../config.js';
import { requireAuth } from '../../middlewares/authentication.js';
import { getCurrentUser, login, logout, register } from './auth.controller.js';

// Routes montées sur /api/auth (voir app.js).
const router = Router();

// Limite le nombre de tentatives par adresse IP pour freiner les attaques par force brute
// (essayer des milliers de mots de passe). Désactivé pendant les tests automatiques.
const authenticationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  limit: 20, // 20 tentatives maximum par fenêtre
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { error: 'Trop de tentatives, réessayez dans quelques minutes.' },
});

router.post('/register', authenticationRateLimiter, register);
router.post('/login', authenticationRateLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
