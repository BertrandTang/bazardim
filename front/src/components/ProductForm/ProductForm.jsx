import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useProducts } from '../../context/ProductsContext.jsx';
import { CATEGORIES } from '../../data/categories.js';
import './ProductForm.css';

// Valeurs par défaut d'un nouveau produit (formulaire de mise en vente).
const EMPTY_PRODUCT = {
  category: CATEGORIES[0].value,
  year_of_acquisition: new Date().getFullYear(),
  state_of_wear: 'Neuf',
  box: true,
  state_of_box: 'Neuf',
  size: { scale: '1/8' },
};

// Champs texte "simples" : on les décrit dans un tableau puis on génère
// les <TextField> avec .map(), au lieu de copier-coller 13 fois le même code.
const DETAIL_FIELDS = [
  { name: 'price', label: 'Prix (€)', type: 'number', required: true },
  { name: 'character_name', label: 'Personnage' },
  { name: 'manufacturer', label: 'Fabricant' },
  { name: 'version', label: 'Version' },
  { name: 'material', label: 'Matière' },
  { name: 'tags', label: 'Tags (séparés par des virgules)' },
  { name: 'img', label: 'Image (URL ou /img/...)' },
  { name: 'year_of_acquisition', label: "Année d'acquisition", type: 'number' },
  { name: 'state_of_wear', label: 'État de la figurine' },
  { name: 'state_of_box', label: 'État de la boîte' },
  { name: 'EAN_number', label: 'Code EAN' },
  { name: 'size_height', label: 'Hauteur (cm)', type: 'number' },
  { name: 'size_width', label: 'Largeur (cm)', type: 'number' },
  { name: 'size_scale', label: 'Échelle' },
];

/**
 * Convertit un produit en valeurs de formulaire.
 * Les champs d'un formulaire contiennent toujours du texte : on transforme donc
 * les nombres, les tableaux (tags) et les objets (size) en chaînes de caractères.
 */
function productToFormValues(product) {
  return {
    title: product.title ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    category: product.category ?? '',
    licence_name: product.licence_name ?? '',
    character_name: product.character_name ?? '',
    manufacturer: product.manufacturer ?? '',
    version: product.version ?? '',
    material: product.material ?? '',
    tags: (product.tags ?? []).join(', '),
    img: product.img ?? '',
    year_of_acquisition: product.year_of_acquisition ?? '',
    state_of_wear: product.state_of_wear ?? '',
    box: product.box ? 'yes' : 'no',
    state_of_box: product.state_of_box ?? '',
    EAN_number: product.EAN_number ?? '',
    size_height: product.size?.height ?? '',
    size_width: product.size?.width ?? '',
    size_scale: product.size?.scale ?? '',
  };
}

/** Opération inverse : convertit les valeurs du formulaire en champs de produit. */
function formValuesToProduct(formValues) {
  return {
    title: formValues.title.trim(),
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
    img: formValues.img.trim(),
    year_of_acquisition: Number(formValues.year_of_acquisition) || null,
    state_of_wear: formValues.state_of_wear.trim(),
    box: formValues.box === 'yes',
    state_of_box: formValues.state_of_box.trim(),
    EAN_number: formValues.EAN_number.trim(),
    size: {
      height: Number(formValues.size_height) || null,
      width: Number(formValues.size_width) || null,
      scale: formValues.size_scale.trim(),
    },
  };
}

/** Retourne un message d'erreur si le formulaire est invalide, sinon une chaîne vide. */
function validateFormValues(formValues) {
  if (!formValues.title.trim() || !formValues.description.trim()) {
    return 'Le titre et la description sont obligatoires.';
  }
  if (!(Number(formValues.price) > 0)) {
    return 'Le prix doit être supérieur à 0.';
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
 * @param {Function} props.onSubmit - Appelée avec les champs du produit quand le formulaire est valide.
 * @param {Function} props.onCancel - Appelée au clic sur "Annuler".
 */
export default function ProductForm({ initialProduct = EMPTY_PRODUCT, submitLabel, onSubmit, onCancel }) {
  const { licences } = useProducts();

  // Toutes les valeurs du formulaire sont regroupées dans un seul objet d'état.
  // La fonction passée à useState n'est appelée qu'au premier affichage.
  const [formValues, setFormValues] = useState(() => productToFormValues(initialProduct));
  const [errorMessage, setErrorMessage] = useState('');

  // Appelée à chaque frappe dans n'importe quel champ : on utilise l'attribut `name`
  // du champ pour savoir quelle propriété de `formValues` mettre à jour.
  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateFormValues(formValues);
    setErrorMessage(validationError);
    if (!validationError) {
      onSubmit(formValuesToProduct(formValues));
    }
  }

  return (
    <Box component="form" className="product-form" onSubmit={handleSubmit} noValidate>
      <TextField label="Titre" name="title" required fullWidth value={formValues.title} onChange={handleChange} />
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

        <TextField select label="Boîte d'origine" name="box" value={formValues.box} onChange={handleChange}>
          <MenuItem value="yes">Oui</MenuItem>
          <MenuItem value="no">Non</MenuItem>
        </TextField>

        {/* Champ libre avec suggestions : les licences déjà existantes sont proposées */}
        <TextField
          label="Licence"
          name="licence_name"
          value={formValues.licence_name}
          onChange={handleChange}
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
        <Button variant="contained" type="submit" className="button-gradient">
          {submitLabel}
        </Button>
      </div>
    </Box>
  );
}
