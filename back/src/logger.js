import pino from 'pino';
import { config } from './config.js';

// Journal (logs) de l'application, au format JSON : facile à lire par les outils de supervision.
// Pendant les tests on n'affiche rien pour garder une sortie lisible.
export const logger = pino({
  level: config.isTest ? 'silent' : 'info',
  // Ces champs ne doivent jamais apparaître dans les logs (jetons de connexion).
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
});
