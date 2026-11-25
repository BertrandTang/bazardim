import { useState } from 'react';
import Button from '@mui/material/Button';
import { uploadImage } from '../../services/api.js';
import './ImageUploadField.css';

// Mêmes règles que l'API (back/src/middlewares/imageUpload.js) : on prévient l'utilisateur
// tout de suite, sans attendre l'envoi. L'API refait de toute façon la vérification.
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMUM_SIZE = 2 * 1024 * 1024; // 2 Mo

/**
 * Champ pour choisir une image sur son appareil, avec un aperçu.
 * Dès que l'image est choisie, elle est envoyée à l'API, qui renvoie son adresse ("/uploads/abc.jpg").
 * C'est cette adresse que le formulaire enregistre ensuite (annonce ou profil).
 *
 * @param {object} props
 * @param {string} props.label - Titre du champ, ex : "Photo de l'annonce".
 * @param {string} props.imageUrl - Adresse de l'image actuelle ('' s'il n'y en a pas).
 * @param {Function} props.onChange - Appelée avec l'adresse de la nouvelle image.
 * @param {boolean} [props.isRound] - Aperçu rond (photo de profil) au lieu de rectangulaire.
 * @param {string} [props.objectPosition] - Cadrage de l'aperçu (propriété CSS object-position), ex : "50% 20%".
 */
export default function ImageUploadField({ label, imageUrl, onChange, isRound = false, objectPosition }) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files[0];
    // On vide le champ : choisir à nouveau le même fichier déclenchera bien un nouvel envoi.
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage('Format non accepté : choisissez une image JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAXIMUM_SIZE) {
      setErrorMessage('Image trop lourde : 2 Mo maximum.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    try {
      const { image_url: uploadedImageUrl } = await uploadImage(file);
      onChange(uploadedImageUrl);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  let buttonText = 'Choisir une image';
  if (isUploading) {
    buttonText = 'Envoi de l’image…';
  } else if (imageUrl) {
    buttonText = 'Changer l’image';
  }

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>

      <div className={isRound ? 'image-upload-preview round' : 'image-upload-preview'}>
        {imageUrl ? (
          <img src={imageUrl} alt={`Aperçu : ${label}`} style={objectPosition ? { objectPosition } : undefined} />
        ) : (
          <span className="image-upload-empty">Aucune image</span>
        )}
      </div>

      {/* Le bouton est un <label> qui contient le vrai champ fichier (caché visuellement) :
          cliquer sur le bouton ouvre la fenêtre de choix de fichier de l'appareil. */}
      <Button component="label" variant="outlined" disabled={isUploading}>
        {buttonText}
        <input type="file" className="visually-hidden" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} />
      </Button>
      <small className="image-upload-hint">JPEG, PNG ou WebP, 2 Mo maximum.</small>

      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
