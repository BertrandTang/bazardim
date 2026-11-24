import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/config.js';
import { getCurrentUser, login, logout, register, verifyLoginCode } from '../controllers/auth.controller.js';

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
// Deuxième étape de la connexion (double authentification) : même limite de tentatives.
router.post('/login/verify', authenticationRateLimiter, verifyLoginCode);
router.post('/logout', logout);
// Pas de requireAuth : un visiteur reçoit null (ce n'est pas une erreur, voir getCurrentUser).
router.get('/me', getCurrentUser);

export default router;
