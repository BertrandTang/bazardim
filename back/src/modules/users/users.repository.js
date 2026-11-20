import { query } from '../../database.js';

// Colonnes renvoyées pour l'utilisateur connecté. Le hash du mot de passe n'en fait JAMAIS partie.
const ACCOUNT_COLUMNS = 'id, username, email, profile_image_url, role, created_at';

/** Compte complet (sans mot de passe) d'un utilisateur, ou null. */
export async function findUserById(userId) {
  const rows = await query(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE id = $1`, [userId]);
  return rows[0] ?? null;
}

/** Utilisé uniquement pour la connexion : renvoie l'id et le hash du mot de passe. */
export async function findCredentialsByEmail(email) {
  const rows = await query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function findPasswordHashById(userId) {
  const rows = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  return rows[0]?.password_hash ?? null;
}

/**
 * Profil public d'un vendeur : pas d'email (donnée personnelle), mais sa note moyenne
 * et son nombre d'avis, calculés à partir de la table reviews.
 */
export async function findPublicProfileById(userId) {
  const rows = await query(
    `SELECT
       users.id,
       users.username,
       users.profile_image_url,
       users.created_at,
       COALESCE(AVG(reviews.rating), 0)::float AS average_rating,
       COUNT(reviews.id)::int AS review_count
     FROM users
     LEFT JOIN reviews ON reviews.seller_id = users.id
     WHERE users.id = $1
     GROUP BY users.id`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function insertUser({ username, email, passwordHash, role = 'user', profileImageUrl = null }) {
  const rows = await query(
    `INSERT INTO users (username, email, password_hash, role, profile_image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${ACCOUNT_COLUMNS}`,
    [username, email, passwordHash, role, profileImageUrl],
  );
  return rows[0];
}

/**
 * Met à jour un compte. COALESCE($n, colonne) garde l'ancienne valeur
 * quand on passe `undefined` / null : on ne modifie que les champs fournis.
 */
export async function updateUserById(userId, { username, email, profileImageUrl, passwordHash }) {
  const rows = await query(
    `UPDATE users SET
       username          = COALESCE($2, username),
       email             = COALESCE($3, email),
       profile_image_url = COALESCE($4, profile_image_url),
       password_hash     = COALESCE($5, password_hash),
       updated_at        = now()
     WHERE id = $1
     RETURNING ${ACCOUNT_COLUMNS}`,
    [userId, username ?? null, email ?? null, profileImageUrl ?? null, passwordHash ?? null],
  );
  return rows[0];
}

/** Supprime le compte. Ses annonces, avis et likes partent avec (ON DELETE CASCADE). */
export async function deleteUserById(userId) {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}
