import { query } from '../config/database.js';

/** Produits mis en favoris par un utilisateur, du plus récent au plus ancien. */
export async function findLikedProducts(userId) {
  return query(
    `SELECT product_details.*
     FROM likes
     JOIN product_details ON product_details.id = likes.product_id
     WHERE likes.user_id = $1
     ORDER BY likes.created_at DESC`,
    [userId],
  );
}

/** Ajoute un favori. "ON CONFLICT DO NOTHING" : liker deux fois n'a pas d'effet (pas d'erreur). */
export async function insertLike(userId, productId) {
  await query('INSERT INTO likes (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, productId]);
}

export async function deleteLike(userId, productId) {
  await query('DELETE FROM likes WHERE user_id = $1 AND product_id = $2', [userId, productId]);
}
