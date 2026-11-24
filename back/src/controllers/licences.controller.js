import { HttpError } from '../utils/errors.js';
import { normalizeText } from '../utils/normalizeText.js';
import { idSchema } from '../validators/common.validator.js';
import { aliasSchema, mergeLicenceSchema, updateLicenceSchema } from '../validators/licences.validator.js';
import {
  approveLicence,
  deleteAlias,
  findAlias,
  findAllLicencesForAdmin,
  findLicenceById,
  findLicenceByNormalizedName,
  insertAlias,
  mergeLicences,
  renameLicence,
} from '../models/licences.model.js';

// Toutes ces routes sont réservées aux administrateurs (voir routes/admin.routes.js).

/** Retrouve la licence de l'URL (/api/admin/licences/:id), ou répond 404. */
async function findLicenceFromUrl(request) {
  const licence = await findLicenceById(idSchema.parse(request.params.id));
  if (!licence) {
    throw new HttpError(404, 'Licence introuvable.');
  }
  return licence;
}

/**
 * Vérifie qu'un nom normalisé n'est pas déjà pris par une AUTRE licence (nom ou synonyme).
 * Sinon, deux licences pourraient correspondre à ce que tape un vendeur.
 */
async function checkNormalizedNameIsFree(normalizedName, licenceId) {
  const licenceWithThisName = await findLicenceByNormalizedName(normalizedName);
  if (licenceWithThisName && licenceWithThisName.id !== licenceId) {
    throw new HttpError(409, `La licence « ${licenceWithThisName.name} » porte déjà ce nom : fusionnez-les plutôt.`);
  }
  const alias = await findAlias(normalizedName);
  if (alias && alias.licence_id !== licenceId) {
    throw new HttpError(409, `« ${normalizedName} » est déjà un synonyme de « ${alias.licence_name} ».`);
  }
}

/** GET /api/admin/licences — toutes les licences, celles en attente d'abord. */
export async function listLicences(request, response) {
  response.json(await findAllLicencesForAdmin());
}

/** PATCH /api/admin/licences/:id — renommer (corriger l'orthographe) et/ou valider une licence. */
export async function updateLicence(request, response) {
  const licence = await findLicenceFromUrl(request);
  const changes = updateLicenceSchema.parse(request.body);

  if (changes.name !== undefined) {
    const newNormalizedName = normalizeText(changes.name);
    await checkNormalizedNameIsFree(newNormalizedName, licence.id);
    await renameLicence(licence, changes.name, newNormalizedName);
  }
  if (changes.status === 'approved') {
    await approveLicence(licence.id);
  }
  response.json(await findLicenceById(licence.id));
}

/**
 * POST /api/admin/licences/:id/merge — la licence de l'URL est un doublon d'une autre :
 * ses annonces y sont déplacées et son nom devient un synonyme (voir mergeLicences).
 */
export async function mergeLicence(request, response) {
  const source = await findLicenceFromUrl(request);
  const { target_licence_id: targetId } = mergeLicenceSchema.parse(request.body);
  if (targetId === source.id) {
    throw new HttpError(400, 'Une licence ne peut pas être fusionnée avec elle-même.');
  }
  if (!(await findLicenceById(targetId))) {
    throw new HttpError(404, 'Licence cible introuvable.');
  }
  await mergeLicences(source, targetId);
  response.status(204).end();
}

/** POST /api/admin/licences/:id/aliases — ajoute un synonyme (traduction, abréviation...). */
export async function addAlias(request, response) {
  const licence = await findLicenceFromUrl(request);
  const { alias } = aliasSchema.parse(request.body);
  const normalizedAlias = normalizeText(alias);

  if (normalizedAlias === licence.normalized_name || (await findAlias(normalizedAlias))?.licence_id === licence.id) {
    throw new HttpError(409, 'Ce synonyme correspond déjà à cette licence.');
  }
  await checkNormalizedNameIsFree(normalizedAlias, licence.id);
  await insertAlias(normalizedAlias, licence.id);
  response.status(201).json({ normalized_alias: normalizedAlias, licence_id: licence.id });
}

/** DELETE /api/admin/licences/:id/aliases/:alias — supprime un synonyme. */
export async function removeAlias(request, response) {
  const licence = await findLicenceFromUrl(request);
  const isDeleted = await deleteAlias(licence.id, normalizeText(request.params.alias));
  if (!isDeleted) {
    throw new HttpError(404, 'Synonyme introuvable.');
  }
  response.status(204).end();
}
