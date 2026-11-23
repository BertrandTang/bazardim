import { z } from 'zod';
import { idSchema } from './common.validator.js';

const ratingSchema = z.number().int().min(1).max(5);
const commentSchema = z.string().trim().min(1).max(1000);

/** Corps de POST /api/reviews. */
export const createReviewSchema = z.object({
  seller_id: idSchema,
  rating: ratingSchema,
  comment: commentSchema,
});

/** Corps de PUT /api/reviews/:id (on ne peut pas changer de vendeur). */
export const updateReviewSchema = z.object({
  rating: ratingSchema,
  comment: commentSchema,
});

/** Paramètres de GET /api/reviews : avis reçus par un vendeur OU écrits par un auteur. */
export const reviewFiltersSchema = z
  .object({
    seller_id: idSchema.optional(),
    author_id: idSchema.optional(),
  })
  .refine((filters) => filters.seller_id || filters.author_id, 'Indiquez seller_id ou author_id.');
