import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { config } from '../config/config.js';
import { HttpError } from '../utils/errors.js';

// Types d'images acceptés, avec l'extension donnée au fichier enregistré.
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Taille maximale d'une image : 2 Mo (largement assez pour une photo d'annonce).
export const MAXIMUM_IMAGE_SIZE = 2 * 1024 * 1024;

// Crée le dossier des images s'il n'existe pas encore (recursive : sans erreur s'il existe déjà).
mkdirSync(config.UPLOAD_DIRECTORY, { recursive: true });

// Où et sous quel nom enregistrer le fichier reçu.
const storage = multer.diskStorage({
  destination: config.UPLOAD_DIRECTORY,
  // Nom ALÉATOIRE (randomUUID) : on n'utilise jamais le nom choisi par l'utilisateur,
  // qui pourrait contenir des caractères dangereux ("../../") ou écraser un autre fichier.
  filename: (request, file, callback) => {
    callback(null, `${randomUUID()}${ALLOWED_IMAGE_TYPES[file.mimetype]}`);
  },
});

/**
 * Middleware multer : lit l'image envoyée dans le champ "image" d'un formulaire
 * (format "multipart/form-data"), l'enregistre sur le disque et la décrit dans `request.file`.
 *
 * Utilisation : router.post('/', requireAuth, uploadImage, controleur);
 */
export const uploadImage = multer({
  storage,
  limits: { fileSize: MAXIMUM_IMAGE_SIZE, files: 1 },
  // Appelée avant l'enregistrement : on refuse ce qui n'est pas une image acceptée.
  fileFilter: (request, file, callback) => {
    if (ALLOWED_IMAGE_TYPES[file.mimetype]) {
      callback(null, true);
    } else {
      callback(new HttpError(400, 'Format d’image non accepté : JPEG, PNG ou WebP uniquement.'));
    }
  },
}).single('image');
