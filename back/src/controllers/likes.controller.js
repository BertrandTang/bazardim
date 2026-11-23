import { HttpError } from '../utils/errors.js';
import { idSchema } from '../validators/common.validator.js';
import { findProductById } from '../models/products.model.js';
import { deleteLike, findLikedProducts, insertLike } from '../models/likes.model.js';

/** GET /api/likes — produits mis en favoris par l'utilisateur connecté. */
export async function listLikedProducts(request, response) {
  response.json(await findLikedProducts(request.user.id));
}

/** PUT /api/likes/:productId — ajoute le produit aux favoris (sans effet s'il y est déjà). */
export async function likeProduct(request, response) {
  const productId = idSchema.parse(request.params.productId);
  if (!(await findProductById(productId))) {
    throw new HttpError(404, 'Produit introuvable.');
  }
  await insertLike(request.user.id, productId);
  response.status(204).end();
}

/** DELETE /api/likes/:productId — retire le produit des favoris. */
export async function unlikeProduct(request, response) {
  const productId = idSchema.parse(request.params.productId);
  await deleteLike(request.user.id, productId);
  response.status(204).end();
}
