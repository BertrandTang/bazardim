import { HttpError } from '../utils/errors.js';

/**
 * POST /api/uploads — reçoit une image (champ "image") et renvoie son adresse : { image_url: "/uploads/abc.jpg" }.
 * Le front met ensuite cette adresse dans l'annonce (image_url) ou dans le profil (profile_image_url).
 * L'image a déjà été vérifiée et enregistrée par le middleware uploadImage (multer).
 */
export function uploadImageFile(request, response) {
  if (!request.file) {
    throw new HttpError(400, 'Aucune image reçue.');
  }
  response.status(201).json({ image_url: `/uploads/${request.file.filename}` });
}
