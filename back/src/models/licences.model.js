import { query, withTransaction } from '../config/database.js';

/**
 * Toutes les licences pour la page d'administration : les licences en attente d'abord,
 * avec le nombre d'annonces qui les utilisent et la liste de leurs synonymes.
 */
export async function findAllLicencesForAdmin() {
  return query(
    `SELECT
       licences.id,
       licences.name,
       licences.status,
       licences.created_at,
       (SELECT count(*)::int FROM products WHERE products.licence_id = licences.id) AS product_count,
       COALESCE(
         (SELECT array_agg(normalized_alias ORDER BY normalized_alias)
          FROM licence_aliases WHERE licence_aliases.licence_id = licences.id),
         '{}'
       ) AS aliases
     FROM licences
     ORDER BY (licences.status = 'pending') DESC, licences.name`,
  );
}

export async function findLicenceById(licenceId) {
  const rows = await query('SELECT id, name, normalized_name, status FROM licences WHERE id = $1', [licenceId]);
  return rows[0] ?? null;
}

/** Licence dont le nom normalisé est `normalizedName`, ou null. */
export async function findLicenceByNormalizedName(normalizedName) {
  const rows = await query('SELECT id, name FROM licences WHERE normalized_name = $1', [normalizedName]);
  return rows[0] ?? null;
}

/** Synonyme `normalizedAlias` avec le nom de sa licence, ou null. */
export async function findAlias(normalizedAlias) {
  const rows = await query(
    `SELECT licence_aliases.licence_id, licences.name AS licence_name
     FROM licence_aliases
     JOIN licences ON licences.id = licence_aliases.licence_id
     WHERE normalized_alias = $1`,
    [normalizedAlias],
  );
  return rows[0] ?? null;
}

/**
 * Renomme une licence. L'ancien nom devient un synonyme : les vendeurs qui le tapent encore
 * sont rangés dans la licence renommée. Si le nouveau nom était un synonyme de cette licence,
 * ce synonyme est supprimé (il est devenu le nom principal).
 */
export async function renameLicence(licence, newName, newNormalizedName) {
  await withTransaction(async (transactionQuery) => {
    await transactionQuery('DELETE FROM licence_aliases WHERE normalized_alias = $1', [newNormalizedName]);
    await transactionQuery('UPDATE licences SET name = $2, normalized_name = $3 WHERE id = $1', [
      licence.id,
      newName,
      newNormalizedName,
    ]);
    if (licence.normalized_name !== newNormalizedName) {
      await transactionQuery('INSERT INTO licence_aliases (normalized_alias, licence_id) VALUES ($1, $2)', [
        licence.normalized_name,
        licence.id,
      ]);
    }
  });
}

/** Valide une licence : elle apparaît dans le menu Licences. */
export async function approveLicence(licenceId) {
  await query("UPDATE licences SET status = 'approved' WHERE id = $1", [licenceId]);
}

/**
 * Fusionne la licence `source` dans la licence `targetId`, dans une transaction :
 * 1. ses annonces passent dans la licence cible ;
 * 2. ses synonymes passent à la licence cible ;
 * 3. son nom devient un synonyme de la licence cible (la prochaine fois, c'est automatique) ;
 * 4. elle est supprimée.
 */
export async function mergeLicences(source, targetId) {
  await withTransaction(async (transactionQuery) => {
    await transactionQuery('UPDATE products SET licence_id = $2 WHERE licence_id = $1', [source.id, targetId]);
    await transactionQuery('UPDATE licence_aliases SET licence_id = $2 WHERE licence_id = $1', [source.id, targetId]);
    await transactionQuery('INSERT INTO licence_aliases (normalized_alias, licence_id) VALUES ($1, $2)', [
      source.normalized_name,
      targetId,
    ]);
    await transactionQuery('DELETE FROM licences WHERE id = $1', [source.id]);
  });
}

export async function insertAlias(normalizedAlias, licenceId) {
  await query('INSERT INTO licence_aliases (normalized_alias, licence_id) VALUES ($1, $2)', [
    normalizedAlias,
    licenceId,
  ]);
}

/** Supprime un synonyme d'une licence. Renvoie false s'il n'existait pas. */
export async function deleteAlias(licenceId, normalizedAlias) {
  const rows = await query(
    'DELETE FROM licence_aliases WHERE licence_id = $1 AND normalized_alias = $2 RETURNING normalized_alias',
    [licenceId, normalizedAlias],
  );
  return rows.length > 0;
}
