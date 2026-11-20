import { HttpError } from '../../errors.js';
import { isOwnerOrAdmin } from '../../middlewares/authentication.js';
import { idSchema } from '../../utils/validation.js';
import { productFiltersSchema, productSchema } from './products.schemas.js';
import {
  deleteProductById,
  findLicenceNames,
  findProductById,
  findProducts,
  insertProduct,
  updateProductById,
} from './products.repository.js';

/** Retrouve le produit de l'URL et vérifie que l'utilisateur a le droit de le modifier. */
async function findEditableProduct(request) {
  const productId = idSchema.parse(request.params.id);
  const product = await findProductById(productId);
  if (!product) {
    throw new HttpError(404, 'Produit introuvable.');
  }
  if (!isOwnerOrAdmin(request.user, product.owner_id)) {
    throw new HttpError(403, 'Vous ne pouvez modifier que vos propres annonces.');
  }
  return product;
}

/** GET /api/products?category=&licence=&search=&owner_id=&limit=&offset= */
export async function listProducts(request, response) {
  const filters = productFiltersSchema.parse(request.query);
  response.json(await findProducts(filters));
}

/** GET /api/products/:id */
export async function getProduct(request, response) {
  const productId = idSchema.parse(request.params.id);
  const product = await findProductById(productId);
  if (!product) {
    throw new HttpError(404, 'Produit introuvable.');
  }
  response.json(product);
}

/** POST /api/products — l'annonce appartient toujours à l'utilisateur connecté. */
export async function createProduct(request, response) {
  const fields = productSchema.parse(request.body);
  const productId = await insertProduct(request.user.id, fields);
  response.status(201).json(await findProductById(productId));
}

/** PUT /api/products/:id — réservé au propriétaire (ou à un administrateur). */
export async function updateProduct(request, response) {
  const product = await findEditableProduct(request);
  const fields = productSchema.parse(request.body);
  await updateProductById(product.id, fields);
  response.json(await findProductById(product.id));
}

/** DELETE /api/products/:id — réservé au propriétaire (ou à un administrateur). */
export async function deleteProduct(request, response) {
  const product = await findEditableProduct(request);
  await deleteProductById(product.id);
  response.status(204).end();
}

/** GET /api/licences — pour le menu "Licences" et les suggestions du formulaire. */
export async function listLicences(request, response) {
  response.json(await findLicenceNames());
}
