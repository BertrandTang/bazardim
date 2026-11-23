import { query } from '../config/database.js';

// La table users est jointe deux fois (une fois pour l'auteur, une fois pour le vendeur) :
// les alias "authors" et "sellers" permettent de les distinguer.
const REVIEW_SELECT = `
  SELECT
    reviews.id,
    reviews.seller_id,
    sellers.username AS seller_username,
    reviews.author_id,
    authors.username AS author_username,
    reviews.rating,
    reviews.comment,
    reviews.created_at,
    reviews.updated_at
  FROM reviews
  JOIN users AS authors ON authors.id = reviews.author_id
  JOIN users AS sellers ON sellers.id = reviews.seller_id`;

/** Avis filtrés par vendeur et/ou par auteur, du plus récent au plus ancien. */
export async function findReviews({ seller_id: sellerId, author_id: authorId }) {
  return query(
    `${REVIEW_SELECT}
     WHERE ($1::int IS NULL OR reviews.seller_id = $1)
       AND ($2::int IS NULL OR reviews.author_id = $2)
     ORDER BY reviews.created_at DESC, reviews.id DESC`,
    [sellerId ?? null, authorId ?? null],
  );
}

export async function findReviewById(reviewId) {
  const rows = await query(`${REVIEW_SELECT} WHERE reviews.id = $1`, [reviewId]);
  return rows[0] ?? null;
}

export async function insertReview({ sellerId, authorId, rating, comment }) {
  const rows = await query(
    `INSERT INTO reviews (seller_id, author_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [sellerId, authorId, rating, comment],
  );
  return rows[0].id;
}

export async function updateReviewById(reviewId, { rating, comment }) {
  await query('UPDATE reviews SET rating = $2, comment = $3, updated_at = now() WHERE id = $1', [
    reviewId,
    rating,
    comment,
  ]);
}

export async function deleteReviewById(reviewId) {
  await query('DELETE FROM reviews WHERE id = $1', [reviewId]);
}
