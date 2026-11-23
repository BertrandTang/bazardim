import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { config } from './config.js';

/**
 * Journal de l'application (winston).
 *
 * Utilisation, partout dans le back :
 *   logger.info('Message normal');
 *   logger.warn('Quelque chose de suspect');
 *   logger.error(error);   // une erreur JavaScript : sa pile d'appels est aussi enregistrée
 *
 * Chaque message a un NIVEAU (du plus grave au moins grave : error, warn, info).
 * Winston l'envoie vers des « transports » (destinations) :
 * - le terminal : tous les messages ;
 * - le fichier back/logs/errors.log : uniquement les erreurs, pour les retrouver après coup.
 */

// Dossier des fichiers de log (back/logs/, ignoré par git).
const LOG_DIRECTORY = fileURLToPath(new URL('../../logs/', import.meta.url));

// Mise en forme d'une ligne : "2026-11-23 14:05:12 [info] GET /api/products → 200 (12 ms)".
// Pour une erreur, on ajoute sa pile d'appels (stack) en dessous, utile pour trouver le fichier fautif.
const lineFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
  const line = `${timestamp} [${level}] ${message}`;
  return stack ? `${line}\n${stack}` : line;
});

export const logger = winston.createLogger({
  // Niveau minimal enregistré : "info" enregistre info, warn et error.
  level: 'info',
  // Formats appliqués à tous les messages :
  // - errors({ stack: true }) : permet d'écrire logger.error(error) en gardant le message ET la pile ;
  // - timestamp : ajoute la date et l'heure.
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Terminal : niveau en couleur (rouge pour error, jaune pour warn, vert pour info).
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), lineFormat),
    }),
    // Fichier : seulement les erreurs (level: 'error'), sans couleurs (illisibles dans un fichier).
    new winston.transports.File({
      filename: `${LOG_DIRECTORY}errors.log`,
      level: 'error',
      format: lineFormat,
    }),
  ],
  // Pendant les tests, aucun log : la sortie des tests reste lisible et aucun fichier n'est écrit.
  silent: config.isTest,
});
