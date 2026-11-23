import pg from 'pg';
import { config } from './config.js';

// PostgreSQL renvoie les nombres décimaux (type NUMERIC, ex : les prix) sous forme de texte
// pour ne jamais perdre de précision. Nos valeurs ont au plus 2 décimales :
// on peut les convertir sans risque en nombres JavaScript.
const NUMERIC_TYPE_ID = 1700;
pg.types.setTypeParser(NUMERIC_TYPE_ID, (value) => Number(value));

// Un "pool" garde quelques connexions ouvertes et les réutilise d'une requête à l'autre :
// c'est bien plus rapide (et moins gourmand) que d'ouvrir une connexion à chaque fois.
const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

/**
 * Exécute une requête SQL et retourne les lignes obtenues.
 *
 * Les valeurs sont TOUJOURS passées à part, dans `parameters`, et désignées dans le SQL
 * par $1, $2... PostgreSQL les traite alors comme des données et jamais comme du code SQL :
 * c'est ce qui protège contre les injections SQL. Ne jamais construire un SQL avec `${valeur}`.
 *
 * @param {string} sql - La requête, ex : 'SELECT * FROM users WHERE id = $1'.
 * @param {Array} [parameters] - Les valeurs de $1, $2...
 * @returns {Promise<object[]>} Les lignes du résultat.
 */
export async function query(sql, parameters = []) {
  const result = await pool.query(sql, parameters);
  return result.rows;
}

/**
 * Exécute plusieurs requêtes dans une transaction : soit elles réussissent toutes,
 * soit aucune n'est appliquée (ex : créer un produit ET ses tags).
 *
 * @param {(transactionQuery: Function) => Promise<*>} callback - Reçoit une fonction qui
 *   s'utilise exactement comme `query`, mais à l'intérieur de la transaction.
 * @returns {Promise<*>} Ce que retourne le callback.
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  const transactionQuery = async (sql, parameters = []) => (await client.query(sql, parameters)).rows;

  try {
    await client.query('BEGIN');
    const result = await callback(transactionQuery);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // On rend toujours la connexion au pool, même en cas d'erreur.
    client.release();
  }
}

/** Ferme toutes les connexions (arrêt du serveur, fin des tests). */
export function closeDatabase() {
  return pool.end();
}
