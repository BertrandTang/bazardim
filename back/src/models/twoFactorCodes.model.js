import { query } from '../config/database.js';

/**
 * Enregistre le code de double authentification d'un utilisateur (son empreinte et sa date d'expiration).
 * S'il en avait déjà un, il est remplacé (ON CONFLICT ... DO UPDATE) et le compteur d'essais repart à 0.
 */
export async function saveTwoFactorCode(userId, codeHash, validityInMinutes) {
  await query(
    `INSERT INTO two_factor_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(mins => $3))
     ON CONFLICT (user_id) DO UPDATE
       SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempt_count = 0`,
    [userId, codeHash, validityInMinutes],
  );
}

/** Code en attente d'un utilisateur, avec `is_expired` calculé par PostgreSQL, ou null. */
export async function findTwoFactorCode(userId) {
  const rows = await query(
    `SELECT code_hash, attempt_count, expires_at < now() AS is_expired
     FROM two_factor_codes
     WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

/** Ajoute un mauvais essai et renvoie le nouveau nombre d'essais. */
export async function incrementTwoFactorAttempts(userId) {
  const rows = await query(
    'UPDATE two_factor_codes SET attempt_count = attempt_count + 1 WHERE user_id = $1 RETURNING attempt_count',
    [userId],
  );
  return rows[0]?.attempt_count ?? 0;
}

/** Supprime le code : il a été utilisé, il a expiré ou il y a eu trop d'essais. */
export async function deleteTwoFactorCode(userId) {
  await query('DELETE FROM two_factor_codes WHERE user_id = $1', [userId]);
}
