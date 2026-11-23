import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config.js';
import { query } from './config/database.js';
import { handleStripeWebhook } from './controllers/orders.controller.js';
import { openApiDocument } from './docs/openapi.js';
import { getSitemap } from './controllers/sitemap.controller.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import authRoutes from './routes/auth.routes.js';
import likesRoutes from './routes/likes.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import productsRoutes from './routes/products.routes.js';
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

// Journal de chaque requête (voir middlewares/requestLogger.js et config/logger.js).
// Pendant les tests, winston est réglé en mode silencieux : rien n'est affiché.
app.use(requestLogger);

// Webhook Stripe : déclaré AVANT express.json, car il a besoin du corps brut (non transformé)
// de la requête pour vérifier la signature de Stripe.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

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

// Plan du site pour les moteurs de recherche, avec les annonces en vente (voir sitemap.controller.js).
// En production, le serveur web transmet /sitemap.xml à l'API (en local : proxy de Vite).
app.get('/sitemap.xml', getSitemap);

// Documentation de l'API (OpenAPI / Swagger, voir docs/openapi.js) :
// - /api/docs      : page interactive pour lire et essayer chaque route ;
// - /api/docs.json : la même description au format JSON, lisible par d'autres outils.
app.get('/api/docs.json', (request, response) => response.json(openApiDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'API Bazardim' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/uploads', uploadsRoutes);

// Sert les images envoyées par les utilisateurs : /uploads/abc.jpg → fichier back/uploads/abc.jpg.
// (helmet ajoute "X-Content-Type-Options: nosniff" : un faux fichier image ne peut pas être exécuté.)
app.use('/uploads', express.static(config.UPLOAD_DIRECTORY));
app.use('/api', productsRoutes);

// ----- Gestion des erreurs (toujours en dernier) -----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
