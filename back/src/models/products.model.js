import { query, withTransaction } from '../config/database.js';
import { normalizeText } from '../utils/normalizeText.js';

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
  'image_position_y',
];

/** Valeurs des colonnes éditables, dans le même ordre que EDITABLE_COLUMNS. */
function getEditableValues(fields) {
  return EDITABLE_COLUMNS.map((column) => fields[column]);
}

/**
 * Retourne l'id de la licence saisie par le vendeur, en évitant les doublons :
 * 1. une licence a déjà ce nom une fois normalisé ("one-piece" = "One Piece") → on la prend ;
 * 2. sinon, ce nom est un synonyme connu ("tensura") → on prend la licence correspondante ;
 * 3. sinon, c'est une licence inconnue → elle est créée "en attente" de validation par un admin.
 */
async function findOrCreateLicenceId(transactionQuery, licenceName) {
  if (!licenceName) {
    return null;
  }
  const normalizedName = normalizeText(licenceName);

  const byName = await transactionQuery('SELECT id FROM licences WHERE normalized_name = $1', [normalizedName]);
  if (byName.length > 0) {
    return byName[0].id;
  }

  const byAlias = await transactionQuery('SELECT licence_id FROM licence_aliases WHERE normalized_alias = $1', [
    normalizedName,
  ]);
  if (byAlias.length > 0) {
    return byAlias[0].licence_id;
  }

  // "ON CONFLICT ... DO UPDATE" : si deux vendeurs créent la même licence au même instant,
  // RETURNING renvoie quand même l'id de celle qui existe.
  const created = await transactionQuery(
    `INSERT INTO licences (name, normalized_name, status) VALUES ($1, $2, 'pending')
     ON CONFLICT (normalized_name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name
     RETURNING id`,
    [licenceName, normalizedName],
  );
  return created[0].id;
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
  // Pour chercher aussi dans les synonymes des licences (ex : "tensura"), enregistrés normalisés.
  const normalizedSearch = search ? normalizeText(search) : '';
  const aliasPattern = normalizedSearch ? `%${normalizedSearch}%` : null;

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
            OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE $4)
            OR EXISTS (SELECT 1 FROM licence_aliases
                       WHERE licence_aliases.licence_id = product_details.licence_id
                         AND licence_aliases.normalized_alias LIKE $7))
     ORDER BY created_at DESC, id DESC
     LIMIT $5 OFFSET $6`,
    [category ?? null, licence ?? null, ownerId ?? null, searchPattern, limit, offset, aliasPattern],
  );
}

export async function findProductById(productId) {
  const rows = await query('SELECT * FROM product_details WHERE id = $1', [productId]);
  return rows[0] ?? null;
}

/**
 * Noms des licences VALIDÉES utilisées par au moins une annonce, par ordre alphabétique
 * (menu Licences et suggestions du formulaire). Les licences en attente n'y apparaissent pas.
 */
export async function findLicenceNames() {
  const rows = await query(
    `SELECT name FROM licences
     WHERE status = 'approved'
       AND EXISTS (SELECT 1 FROM products WHERE products.licence_id = licences.id)
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

/** Annonces encore en vente, avec leur date de dernière modification (pour le plan du site). */
export async function findAvailableProductsForSitemap() {
  return query('SELECT id, updated_at FROM products WHERE sold_at IS NULL ORDER BY id');
}
