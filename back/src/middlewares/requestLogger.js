import { logger } from '../config/logger.js';

/**
 * Middleware de journalisation : écrit une ligne dans le journal (winston) pour chaque requête reçue.
 *
 * Exemple de sortie :
 *   2026-11-23 14:05:12 [info] GET /api/products → 200 (12 ms)
 *   2026-11-23 14:05:20 [warn] POST /api/auth/login → 401 (85 ms)
 *
 * Un middleware Express est une fonction qui reçoit trois paramètres :
 * - `request`  : la requête envoyée par le client (méthode, adresse, corps, cookies...) ;
 * - `response` : la réponse que l'on va renvoyer au client ;
 * - `next`     : une fonction à appeler pour passer au middleware (ou à la route) suivant.
 *
 * La journalisation fait partie de la « sécurité en profondeur » demandée par la certification (C21) :
 * elle permet de voir ce qui se passe sur l'API et de retrouver l'origine d'une erreur.
 */
export function requestLogger(request, response, next) {
  // On note l'heure d'arrivée de la requête (en millisecondes) pour calculer sa durée.
  const startTime = Date.now();

  // On ne peut pas écrire le code de réponse tout de suite : la route ne l'a pas encore choisi.
  // On attend donc l'événement "finish", déclenché quand la réponse a été entièrement envoyée.
  response.on('finish', () => {
    const duration = Date.now() - startTime;
    // `originalUrl` contient l'adresse complète demandée, paramètres compris (ex : /api/products?limit=10).
    const message = `${request.method} ${request.originalUrl} → ${response.statusCode} (${duration} ms)`;

    // Le niveau dépend du code de réponse, pour repérer d'un coup d'œil ce qui ne va pas :
    // - 5xx : erreur du serveur → error (aussi écrite dans logs/errors.log) ;
    // - 4xx : requête refusée (mauvais mot de passe, accès interdit...) → warn ;
    // - sinon : tout va bien → info.
    if (response.statusCode >= 500) {
      logger.error(message);
    } else if (response.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  // Indispensable : sans cet appel, la requête resterait bloquée ici et le client n'aurait jamais de réponse.
  next();
}
