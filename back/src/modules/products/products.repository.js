import { query, withTransaction } from '../../database.js';

// Colonnes de la table products remplies à partir du formulaire.
// Ces noms viennent de notre code (jamais de l'utilisateur) : on peut donc les insérer
// dans le SQL sans risque. Les VALEURS, elles, passent toujours par $1, $2...
const EDITABLE_COLUMNS = [
  'title',
  'description',
  'price',
  'category',
  'character_name',
  'manufacturer',
  'version',
  'material',
  'state_of_wear',
  'has_box',
  'state_of_box',
  'ean_code',
  'year_of_acquisition',
  'height_cm',
  'width_cm',
  'scale',
  'image_url',
];

/** Valeurs des colonnes éditables, dans le même ordre que EDITABLE_COLUMNS. */
function getEditableValues(fields) {
  return EDITABLE_COLUMNS.map((column) => fields[column]);
}

/**
 * Retourne l'id de la licence portant ce nom, en la créant si elle n'existe pas encore.
 * "ON CONFLICT ... DO UPDATE" permet à RETURNING de renvoyer l'id même si la licence existait.
 */
async function findOrCreateLicenceId(transactionQuery, licenceName) {
  if (!licenceName) {
    return null;
  }
  const rows = await transactionQuery(
    `INSERT INTO licences (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [licenceName],
  );
  return rows[0].id;
}

/** Remplace tous les tags d'un produit par la liste `tagNames`. */
async function replaceProductTags(transactionQuery, productId, tagNames) {
  await transactionQuery('DELETE FROM product_tags WHERE product_id = $1', [productId]);

  for (const tagName of tagNames) {
    const rows = await transactionQuery(
      `INSERT INTO tags (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName],
    );
    await transactionQuery('INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2)', [productId, rows[0].id]);
  }
}

/**
 * Liste des produits avec filtres facultatifs.
 * Astuce SQL : "($1::text IS NULL OR category = $1)" signifie
 * « si aucun filtre de catégorie n'est fourni, on garde toutes les lignes ».
 */
export async function findProducts({ category, licence, search, owner_id: ownerId, limit, offset }) {
  // ILIKE = LIKE sans tenir compte des majuscules ; les % autour signifient « contient ».
  const searchPattern = search ? `%${search}%` : null;

  return query(
    `SELECT * FROM product_details
     WHERE ($1::text IS NULL OR category = $1)
       AND ($2::text IS NULL OR licence_name = $2)
       AND ($3::int IS NULL OR owner_id = $3)
       AND ($4::text IS NULL
            OR title ILIKE $4
            OR description ILIKE $4
            OR licence_name ILIKE $4
            OR character_name ILIKE $4
            OR manufacturer ILIKE $4
            OR owner_username ILIKE $4
            OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE $4))
     ORDER BY created_at DESC, id DESC
     LIMIT $5 OFFSET $6`,
    [category ?? null, licence ?? null, ownerId ?? null, searchPattern, limit, offset],
  );
}

export async function findProductById(productId) {
  const rows = await query('SELECT * FROM product_details WHERE id = $1', [productId]);
  return rows[0] ?? null;
}

/** Noms des licences utilisées par au moins une annonce, par ordre alphabétique. */
export async function findLicenceNames() {
  const rows = await query(
    `SELECT name FROM licences
     WHERE EXISTS (SELECT 1 FROM products WHERE products.licence_id = licences.id)
     ORDER BY name`,
  );
  return rows.map((row) => row.name);
}

/** Crée un produit (avec sa licence et ses tags) et retourne son id. */
export async function insertProduct(ownerId, fields) {
  return withTransaction(async (transactionQuery) => {
    const licenceId = await findOrCreateLicenceId(transactionQuery, fields.licence_name);

    // $1, $2, ... $n pour chaque colonne éditable, puis owner_id et licence_id à la fin.
    const placeholders = EDITABLE_COLUMNS.map((column, index) => `$${index + 1}`);
    const rows = await transactionQuery(
      `INSERT INTO products (${EDITABLE_COLUMNS.join(', ')}, owner_id, licence_id)
       VALUES (${placeholders.join(', ')}, $${EDITABLE_COLUMNS.length + 1}, $${EDITABLE_COLUMNS.length + 2})
       RETURNING id`,
      [...getEditableValues(fields), ownerId, licenceId],
    );

    const productId = rows[0].id;
    await replaceProductTags(transactionQuery, productId, fields.tags);
    return productId;
  });
}

/** Remplace tous les champs éditables d'un produit. */
export async function updateProductById(productId, fields) {
  await withTransaction(async (transactionQuery) => {
    const licenceId = await findOrCreateLicenceId(transactionQuery, fields.licence_name);

    // "title = $1, description = $2, ..." puis licence_id et l'id du produit à la fin.
    const assignments = EDITABLE_COLUMNS.map((column, index) => `${column} = $${index + 1}`);
    await transactionQuery(
      `UPDATE products
       SET ${assignments.join(', ')}, licence_id = $${EDITABLE_COLUMNS.length + 1}, updated_at = now()
       WHERE id = $${EDITABLE_COLUMNS.length + 2}`,
      [...getEditableValues(fields), licenceId, productId],
    );

    await replaceProductTags(transactionQuery, productId, fields.tags);
  });
}

export async function deleteProductById(productId) {
  await query('DELETE FROM products WHERE id = $1', [productId]);
}
