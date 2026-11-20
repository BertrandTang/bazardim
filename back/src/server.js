// Point d'entrée : démarre le serveur HTTP (lancé par `npm run dev` ou `npm start`).
import app from './app.js';
import { config } from './config.js';
import { closeDatabase } from './database.js';
import { logger } from './logger.js';

const server = app.listen(config.PORT, () => {
  logger.info(`API Bazardim démarrée sur http://localhost:${config.PORT}`);
});

// Arrêt propre (Ctrl+C, ou arrêt du conteneur en production) : on termine les requêtes
// en cours, puis on ferme les connexions à la base de données.
function shutDown(signal) {
  logger.info(`${signal} reçu, arrêt du serveur...`);
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
