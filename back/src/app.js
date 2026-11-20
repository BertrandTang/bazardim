import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { query } from './database.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import likesRoutes from './modules/likes/likes.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import usersRoutes from './modules/users/users.routes.js';

// L'application est créée ici, sans démarrer le serveur : les tests peuvent ainsi
// l'importer et lui envoyer des requêtes directement (voir server.js pour le démarrage).
const app = express();

// ----- Middlewares : exécutés dans cet ordre pour chaque requête -----

// Ajoute des en-têtes HTTP de sécurité (protection contre le clickjacking, le "sniffing" MIME...).
app.use(helmet());

// CORS : seul notre front-end a le droit d'appeler l'API depuis un navigateur.
// `credentials: true` autorise l'envoi du cookie de connexion.
app.use(cors({ origin: config.FRONT_URL, credentials: true }));

// Journal de chaque requête : méthode, adresse, code de réponse et durée.
// On ne garde que l'essentiel (les noms `req` et `res` sont imposés par pino-http) :
// pas d'en-têtes, donc jamais de cookie de connexion dans les logs.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (request) => ({ method: request.method, url: request.url }),
      res: (response) => ({ statusCode: response.statusCode }),
    },
  }),
);

// Lit le corps JSON des requêtes (limité à 100 Ko pour éviter les envois géants).
app.use(express.json({ limit: '100kb' }));

// Lit les cookies (request.cookies) : nécessaire pour le jeton de connexion.
app.use(cookieParser());

// ----- Routes -----

// Vérifie que l'API et la base de données répondent (utilisé par la supervision).
app.get('/api/health', async (request, response) => {
  await query('SELECT 1');
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api', productsRoutes);

// ----- Gestion des erreurs (toujours en dernier) -----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
