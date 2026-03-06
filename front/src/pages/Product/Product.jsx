import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import productsData from '../../data/figures.json';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Product.css';

function getImageIndexFromId(productId) {
    const digits = String(productId || '').match(/\d+/)?.[0];
    const numeric = Number(digits || 1);
    const normalized = ((numeric - 1) % 11 + 11) % 11;
    return normalized + 1;
}

function resolveImagePath(rawImage, productId) {
    if (!rawImage || typeof rawImage !== 'string') return '/img/img_1.jpg';
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage;
    if (rawImage.startsWith('/img/')) return rawImage;
    if (rawImage.startsWith('url_image/')) {
        return `/img/img_${getImageIndexFromId(productId)}.jpg`;
    }
    if (rawImage.startsWith('/')) return rawImage;
    return `/${rawImage}`;
}

function mapProduct(product) {
    return {
        ...product,
        id: product.id ?? product.product_id,
        title: product.title || product.product_title || 'TITRE',
        description: product.description || product.product_description || '',
        price: product.price ?? product.product_price ?? 0,
        tags: product.tags || product.product_tags || [],
        username: product.username || product.product_username || product.owner_username,
        image: resolveImagePath(product.img || product.image || product.product_img, product.id ?? product.product_id),
        category: product.category || product.product_category || '',
        licenceName: product.licence_name || '',
        characterName: product.character_name || '',
        manufacturer: product.manufacturer || '',
        version: product.version || '',
        material: product.material || '',
        yearOfAcquisition: product.year_of_acquisition ?? '',
        stateOfWear: product.state_of_wear || '',
        stateOfBox: product.state_of_box || '',
        box: product.box,
        eanNumber: product.EAN_number || '',
        size: product.size || {},
        ownerUserId: product.owner_user_id ?? product.product_user_id ?? product.user_id ?? '',
    };
}

export default function Product() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { addItem } = useCart();
    const [productOverrides, setProductOverrides] = useState(() => {
        try {
            const raw = localStorage.getItem('productOverrides');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        licenceName: '',
        characterName: '',
        tags: '',
        image: '',
        yearOfAcquisition: '',
        manufacturer: '',
        version: '',
        material: '',
        stateOfWear: '',
        box: '',
        stateOfBox: '',
        eanNumber: '',
        sizeHeight: '',
        sizeWidth: '',
        sizeScale: '',
    });

    useEffect(() => {
        try {
            localStorage.setItem('productOverrides', JSON.stringify(productOverrides));
        } catch {
        }
    }, [productOverrides]);

    const products = useMemo(
        () => (productsData.figures || []).map(mapProduct).map((product) => ({
            ...product,
            ...(productOverrides[String(product.id)] || {}),
        })),
        [productOverrides]
    );
    const product = products.find((p) => String(p.id) === String(id));
    const shouldStartInEdit = searchParams.get('edit') === '1';

    const isOwner = !!user && String(user.user_id) === String(product?.ownerUserId);

    useEffect(() => {
        if (!product) return;
        if (isOwner && shouldStartInEdit) {
            setIsEditing(true);
            return;
        }
        setIsEditing(false);
    }, [product?.id, isOwner, shouldStartInEdit]);

    useEffect(() => {
        if (!product) return;
        setEditValues({
            title: product.title || '',
            description: product.description || '',
            price: String(product.price ?? ''),
            category: product.category || '',
            licenceName: product.licenceName || '',
            characterName: product.characterName || '',
            tags: (product.tags || []).join(', '),
            image: product.image || '',
            yearOfAcquisition: String(product.yearOfAcquisition ?? ''),
            manufacturer: product.manufacturer || '',
            version: product.version || '',
            material: product.material || '',
            stateOfWear: product.stateOfWear || '',
            box: typeof product.box === 'boolean' ? (product.box ? 'oui' : 'non') : '',
            stateOfBox: product.stateOfBox || '',
            eanNumber: product.eanNumber || '',
            sizeHeight: String(product.size?.height ?? ''),
            sizeWidth: String(product.size?.width ?? ''),
            sizeScale: product.size?.scale || '',
        });
    }, [product?.id]);

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProduct = () => {
        if (!product) return;
        const parsedPrice = Number(editValues.price);
        const parsedYear = Number(editValues.yearOfAcquisition);
        const parsedSizeHeight = Number(editValues.sizeHeight);
        const parsedSizeWidth = Number(editValues.sizeWidth);
        const parsedTags = editValues.tags
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        const normalizedBox = editValues.box.trim().toLowerCase();
        let nextBox = product.box;
        if (['oui', 'true', '1', 'yes'].includes(normalizedBox)) nextBox = true;
        if (['non', 'false', '0', 'no'].includes(normalizedBox)) nextBox = false;

        setProductOverrides((prev) => ({
            ...prev,
            [String(product.id)]: {
                title: editValues.title.trim() || product.title,
                description: editValues.description.trim() || product.description,
                price: Number.isFinite(parsedPrice) ? parsedPrice : product.price,
                category: editValues.category.trim() || product.category,
                licenceName: editValues.licenceName.trim() || product.licenceName,
                characterName: editValues.characterName.trim() || product.characterName,
                tags: parsedTags.length ? parsedTags : product.tags,
                image: resolveImagePath(editValues.image.trim() || product.image, product.id),
                yearOfAcquisition: Number.isFinite(parsedYear) ? parsedYear : product.yearOfAcquisition,
                manufacturer: editValues.manufacturer.trim() || product.manufacturer,
                version: editValues.version.trim() || product.version,
                material: editValues.material.trim() || product.material,
                stateOfWear: editValues.stateOfWear.trim() || product.stateOfWear,
                box: nextBox,
                stateOfBox: editValues.stateOfBox.trim() || product.stateOfBox,
                eanNumber: editValues.eanNumber.trim() || product.eanNumber,
                size: {
                    height: Number.isFinite(parsedSizeHeight) ? parsedSizeHeight : product.size?.height,
                    width: Number.isFinite(parsedSizeWidth) ? parsedSizeWidth : product.size?.width,
                    scale: editValues.sizeScale.trim() || product.size?.scale || '',
                },
            },
        }));
        setIsEditing(false);
    };

    if (!product) {
        return (
            <Box className="product-page product-page--empty">
                <h2>Produit introuvable</h2>
            </Box>
        );
    }

    return (
        <Box className="product-page">
            <Box className="product-full-view">
                <h1 className="product-full-title">{product.title || 'TITRE'}</h1>

                <Box className="product-full-view__media">
                    <img
                        className="product-detail-image"
                        src={product.image}
                        alt={product.title}
                        onError={(event) => {
                            event.currentTarget.src = '/img/img_1.jpg';
                        }}
                    />
                </Box>

                <Box className="product-full-view__content">
                    <div className="product-full-user">
                        <RouterLink to={`/user/${product.ownerUserId}`} className="avatar-link">
                            <div className="avatar">U</div>
                        </RouterLink>
                        <div className="username">
                            <RouterLink to={`/user/${product.ownerUserId}`}>{product.username || 'USERNAME'}</RouterLink>
                        </div>
                    </div>

                    <div className="product-full-tags">
                        {product.category ? <span className="product-tag category">{product.category}</span> : null}
                        {product.licenceName ? <span className="product-tag licence">{product.licenceName}</span> : null}
                        {product.characterName ? <span className="product-tag character">{product.characterName}</span> : null}
                        {(product.tags || []).map((tag) => (
                            <span key={tag} className="product-tag custom">{tag}</span>
                        ))}
                    </div>

                    {isOwner && isEditing ? (
                        <Box className="product-edit-form">
                            <TextField
                                label="Titre"
                                name="title"
                                fullWidth
                                value={editValues.title}
                                onChange={handleEditChange}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                multiline
                                minRows={4}
                                fullWidth
                                value={editValues.description}
                                onChange={handleEditChange}
                            />
                            <Box className="product-edit-grid">
                                <TextField
                                    label="Prix (€)"
                                    name="price"
                                    type="number"
                                    fullWidth
                                    value={editValues.price}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Catégorie"
                                    name="category"
                                    fullWidth
                                    value={editValues.category}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Licence"
                                    name="licenceName"
                                    fullWidth
                                    value={editValues.licenceName}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Personnage"
                                    name="characterName"
                                    fullWidth
                                    value={editValues.characterName}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Tags (séparés par virgule)"
                                    name="tags"
                                    fullWidth
                                    value={editValues.tags}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Image (URL ou /img/...)"
                                    name="image"
                                    fullWidth
                                    value={editValues.image}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Année d'acquisition"
                                    name="yearOfAcquisition"
                                    type="number"
                                    fullWidth
                                    value={editValues.yearOfAcquisition}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Fabricant"
                                    name="manufacturer"
                                    fullWidth
                                    value={editValues.manufacturer}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Version"
                                    name="version"
                                    fullWidth
                                    value={editValues.version}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Matière"
                                    name="material"
                                    fullWidth
                                    value={editValues.material}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="État figurine"
                                    name="stateOfWear"
                                    fullWidth
                                    value={editValues.stateOfWear}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Boîte (oui/non)"
                                    name="box"
                                    fullWidth
                                    value={editValues.box}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="État boîte"
                                    name="stateOfBox"
                                    fullWidth
                                    value={editValues.stateOfBox}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="EAN"
                                    name="eanNumber"
                                    fullWidth
                                    value={editValues.eanNumber}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Taille hauteur (cm)"
                                    name="sizeHeight"
                                    type="number"
                                    fullWidth
                                    value={editValues.sizeHeight}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Taille largeur (cm)"
                                    name="sizeWidth"
                                    type="number"
                                    fullWidth
                                    value={editValues.sizeWidth}
                                    onChange={handleEditChange}
                                />
                                <TextField
                                    label="Échelle"
                                    name="sizeScale"
                                    fullWidth
                                    value={editValues.sizeScale}
                                    onChange={handleEditChange}
                                />
                            </Box>
                        </Box>
                    ) : (
                        <p className="product-full-desc">{product.description || 'Aucune description.'}</p>
                    )}

                    {!isEditing && (
                        <div className="product-full-specs">
                            <div><strong>Année:</strong> {product.yearOfAcquisition || 'N/C'}</div>
                            <div><strong>Fabricant:</strong> {product.manufacturer || 'N/C'}</div>
                            <div><strong>Version:</strong> {product.version || 'N/C'}</div>
                            <div><strong>Matière:</strong> {product.material || 'N/C'}</div>
                            <div><strong>État figurine:</strong> {product.stateOfWear || 'N/C'}</div>
                            <div><strong>Boîte:</strong> {typeof product.box === 'boolean' ? (product.box ? 'Oui' : 'Non') : 'N/C'}</div>
                            <div><strong>État boîte:</strong> {product.stateOfBox || 'N/C'}</div>
                            <div><strong>EAN:</strong> {product.eanNumber || 'N/C'}</div>
                            <div>
                                <strong>Taille:</strong>{' '}
                                {product.size?.height ? `${product.size.height} cm` : 'N/C'}
                                {product.size?.width ? ` • ${product.size.width} cm` : ''}
                                {product.size?.scale ? ` • ${product.size.scale}` : ''}
                            </div>
                        </div>
                    )}

                    <div className="product-full-bottom">
                        <div className="product-price">{Number(product.price || 0).toFixed(2)}€</div>
                        {isOwner ? (
                            isEditing ? (
                                <>
                                    <Button variant="contained" className="product-full-add" onClick={handleSaveProduct}>ENREGISTRER</Button>
                                    <Button variant="outlined" onClick={() => setIsEditing(false)}>ANNULER</Button>
                                </>
                            ) : (
                                <Button variant="contained" className="product-full-add" onClick={() => setIsEditing(true)}>MODIFIER</Button>
                            )
                        ) : (
                            <Button variant="contained" className="product-full-add" onClick={() => addItem(product)}>AJOUTER</Button>
                        )}
                    </div>
                </Box>
            </Box>
        </Box>
    );
}
