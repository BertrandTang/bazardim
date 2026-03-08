import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import figuresData from '../../data/figures.json';
import { useAuth } from '../../context/AuthContext.jsx';
import { addCreatedProduct, removeDeletedProductId } from '../../utils/productStorage.js';
import './Sell.css';

const categoryOptions = ['FIGURINE', 'FIGURINE ARTICULÉE', 'STATUE'];

function toNumberOrZero(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function Sell() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const licenceOptions = useMemo(() => {
        const values = (figuresData.figures || []).map((item) => item.licence_name).filter(Boolean);
        return Array.from(new Set(values));
    }, []);

    const [formValues, setFormValues] = useState({
        title: '',
        description: '',
        price: '',
        category: categoryOptions[0],
        licence_name: licenceOptions[0] || '',
        character_name: '',
        tags: '',
        image: '',
        year_of_acquisition: String(new Date().getFullYear()),
        manufacturer: '',
        version: '',
        material: '',
        state_of_wear: 'Neuf',
        box: 'oui',
        state_of_box: 'Neuf',
        EAN_number: '',
        size_height: '',
        size_width: '',
        size_scale: '1/8',
    });
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (!user?.user_id) {
            setError('Vous devez etre connecte pour vendre un produit.');
            return;
        }

        if (!formValues.title.trim() || !formValues.description.trim() || !formValues.price.trim()) {
            setError('Titre, description et prix sont obligatoires.');
            return;
        }

        const generatedId = `USR${Date.now()}`;
        const tags = formValues.tags
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        const normalizedBox = formValues.box.trim().toLowerCase();

        const newProduct = {
            id: generatedId,
            category: formValues.category.trim() || 'FIGURINE',
            licence_name: formValues.licence_name.trim(),
            character_name: formValues.character_name.trim(),
            title: formValues.title.trim(),
            description: formValues.description.trim(),
            price: toNumberOrZero(formValues.price),
            year_of_acquisition: toNumberOrZero(formValues.year_of_acquisition),
            manufacturer: formValues.manufacturer.trim(),
            version: formValues.version.trim(),
            state_of_wear: formValues.state_of_wear.trim(),
            box: ['oui', 'true', '1', 'yes'].includes(normalizedBox),
            state_of_box: formValues.state_of_box.trim(),
            EAN_number: formValues.EAN_number.trim(),
            size: {
                height: toNumberOrZero(formValues.size_height),
                width: toNumberOrZero(formValues.size_width),
                scale: formValues.size_scale.trim(),
            },
            material: formValues.material.trim(),
            img: formValues.image.trim() || '/img/img_1.jpg',
            tags,
            owner_user_id: user.user_id,
            owner_username: user.username || 'Utilisateur',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        addCreatedProduct(newProduct);
        removeDeletedProductId(generatedId);
        navigate(`/product/${generatedId}`);
    };

    return (
        <Box className="sell-page">
            <Box className="sell-form-card" component="form" onSubmit={handleSubmit}>
                <h1>Mettre un produit en vente</h1>
                <p>Complete la fiche comme les produits existants pour un rendu coherent.</p>

                <TextField
                    label="Titre"
                    name="title"
                    fullWidth
                    required
                    value={formValues.title}
                    onChange={handleChange}
                />
                <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    minRows={4}
                    required
                    value={formValues.description}
                    onChange={handleChange}
                />

                <Box className="sell-grid">
                    <TextField
                        label="Prix (EUR)"
                        name="price"
                        type="number"
                        required
                        value={formValues.price}
                        onChange={handleChange}
                    />
                    <TextField
                        select
                        label="Categorie"
                        name="category"
                        value={formValues.category}
                        onChange={handleChange}
                    >
                        {categoryOptions.map((category) => (
                            <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Licence"
                        name="licence_name"
                        value={formValues.licence_name}
                        onChange={handleChange}
                        list="sell-licence-options"
                    />
                    <datalist id="sell-licence-options">
                        {licenceOptions.map((licence) => (
                            <option key={licence} value={licence} />
                        ))}
                    </datalist>
                    <TextField
                        label="Personnage"
                        name="character_name"
                        value={formValues.character_name}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Fabricant"
                        name="manufacturer"
                        value={formValues.manufacturer}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Version"
                        name="version"
                        value={formValues.version}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Matiere"
                        name="material"
                        value={formValues.material}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Tags (virgules)"
                        name="tags"
                        value={formValues.tags}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Image (/img/... ou URL)"
                        name="image"
                        value={formValues.image}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Annee d'acquisition"
                        name="year_of_acquisition"
                        type="number"
                        value={formValues.year_of_acquisition}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Etat figurine"
                        name="state_of_wear"
                        value={formValues.state_of_wear}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Boite (oui/non)"
                        name="box"
                        value={formValues.box}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Etat boite"
                        name="state_of_box"
                        value={formValues.state_of_box}
                        onChange={handleChange}
                    />
                    <TextField
                        label="EAN"
                        name="EAN_number"
                        value={formValues.EAN_number}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Taille hauteur (cm)"
                        name="size_height"
                        type="number"
                        value={formValues.size_height}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Taille largeur (cm)"
                        name="size_width"
                        type="number"
                        value={formValues.size_width}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Echelle"
                        name="size_scale"
                        value={formValues.size_scale}
                        onChange={handleChange}
                    />
                </Box>

                {error ? <div className="sell-error">{error}</div> : null}

                <Box className="sell-actions">
                    <Button variant="outlined" onClick={() => navigate('/profile')}>Retour profil</Button>
                    <Button variant="contained" type="submit" className="sell-submit">Publier le produit</Button>
                </Box>
            </Box>
        </Box>
    );
}
