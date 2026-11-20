import { HttpError } from '../../errors.js';
import { isOwnerOrAdmin } from '../../middlewares/authentication.js';
import { idSchema } from '../../utils/validation.js';
import { findUserById } from '../users/users.repository.js';
import { createReviewSchema, reviewFiltersSchema, updateReviewSchema } from './reviews.schemas.js';
import { deleteReviewById, findReviewById, findReviews, insertReview, updateReviewById } from './reviews.repository.js';

/** Retrouve l'avis de l'URL (404 s'il n'existe pas). */
async function findReviewOrFail(request) {
  const reviewId = idSchema.parse(request.params.id);
  const review = await findReviewById(reviewId);
  if (!review) {
    throw new HttpError(404, 'Avis introuvable.');
  }
  return review;
}

/** GET /api/reviews?seller_id= ou ?author_id= */
export async function listReviews(request, response) {
  const filters = reviewFiltersSchema.parse(request.query);
  response.json(await findReviews(filters));
}

/** POST /api/reviews — l'auteur est toujours l'utilisateur connecté. */
export async function createReview(request, response) {
  const { seller_id: sellerId, rating, comment } = createReviewSchema.parse(request.body);

  if (sellerId === request.user.id) {
    throw new HttpError(400, 'Vous ne pouvez pas vous noter vous-même.');
  }
  if (!(await findUserById(sellerId))) {
    throw new HttpError(404, 'Vendeur introuvable.');
  }

  const reviewId = await insertReview({ sellerId, authorId: request.user.id, rating, comment });
  response.status(201).json(await findReviewById(reviewId));
}

/** PUT /api/reviews/:id — seul l'auteur peut modifier son avis. */
export async function updateReview(request, response) {
  const review = await findReviewOrFail(request);
  if (review.author_id !== request.user.id) {
    throw new HttpError(403, 'Vous ne pouvez modifier que vos propres avis.');
  }

  const changes = updateReviewSchema.parse(request.body);
  await updateReviewById(review.id, changes);
  response.json(await findReviewById(review.id));
}

/** DELETE /api/reviews/:id — l'auteur, ou un administrateur (modération). */
export async function deleteReview(request, response) {
  const review = await findReviewOrFail(request);
  if (!isOwnerOrAdmin(request.user, review.author_id)) {
    throw new HttpError(403, 'Vous ne pouvez supprimer que vos propres avis.');
  }

  await deleteReviewById(review.id);
  response.status(204).end();
}
