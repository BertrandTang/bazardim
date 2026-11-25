import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import ImageUploadField from '../ImageUploadField/ImageUploadField.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import { getImageObjectPosition } from '../../utils/productHelpers.js';
import { buildProductTitle } from '../../utils/productTitle.js';
import './ProductForm.css';

// Valeurs par défaut d'un nouveau produit (formulaire de mise en vente).
const EMPTY_PRODUCT = {
  category: CATEGORIES[0].value,
  year_of_acquisition: new Date().getFullYear(),
  state_of_wear: 'Neuf',
  has_box: true,
  state_of_box: 'Neuf',
  scale: '1/8',
};

// Les noms des champs (`name`) sont ceux attendus par l'API (voir back/README.md).
// Champs texte "simples" : on les décrit dans un tableau puis on génère
// les <TextField> avec .map(), au lieu de copier-coller 13 fois le même code.
const DETAIL_FIELDS = [
  { name: 'price', label: 'Prix (€)', type: 'number', required: true },
  { name: 'character_name', label: 'Personnage', required: true },
  { name: 'version', label: 'Édition (ex : Gear 5, Collector)' },
  { name: 'manufacturer', label: 'Fabricant' },
  { name: 'material', label: 'Matière' },
  { name: 'tags', label: 'Tags (séparés par des virgules)' },
  { name: 'year_of_acquisition', label: "Année d'acquisition", type: 'number' },
  { name: 'state_of_wear', label: 'État de la figurine' },
  { name: 'state_of_box', label: 'État de la boîte' },
  { name: 'ean_code', label: 'Code EAN (8 ou 13 chiffres)' },
  { name: 'height_cm', label: 'Hauteur (cm)', type: 'number' },
  { name: 'width_cm', label: 'Largeur (cm)', type: 'number' },
  { name: 'scale', label: 'Échelle' },
];

/**
 * Convertit un produit en valeurs de formulaire.
 * Les champs d'un formulaire contiennent toujours du texte : on transforme donc
 * les nombres, les booléens et les tableaux (tags) en chaînes de caractères.
 */
function productToFormValues(product) {
  return {
    description: product.description ?? '',
    price: product.price ?? '',
    category: product.category ?? '',
    licence_name: product.licence_name ?? '',
    character_name: product.character_name ?? '',
    manufacturer: product.manufacturer ?? '',
    version: product.version ?? '',
    material: product.material ?? '',
    tags: (product.tags ?? []).join(', '),
    image_url: product.image_url ?? '',
    // Cadrage vertical de la photo (0 = haut, 100 = bas) : un nombre, pour le curseur.
    image_position_y: product.image_position_y ?? 50,
    year_of_acquisition: product.year_of_acquisition ?? '',
    state_of_wear: product.state_of_wear ?? '',
    has_box: product.has_box ? 'yes' : 'no',
    state_of_box: product.state_of_box ?? '',
    ean_code: product.ean_code ?? '',
    height_cm: product.height_cm ?? '',
    width_cm: product.width_cm ?? '',
    scale: product.scale ?? '',
  };
}

/**
 * Opération inverse : convertit les valeurs du formulaire en champs de produit, au format de l'API.
 * Un champ texte vide est envoyé tel quel : l'API l'enregistre comme "non renseigné" (NULL).
 */
function formValuesToProduct(formValues) {
  // Pas de titre : l'API le calcule à partir du type, du personnage, de l'édition et du fabricant.
  return {
    description: formValues.description.trim(),
    price: Number(formValues.price),
    category: formValues.category,
    licence_name: formValues.licence_name.trim(),
    character_name: formValues.character_name.trim(),
    manufacturer: formValues.manufacturer.trim(),
    version: formValues.version.trim(),
    material: formValues.material.trim(),
    // "shf, bandai" devient ["shf", "bandai"]
    tags: formValues.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    image_url: formValues.image_url,
    image_position_y: formValues.image_position_y,
    year_of_acquisition: Number(formValues.year_of_acquisition) || null,
    state_of_wear: formValues.state_of_wear.trim(),
    has_box: formValues.has_box === 'yes',
    state_of_box: formValues.state_of_box.trim(),
    ean_code: formValues.ean_code.trim(),
    height_cm: Number(formValues.height_cm) || null,
    width_cm: Number(formValues.width_cm) || null,
    scale: formValues.scale.trim(),
  };
}

/** Retourne un message d'erreur si le formulaire est invalide, sinon une chaîne vide. */
function validateFormValues(formValues) {
  if (!formValues.character_name.trim() || !formValues.description.trim()) {
    return 'Le personnage et la description sont obligatoires.';
  }
  if (!(Number(formValues.price) > 0)) {
    return 'Le prix doit être supérieur à 0.';
  }
  if (!formValues.image_url) {
    return 'Ajoutez une photo de votre annonce.';
  }
  return '';
}

/**
 * Formulaire de produit, partagé entre la mise en vente (page Sell)
 * et la modification d'une annonce (page Product).
 *
 * @param {object} props
 * @param {object} [props.initialProduct] - Produit à modifier (vide pour une création).
 * @param {string} props.submitLabel - Texte du bouton de validation.
 * @param {Function} props.onSubmit - Fonction async appelée avec les champs du produit quand le formulaire
 *   est valide. Si elle lance une erreur (refus de l'API), son message est affiché sous le formulaire.
 * @param {Function} props.onCancel - Appelée au clic sur "Annuler".
 */
export default function ProductForm({ initialProduct = EMPTY_PRODUCT, submitLabel, onSubmit, onCancel }) {
  const { licences } = useProducts();

  // Toutes les valeurs du formulaire sont regroupées dans un seul objet d'état.
  // La fonction passée à useState n'est appelée qu'au premier affichage.
  const [formValues, setFormValues] = useState(() => productToFormValues(initialProduct));
  const [errorMessage, setErrorMessage] = useState('');
  // Vrai pendant l'envoi à l'API : le bouton est désactivé pour éviter un double envoi.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Appelée à chaque frappe dans n'importe quel champ : on utilise l'attribut `name`
  // du champ pour savoir quelle propriété de `formValues` mettre à jour.
  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // 1. Vérification rapide dans le navigateur, sans attendre le serveur.
    const validationError = validateFormValues(formValues);
    setErrorMessage(validationError);
    if (validationError) {
      return;
    }

    // 2. Envoi à l'API, qui refait toutes les vérifications (on ne fait jamais confiance au navigateur).
    setIsSubmitting(true);
    try {
      await onSubmit(formValuesToProduct(formValues));
    } catch (error) {
      setErrorMessage(error.message);
      // Le formulaire n'est réactivé qu'en cas d'erreur : en cas de succès, la page change.
      setIsSubmitting(false);
    }
  }

  return (
    <Box component="form" className="product-form" onSubmit={handleSubmit} noValidate>
      {/* Photo obligatoire : envoyée à l'API dès qu'elle est choisie, puis on garde son adresse. */}
      <ImageUploadField
        label="Photo de l’annonce *"
        imageUrl={formValues.image_url}
        onChange={(imageUrl) => setFormValues((previousValues) => ({ ...previousValues, image_url: imageUrl }))}
        objectPosition={getImageObjectPosition(formValues)}
      />
      {/* Cadrage : une photo en hauteur est rognée dans les cartes. Le vendeur choisit la partie visible,
          et l'aperçu ci-dessus se met à jour en direct. Le curseur se règle aussi au clavier (flèches). */}
      {formValues.image_url && (
        <div className="product-form-framing">
          <span id="product-form-framing-label">Cadrage de la photo</span>
          <div className="product-form-framing-slider">
            <span aria-hidden="true">Haut</span>
            <Slider
              value={formValues.image_position_y}
              min={0}
              max={100}
              aria-labelledby="product-form-framing-label"
              getAriaValueText={(value) => `${value} % depuis le haut`}
              onChange={(event, value) =>
                setFormValues((previousValues) => ({ ...previousValues, image_position_y: value }))
              }
            />
            <span aria-hidden="true">Bas</span>
          </div>
        </div>
      )}
      {/* Aperçu du titre, calculé à partir des champs ci-dessous et mis à jour à chaque frappe.
          aria-live="polite" : un lecteur d'écran annonce le nouveau titre quand il change. */}
      <p className="product-form-title-preview" aria-live="polite">
        <span>Titre de l’annonce (créé automatiquement) :</span>
        <strong>
          {formValues.character_name.trim()
            ? buildProductTitle(formValues)
            : 'complétez le type, le personnage et l’édition ci-dessous'}
        </strong>
      </p>
      <TextField
        label="Description"
        name="description"
        required
        fullWidth
        multiline
        minRows={4}
        value={formValues.description}
        onChange={handleChange}
      />

      <div className="product-form-grid">
        <TextField select label="Catégorie" name="category" value={formValues.category} onChange={handleChange}>
          {CATEGORIES.map((category) => (
            <MenuItem key={category.value} value={category.value}>
              {category.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField select label="Boîte d'origine" name="has_box" value={formValues.has_box} onChange={handleChange}>
          <MenuItem value="yes">Oui</MenuItem>
          <MenuItem value="no">Non</MenuItem>
        </TextField>

        {/* Champ libre avec suggestions : les licences déjà existantes sont proposées.
            L'API reconnaît les autres écritures ("one-piece") et les synonymes ("DBZ") ;
            une licence vraiment nouvelle est vérifiée par un administrateur avant d'entrer dans le menu. */}
        <TextField
          label="Licence"
          name="licence_name"
          value={formValues.licence_name}
          onChange={handleChange}
          helperText="Choisissez-la dans la liste si elle existe. Une nouvelle licence sera vérifiée par notre équipe."
          slotProps={{ htmlInput: { list: 'licence-suggestions' } }}
        />
        <datalist id="licence-suggestions">
          {licences.map((licence) => (
            <option key={licence} value={licence} />
          ))}
        </datalist>

        {DETAIL_FIELDS.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type ?? 'text'}
            required={field.required}
            value={formValues[field.name]}
            onChange={handleChange}
          />
        ))}
      </div>

      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="product-form-actions">
        <Button variant="outlined" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="contained" type="submit" className="button-gradient" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </Box>
  );
}
