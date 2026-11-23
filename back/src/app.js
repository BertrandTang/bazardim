import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/config.js';
import { query } from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import authRoutes from './routes/auth.routes.js';
import likesRoutes from './routes/likes.routes.js';
import productsRoutes from './routes/products.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import usersRoutes from './routes/users.routes.js';

// L'application est créée ici, sans démarrer le serveur : les tests peuvent ainsi
// l'importer et lui envoyer des requêtes directement (voir server.js pour le démarrage).
const app = express();

// ----- Middlewares : exécutés dans cet ordre pour chaque requête -----

// Ajoute des en-têtes HTTP de sécurité (protection contre le clickjacking, le "sniffing" MIME...).
app.use(helmet());

// CORS : seul notre front-end a le droit d'appeler l'API depuis un navigateur.
// `credentials: true` autorise l'envoi du cookie de connexion.
app.use(cors({ origin: config.FRONT_URL, credentials: true }));

// Journal de chaque requête dans le terminal (voir middlewares/requestLogger.js).
// Désactivé pendant les tests pour garder une sortie lisible.
if (!config.isTest) {
  app.use(requestLogger);
}

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
