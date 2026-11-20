/**
 * Erreur "prévue" avec un code HTTP, à lancer depuis un contrôleur :
 *   throw new HttpError(404, 'Produit introuvable.');
 * Le gestionnaire d'erreurs (middlewares/errorHandler.js) la transforme en réponse JSON.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
