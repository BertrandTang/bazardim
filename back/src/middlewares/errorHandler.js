import multer from 'multer';
import { z } from 'zod';
import { logger } from '../config/logger.js';
import { HttpError } from '../utils/errors.js';

// Codes d'erreur renvoyés par PostgreSQL (https://www.postgresql.org/docs/current/errcodes-appendix.html)
const POSTGRES_UNIQUE_VIOLATION = '23505';

// Message à afficher pour chaque contrainte UNIQUE de la base (voir database/schema.sql).
const UNIQUE_CONSTRAINT_MESSAGES = {
  users_email_key: 'Un compte existe déjà avec cet email.',
  users_username_key: 'Ce pseudo est déjà utilisé.',
};

/** Répond 404 quand aucune route ne correspond à l'adresse demandée. */
export function notFoundHandler(request, response) {
  response.status(404).json({ error: 'Route introuvable.' });
}

/**
 * Gestionnaire d'erreurs central : toutes les erreurs lancées dans les routes arrivent ici
 * (Express 5 attrape aussi les erreurs des fonctions async). On les transforme en réponse JSON.
 *
 * Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres : `next` doit rester présent.
 */
export function errorHandler(error, request, response, next) {
  // Erreur prévue par notre code (ex : 404 produit introuvable, 403 accès refusé).
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  // Données envoyées invalides (validation zod) : on indique chaque champ en erreur.
  if (error instanceof z.ZodError) {
    const details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return response.status(400).json({ error: 'Données invalides.', details });
  }

  // Fichier refusé par multer (envoi d'images) : trop lourd, plusieurs fichiers...
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE' ? 'Image trop lourde : 2 Mo maximum.' : 'Envoi de l’image impossible.';
    return response.status(400).json({ error: message });
  }

  // Corps de requête qui n'est pas du JSON valide.
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Le corps de la requête n’est pas un JSON valide.' });
  }

  // Valeur déjà existante en base (email ou pseudo déjà pris).
  if (error.code === POSTGRES_UNIQUE_VIOLATION) {
    const message = UNIQUE_CONSTRAINT_MESSAGES[error.constraint] ?? 'Cette valeur est déjà utilisée.';
    return response.status(409).json({ error: message });
  }

  // Erreur inattendue : on la journalise en détail (message + pile d'appels, dans le terminal
  // et dans logs/errors.log), mais on ne renvoie au client qu'un message générique
  // (ne jamais exposer la pile d'appels ou le SQL).
  logger.error(error);
  return response.status(500).json({ error: 'Erreur interne du serveur.' });
}
